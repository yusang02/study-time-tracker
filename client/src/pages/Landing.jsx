import { Link } from "react-router-dom";

function Landing() {
  return (
    <div className="landing">
      <h1>Study Time Tracker</h1>
      <p>Start a timer, track your subjects, see your weekly total.</p>
      <div className="landing-buttons">
        <Link to="/login" className="login">
          Login
        </Link>
        <Link to="/register">Register</Link>
      </div>
    </div>
  );
}

export default Landing;
