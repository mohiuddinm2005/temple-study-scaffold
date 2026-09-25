# API and data handoff (planned; routes currently return 501)

All endpoints are same-origin JSON over HTTPS, scoped to the authenticated student's account unless noted. State-changing requests need CSRF/origin protection and input validation. Return `{ "error": "..." }` with an appropriate HTTP status on failure. Never return Canvas URLs or server keys to the browser. Owner 2 should resolve session and student identity server-side, not accept a `userId` in request bodies.

| Endpoint | Input | Proposed response | Owner |
| --- | --- | --- | --- |
| `POST /api/auth/register` | email, password, invite code | student summary; HTTP-only session cookie | 2 |
| `POST /api/auth/login` | email, password | student summary; session cookie | 2 |
| `POST /api/auth/logout` | empty | `{ok:true}` | 2 |
| `GET /api/auth/me` | none | student summary or unauthenticated state | 2 |
| `POST /api/canvas/import` | new feed URL or refresh saved feed | imported count, last-sync time | 3 |
| `GET /api/assignments` | none | events with ID, title, UTC due time, local completion, source type | 2 + 3 |
| `PATCH /api/assignments/{id}` | completed boolean; optionally reminder eligibility | updated event summary | 2 + 4 |
| `POST /api/grades/scenario` | target %, earned weighted points, remaining weight % | required average %, feasibility and assumptions | 2 |
| `POST /api/study/plan` | event ID, difficult topic, minutes | short task, model/template source | 3 |
| `GET /api/push/subscribe` | none | public VAPID key | 4 |
| `POST /api/push/subscribe` | browser subscription JSON | `{ok:true}` | 4 |
| `POST /api/reminders/test` | empty | accepted/failed result for own device | 4 |

Proposed SQLite tables: `users`, `sessions`, `canvas_connections`, `assignments`, `push_devices`, `reminder_jobs`, `study_plans`. Add schema as versioned migrations under `lib/db/migrations/`. Uniqueness: `(user_id, source_uid, recurrence_id)` for imports and `(assignment_id, revision, device_id, offset_hours)` for jobs. Persist due instants as UTC ISO strings, preserve source timezone and date-only distinction. Use foreign keys, WAL, busy timeout, and a backup procedure. Do not store the raw feed URL unencrypted or log it.

Before coding across branches, owners 1–4 should agree on event DTO, reminder eligibility (calendar contains non-assignment events), grade units, failure codes, and schema migration order. This document is a proposal, not an implemented API.
