// Runs the Mrs Janin runner headless: a no-op canvas stands in for the
// browser and the play loop is stepped by hand.
import assert from "node:assert/strict";

globalThis.window = globalThis;
globalThis.location = { search: "" };
globalThis.devicePixelRatio = 1;
globalThis.requestAnimationFrame = () => 0;
globalThis.setTimeout = (fn) => { fn(); return 0; };
// A store that throws, as some private-browsing modes do.
globalThis.localStorage = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
const noop = () => {};
const context = new Proxy({}, {
  get: (target, key) => key in target ? target[key]
    : key === "createLinearGradient" || key === "createRadialGradient" ? () => ({ addColorStop: noop })
    : key === "measureText" ? () => ({ width: 10 })
    : noop,
  set: (target, key, value) => { target[key] = value; return true; },
});
const canvas = { width: 390, height: 780, style: {}, getContext: () => context, getBoundingClientRect: () => ({ left: 0, top: 0, width: 390, height: 780 }) };
const { MrsJaninGame, MISSIONS } = await import("../client/src/game.js");

const newGame = () => { const game = new MrsJaninGame(canvas, {}, noop); game.start(); return game; };
const step = (game) => game.updatePlaying(1 / 60);

// Loads with a blocked localStorage.
const game = newGame();
assert.equal(game.status, "playing");

// Each mission delivers enough obstacles; mission 1 must bring at least three.
// The runner is made invulnerable here to count what the course sends.
for (let run = 0; run < 25; run++) {
  for (let m = 0; m < MISSIONS.length; m++) {
    const g = newGame();
    g.missionIndex = m; g.resetMission(); g.status = "playing";
    g.overlaps = () => false;
    const reached = new Set();
    while (g.status === "playing" && g.missionIndex === m) {
      step(g);
      for (const o of g.obstacles) if (o.x <= g.player.x + g.player.width) reached.add(o);
    }
    assert.ok(reached.size >= (m === 0 ? 3 : m + 1), `mission ${m + 1} sent only ${reached.size} obstacles`);
  }
}

// Hitting an obstacle ends the run.
const crash = newGame();
crash.obstacles.push({ kind: "crate", width: 54, height: 54, x: crash.player.x, y: crash.groundY - 54 });
step(crash);
assert.equal(crash.status, "gameover");

// Double jump only from mission 3.
const single = newGame();
assert.equal(single.jump(), true);
assert.equal(single.jump(), false, "mission 1 allows one jump");
const double = newGame();
double.missionIndex = 2; double.resetMission();
assert.equal(double.jump(), true);
assert.equal(double.jump(), true, "mission 3 allows a second jump");
assert.equal(double.jump(), false);

// Clearing all six missions completes the course.
const course = newGame();
for (let m = 0; m < MISSIONS.length; m++) { course.distance = course.mission.distance; course.clearMission(); }
assert.equal(course.status, "complete");

console.log("Mrs Janin runner test passed: mission pacing, collisions, double jump, course completion, blocked storage.");
