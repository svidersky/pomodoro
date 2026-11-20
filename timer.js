// Timer rules — no screen code, no real clock. See CONTEXT.md for the vocabulary.
// Loaded as a plain <script> (so double-clicking index.html still works); exposes `window.Pomodoro`.

(function () {
  const MIN = 60_000;
  const DEFAULT_SETTINGS = { focusMin: 30, breakMin: 7 };
  const MAX_MINUTES = 180;

  // Turns user input into a valid whole number of minutes, or null if it isn't one.
  function parseMinutes(input) {
    if (String(input).trim() === "") return null;
    const value = Math.round(Number(input));
    return Number.isFinite(value) && value >= 1 && value <= MAX_MINUTES ? value : null;
  }

  /**
   * @param {object} opts
   * @param {() => number} opts.now           current time in ms (Date.now in the app, a fake in tests)
   * @param {{focusMin:number, breakMin:number}} opts.settings  starting Settings
   */
  function createTimer({ now, settings }) {
    let current = { ...settings };
    const lengthOf = (phase) => (phase === "focus" ? current.focusMin : current.breakMin) * MIN;

    const s = {
      phase: "focus",
      lengthMs: lengthOf("focus"), // fixed when the Phase is loaded
      remainingMs: lengthOf("focus"),
      running: false,
      endAt: 0,
      count: 0,
    };

    const nextPhase = () => (s.phase === "focus" ? "break" : "focus");
    const isUntouched = () => !s.running && s.remainingMs === s.lengthMs;

    function loadPhase(phase) {
      s.phase = phase;
      s.lengthMs = lengthOf(phase);
      s.remainingMs = s.lengthMs;
      s.running = false;
    }

    function syncRemaining() {
      if (s.running) s.remainingMs = Math.max(0, s.endAt - now());
    }

    return {
      // Read-only view of the timer for drawing the screen.
      snapshot() {
        syncRemaining();
        return {
          phase: s.phase,
          remainingMs: s.remainingMs,
          running: s.running,
          count: s.count,
          untouched: isUntouched(),
        };
      },

      start() {
        if (s.running) return;
        s.running = true;
        s.endAt = now() + s.remainingMs;
      },

      pause() {
        if (!s.running) return;
        syncRemaining();
        s.running = false;
      },

      // Call regularly. Returns the Phase that just ended ("focus" | "break"), or null.
      tick() {
        if (!s.running) return null;
        syncRemaining();
        if (s.remainingMs > 0) return null;
        const ended = s.phase;
        if (ended === "focus") s.count += 1; // a Pomodoro counts once its Focus runs to zero
        loadPhase(nextPhase());              // the next Phase waits for Start
        return ended;
      },

      resetPhase() { loadPhase(s.phase); },
      skip() { loadPhase(nextPhase()); },    // skipping never counts a Pomodoro
      resetAll() { s.count = 0; loadPhase("focus"); },

      // New Settings apply from the next Phase; a Phase not yet started picks them up now.
      updateSettings(next) {
        const untouched = isUntouched();
        current = { ...next };
        if (untouched) loadPhase(s.phase);
      },
    };
  }

  window.Pomodoro = { createTimer, parseMinutes, DEFAULT_SETTINGS };
})();
