import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [second, setSecond] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [inputError, setInputError] = useState(false);
  const [modalError, setModalError] = useState(false);

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
      if (!response.ok) {
        console.error("Failed to fetch subjects:", response.statusText);
        return;
      }
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
    if (startTime === null) {
      setStartTime(new Date().toISOString());
    }
  }

  async function handleStop() {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          subject_id: selectedSubject,
          started_at: startTime,
          ended_at: new Date().toISOString(),
          duration_seconds: second,
        }),
      });

      if (!response.ok) {
        console.error("Failed to save session:", response.statusText);
        return;
      }

      setIsRunning(false);
      setSecond(0);
      setStartTime(null);
      setSelectedSubject(null);
    } catch (error) {
      console.error("Error saving session:", error);
    }
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

  async function handleAddSubject() {
    if (!newSubjectName.trim()) {
      setInputError(true);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/subjects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          subjectName: newSubjectName,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setModalError(data.error || "Failed to add subject");
        return;
      }

      const newSubject = await response.json();
      setSubjects([...subjects, newSubject]);
      setNewSubjectName("");
      setShowModal(false);
    } catch (error) {
      console.error("Error adding subject:", error);
    }
  }

  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm("Delete this subject? All study records will be lost."))
      return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/subjects/${subjectId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        console.error("Failed to delete subject:", response.statusText);
        return;
      }

      setSubjects(subjects.filter((s) => s.id !== subjectId));
      if (selectedSubject === subjectId) {
        setSelectedSubject(null);
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
    }
  };

  const currentSubject = subjects.find((s) => s.id === selectedSubject);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <p className="dashboard-greeting">
          {startTime
            ? `Keep going, ${userData?.username}!`
            : `Hello, ${userData?.username}!`}
        </p>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className="timer">{formatTime(second)}</div>
      <button
        disabled={!selectedSubject}
        onClick={handlePlay}
        className="play-btn"
      >
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
        {startTime ? (
          <>
            <button className="stop-btn" onClick={handleStop}>
              END
            </button>
            <div className="subject selected">{currentSubject?.name}</div>
          </>
        ) : (
          <>
            <div className="subject-controls">
              <button onClick={() => setShowModal(true)}>Add</button>
              <button
                disabled={!selectedSubject}
                onClick={() => handleDeleteSubject(selectedSubject)}
              >
                Delete
              </button>
            </div>
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => handleSubjectClick(subject.id)}
                className={
                  selectedSubject === subject.id
                    ? "subject selected"
                    : "subject"
                }
              >
                {subject.name}
              </button>
            ))}
          </>
        )}
      </div>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add New Subject</h2>
            <input
              className={inputError ? "input-error" : ""}
              type="text"
              placeholder="Subject Name"
              value={newSubjectName}
              onChange={(e) => {
                setNewSubjectName(e.target.value);
                setInputError(false);
                setModalError("");
              }}
            />
            {modalError && <p className="modal-error">{modalError}</p>}
            <div className="modal-buttons">
              <button
                className="modal-cancel"
                onClick={() => {
                  setShowModal(false);
                  setInputError(false);
                  setNewSubjectName("");
                  setModalError("");
                }}
              >
                Cancel
              </button>
              <button className="modal-confirm" onClick={handleAddSubject}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
