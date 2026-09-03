# Study Time Tracker

A full-stack web app for tracking how long you study each subject.
Pick a subject, start the timer, and the session is saved to your account.

**Live demo:** [study-time-tracker-ten.vercel.app](https://study-time-tracker-ten.vercel.app)

**Status:** In development. Login, subjects, the timer, and per-subject totals all work. Charts and a full statistics page are next.

## Tech stack

| Layer    | Tools                                      |
| -------- | ------------------------------------------ |
| Frontend | React 19, React Router, Vite               |
| Backend  | Node.js, Express 5                         |
| Database | PostgreSQL (Neon)                          |
| Auth     | express-session, connect-pg-simple, bcrypt |
| Hosting  | Vercel (frontend), Render (backend)        |

## Features

- Register and log in with an email and password
- Passwords are hashed with bcrypt, never stored as plain text
- Sessions are stored in PostgreSQL, so a server restart does not log everyone out
- Add and delete your own subjects
- Stopwatch that counts your study time
- Finished sessions are saved with start time, end time, and duration
- Each subject shows your total study time, added up in the database
- Each user only sees their own data

## How auth works

The app uses **server-side sessions with cookies**, not JWT.

1. On login the server checks the password with `bcrypt.compare()`.
2. If it matches, the user id is stored in `req.session.userId`.
3. The session row goes into a PostgreSQL table, and the browser only gets a signed cookie.
4. Every protected route checks `req.session.userId` before touching the database.

The cookie is `httpOnly`, so JavaScript on the page cannot read it. In production it is also `secure` and `sameSite: none`, because the frontend and backend are on different domains.

Login errors return the same message whether the email exists or not, so the API does not leak which emails are registered.

## API

All routes that need a login return `401` when there is no session.

| Method | Path                    | What it does                             |
| ------ | ----------------------- | ---------------------------------------- |
| POST   | `/register`             | Create a new account                     |
| POST   | `/login`                | Start a session                          |
| POST   | `/logout`               | Destroy the session                      |
| GET    | `/me`                   | Get the logged-in user                   |
| GET    | `/subjects`             | List your subjects with total study time |
| POST   | `/subjects`             | Add a subject                            |
| PATCH  | `/subjects/:subject_id` | Rename a subject                         |
| DELETE | `/subjects/:subject_id` | Delete a subject                         |
| POST   | `/sessions`             | Save a finished study session            |

## Database

Three tables. Deleting a user removes their subjects and sessions automatically through `ON DELETE CASCADE`.

```
users
  id, username, email, password_hash, created_at

subjects
  id, user_id -> users.id, name, created_at
  UNIQUE (user_id, name)

study_sessions
  id, user_id -> users.id, subject_id -> subjects.id,
  started_at, ended_at, duration_seconds
```

The `UNIQUE (user_id, name)` rule means two people can both have a subject called "Math", but one person cannot add "Math" twice.

## Running it locally

You need Node.js 18 or newer and a PostgreSQL database. A free [Neon](https://neon.com) database works fine.

### 1. Clone the repo

```bash
git clone https://github.com/yusang02/study-time-tracker.git
cd study-time-tracker
```

### 2. Set up the database

Run `server/schema.sql` on your database. The session table is created automatically the first time the server starts.

### 3. Start the backend

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and fill in both values:

```
DATABASE_URL=your_postgres_connection_string
SESSION_SECRET=a_long_random_string
```

To generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then start it:

```bash
npm start
```

The server runs on `http://localhost:3000`.

### 4. Start the frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the URL that Vite prints, usually `http://localhost:5173`.

In development Vite proxies `/api` to `localhost:3000`, so you do not need to worry about CORS.

## Project structure

```
study-time-tracker/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx     # Home page
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Dashboard.jsx   # Timer and subject list
│   │   ├── App.jsx             # Routes
│   │   ├── main.jsx
│   │   └── index.css
│   └── vite.config.js          # Dev proxy to the backend
└── server/
    ├── index.js                # Express app and all routes
    ├── db.js                   # PostgreSQL connection pool
    └── schema.sql              # Table definitions
```

## Deployment

The frontend is on Vercel and the backend is on Render, so they sit on different domains. Two things make that work:

- The backend only allows requests from the Vercel domain, with `credentials: true`
- `app.set("trust proxy", 1)` lets Express see that the connection is HTTPS behind Render's proxy, which is required for a `secure` cookie

The API URL is set through `VITE_API_URL`, so the same frontend code works in both development and production.

Note: the backend runs on Render's free tier, so the first request after a quiet period can take around 30 seconds while the service wakes up.

## How the totals are worked out

`GET /subjects` does not send every saved session to the browser. The database groups the rows and adds them up first, so the response stays the same size no matter how many sessions you have:

```sql
SELECT s.id, s.name, COALESCE(SUM(ss.duration_seconds), 0) AS total_seconds
FROM subjects AS s
LEFT JOIN study_sessions AS ss ON ss.subject_id = s.id
WHERE s.user_id = $1
GROUP BY s.id
ORDER BY s.created_at
```

`LEFT JOIN` keeps subjects that have no sessions yet, and `COALESCE` turns their `NULL` sum into `0`.

## Roadmap

### Next: statistics page

Right now you can see a total per subject, but not how that time is spread out. The next step is a page that answers "when did I study?"

Planned for that page:

- Totals for today, this week, and this month
- A bar chart of daily study time over the last 7 days
- A list of recent sessions

This needs a new `GET /sessions` endpoint, with a row limit so the browser never pulls the whole history at once.

### Later

- Rename a subject (the `PATCH` endpoint exists, the button does not)

- Edit or delete a saved session
- Study goals, for example "5 hours of Math per week"
- Password reset
- Automated tests

## Author

Yusang ([github.com/yusang02](https://github.com/yusang02))
