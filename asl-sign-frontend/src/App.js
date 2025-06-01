import React, { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import "./App.css";

function App() {
  const webcamRef = useRef(null);
  const [prediction, setPrediction] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [outputLine, setOutputLine] = useState("");
  const [darkMode, setDarkMode] = useState(true);

  const captureAndPredict = useCallback(async () => {
    if (!webcamRef.current) return;

    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) {
      alert("Could not capture image. Try again.");
      return;
    }

    const res = await fetch(screenshot);
    const blob = await res.blob();
    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("image", file);

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/predict", formData);
      const result = response.data.prediction;
      setPrediction(result);
      setOutputLine(prev => prev + result);
    } catch (error) {
      setPrediction("❌");
    }
    setLoading(false);
  }, []);

  const handleKeyPress = useCallback((event) => {
    if (event.code === "Space" && cameraOn) {
      event.preventDefault();
      captureAndPredict();
    }
  }, [cameraOn, captureAndPredict]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light";
  }, [darkMode]);

  const toggleCamera = () => {
    setCameraOn(prev => !prev);
    setPrediction("");
  };

  const insertSpace = () => setOutputLine(prev => prev + " ");
  const clearOutput = () => {
    setOutputLine("");
    setPrediction("");
  };
  const undoLastChar = () => setOutputLine(prev => prev.slice(0, -1));
  const toggleTheme = () => setDarkMode(prev => !prev);

  return (
    <div className={`App ${darkMode ? "dark" : "light"}`}>
      <h1>ASL Sign Detector</h1>

      <div className="controls">
        <button onClick={toggleTheme} className="toggle-theme">
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
        <button onClick={toggleCamera} className="secondary">
          {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
        </button>
        <button onClick={captureAndPredict} disabled={!cameraOn} className="green">
          📸 Capture & Predict
        </button>
      </div>

      <div className="video-section">
        {cameraOn && (
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="webcam"
            videoConstraints={{ facingMode: "user" }}
          />
        )}
      </div>

      <div className="below-video-controls">
        <button onClick={insertSpace} disabled={!cameraOn} className="green">
          ␣ Insert Space
        </button>
        <button onClick={undoLastChar} disabled={!cameraOn || outputLine.length === 0} className="green">
          ⬅️ Undo Last Character
        </button>
        <button onClick={clearOutput} className="clear">
          🗑️ Clear Output
        </button>
      </div>

      <div className="prediction">
        {loading ? (
          <p className="loading">⏳ Predicting...</p>
        ) : (
          prediction && (
            <h2>
              Prediction: <span className="result">{prediction}</span>
            </h2>
          )
        )}
        <p className="note">Press <strong>Spacebar</strong> to Capture & Predict</p>
      </div>

      <div className="history-line">
        <h3>✏️ Output</h3>
        <p className="output-text">{outputLine || "No output yet..."}</p>
      </div>

      <div className="asl-reference">
        <a href="/sign_lang_alph.png" target="_blank" rel="noopener noreferrer">
          📘 View ASL Alphabet Chart
        </a>
      </div>

    </div>
  );
}

export default App;
