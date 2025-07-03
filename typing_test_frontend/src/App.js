import React, { useState, useRef, useEffect } from "react";
import "./App.css";

// PUBLIC_INTERFACE
/**
 * Typing Test Main Component - Minimal UI, Full-Screen, Dark Theme
 * Focuses user attention on a clean dark typing area, high contrast, minimal accents.
 * Color palette: primary: #282C34, accent: #FF9800, secondary: #4F8EF7, text: light, backgrounds: deep gray/black.
 */
const TEST_DURATION = 60; // seconds

const WORDS = [
  "type","keyboard","speed","learn","focus","improve","react","modern",
  "simple","quick","fox","dog","skill","library","makes","perfect",
  "things","stay","keep","jumps","over","brown","lazy","test","code",
  "web","best","makes","strong","light","time","great","fast","fun",
  "demo","user","input","output","logic","stats","again"
];
const PUNCTUATION = [".", ",", "!", "?", ";", ":"];
const NUMBERS = ["1","2","3","4","5","6","7","8","9","0"];

function App() {
  // Theme state (dark mode enforced)
  const [theme] = useState("dark");

  // Option Toggles
  const [includePunctuation, setIncludePunctuation] = useState(false);
  const [includeNumbers, setIncludeNumbers] = useState(false);
  const [includeCasing, setIncludeCasing] = useState(false);

  // Test State
  const [testStarted, setTestStarted] = useState(false);
  const [testFinished, setTestFinished] = useState(false);

  // Test data
  const [testWords, setTestWords] = useState([]);
  const [userInputs, setUserInputs] = useState([]);
  const [currentWordInput, setCurrentWordInput] = useState("");
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [timer, setTimer] = useState(TEST_DURATION);
  const [intervalId, setIntervalId] = useState(null);

  // Stats
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);

  // Focus
  const inputRef = useRef(null);

  // PUBLIC_INTERFACE
  function generateTestWords({ punctuation = false, numbers = false, casing = false, numWords = 32 } = {}) {
    let pool = [...WORDS];
    if (numbers) pool = pool.concat(NUMBERS);
    let arr = [];
    for (let i = 0; i < numWords; ++i) {
      let word = pool[Math.floor(Math.random() * pool.length)];
      if (casing && Math.random() > 0.5) {
        if (Math.random() > 0.5) word = word[0].toUpperCase() + word.slice(1);
        else word = word.toUpperCase();
      }
      if (punctuation && Math.random() < 0.18) {
        if (Math.random() < 0.7)
          word = word + PUNCTUATION[Math.floor(Math.random() * PUNCTUATION.length)];
        else
          word = PUNCTUATION[Math.floor(Math.random() * PUNCTUATION.length)] + word;
      }
      arr.push(word);
    }
    if (punctuation && arr.length > 0 && Math.random() > 0.3)
      arr[arr.length-1] = arr[arr.length-1].replace(/[.,!?;:]*$/, "") + ".";
    return arr;
  }

  useEffect(() => {
    setTestStarted(false);
    setTestFinished(false);
    setCurrentWordInput("");
    setCurrentWordIdx(0);
    setUserInputs([]);
    setTimer(TEST_DURATION);
    const generated = generateTestWords({
      punctuation: includePunctuation,
      numbers: includeNumbers,
      casing: includeCasing,
    });
    setTestWords(generated);
    // eslint-disable-next-line
  }, [includePunctuation, includeNumbers, includeCasing]);

  useEffect(() => {
    if (testStarted && timer > 0 && !testFinished) {
      const id = setInterval(() => setTimer((prev) => prev - 1), 1000);
      setIntervalId(id);
      return () => clearInterval(id);
    } else if (timer === 0 && testStarted) {
      finishTest();
    }
    // eslint-disable-next-line
  }, [testStarted, timer, testFinished]);

  useEffect(() => {
    if (testStarted || testFinished) updateStats();
    // eslint-disable-next-line
  }, [userInputs, currentWordInput, timer, testStarted, testFinished]);

  // PUBLIC_INTERFACE
  const handleRestart = () => {
    setTestStarted(false);
    setTestFinished(false);
    setCurrentWordIdx(0);
    setUserInputs([]);
    setCurrentWordInput("");
    setTimer(TEST_DURATION);
    const generated = generateTestWords({
      punctuation: includePunctuation,
      numbers: includeNumbers,
      casing: includeCasing,
    });
    setTestWords(generated);
    setWpm(0);
    setAccuracy(0);
    setTimeout(() => inputRef.current && inputRef.current.focus(), 120);
  };

  // PUBLIC_INTERFACE
  const handleStart = () => {
    setTestStarted(true);
    setTestFinished(false);
    setCurrentWordIdx(0);
    setUserInputs([]);
    setCurrentWordInput("");
    setTimer(TEST_DURATION);
    setWpm(0);
    setAccuracy(0);
    setTimeout(() => inputRef.current && inputRef.current.focus(), 60);
  };

  // PUBLIC_INTERFACE
  const handleTyping = (e) => {
    if (!testStarted || testFinished) return;
    let value = e.target.value;

    if (value.endsWith(" ")) {
      const trimmed = value.trimEnd();
      let nextInputs = [...userInputs];
      nextInputs[currentWordIdx] = trimmed;
      setUserInputs(nextInputs);

      if (currentWordIdx < testWords.length - 1) {
        setCurrentWordIdx((idx) => idx + 1);
        setCurrentWordInput("");
      } else {
        finishTest();
      }
      setTimeout(() => {
        if (inputRef.current) inputRef.current.value = "";
      }, 0);
      return;
    }
    setCurrentWordInput(value);
  };

  useEffect(() => {
    if (!testStarted || testFinished) return;
    if (inputRef.current && inputRef.current.value !== currentWordInput) {
      inputRef.current.value = currentWordInput;
    }
  }, [currentWordInput, testStarted, testFinished]);

  useEffect(() => {
    if (userInputs.length < currentWordIdx)
      setUserInputs([...userInputs, ""]);
  }, [currentWordIdx, userInputs]);

  useEffect(() => {
    if (!testStarted || testFinished) return;
    if (
      currentWordIdx === testWords.length - 1 &&
      currentWordInput.length >= testWords[testWords.length - 1].length
    ) {
      let nextInputs = [...userInputs];
      nextInputs[currentWordIdx] = currentWordInput;
      setUserInputs(nextInputs);
      finishTest();
    }
    // eslint-disable-next-line
  }, [currentWordInput, currentWordIdx, testStarted, testFinished]);

  // PUBLIC_INTERFACE
  function finishTest() {
    setTestFinished(true);
    setTestStarted(false);
    setTimer((t) => (t === 0 ? 0 : t));
    if (intervalId) clearInterval(intervalId);
    updateStats(true);
  }

  // PUBLIC_INTERFACE
  function updateStats(final = false) {
    let attemptCount = 0;
    let correctChars = 0;
    let totalChars = 0;
    let correctWords = 0;

    let entries = [...userInputs];
    if (!final && (!testFinished)) {
      if (currentWordInput.length > 0) {
        entries = [...userInputs];
        entries[currentWordIdx] = currentWordInput;
      }
    }
    for (let i = 0; i < testWords.length; ++i) {
      const refWord = testWords[i] || "";
      const typed = entries[i] || "";
      if (typed === "") continue;
      attemptCount++;
      if (typed === refWord) correctWords++;
      let wordCorrect = 0;
      let chars = Math.max(typed.length, refWord.length);
      for (let j = 0; j < chars; ++j) {
        totalChars++;
        if (typed[j] === refWord[j]) wordCorrect++;
      }
      correctChars += wordCorrect;
    }
    const timeElapsed = TEST_DURATION - timer;
    const minutes = final ? (TEST_DURATION / 60) : timeElapsed > 0 ? (timeElapsed / 60) : (1 / 60);
    let wpmValue = correctWords / minutes;
    setWpm(Math.round(wpmValue));
    setAccuracy(totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0);
  }

  // PUBLIC_INTERFACE: highlights typing text with dark-friendly readable accent/colors
  function getHighlightedText() {
    let result = [];
    for (let wi = 0; wi < testWords.length; ++wi) {
      let word = testWords[wi];
      let input =
        wi < userInputs.length
          ? userInputs[wi]
          : wi === currentWordIdx
          ? currentWordInput
          : "" || "";
      for (let ci = 0; ci < word.length; ++ci) {
        let char = word[ci];
        let style = {};
        if (input.length > ci) {
          style.backgroundColor = input[ci] === char ? "#394050" : "#74252f";
          style.color = input[ci] === char ? "#FFEB3B" : "#FF5555";
          style.fontWeight = 600;
          style.borderRadius = "3px";
          style.padding = "0 1.7px";
        }
        result.push(
          <span key={`w${wi}-c${ci}`} style={style}>{char}</span>
        );
      }
      if (wi !== testWords.length - 1) {
        result.push(
          <span key={`w${wi}-sp`} style={{ userSelect: "none" }}>{" "}</span>
        );
      }
    }
    return result;
  }

  // Minimal dark palette (for inline accents)
  const palette = {
    "--primary": "#282C34",
    "--accent": "#FF9800",
    "--secondary": "#4F8EF7",
    "--bg": "#181A1B",
    "--border": "#232427",
    "--input-bg": "#23252A",
    "--input-border": "#333740",
    "--surface": "#212326",
    "--text-main": "#F9F9F9",
    "--text-secondary": "#bfc7d5"
  };

  // Option toggles UI, minimal
  function renderOptionsPanel() {
    return (
      <div className="options-panel">
        <label>
          <input
            type="checkbox"
            checked={includePunctuation}
            onChange={() => setIncludePunctuation(v => !v)}
            disabled={testStarted && !testFinished}
            style={{ accentColor: palette["--accent"], marginRight: 2 }}
          />
          Punctuation
        </label>
        <label>
          <input
            type="checkbox"
            checked={includeCasing}
            onChange={() => setIncludeCasing(v => !v)}
            disabled={testStarted && !testFinished}
            style={{ accentColor: palette["--accent"], marginRight: 2 }}
          />
          Mixed Casing
        </label>
        <label>
          <input
            type="checkbox"
            checked={includeNumbers}
            onChange={() => setIncludeNumbers(v => !v)}
            disabled={testStarted && !testFinished}
            style={{ accentColor: palette["--accent"], marginRight: 2 }}
          />
          Numbers
        </label>
      </div>
    );
  }

  // Theme toggle is kept, but always on dark for minimal UI.
  return (
    <div
      className="typing-app"
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        background: palette["--bg"],
        color: palette["--text-main"],
        fontFamily: "Inter, Segoe UI, Arial, sans-serif",
      }}
      data-theme={theme}
    >
      {/* theme toggle (icon only, no mode switching in minimal mode) */}
      <button
        className="theme-toggle"
        tabIndex={-1}
        aria-label="Dark theme mode"
        style={{
          background: palette["--surface"],
          color: palette["--text-main"],
          border: "none",
        }}
        disabled
      >
        <span aria-label="dark mode" role="img">🌙</span>
      </button>
      <div className="centered-body">
        <div className="typing-container" tabIndex={-1}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            margin: 0,
            marginBottom: 15,
            letterSpacing: "-1px",
            color: palette["--text-main"],
            textAlign: "center"
          }}>Typing Test</h1>
          {/* TIMER */}
          <div style={{
            fontSize: 23,
            marginBottom: 20,
            fontFamily: "monospace",
            letterSpacing: ".8px",
            fontWeight: 400,
            color: palette["--accent"],
            textAlign: "center"
          }}>
            ⏱ <span>{timer < 10 ? `0${timer}` : timer}s</span>
          </div>
          {renderOptionsPanel()}
          {/* TEST PHRASE */}
          <div className="test-paragraph" tabIndex={-1}>
            {getHighlightedText()}
          </div>
          <input
            ref={inputRef}
            disabled={!testStarted || testFinished}
            className="typing-input"
            style={{
              background: palette["--input-bg"], color: palette["--text-main"],
              border: `2px solid ${palette["--input-border"]}`
            }}
            placeholder={
              testStarted ? "Type the text above..." : "Click Start to begin"
            }
            defaultValue=""
            onChange={handleTyping}
            onPaste={e => e.preventDefault()}
            tabIndex={0}
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            aria-label="Start typing here"
            maxLength={testWords[currentWordIdx] ? testWords[currentWordIdx].length + 4 : 22}
          />
          {/* BUTTONS */}
          <div style={{
            display: "flex",
            justifyContent: testStarted ? "space-between" : "center",
            gap: 10,
            marginBottom: 0,
            marginTop: "2px"
          }}>
            {(testFinished || !testStarted) && (
              <button
                onClick={handleStart}
                className="btn"
                style={{ background: palette["--accent"], color: "#222" }}
              >Start</button>
            )}
            {(testStarted && !testFinished) && (
              <button
                onClick={finishTest}
                className="btn"
                style={{
                  background: palette["--secondary"],
                  color: "#F9F9F9",
                  fontWeight: 500,
                }}
              >Finish</button>
            )}
            {(testFinished || testStarted) && (
              <button
                onClick={handleRestart}
                className="btn"
                style={{
                  background: "#23252a",
                  color: palette["--accent"],
                  border: `1.4px solid ${palette["--accent"]}`,
                  fontWeight: 470,
                }}
              >Restart</button>
            )}
          </div>
        </div>
        {/* RESULTS */}
        <div className="results-section">
          {testFinished ? (
            <>
              <div style={{
                fontWeight: 600,
                fontSize: 20,
                marginBottom: 10,
                color: palette["--secondary"]
              }}>
                🏁 Results
              </div>
              <div style={{
                marginBottom: 8
              }}>
                <span style={{ fontWeight: 500, color: palette["--accent"] }}>WPM:</span> <span style={{ fontWeight: 700 }}>{wpm}</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: palette["--secondary"], fontWeight: 500 }}>Accuracy:</span> <span style={{ fontWeight: 700 }}>{accuracy}%</span>
              </div>
              <div style={{ color: "#848ca2", fontSize: 13, marginTop: 6 }}>
                Try again for another score.
              </div>
            </>
          ) : (
            <span style={{ color: "#555B6D" }}>Start the test to see your results here.</span>
          )}
        </div>
        {/* Attribution */}
        <div style={{ marginTop: 48, color: "#353950", fontSize: 13, textAlign: "center" }}>
          <span style={{ color: palette["--accent"], textShadow: "0 2px 4px #1a1a1c33" }}>typespeed.app</span>
          {" "} / A minimal React typing test demo
        </div>
      </div>
    </div>
  );
}

export default App;
