import React, { useState, useRef, useEffect } from "react";
import "./App.css";

// PUBLIC_INTERFACE
/**
 * Typing Test Main Component
 * Features:
 * - Typing test UI (random text)
 * - Timer functionality (60s default)
 * - Real-time WPM calculation
 * - Result display (WPM, accuracy, stats)
 * - Restart/New Test option
 * Styling: Modern, minimal, light theme (primary: #4F8EF7, secondary: #282C34, accent: #FF9800)
 */
const TEST_DURATION = 60; // seconds
const TEST_TEXTS = [
  "The quick brown fox jumps over the lazy dog.",
  "React is a JavaScript library for building user interfaces.",
  "Typing fast is a useful skill for programmers.",
  "Practice makes perfect when learning new things.",
  "Stay focused and keep improving your typing speed."
];

// PUBLIC_INTERFACE
function App() {
  // State for theme (still supports user toggle per template)
  const [theme, setTheme] = useState("light");

  // Core state for Typing Test
  const [testStarted, setTestStarted] = useState(false);
  const [testFinished, setTestFinished] = useState(false);

  // The test phrase
  const [testText, setTestText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [timer, setTimer] = useState(TEST_DURATION);
  const [intervalId, setIntervalId] = useState(null);

  // Performance stats
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);

  // Focus management
  const inputRef = useRef(null);

  // On mount: pick a random test text
  useEffect(() => {
    setTestText(TEST_TEXTS[Math.floor(Math.random() * TEST_TEXTS.length)]);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (testStarted && timer > 0 && !testFinished) {
      const id = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      setIntervalId(id);
      return () => clearInterval(id);
    } else if (timer === 0 && testStarted) {
      finishTest();
    }
    // eslint-disable-next-line
  }, [testStarted, timer, testFinished]);

  // Recalculate stats on every input
  useEffect(() => {
    if (testStarted || testFinished) {
      updateStats();
    }
    // eslint-disable-next-line
  }, [userInput, timer, testStarted, testFinished]);

  // Reset on new test
  const handleRestart = () => {
    setTestText(TEST_TEXTS[Math.floor(Math.random() * TEST_TEXTS.length)]);
    setUserInput("");
    setTimer(TEST_DURATION);
    setTestStarted(false);
    setTestFinished(false);
    setWpm(0);
    setAccuracy(0);
    // Focus input after a short delay (for DOM update)
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 150);
  };

  // Start typing test
  const handleStart = () => {
    setTestStarted(true);
    setTestFinished(false);
    setUserInput("");
    setTimer(TEST_DURATION);
    setWpm(0);
    setAccuracy(0);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  // Typing event
  const handleTyping = (e) => {
    let value = e.target.value;
    if (!testStarted || testFinished) return;
    if (value.length > testText.length) value = value.slice(0, testText.length);
    setUserInput(value);
    // If user finishes early
    if (value.length === testText.length) {
      finishTest();
    }
  };

  // Finish test
  const finishTest = () => {
    setTestFinished(true);
    setTestStarted(false);
    setTimer((t) => t === 0 ? 0 : t); // freeze timer visually
    if (intervalId) clearInterval(intervalId);
    updateStats(true);
  };

  // Calculate stats
  const updateStats = (final = false) => {
    const wordsTyped = userInput.trim().split(/\s+/).filter(Boolean);
    const numWords = wordsTyped.length;
    const timeElapsed = TEST_DURATION - timer;
    let minutes = final ? TEST_DURATION / 60 : timeElapsed > 0 ? timeElapsed / 60 : 1/60;

    // Count correct characters vs total attempted
    let correct = 0;
    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] === testText[i]) correct++;
    }
    const total = userInput.length;
    setAccuracy(total > 0 ? Math.round((correct / total) * 100) : 0);

    // WPM: Only count fully-correct words
    let correctWords = 0;
    const testWords = testText.split(/\s+/);
    for (let i = 0; i < wordsTyped.length; i++) {
      if (wordsTyped[i] === testWords[i]) correctWords++;
    }
    // During test: show current WPM; at end: use total time
    let wpmComputed = correctWords / minutes;
    setWpm(Math.round(wpmComputed));
  };

  // Styling: minimal layout with palette
  const palette = {
    "--primary": "#4F8EF7",
    "--secondary": "#282C34",
    "--accent": "#FF9800",
    "--bg": "#fff",
    "--border": "#e9ecef",
    "--input-bg": "#f8f9fa",
    "--input-border": "#cfd8dc"
  };

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prev) => prev === "light" ? "dark" : "light");
  };

  // Highlight logic for live visual feedback on typing
  const getHighlightedText = () => {
    const chars = testText.split("");
    return chars.map((char, idx) => {
      let style = {};
      if (idx < userInput.length) {
        style.backgroundColor = userInput[idx] === char ? "#B3E5FC" : "#FFCDD2";
        style.color = userInput[idx] === char ? palette["--secondary"] : "#C62828";
        style.fontWeight = 500;
      }
      return (
        <span key={idx} style={style}>{char}</span>
      );
    });
  };

  return (
    <div
      className="typing-app"
      style={{
        minHeight: "100vh",
        background: palette["--bg"],
        color: palette["--secondary"],
        fontFamily: "Inter, Segoe UI, Arial, sans-serif",
        transition: "background 0.4s"
      }}
      data-theme={theme}
    >
      {/* theme toggle (optional, as per template) */}
      <button
        className="theme-toggle"
        style={{
          background: palette["--primary"],
          borderRadius: 8,
          color: "#fff",
          fontWeight: 600,
          position: "absolute",
          right: 24,
          top: 24,
          zIndex: 10,
          border: "none",
          padding: "10px 20px",
          cursor: "pointer"
        }}
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
      <div className="centered-body" style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: 24
      }}>
        <div className="typing-container"
          style={{
            background: "#fff",
            border: `1.5px solid ${palette["--border"]}`,
            borderRadius: 16,
            boxShadow: "0 2px 10px rgba(47,62,88,0.05)",
            maxWidth: 540,
            width: "100%",
            padding: "40px 28px 32px 28px",
            marginBottom: 32
          }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            margin: 0,
            marginBottom: 18,
            letterSpacing: "-1.2px",
            color: palette["--secondary"]
          }}>Typing Test</h1>
          {/* TIMER */}
          <div style={{
            fontSize: 22,
            marginBottom: 20,
            fontWeight: 400,
            color: palette["--primary"]
          }}>
            ⏱ <span>{timer < 10 ? `0${timer}` : timer}s</span>
          </div>

          {/* TEST PHRASE - highlight input */}
          <div className="test-paragraph"
            style={{
              minHeight: 54,
              border: `1px solid ${palette["--border"]}`,
              borderRadius: 9,
              padding: "18px 14px",
              marginBottom: 18,
              fontSize: 18,
              background: "#FCFCFD",
              userSelect: "none",
              letterSpacing: "0.2px",
              lineHeight: 1.58
            }}>
            {getHighlightedText()}
          </div>
          {/* INPUT */}
          <input
            ref={inputRef}
            disabled={!testStarted || testFinished}
            className="typing-input"
            style={{
              width: "100%",
              fontSize: 18,
              minHeight: 38,
              border: `2px solid ${palette["--input-border"]}`,
              borderRadius: 7,
              padding: "9px 12px",
              background: palette["--input-bg"],
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 24,
              marginTop: 0,
              color: "#222",
              transition: "border-color 0.2s"
            }}
            placeholder={
              testStarted ? "Type the text above..." : "Click Start to begin"
            }
            value={userInput}
            onChange={handleTyping}
            onPaste={(e) => e.preventDefault()}
            tabIndex={0}
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            aria-label="Start typing here"
            maxLength={testText.length}
          />
          {/* BUTTONS */}
          <div style={{
            display: "flex",
            justifyContent: testStarted ? "space-between" : "center",
            gap: 10,
            marginBottom: 0
          }}>
            {(testFinished || !testStarted) && (
              <button
                onClick={handleStart}
                className="btn"
                style={{
                  background: palette["--primary"],
                  color: "#fff",
                  fontWeight: 500,
                  fontSize: 16,
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 24px",
                  cursor: "pointer",
                  boxShadow: "0 1px 4px rgba(79, 142, 247, 0.06)",
                  transition: "box-shadow 0.2s"
                }}
              >Start</button>
            )}
            {(testStarted && !testFinished) && (
              <button
                onClick={finishTest}
                className="btn"
                style={{
                  background: palette["--accent"],
                  color: "#fff",
                  fontWeight: 500,
                  fontSize: 16,
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 24px",
                  cursor: "pointer",
                  boxShadow: "0 1px 4px rgba(255, 152, 0, 0.06)",
                  transition: "box-shadow 0.2s"
                }}
              >Finish</button>
            )}
            {(testFinished || testStarted) && (
              <button
                onClick={handleRestart}
                className="btn"
                style={{
                  background: "#f6f7f8",
                  color: palette["--accent"],
                  border: `1.5px solid ${palette["--accent"]}`,
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontWeight: 470,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >Restart</button>
            )}
          </div>
        </div>
        {/* RESULT DISPLAY */}
        <div className="results-section"
          style={{
            width: "100%",
            maxWidth: 540,
            minHeight: 60,
            padding: "22px 18px",
            background: "#fff",
            borderRadius: 13,
            border: `1.2px solid ${palette["--border"]}`,
            textAlign: "center",
            color: palette["--secondary"],
            boxShadow: "0 1.5px 5px rgba(47,62,88,0.04)",
            fontSize: 17,
            fontWeight: 400,
          }}>
          {testFinished ? (
            <>
              <div style={{
                fontWeight: 600,
                fontSize: 20,
                marginBottom: 10,
                color: palette["--primary"]
              }}>
                🏁 Results
              </div>
              <div style={{
                marginBottom: 8
              }}>
                <span style={{ fontWeight: 500, color: palette["--accent"] }}>WPM:</span> <span style={{ fontWeight: 700 }}>{wpm}</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: palette["--primary"], fontWeight: 500 }}>Accuracy:</span> <span style={{ fontWeight: 700 }}>{accuracy}%</span>
              </div>
              <div style={{ color: "#999", fontSize: 14, marginTop: 6 }}>
                Try again for a new test!
              </div>
            </>
          ) : (
            <span style={{ color: "#b3b3b3" }}>Start the test to see your results here.</span>
          )}
        </div>
        {/* Attribution */}
        <div style={{ marginTop: 52, color: "#BBB", fontSize: 13, letterSpacing: 0.03 }}>
          Made with <span style={{ color: palette["--primary"] }}>React</span> | Typing Test Demo
        </div>
      </div>
    </div>
  );
}

export default App;
