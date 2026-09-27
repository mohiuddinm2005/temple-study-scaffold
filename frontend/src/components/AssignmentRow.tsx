import type { Assignment } from '../types';

export default function AssignmentRow({ assignment }: { assignment: Assignment }) {
  const due = new Date(assignment.dueAt);
  const month = due.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
  const day = assignment.dateOnly && assignment.sourceDate
    ? Number(assignment.sourceDate.split('-')[2])
    : due.getDate();

  return (
    <div className="assignment">
      <div className="date-box">
        <strong>{day}</strong>
        <span>{month}</span>
      </div>
      <div className="assignment-info">
        <h3>{assignment.title}</h3>
        <p>{assignment.dateOnly && assignment.sourceDate ? assignment.sourceDate : due.toLocaleString()}</p>
      </div>
    </div>
  );
}