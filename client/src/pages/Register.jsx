import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    // 1. Prevent default form submission
    e.preventDefault();
    // 2. Send POST request to /api/register with username, email, password
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
        credentials: "include", // Include cookies in the request
      });

      const data = await response.json();

      // 4. If successful, redirect to /login
      if (response.ok) {
        navigate("/login");
      }
      // 5. If not successful, show an alert with the error message
      else {
        setError(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Error registering user:", error);
      setError("An error occurred while registering. Please try again.");
    }
  }

  return (
    <div className="auth">
      <form onSubmit={handleSubmit}>
        <h1>Hello, Friend!</h1>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <small className="hint">At least 8 characters</small>
        <p className="error">{error}</p>

        <button type="submit">Sign up</button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
