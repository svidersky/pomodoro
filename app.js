// Screen, buttons, alerts and saved Settings. The timer rules live in timer.js.

const { createTimer, parseMinutes, DEFAULT_SETTINGS } = window.Pomodoro;
const SETTINGS_KEY = "pomodoro.settings";
const PHASE_NAMES = { focus: "Focus", break: "Break" };

// ---- Settings (kept between visits) ----
function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (saved && parseMinutes(saved.focusMin) && parseMinutes(saved.breakMin)) return saved;
  } catch (_) { /* storage unavailable or corrupt: fall back to defaults */ }
  return { ...DEFAULT_SETTINGS };
}
function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (_) {}
}

let settings = loadSettings();
const timer = createTimer({ now: () => Date.now(), settings });

// ---- DOM ----
const $ = (id) => document.getElementById(id);
const els = {
  label: $("phase-label"), time: $("time"), status: $("status"), count: $("count"),
  start: $("start"), resetPhase: $("reset-phase"), skip: $("skip"), resetAll: $("reset-all"),
  focusMin: $("focus-min"), breakMin: $("break-min"),
};

function format(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function render() {
  const t = timer.snapshot();
  document.body.dataset.phase = t.phase;
  document.body.dataset.state = t.running ? "running" : (t.untouched ? "ready" : "paused");
  els.label.textContent = PHASE_NAMES[t.phase];
  els.time.textContent = format(t.remainingMs);
  els.count.textContent = t.count;
  els.start.textContent = t.running ? "Pause" : (t.untouched ? "Start" : "Resume");
  els.status.textContent = t.running ? "Running" : (t.untouched ? "Ready" : "Paused");
}

// ---- Clock: the app's only real-time loop ----
setInterval(() => {
  const ended = timer.tick();
  if (ended) alertPhaseEnd(ended);
  render();
}, 250);

// ---- Alerts: sound (always) + desktop notification (if the browser allows) ----
let audioCtx = null;
function unlockAudio() {
  // Browsers only allow sound after a user click, so create the audio context on Start.
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (_) { audioCtx = null; }
}

function playChime() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  [0, 0.35, 0.7].forEach((offset, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = [880, 660, 880][i];
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.4, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.3);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.32);
  });
}

function askNotificationPermission() {
  try {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  } catch (_) {}
}

function alertPhaseEnd(ended) {
  playChime();
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const body = ended === "focus"
      ? `Focus done — Pomodoro #${timer.snapshot().count}. Press Start for your Break.`
      : "Break over. Press Start for your next Focus.";
    new Notification(`${PHASE_NAMES[ended]} finished`, { body });
  } catch (_) { /* notifications not supported here: the chime still played */ }
}

// ---- Settings inputs ----
function onSettingChange(key, input) {
  const value = parseMinutes(input.value);
  if (value === null) { input.value = settings[key]; return; } // reject invalid input
  settings = { ...settings, [key]: value };
  saveSettings(settings);
  timer.updateSettings(settings);
  render();
}

// ---- Wire up ----
els.start.addEventListener("click", () => {
  if (timer.snapshot().running) timer.pause();
  else { unlockAudio(); askNotificationPermission(); timer.start(); }
  render();
});
els.resetPhase.addEventListener("click", () => { timer.resetPhase(); render(); });
els.skip.addEventListener("click", () => { timer.skip(); render(); });
els.resetAll.addEventListener("click", () => {
  if (!confirm("Reset everything? This sets the Pomodoro count back to 0.")) return;
  timer.resetAll();
  render();
});
els.focusMin.value = settings.focusMin;
els.breakMin.value = settings.breakMin;
els.focusMin.addEventListener("change", () => onSettingChange("focusMin", els.focusMin));
els.breakMin.addEventListener("change", () => onSettingChange("breakMin", els.breakMin));

render();
