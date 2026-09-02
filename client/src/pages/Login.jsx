import { Link } from "react-router-dom";

function Login() {
  return (
    <div className="auth">
      <form>
        <h1>Welcome back!</h1>
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">Login</button>
        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
