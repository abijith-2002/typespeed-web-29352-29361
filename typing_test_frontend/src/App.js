import React, { useState, useRef, useEffect } from "react";
import "./App.css";

// PUBLIC_INTERFACE
/**
 * Typing Test Main Component
 * Features:
 * - Typing test UI (customizable random text)
 * - Timer functionality (60s default)
 * - Real-time WPM and accuracy calculation
 * - Option toggles: include/exclude punctuation, mixed casing, numbers
 * - Letter-by-letter comparison, advance on space
 * - Result display (WPM, accuracy, stats)
 * - Restart/New Test option
 * Styling: Modern, minimal, light theme (primary: #4F8EF7, secondary: #282C34, accent: #FF9800)
 */
const TEST_DURATION = 60; // seconds

const WORDS = [
  "type",
  "keyboard",
  "speed",
  "learn",
  "focus",
  "improve",
  "react",
  "modern",
  "simple",
  "quick",
  "fox",
  "dog",
  "skill",
  "library",
  "makes",
  "perfect",
  "things",
  "stay",
  "keep",
  "jumps",
  "over",
  "brown",
  "lazy",
  "test",
  "code",
  "web",
  "best",
  "makes",
  "strong",
  "light",
  "time",
  "great",
  "fast",
  "fun",
  "demo",
  "user",
  "input",
  "output",
  "logic",
  "stats",
  "again",
];

const PUNCTUATION = [".", ",", "!", "?", ";", ":"];

const NUMBERS = ["1","2","3","4","5","6","7","8","9","0"];

// PUBLIC_INTERFACE
function App() {
  // Theme state (optional toggle)
  const [theme, setTheme] = useState("light");

  // Option Toggles
  const [includePunctuation, setIncludePunctuation] = useState(false);
  const [includeNumbers, setIncludeNumbers] = useState(false);
  const [includeCasing, setIncludeCasing] = useState(false);

  // Test State
  const [testStarted, setTestStarted] = useState(false);
  const [testFinished, setTestFinished] = useState(false);

  // Test data
  const [testWords, setTestWords] = useState([]); // array of words (strings)
  const [userInputs, setUserInputs] = useState([]); // array of strings, one per word
  const [currentWordInput, setCurrentWordInput] = useState(""); // current word string
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [testText, setTestText] = useState(""); // full test string (for highlight display)
  const [timer, setTimer] = useState(TEST_DURATION);
  const [intervalId, setIntervalId] = useState(null);

  // Stats
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);

  // Focus
  const inputRef = useRef(null);

  // Word/phrase generator respecting toggles
  // PUBLIC_INTERFACE
  function generateTestWords(
    { punctuation = false, numbers = false, casing = false, numWords = 32 } = {}
  ) {
    let pool = [...WORDS];
    if (numbers) {
      pool = pool.concat(NUMBERS.map((n) => n));
    }
    let arr = [];
    for (let i = 0; i < numWords; ++i) {
      let word = pool[Math.floor(Math.random() * pool.length)];
      // Casing
      if (casing && Math.random() > 0.5) {
        // randomly uppercase first letter or whole word
        if (Math.random() > 0.5)
          word = word[0].toUpperCase() + word.slice(1);
        else
          word = word.toUpperCase();
      }
      // Optionally add punctuation (but only not on every word)
      if (punctuation && Math.random() < 0.18) {
        if (Math.random() < 0.7) {
          // Attach at end
          word = word + PUNCTUATION[Math.floor(Math.random() * PUNCTUATION.length)];
        } else {
          // Attach at front
          word = PUNCTUATION[Math.floor(Math.random() * PUNCTUATION.length)] + word;
        }
      }
      arr.push(word);
    }
    // Optionally join last word with period only for nicer finish if punctuation
    if (punctuation && arr.length > 0 && Math.random() > 0.3) {
      arr[arr.length-1] = arr[arr.length-1].replace(/[.,!?;:]*$/, "") + ".";
    }
    return arr;
  }

  // At mount & on option change & restart: generate new words
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
    setTestText(generated.join(" "));
  }, [includePunctuation, includeNumbers, includeCasing]);

  // Timer countdown logic
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
  }, [testStarted, timer, testFinished]);

  // On any input or end, update stats
  useEffect(() => {
    if (testStarted || testFinished) {
      updateStats();
    }
    // eslint-disable-next-line
  }, [userInputs, currentWordInput, timer, testStarted, testFinished]);

  // Restart
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
    setTestText(generated.join(" "));
    setWpm(0);
    setAccuracy(0);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 150);
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
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  // PUBLIC_INTERFACE
  const handleTyping = (e) => {
    if (!testStarted || testFinished) return;
    let value = e.target.value;

    // If space pressed, finalize the current word and advance
    // We support user typing multi spaces by split
    if (value.endsWith(" ")) {
      const trimmed = value.trimEnd();
      // Save current input so far as word entry
      let nextInputs = [...userInputs];
      nextInputs[currentWordIdx] = trimmed;
      setUserInputs(nextInputs);

      // Advance to next word if possible
      if (currentWordIdx < testWords.length - 1) {
        setCurrentWordIdx((idx) => idx + 1);
        setCurrentWordInput("");
      } else {
        finishTest();
      }
      // forcibly clear input value to next word
      setTimeout(() => {
        if (inputRef.current) inputRef.current.value = "";
      }, 0);
      return;
    }

    // Otherwise just update the current word input (letter by letter)
    setCurrentWordInput(value);
  };

  // Called for controlled input value to keep sync
  useEffect(() => {
    if (!testStarted || testFinished) return;
    if (inputRef.current && inputRef.current.value !== currentWordInput) {
      inputRef.current.value = currentWordInput;
    }
  }, [currentWordInput, testStarted, testFinished]);

  // When currentWordIdx changes, push new word input if necessary
  useEffect(() => {
    // If starting on a new word, ensure userInputs has correct length
    if (userInputs.length < currentWordIdx) {
      setUserInputs([...userInputs, ""]);
    }
  }, [currentWordIdx, userInputs]);

  // // When user finishes typing the last word's last letter, mark as done
  useEffect(() => {
    if (!testStarted || testFinished) return;
    if (
      currentWordIdx === testWords.length - 1 &&
      currentWordInput.length >= testWords[testWords.length - 1].length
    ) {
      // Save final word
      let nextInputs = [...userInputs];
      nextInputs[currentWordIdx] = currentWordInput;
      setUserInputs(nextInputs);
      finishTest();
    }
  }, [currentWordInput, currentWordIdx, testStarted, testFinished]);

  // PUBLIC_INTERFACE
  function finishTest() {
    setTestFinished(true);
    setTestStarted(false);
    setTimer((t) => t === 0 ? 0 : t); // freeze timer visually
    if (intervalId) clearInterval(intervalId);
    updateStats(true);
  }

  // PUBLIC_INTERFACE
  function updateStats(final = false) {
    // To compute correctness, compare each word input to test word
    let attemptCount = 0;
    let correctChars = 0;
    let totalChars = 0;
    let correctWords = 0;

    // Count up to latest completed word unless finished, then all
    let entries = [...userInputs];
    if (!final && (!testFinished)) {
      // Only count current word if any input in progress
      if (currentWordInput.length > 0) {
        entries = [...userInputs];
        entries[currentWordIdx] = currentWordInput;
      }
    }
    // Compare
    for (let i = 0; i < testWords.length; ++i) {
      const refWord = testWords[i] || "";
      const typed = entries[i] || "";
      if (typed === "") continue;
      attemptCount++;
      // Check word
      if (typed === refWord) correctWords++;
      // Char-by-char accuracy
      let wordCorrect = 0;
      let chars = Math.max(typed.length, refWord.length);
      for (let j = 0; j < chars; ++j) {
        totalChars++;
        if (typed[j] === refWord[j]) wordCorrect++;
      }
      correctChars += wordCorrect;
    }

    // Time in minutes
    const timeElapsed = TEST_DURATION - timer;
    const minutes = final ? TEST_DURATION / 60 : timeElapsed > 0 ? timeElapsed / 60 : 1 / 60;
    // WPM (strict: only 100% matched words count)
    let wpmValue = correctWords / minutes;
    setWpm(Math.round(wpmValue));
    // Accuracy
    setAccuracy(totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0);
  }

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prev) => prev === "light" ? "dark" : "light");
  };

  // PUBLIC_INTERFACE
  // Display with highlight: Each word, each char, highlight based on actual input for the word
  function getHighlightedText() {
    // For each word, check its input
    let result = [];
    for (let wi = 0; wi < testWords.length; ++wi) {
      let word = testWords[wi];
      let input = (wi < userInputs.length ? userInputs[wi] : (wi === currentWordIdx ? currentWordInput : "")) || "";
      for (let ci = 0; ci < word.length; ++ci) {
        let char = word[ci];
        let style = {};
        if (input.length > ci) {
          style.backgroundColor = input[ci] === char ? "#B3E5FC" : "#FFCDD2";
          style.color = input[ci] === char ? "#282C34" : "#C62828";
          style.fontWeight = 500;
        }
        result.push(
          <span key={`w${wi}-c${ci}`} style={style}>{char}</span>
        );
      }
      // add word space, but don't highlight (or show a real space marker)
      if (wi !== testWords.length - 1) {
        result.push(<span key={`w${wi}-sp`} style={{ userSelect: "none" }}>{" "}</span>);
      }
    }
    return result;
  }

  // Palette for minimal styling
  const palette = {
    "--primary": "#4F8EF7",
    "--secondary": "#282C34",
    "--accent": "#FF9800",
    "--bg": "#fff",
    "--border": "#e9ecef",
    "--input-bg": "#f8f9fa",
    "--input-border": "#cfd8dc",
  };

  // Option toggles UI
  function renderOptionsPanel() {
    return (
      <div style={{
        display: "flex",
        flexDirection: "row",
        gap: 16,
        marginBottom: 24,
        alignItems: "center",
        justifyContent: "flex-start",
        flexWrap: "wrap"
      }}>
        <label style={{
          display: "flex", alignItems: "center", gap: 7,
          fontSize: 15, fontWeight: 500,
          color: palette["--secondary"],
          background: "#f8f9fa", padding: "6px 12px", borderRadius: 8,
          cursor: "pointer"
        }}>
          <input
            type="checkbox"
            checked={includePunctuation}
            onChange={() => setIncludePunctuation(v => !v)}
            disabled={testStarted && !testFinished}
            style={{ accentColor: palette["--accent"], marginRight: 2 }}
          />
          Punctuation
        </label>
        <label style={{
          display: "flex", alignItems: "center", gap: 7,
          fontSize: 15, fontWeight: 500,
          color: palette["--secondary"],
          background: "#f8f9fa", padding: "6px 12px", borderRadius: 8,
          cursor: "pointer"
        }}>
          <input
            type="checkbox"
            checked={includeCasing}
            onChange={() => setIncludeCasing(v => !v)}
            disabled={testStarted && !testFinished}
            style={{ accentColor: palette["--accent"], marginRight: 2 }}
          />
          Mixed Casing
        </label>
        <label style={{
          display: "flex", alignItems: "center", gap: 7,
          fontSize: 15, fontWeight: 500,
          color: palette["--secondary"],
          background: "#f8f9fa", padding: "6px 12px", borderRadius: 8,
          cursor: "pointer"
        }}>
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
          {/* OPTIONS */}
          {renderOptionsPanel()}
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
            // value is controlled by setCurrentWordInput but userInputs as source of truth
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
