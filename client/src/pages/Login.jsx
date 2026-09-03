import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message || "",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    // Prevent default form submission
    e.preventDefault();
    setSuccessMessage("");
    setLoading(true);
    setError("");

    // Send POST request to /api/login with email and password
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

      // If successful, redirect to /dashboard
      if (response.ok) {
        navigate("/dashboard");
      }
      // If not successful, show an alert with the error message
      else {
        setError(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Error logging in user:", error);
      setError("An error occurred while logging in. Please try again.");
    } finally {
      setLoading(false);
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
        <small className="hint">At least 8 characters</small>
        {successMessage ? (
          <p className="success">{successMessage}</p>
        ) : (
          <p className="error">{error}</p>
        )}
        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>
        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
