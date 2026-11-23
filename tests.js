// Timer rule tests, shared by tests.html (browser) and run-tests.js (Node / CI).
// Needs `Pomodoro` (timer.js) loaded first; exposes the list as `window.PomodoroTests`.

(function () {
  const Pomodoro = window.Pomodoro;
  // ---- Tiny test helper ----
  const tests = [];
  const test = (name, fn) => tests.push({ name, fn });
  function equal(actual, expected, what = "value") {
    if (actual !== expected) throw new Error(`${what}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }

  // ---- Fake clock: tests move time forward instantly ----
  const MIN = 60_000;
  function setup(settings = { focusMin: 30, breakMin: 7 }) {
    let time = 1_000_000;
    const timer = Pomodoro.createTimer({ now: () => time, settings });
    const advance = (ms) => { time += ms; return timer.tick(); };
    return { timer, advance, snap: () => timer.snapshot() };
  }

  // ---- Starting state ----
  test("starts on a 30:00 Focus, paused, with 0 Pomodoros", () => {
    const { snap } = setup();
    const s = snap();
    equal(s.phase, "focus", "phase"); equal(s.remainingMs, 30 * MIN, "remaining");
    equal(s.running, false, "running"); equal(s.count, 0, "count"); equal(s.untouched, true, "untouched");
  });

  test("time does not move until Start is pressed", () => {
    const { advance, snap } = setup();
    advance(5 * MIN);
    equal(snap().remainingMs, 30 * MIN, "remaining");
  });

  // ---- Counting down ----
  test("counts down while running", () => {
    const { timer, advance, snap } = setup();
    timer.start(); advance(10 * MIN);
    equal(snap().remainingMs, 20 * MIN, "remaining");
  });

  test("pause freezes the time and resume continues from there", () => {
    const { timer, advance, snap } = setup();
    timer.start(); advance(10 * MIN); timer.pause();
    advance(60 * MIN);
    equal(snap().remainingMs, 20 * MIN, "remaining while paused");
    equal(snap().untouched, false, "untouched");
    timer.start(); advance(5 * MIN);
    equal(snap().remainingMs, 15 * MIN, "remaining after resume");
  });

  // ---- Phase end and counting Pomodoros ----
  test("a Focus that runs to zero counts one Pomodoro", () => {
    const { timer, advance, snap } = setup();
    timer.start();
    equal(advance(30 * MIN), "focus", "ended phase");
    equal(snap().count, 1, "count");
  });

  test("after Focus ends, a full Break is loaded and waits for Start", () => {
    const { timer, advance, snap } = setup();
    timer.start(); advance(30 * MIN);
    const s = snap();
    equal(s.phase, "break", "phase"); equal(s.remainingMs, 7 * MIN, "remaining"); equal(s.running, false, "running");
    advance(10 * MIN);
    equal(snap().remainingMs, 7 * MIN, "remaining after waiting");
  });

  test("after Break ends, a Focus is loaded and waits for Start; count unchanged", () => {
    const { timer, advance, snap } = setup();
    timer.start(); advance(30 * MIN);
    timer.start(); equal(advance(7 * MIN), "break", "ended phase");
    const s = snap();
    equal(s.phase, "focus", "phase"); equal(s.running, false, "running"); equal(s.count, 1, "count");
  });

  test("a Pomodoro counts even if its Break is skipped", () => {
    const { timer, advance, snap } = setup();
    timer.start(); advance(30 * MIN); timer.skip();
    equal(snap().count, 1, "count"); equal(snap().phase, "focus", "phase");
  });

  test("one tick reports the ending once, even if the tab was asleep long past zero", () => {
    const { timer, advance, snap } = setup();
    timer.start();
    equal(advance(3 * 60 * MIN), "focus", "ended phase");
    equal(advance(1000), null, "next tick");
    equal(snap().count, 1, "count");
  });

  // ---- Skip and resets ----
  test("skipping a Focus does not count a Pomodoro", () => {
    const { timer, advance, snap } = setup();
    timer.start(); advance(18 * MIN); timer.skip();
    equal(snap().count, 0, "count"); equal(snap().phase, "break", "phase"); equal(snap().running, false, "running");
  });

  test("Reset Phase restarts the current countdown from full, paused, without counting", () => {
    const { timer, advance, snap } = setup();
    timer.start(); advance(29 * MIN); timer.resetPhase();
    const s = snap();
    equal(s.phase, "focus", "phase"); equal(s.remainingMs, 30 * MIN, "remaining");
    equal(s.running, false, "running"); equal(s.count, 0, "count");
  });

  test("Reset All goes back to a fresh Focus with 0 Pomodoros", () => {
    const { timer, advance, snap } = setup();
    timer.start(); advance(30 * MIN); timer.start(); advance(2 * MIN);
    timer.resetAll();
    const s = snap();
    equal(s.phase, "focus", "phase"); equal(s.remainingMs, 30 * MIN, "remaining");
    equal(s.running, false, "running"); equal(s.count, 0, "count");
  });

  // ---- Settings ----
  test("custom Settings set the Phase lengths", () => {
    const { timer, advance, snap } = setup({ focusMin: 25, breakMin: 10 });
    equal(snap().remainingMs, 25 * MIN, "focus length");
    timer.start(); advance(25 * MIN);
    equal(snap().remainingMs, 10 * MIN, "break length");
  });

  test("a Settings change does not cut a Phase that has started", () => {
    const { timer, advance, snap } = setup();
    timer.start(); advance(5 * MIN);
    timer.updateSettings({ focusMin: 10, breakMin: 7 });
    equal(snap().remainingMs, 25 * MIN, "remaining");
  });

  test("a Settings change applies from the next Phase", () => {
    const { timer, advance, snap } = setup();
    timer.start(); advance(5 * MIN);
    timer.updateSettings({ focusMin: 30, breakMin: 3 });
    advance(25 * MIN);
    equal(snap().remainingMs, 3 * MIN, "break length");
  });

  test("a Phase not yet started picks up new Settings straight away", () => {
    const { timer, snap } = setup();
    timer.updateSettings({ focusMin: 45, breakMin: 7 });
    equal(snap().remainingMs, 45 * MIN, "remaining");
  });

  test("parseMinutes accepts whole minutes from 1 to 180 only", () => {
    equal(Pomodoro.parseMinutes("25"), 25, "25");
    equal(Pomodoro.parseMinutes("7.4"), 7, "7.4");
    equal(Pomodoro.parseMinutes("180"), 180, "180");
    equal(Pomodoro.parseMinutes("0"), null, "0");
    equal(Pomodoro.parseMinutes("181"), null, "181");
    equal(Pomodoro.parseMinutes("-5"), null, "-5");
    equal(Pomodoro.parseMinutes(""), null, "empty");
    equal(Pomodoro.parseMinutes("abc"), null, "abc");
  });

  window.PomodoroTests = tests;
})();
