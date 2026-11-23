// Runs the timer tests in Node (used by CI): `node run-tests.js`. No dependencies.
// Same tests as tests.html; both load tests.js.

globalThis.window = globalThis;
require("./timer.js");
require("./tests.js");

const tests = window.PomodoroTests;
let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`✗ ${name}\n    ${e.message}`);
  }
}
console.log(failed ? `\n${failed} of ${tests.length} failed` : `\nAll ${tests.length} tests passed`);
process.exit(failed ? 1 : 0);
