# Pomodoro Timer

A minimal Pomodoro timer that runs in the browser — plain HTML, CSS and JavaScript, no build step, nothing to install.

- **Focus** 30 min → **Break** 7 min, repeating (lengths changeable in Settings and remembered)
- A **Pomodoro** counts when its Focus runs to 0:00; skipping or resetting a Focus doesn't count
- Each Phase waits for you to press Start
- Chime + desktop notification when a Phase ends
- Colour changes per Phase; follows your light/dark mode
- Attention cues: when paused, the time bounces and the Resume button shines; when a Break is waiting to start, the card glows green (static glow if your system prefers reduced motion)

See [CONTEXT.md](CONTEXT.md) for the exact meaning of each term.

## Use it

Open `index.html` in a browser (double-click works), or use the GitHub Pages link in the repo's About section.

## Tests

Open `tests.html` in a browser. It runs every timer rule against a fake clock and shows a green/red list.

## Files

| File | What it does |
| --- | --- |
| `index.html` | The page |
| `style.css` | Look and colours |
| `timer.js` | Timer rules only — no screen code |
| `app.js` | Screen, buttons, sound, notifications, saved Settings |
| `tests.html` | Tests for `timer.js` |
| `CONTEXT.md` | Glossary of terms |
