import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";

function Landing() {
  return (
    <div className="landing">
      <img src={logo} alt="logo" className="landing-logo" />
      <h1>Study Time Tracker</h1>
      <p>
        Start a timer, track your subjects
        <br />
        See your weekly total.
      </p>
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
