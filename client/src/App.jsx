import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [result, setResult] = useState();
  useEffect(() => {
    async function load() {
      const res = await fetch(
        "https://study-time-tracker-yszp.onrender.com/test",
      );
      const result = await res.json();
      setResult(result);
    }
    load();
  }, []);

  return (
    <>
      <h1>Study Time Tracker</h1>
      <p>{result?.status}</p>
    </>
  );
}

export default App;
