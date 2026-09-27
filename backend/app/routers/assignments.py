import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from app.db import db_lock
from app.dependencies import current_user_id, db_dep, require_same_origin
from app.schemas import AssignmentUpdateRequest

router = APIRouter(prefix="/api/assignments", tags=["assignments"])


@router.get("")
def list_assignments(user_id: str = Depends(current_user_id), db: sqlite3.Connection = Depends(db_dep)):
    rows = db.execute(
        """
        SELECT id, title, due_at, source_timezone, source_date, date_only, completed, reminder_eligible
        FROM assignments WHERE user_id = ? ORDER BY due_at LIMIT 500
        """,
        (user_id,),
    ).fetchall()
    assignments = [
        {
            "id": row["id"],
            "title": row["title"],
            "dueAt": row["due_at"],
            "sourceTimezone": row["source_timezone"],
            "sourceDate": row["source_date"],
            "dateOnly": bool(row["date_only"]),
            "completed": bool(row["completed"]),
            "reminderEligible": bool(row["reminder_eligible"]),
            "sourceType": "canvas",
        }
        for row in rows
    ]
    connection = db.execute(
        "SELECT last_synced_at FROM canvas_connections WHERE user_id = ?", (user_id,)
    ).fetchone()
    return {
        "assignments": assignments,
        "lastSyncedAt": connection["last_synced_at"] if connection else None,
        "hasCanvasFeed": bool(connection),
    }


@router.patch("/{assignment_id}")
def update_assignment(
    assignment_id: str,
    body: AssignmentUpdateRequest,
    user_id: str = Depends(current_user_id),
    db: sqlite3.Connection = Depends(db_dep),
    _origin: None = Depends(require_same_origin),
):
    updates = {
        "completed": body.completed,
        "reminder_eligible": body.reminder_eligible,
    }
    updates = {column: value for column, value in updates.items() if value is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="At least one assignment field is required")

    assignments = ", ".join(f"{column} = ?" for column in updates)
    values = [int(value) for value in updates.values()]
    with db_lock():
        cursor = db.execute(
            f"UPDATE assignments SET {assignments} WHERE id = ? AND user_id = ?",
            (*values, assignment_id, user_id),
        )
        if cursor.rowcount == 0:
            db.rollback()
            raise HTTPException(status_code=404, detail="Assignment not found")
        row = db.execute(
            """
            SELECT id, title, due_at, source_timezone, source_date, date_only, completed,
                   reminder_eligible
            FROM assignments WHERE id = ? AND user_id = ?
            """,
            (assignment_id, user_id),
        ).fetchone()
        db.commit()

    return {
        "id": row["id"],
        "title": row["title"],
        "dueAt": row["due_at"],
        "sourceTimezone": row["source_timezone"],
        "sourceDate": row["source_date"],
        "dateOnly": bool(row["date_only"]),
        "completed": bool(row["completed"]),
        "reminderEligible": bool(row["reminder_eligible"]),
        "sourceType": "canvas",
    }
