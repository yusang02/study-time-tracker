import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Include cookies in the request
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/dashboard"); // Redirect to dashboard on successful login
      }
      // Handle failed login
      else {
        setError(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Error logging in user:", error);
      setError("An error occurred while logging in. Please try again.");
    }
  }

  return (
    <div className="auth">
      <form onSubmit={handleSubmit}>
        <h1>Welcome back!</h1>
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
        <p className="error">{error}</p>
        <button type="submit">Login</button>
        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
