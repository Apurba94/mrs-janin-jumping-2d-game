// Paper-Cut Dash application shell: canvas runtime plus tactile mobile HUD controls.

import "./style.css";
import { preloadAssets, ASSETS } from "./assets.js";
import { MrsJaninGame } from "./game.js";

const canvas = document.querySelector("#runnerCanvas");
const shell = document.querySelector("#gameShell");
const startPanel = document.querySelector("#startPanel");
const endPanel = document.querySelector("#endPanel");
const pausePanel = document.querySelector("#pausePanel");
const missionBadge = document.querySelector("#missionBadge");
const missionName = document.querySelector("#missionName");
const missionGoal = document.querySelector("#missionGoal");
const scoreValue = document.querySelector("#scoreValue");
const bestValue = document.querySelector("#bestValue");
const progressBar = document.querySelector("#progressBar");
const doubleChip = document.querySelector("#doubleChip");
const jumpButton = document.querySelector("#jumpButton");
const pauseButton = document.querySelector("#pauseButton");
const appLogo = document.querySelector("#appLogo");
const resultTitle = document.querySelector("#resultTitle");
const resultBody = document.querySelector("#resultBody");
const resultScore = document.querySelector("#resultScore");
const actionButton = document.querySelector("#actionButton");
const resumeButton = document.querySelector("#resumeButton");
const startButton = document.querySelector("#startButton");

appLogo.src = ASSETS.logo;
const images = preloadAssets();
let state = null;

function renderHud(next) {
  state = next;
  shell.dataset.status = next.status;
  missionBadge.textContent = `MISSION ${String(next.missionNumber).padStart(2, "0")} / ${String(next.missionTotal).padStart(2, "0")}`;
  missionName.textContent = next.mission.title;
  missionGoal.textContent = next.mission.goal;
  scoreValue.textContent = String(next.score).padStart(5, "0");
  bestValue.textContent = String(next.bestScore).padStart(5, "0");
  progressBar.style.width = `${Math.max(2, (next.distance / next.target) * 100)}%`;
  doubleChip.hidden = !next.doubleJump;

  startPanel.hidden = next.status !== "ready";
  pausePanel.hidden = next.status !== "paused";
  const ended = next.status === "gameover" || next.status === "complete";
  endPanel.hidden = !ended;
  if (ended) {
    const won = next.status === "complete";
    resultTitle.textContent = won ? "THE ROAD REMEMBERS." : "ALMOST, MRS JANIN.";
    resultBody.textContent = won ? "Six missions cleared. You made the clever road look easy." : `${next.mission.title} is still open. A smaller jump will carry you farther.`;
    resultScore.textContent = `RUN SCORE · ${String(next.score).padStart(5, "0")}`;
    actionButton.textContent = won ? "RUN THE ROAD AGAIN" : "TRY THAT HOP AGAIN";
  }
}

const game = new MrsJaninGame(canvas, images, renderHud);
game.update(performance.now());

function attemptJump(event) {
  event?.preventDefault();
  if (state?.status === "paused") return;
  game.jump();
}

function startRun() {
  game.start({ restart: false });
}

function resumeRun() {
  game.resume();
}

function retryRun() {
  game.start({ restart: true });
}

startButton.addEventListener("click", startRun);
actionButton.addEventListener("click", retryRun);
resumeButton.addEventListener("click", resumeRun);
jumpButton.addEventListener("pointerdown", attemptJump, { passive: false });
canvas.addEventListener("pointerdown", attemptJump, { passive: false });
pauseButton.addEventListener("click", () => game.pause());
window.addEventListener("resize", () => game.resize());
window.addEventListener("keydown", (event) => {
  if (["Space", "ArrowUp", "KeyW"].includes(event.code)) attemptJump(event);
  if (event.code === "Escape") game.pause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) game.pause();
});

if (new URLSearchParams(window.location.search).has("demo")) {
  window.setTimeout(() => game.start({ restart: false }), 600);
}
