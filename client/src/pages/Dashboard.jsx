import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [second, setSecond] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      setSecond((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning]);

  async function fetchSubjects() {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/subjects`, {
        method: "GET",
        credentials: "include",
      });
      const subjects = await response.json();
      setSubjects(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  }

  async function fetchData() {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Failed to fetch user data:", response.statusText);
        navigate("/login"); // Default to login page if not authenticated
        return;
      }
      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  async function handleLogout() {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        console.error("Failed to log out:", response.statusText);
        return;
      }
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  function handlePlay() {
    setIsRunning(!isRunning);
  }

  function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function handleSubjectClick(subjectId) {
    setSelectedSubject(subjectId);
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <p className="dashboard-greeting">Hello, {userData?.username}!</p>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className="timer">{formatTime(second)}</div>
      <button onClick={handlePlay} className="play-btn">
        {isRunning ? (
          <span className="pause-icon">
            <span></span>
            <span></span>
          </span>
        ) : (
          "▶"
        )}
      </button>
      <div className="subject-list">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            onClick={() => handleSubjectClick(subject.id)}
            className={
              selectedSubject === subject.id ? "subject selected" : "subject"
            }
          >
            {subject.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
