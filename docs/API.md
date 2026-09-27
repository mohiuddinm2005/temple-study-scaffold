# API and data handoff

The Canvas import, basic pilot authentication, and assignment listing routes are implemented. Other routes remain planned stubs.

All endpoints are same-origin JSON over HTTPS, scoped to the authenticated student's account unless noted. Implemented state-changing routes check the request origin and validate inputs. Failures return `{ "error": "..." }` with an appropriate HTTP status. Canvas URLs and server keys are never returned to the browser. The server resolves student identity from the session cookie; request bodies do not accept a `userId`.

| Endpoint | Input | Proposed response | Owner |
| --- | --- | --- | --- |
| `POST /api/auth/register` | email, password | student summary; HTTP-only session cookie | 2 |
| `POST /api/auth/login` | email, password | student summary; session cookie | 2 |
| `POST /api/auth/logout` | empty | `{ok:true}` | 2 |
| `GET /api/auth/me` | none | student summary or unauthenticated state | 2 |
| `POST /api/canvas/import` | `{ "feedUrl": "https://templeu.instructure.com/feeds/calendars/user_….ics" }` for import/replacement, or `{}` to refresh the saved feed | `{ "importedCount": number, "lastSyncedAt": ISO string }` | 3 |
| `GET /api/assignments` | none | events with ID, title, UTC due time, local completion, source type | 2 + 3 |
| `PATCH /api/assignments/{id}` | completed boolean; optionally reminder eligibility | updated event summary | 2 + 4 |
| `POST /api/grades/scenario` | target %, earned weighted points, remaining weight % | required average %, feasibility and assumptions | 2 |
| `POST /api/study/plan` | event ID, difficult topic, minutes | short task, model/template source | 3 |
| `GET /api/push/subscribe` | none | public VAPID key | 4 |
| `POST /api/push/subscribe` | browser subscription JSON | `{ok:true}` | 4 |
| `POST /api/reminders/test` | empty | accepted/failed result for own device | 4 |

The implemented Canvas slice initializes `users`, `sessions`, `canvas_connections`, and `assignments` in SQLite. Imports are unique by `(user_id, source_uid, recurrence_id)`, with due instants stored as UTC ISO strings and date-only values preserved separately. The database enables foreign keys, WAL, and a busy timeout. Feed URLs are encrypted at rest. Versioned migrations, backups, reminder jobs, and the other planned tables remain future work.



# Grade calculation design

Canvas iCal does **not** provide course gradebook or grading category weights. Ask the student for their syllabus-based passing target, earned contribution to the course total, and remaining weight. With percentages in 0–100 units:

`required average on remaining work = (target − earned weighted points) / (remaining weight / 100)`

Example: target 70%, 42 percentage points already earned, 40% left yields 70% needed on the remaining work. `remaining weight = 0` means no remaining opportunity; ≤0 required means the target has already been met under the given assumptions; >100 required means mathematically unreachable. Round for display only. Validate totals and explain whether unknown grades or extra credit change the result. Never use a language model for arithmetic.

Temple's [undergraduate grading policy](https://bulletin.temple.edu/undergraduate/academic-policies/grades-grading/) states D− is passing generally, but General Education and many major requirements require at least C−. Individual syllabus cutoffs and program rules matter. UI copy should say **"based on the target and weights you entered"**, never assert that a student passed an actual course or predict official academic standing. Owner 2 adds boundary tests before connecting the UI.






# Reminder design

The student explicitly enables browser Web Push on each device. Subscribe via a service worker and store subscription data per user/device. On iOS/iPadOS, support requires a compatible Home Screen web app and notification permission. A test route should send an immediate message clearly labeled **test**.

For a timed, user-confirmed assignment, queue 48-hour and 24-hour jobs if those moments are still in the future. Use the due time's UTC instant; date-only entries have no timed job until the student supplies a time. Make job keys idempotent and include an assignment revision, device and offset. Cancel pending jobs after due-time edits or completion. The separate worker leases due jobs, sends with limited retries, expires late jobs, and records accepted/failed status. Provider acceptance does not prove the student saw a notification. Test with an injected clock and a fake push sender rather than waiting two days.

SMS is a later option, not part of this scaffold or weekend MVP. It would need opt-in, validated numbers, opt-out handling, provider configuration, deliverability checks, and a cost budget. Google/Apple calendar reminders are distinct from the app's Web Push; their behavior depends on those calendar clients.

- [WebKit: Web Push for web apps on iOS/iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)