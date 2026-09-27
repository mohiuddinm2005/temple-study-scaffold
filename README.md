# Nemo.AI

Nemo.AI helps students organize Temple Canvas deadlines, calculate the average needed on remaining coursework, and start a focused study task. The application uses a **Python FastAPI backend** and a **React + TypeScript frontend served by Vite**, with SQLite for local persistence.

Run the backend and frontend in separate terminals. All commands below assume the repository contains `backend/` and `frontend/`; the repository folder itself may still be named `temple-study-scaffold`.

## Current functionality

| Feature | Current behavior |
| --- | --- |
| Accounts | Registration, login, logout, and session cookies are implemented. Registration requires a password of at least 12 characters. |
| Canvas calendar | Import and manually refresh a private Temple Canvas iCal feed. Events are deduplicated and stored in SQLite. |
| Dashboard | Displays imported items, course groups derived from event titles, a calendar, and assignment lists. |
| Grade scenarios | Computes the required average from a target percentage, earned weighted percentage points, and remaining weight. |
| Assignment updates | `PATCH /api/assignments/{id}` updates local completion and reminder eligibility. It does not update Canvas submission status or schedule/cancel reminder jobs. |
| Study tasks | Authenticated WebSocket streams a short task from Google Gemini, with a labeled template fallback when no model text is available. |
| SMS test | `POST /api/reminders/test` queues a Twilio SMS in a background task. A successful HTTP response means queued, not delivered. |
| Browser push | `/api/push/subscribe` remains a 501 placeholder. |
| Scheduled reminders | Automatic 24/48-hour scheduling and a reminder worker are not implemented. |

Google/Apple calendar synchronization and a focus timer are not implemented in the current application. Canvas iCal supplies calendar events, not gradebook data or proof of assignment submission. Students must obtain grading weights and the appropriate passing target from their course syllabus.

## Stack and source ownership

| Layer | Technology | Main location |
| --- | --- | --- |
| Frontend | React 19, TypeScript, Vite 6, CSS | `frontend/src/` |
| HTTP API and WebSocket | FastAPI, Uvicorn, Pydantic | `backend/app/main.py`, `backend/app/routers/` |
| Database | Python `sqlite3`, SQLite with WAL enabled | `backend/app/db.py` |
| Authentication and feed encryption | Session cookies, scrypt password hashes, AES-GCM | `backend/app/security.py` |
| Calendar import | HTTPX, `icalendar`, `recurring-ical-events` | `backend/app/canvas_ics.py` |
| AI | Google Gen AI SDK | `backend/app/gemini_client.py` |
| SMS | Twilio SDK and FastAPI background tasks | `backend/app/twilio_client.py`, `backend/app/routers/reminders.py` |

The active frontend starts at `frontend/src/main.tsx`, which renders `App.tsx`. The backend starts at `backend/app/main.py`. The course helper belongs at `frontend/src/lib/course.ts`. Run npm commands inside `frontend/` and backend commands inside `backend/`.

## Local setup

### Prerequisites

- Python 3.12 and Node.js 24 are the versions used for the reviewed local checks. npm is included with Node.js.
- Use `localhost` consistently for browser, API, and WebSocket URLs. The default frontend origin is `http://localhost:5173`.
- Internet access is needed to install dependencies. Gemini and Twilio credentials are optional for starting the app; their live services require configured credentials.

### 1. Install backend dependencies

From the repository root, open a terminal.

**Windows PowerShell:**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

**macOS/Linux:**

```bash
cd backend
python3 -m venv .venv
./.venv/bin/python -m pip install -r requirements.txt
```

Reuse an existing backend virtual environment if it already contains the project dependencies. These commands use its Python executable directly, so activation is optional.

### 2. Configure the backend

The reviewed repository does not contain `backend/.env.example`. **Create `backend/.env` manually in your editor if it does not exist.** If it already exists, retain its database path, encryption key, and credentials.

For a new installation, generate an encryption key:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

On macOS/Linux, use `python3` if `python` is unavailable. Copy the generated value into the configuration below, replacing `PASTE_YOUR_64_HEX_CHARACTER_KEY`:

```dotenv
DATABASE_PATH=./data/study.db
APP_ENCRYPTION_KEY=PASTE_YOUR_64_HEX_CHARACTER_KEY
ALLOWED_ORIGINS=http://localhost:5173
COOKIE_SECURE=false

# Optional: leave the API key blank to use the study-task template.
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_MAX_OUTPUT_TOKENS=300
GEMINI_TIMEOUT_SECONDS=12

# Optional: required only for live SMS delivery.
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

Keep the encryption key stable: replacing it makes existing saved Canvas feed URLs unreadable. SQLite creates its directory and schema on first database access. Relative paths and `.env` loading are based on the backend process's working directory, which is why startup commands run from `backend/`.

### 3. Start the backend

In the same terminal, still inside `backend/`:

**Windows PowerShell:**

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

**macOS/Linux:**

```bash
./.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

With the environment activated, `python -m uvicorn app.main:app --reload --port 8000` is equivalent.

- Health check: <http://localhost:8000/health> should return `{"ok":true}`.
- HTTP API documentation: <http://localhost:8000/docs>.

### 4. Configure and start the frontend

Open a second terminal at the repository root:

```bash
cd frontend
npm ci
```

The reviewed repository does not contain `frontend/.env.example`. The code already defaults to the URLs below. To make the configuration explicit, create `frontend/.env.local` in your editor, or retain an existing file with these values:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

Start Vite:

```bash
npm run dev -- --strictPort
```

Open <http://localhost:5173>. `--strictPort` prevents Vite from silently switching to a port that the backend origin allowlist does not permit. Keep both terminals running; stop each with `Ctrl+C`.

## Environment variable reference

| Variable | Location | Purpose/default |
| --- | --- | --- |
| `DATABASE_PATH` | `backend/.env` | SQLite file; defaults to `./data/study.db` relative to `backend/`. |
| `APP_ENCRYPTION_KEY` | `backend/.env` | Required for saved Canvas feeds; 32 random bytes encoded as 64 hex characters or base64. |
| `ALLOWED_ORIGINS` | `backend/.env` | Comma-separated frontend origins; defaults to `http://localhost:5173`. Used for CORS and origin checks. |
| `COOKIE_SECURE` | `backend/.env` | Defaults to `false` for local HTTP. `true` enables Secure cookies and switches SameSite to None; requires HTTPS. |
| `GEMINI_API_KEY` | `backend/.env` | Optional; absence selects the template path. |
| `GEMINI_MODEL` | `backend/.env` | Configured default is `gemini-2.5-flash`; live access depends on the provider/account. |
| `GEMINI_MAX_OUTPUT_TOKENS` | `backend/.env` | Integer output cap; defaults to `300`. |
| `GEMINI_TIMEOUT_SECONDS` | `backend/.env` | Integer request timeout; defaults to `12`. |
| `TWILIO_ACCOUNT_SID` | `backend/.env` | Twilio account identifier for SMS. |
| `TWILIO_AUTH_TOKEN` | `backend/.env` | Twilio credential for SMS. |
| `TWILIO_PHONE_NUMBER` | `backend/.env` | Twilio sending number. |
| `VITE_API_BASE_URL` | `frontend/.env.local` | HTTP API base URL, without a trailing slash. |
| `VITE_WS_BASE_URL` | `frontend/.env.local` | WebSocket base URL, without a trailing slash. |

Do not leave integer or boolean settings blank: omit them to use defaults, or supply valid values. Restart the backend after configuration changes; restart Vite after frontend environment changes. `VITE_*` values are exposed to the browser and must never contain Gemini, Twilio, or encryption secrets.

Keep `.env` files, private Canvas links, local databases, virtual environments, and dependency folders out of Git and shared source archives. Preserve the local database and its encryption key when cleaning up the repository.

## API behavior

Use `/docs` for HTTP request schemas. The active routes are:

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/health` | Process health response. |
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | Account and session management. |
| GET | `/api/auth/me` | Current session; 401 when signed out is expected. |
| POST | `/api/canvas/import` | Send `{"feedUrl":"..."}` to import/replace a feed, or `{}` to refresh a saved feed. |
| GET | `/api/assignments` | Current student's imported events and sync status. |
| PATCH | `/api/assignments/{id}` | Update `completed` and/or `reminderEligible` booleans. |
| POST | `/api/grades/scenario` | Accepts `target`, `earnedPoints`, and `remainingWeight`, all in percentage units. |
| GET/POST | `/api/push/subscribe` | 501; not implemented. |
| POST | `/api/reminders/test` | Accepts `{"phone_number":"..."}` and queues a test SMS. |
| WebSocket | `/ws/study-plan` | Authenticated streamed study-task requests. |

The browser API client includes cookies with requests. Account writes, Canvas imports, grade calculations, and assignment updates check the allowed origin. Assignment data is scoped to the signed-in student. **The SMS test route currently lacks authentication and rate limiting; restrict access before exposing it publicly.** Its response confirms queueing only, and background delivery failures are not returned in that response.

Grade example: target `70`, earned weighted points `42`, remaining weight `40` yields a required average of `70%`: `(70 - 42) / (40 / 100)`. Earned points means contribution to the final course percentage, not raw assignment points or the current gradebook average.

### Study WebSocket contract

The server checks the session and Origin when opening the connection. Send:

```json
{"assignmentTitle":"Algebra practice","course":"MATH-1021","difficultTopic":"Factoring","minutes":15}
```

It emits `{"type":"chunk","text":"..."}` messages, then `{"type":"done","source":"model"}` or `{"type":"done","source":"template"}`. Validation errors use `{"type":"error","message":"..."}`.

**One connection can accept multiple sequential requests.** The current frontend opens a connection for each submitted task and closes the previous connection before starting another. A `done` message does not close the server connection. Requests use assignment title, course, optional difficult topic, and time available; the model does not calculate grades. If generation fails after text has already streamed, the current implementation keeps that partial text and labels it `model`; template fallback applies when no model text was produced.

## Verification and troubleshooting

Run the frontend checks from `frontend/`:

```bash
npm run typecheck
npm run build
```

The production build is written to `frontend/dist/`. `npm run preview` is a local build preview, not a production deployment. Its port differs from the development server; backend origin configuration must permit the actual preview origin if testing API calls there.

There is **no populated Python test suite in the reviewed repository**. `backend/test_grades.py` is empty, and `pytest` is not listed in `backend/requirements.txt`. Do not treat a pytest command as an existing verification step. Port the useful legacy Canvas test cases to backend tests and add a development test dependency before adopting that command.

For a manual smoke check: verify `/health`, register a synthetic account, log out and back in, calculate the 70/42/40 example, and check assignment listing. To exercise the study UI, import a consenting test feed and request a task. With no Gemini key, the task should be labeled as a template. Test SMS only with configured credentials and a recipient who has agreed to receive it.

| Symptom | Check |
| --- | --- |
| `Could not import module "app.main"` | Run Uvicorn from `backend/`; confirm `backend/app/main.py` exists. Run `python -c "from app.main import app"` with the backend environment active to reveal the actual import error. |
| Missing Python package | Install requirements using the same virtual-environment Python that launches Uvicorn. |
| Missing `../lib/course` import | Place the helper at `frontend/src/lib/course.ts`. Move only the course helper from the old root `lib/course/course.ts`, not the old server modules. |
| CORS/Origin rejection | Open the frontend at `http://localhost:5173`; match `ALLOWED_ORIGINS` exactly. Avoid mixing `localhost` and `127.0.0.1`. |
| Canvas encryption error | Set a valid key in `backend/.env`; retain the original key for previously encrypted feeds. |
| Study task uses a template | Expected without a Gemini key. With a key configured, check backend logs for provider or timeout errors. |
| SMS says queued but does not arrive | Check backend logs and Twilio delivery status; queueing is not delivery confirmation. |

Review baseline: backend health, account/session flow, grade calculation, listing, origin checks, and WebSocket template fallback passed local smoke checks. The uploaded frontend failed on the missing course helper; its build passed in a diagnostic copy with the helper at the correct path. These checks do not establish live Canvas, Gemini, or Twilio delivery success.

## Team ownership

| Member | Primary responsibility | Owned areas |
| --- | --- | --- |
| 1 — Frontend | Dashboard, navigation, forms, responsive styles, UI error states | `frontend/src/App.tsx`, `components/`, `layout/`, `styles.css`, `lib/course.ts` |
| 2 — Backend and data | SQLite, authentication, sessions, grade calculations, shared schemas | `backend/app/db.py`, `security.py`, `dependencies.py`, `schemas.py`, auth/grades/assignments routers |
| 3 — Canvas and AI | Feed validation/parsing, manual sync, Gemini behavior, WebSocket contract | `backend/app/canvas_ics.py`, `gemini_client.py`, canvas/study routers; coordinate `frontend/src/api/studyPlanSocket.ts` with member 1 |
| 4 — Notifications and deployment | Twilio test flow, pending push/scheduler work, configuration and hosting | `backend/app/twilio_client.py`, reminders/push routers, deployment setup |

Each member maintains tests and documentation for their area. Agree on request/response changes before modifying both sides. Member 2 reviews shared schema changes; members 1 and 3 coordinate streamed study-task behavior. Track new capabilities as explicit tasks rather than describing planned work as implemented.
