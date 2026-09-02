import "dotenv/config";
import db from "./db.js";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 12;
const PgSession = connectPgSimple(session);
const isProd = process.env.NODE_ENV === "production";

app.use(
  isProd
    ? cors({
        origin: "https://study-time-tracker-ten.vercel.app",
        credentials: true,
      })
    : cors(),
);
app.use(express.json());
if (isProd) app.set("trust proxy", 1);
app.use(
  session({
    // Store sessions in Postgres instead of memory
    store: new PgSession({
      pool: db,
      createTableIfMissing: true,
    }),
    // Signs the cookie so it can't be forged
    secret: process.env.SESSION_SECRET,
    // Don't rewrite unchanged sessions
    resave: false,
    // Don't create sessions for visitors who never log in
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true, // Not readable by JS (XSS defence)
      sameSite: isProd ? "none" : "lax",
      secure: isProd, // HTTPS only
    },
  }),
);

// Handle register
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email and password are required" });
    }

    if (!email.includes("@") || !email.includes(".")) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    // Hash password
    const hashPass = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, hashPass],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    // Duplicate email or username
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email or username already taken" });
    }

    res.status(500).json({ error: "Registration failed" });
  }
});

// Handle login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    // Same message as wrong password (don't leak which emails exist)
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Compare against the stored hash
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Start the session
    req.session.userId = user.id;

    // Never send password_hash back
    res.json({ id: user.id, username: user.username, email: user.email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Handle logout
app.post("/logout", (req, res) => {
  // Delete the session in the DB
  req.session.destroy((error) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Logout failed" });
    }
    // Delete the cookie in the browser
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
});

// Return the currently logged in user
app.get("/me", async (req, res) => {
  try {
    // Not logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Find user
    const result = await db.query(
      "SELECT id, username, email FROM users WHERE id = $1",
      [req.session.userId],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Add a new subject for the logged-in user
app.post("/subjects", async (req, res) => {
  try {
    const { subjectName } = req.body;

    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Validate input
    if (!subjectName) {
      return res.status(400).json({ error: "Subject name is required" });
    }

    // Insert subject
    const result = await db.query(
      "INSERT INTO subjects (user_id, name) VALUES ($1, $2) RETURNING id, name",
      [req.session.userId, subjectName],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Subject already exists" });
    }
    console.error(error);
    res.status(500).json({ error: "Failed to add subject" });
  }
});

// Delete a subject for the logged-in user
app.delete("/subjects/:subject_id", async (req, res) => {
  try {
    const { subject_id } = req.params;

    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Delete the subject
    const result = await db.query(
      "DELETE FROM subjects WHERE id = $1 AND user_id = $2 RETURNING id",
      [subject_id, req.session.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Subject not found" });
    }
    res.json({ message: "Subject deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete subject" });
  }
});

// Return all subjects for the logged-in user
app.get("/subjects", async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Fetch subjects for the logged-in user
    const result = await db.query(
      "SELECT id, name FROM subjects WHERE user_id = $1 ORDER BY created_at",
      [req.session.userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

// Create a completed study session
app.post("/sessions", async (req, res) => {
  try {
    const { subject_id, started_at, ended_at, duration_seconds } = req.body;
    //check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Validate input
    if (!subject_id || !started_at || !ended_at || !duration_seconds) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if the subject belongs to the logged-in user
    const subjectResult = await db.query(
      "SELECT id FROM subjects WHERE id = $1 AND user_id = $2",
      [subject_id, req.session.userId],
    );
    if (subjectResult.rows.length === 0) {
      return res.status(404).json({ error: "Subject not found" });
    }

    // Insert session
    const result = await db.query(
      "INSERT INTO study_sessions (user_id, subject_id, started_at, ended_at, duration_seconds) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [req.session.userId, subject_id, started_at, ended_at, duration_seconds],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create study session" });
  }
});

// Update a subject name for the logged-in user
app.patch("/subjects/:subject_id", async (req, res) => {
  try {
    const { subject_id } = req.params;
    const { subjectName } = req.body;

    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Validate input
    if (!subjectName) {
      return res.status(400).json({ error: "Subject name is required" });
    }

    // Update subject name
    const result = await db.query(
      "UPDATE subjects SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING id, name",
      [subjectName, subject_id, req.session.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Subject not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update subject" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}.`);
});
