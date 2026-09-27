// Paper-Cut Dash gameplay: one-thumb jumping, collision-safe obstacle lanes, and mission escalation.

const COLORS = {
  ink: "#242448",
  night: "#171834",
  marigold: "#f7c843",
  coral: "#f06e5b",
  parchment: "#fff5d8",
  mist: "#aeb7d8",
  plum: "#4b3c72",
  road: "#dfc790",
};

// Distances are sized so each mission delivers the obstacles its goal names
// (mission 1: at least three road blocks). tests/runner.test.mjs checks this.
export const MISSIONS = [
  { title: "EASY HOPS", goal: "Clear 3 road blocks", distance: 1680, speed: 235, gap: [1.5, 2.15], doubleJump: false, flavor: "Find your feet." },
  { title: "QUICK STEPS", goal: "Keep the rhythm", distance: 2340, speed: 280, gap: [1.2, 1.85], doubleJump: false, flavor: "The road is waking up." },
  { title: "TWIN TROUBLE", goal: "Use the second hop", distance: 3090, speed: 318, gap: [1.02, 1.55], doubleJump: true, flavor: "Air belongs to you, too." },
  { title: "BUSH HOUR", goal: "Stay light, stay sharp", distance: 3960, speed: 355, gap: [0.86, 1.35], doubleJump: true, flavor: "Thorns do not negotiate." },
  { title: "WHEELWORK", goal: "Outrun the rolling line", distance: 4950, speed: 395, gap: [0.72, 1.18], doubleJump: true, flavor: "The road gets clever." },
  { title: "JANIN DASH", goal: "Finish the full course", distance: 6240, speed: 435, gap: [0.63, 1.04], doubleJump: true, flavor: "One more hop." },
];

const OBSTACLE_SHAPES = [
  { kind: "crate", width: 54, height: 54, bias: 0.42 },
  { kind: "bush", width: 86, height: 45, bias: 0.35 },
  { kind: "wheel", width: 50, height: 50, bias: 0.23 },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const randomBetween = (min, max) => min + Math.random() * (max - min);

// localStorage throws in some private-browsing modes; the best score is a
// nicety, so a blocked store must never stop the game from loading.
const BEST_KEY = "mrs-janin-best";
const readBest = () => { try { return Number(localStorage.getItem(BEST_KEY) || 0); } catch { return 0; } };
const saveBest = (value) => { try { localStorage.setItem(BEST_KEY, String(value)); } catch { /* not persisted */ } };

export class MrsJaninGame {
  constructor(canvas, images, onStateChange) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.images = images;
    this.onStateChange = onStateChange;
    this.canvasSize = { width: 390, height: 780, pixelRatio: 1 };
    this.status = "ready";
    this.missionIndex = 0;
    this.score = 0;
    this.bestScore = readBest();
    this.distance = 0;
    this.player = { x: 0, y: 0, width: 66, height: 84, velocityY: 0, jumps: 0, grounded: true, tilt: 0 };
    this.obstacles = [];
    this.stars = [];
    this.puffs = [];
    this.backgroundOffset = 0;
    this.nextSpawn = 0;
    this.lastTime = performance.now();
    this.frame = 0;
    this.bannerTimer = 0;
    this.demoMode = new URLSearchParams(window.location.search).has("demo");
    this.demoCooldown = 0;
    this.resize();
    this.emit();
  }

  get mission() {
    return MISSIONS[this.missionIndex];
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(rect.width * pixelRatio));
    this.canvas.height = Math.max(1, Math.floor(rect.height * pixelRatio));
    this.canvasSize = { width: rect.width, height: rect.height, pixelRatio };
    this.groundY = rect.height * 0.77;
    this.player.x = rect.width * 0.22;
    if (this.player.grounded) this.player.y = this.groundY - this.player.height;
  }

  start({ restart = false } = {}) {
    if (restart) {
      this.missionIndex = 0;
      this.score = 0;
    }
    this.resetMission();
    this.status = "playing";
    this.emit();
  }

  resetMission() {
    this.distance = 0;
    this.obstacles = [];
    this.stars = [];
    this.puffs = [];
    this.nextSpawn = 0.9;
    this.player.velocityY = 0;
    this.player.jumps = 0;
    this.player.grounded = true;
    this.player.y = this.groundY - this.player.height;
    this.bannerTimer = 1.6;
  }

  pause() {
    if (this.status !== "playing") return;
    this.status = "paused";
    this.emit();
  }

  resume() {
    if (this.status !== "paused") return;
    this.status = "playing";
    this.emit();
  }

  jump() {
    if (this.status === "ready" || this.status === "gameover" || this.status === "complete") {
      this.start({ restart: this.status !== "ready" });
      return true;
    }
    if (this.status !== "playing") return false;
    const mayDouble = this.mission.doubleJump && this.player.jumps < 2;
    if (this.player.grounded || mayDouble) {
      this.player.velocityY = this.player.grounded ? -760 : -660;
      this.player.jumps += 1;
      this.player.grounded = false;
      this.puffs.push({ x: this.player.x + 12, y: this.player.y + this.player.height - 8, life: 0.32, size: 10 });
      return true;
    }
    return false;
  }

  update(timestamp) {
    const delta = clamp((timestamp - this.lastTime) / 1000, 0, 0.035);
    this.lastTime = timestamp;
    this.frame += delta;
    if (this.status === "playing") this.updatePlaying(delta);
    this.draw();
    requestAnimationFrame((time) => this.update(time));
  }

  updatePlaying(delta) {
    const mission = this.mission;
    const speed = mission.speed * (1 + Math.min(this.distance / mission.distance, 1) * 0.16);
    this.distance += speed * delta;
    this.score += Math.round(speed * delta * 0.16);
    this.backgroundOffset += speed * delta;
    this.bannerTimer = Math.max(0, this.bannerTimer - delta);

    this.player.velocityY += 1940 * delta;
    this.player.y += this.player.velocityY * delta;
    this.player.tilt = clamp(this.player.velocityY / 1700, -0.25, 0.26);
    if (this.player.y >= this.groundY - this.player.height) {
      this.player.y = this.groundY - this.player.height;
      this.player.velocityY = 0;
      this.player.grounded = true;
      this.player.jumps = 0;
      this.player.tilt = 0;
    }

    this.nextSpawn -= delta;
    if (this.nextSpawn <= 0) this.spawnPattern(speed);
    for (const obstacle of this.obstacles) obstacle.x -= speed * delta;
    for (const star of this.stars) star.x -= speed * delta;
    for (const puff of this.puffs) {
      puff.life -= delta;
      puff.size += 30 * delta;
      puff.y -= 24 * delta;
    }
    this.obstacles = this.obstacles.filter((item) => item.x + item.width > -100);
    this.puffs = this.puffs.filter((item) => item.life > 0);

    for (const star of this.stars) {
      if (!star.collected && this.overlaps(this.playerHitbox(), { x: star.x, y: star.y, width: star.size, height: star.size })) {
        star.collected = true;
        this.score += 250;
        this.puffs.push({ x: star.x, y: star.y, life: 0.5, size: 9 });
      }
    }
    this.stars = this.stars.filter((star) => !star.collected && star.x + star.size > -50);

    const playerHitbox = this.playerHitbox();
    const collision = this.obstacles.find((obstacle) => this.overlaps(playerHitbox, this.obstacleHitbox(obstacle)));
    if (collision) {
      if (this.demoMode) {
        this.obstacles = this.obstacles.filter((obstacle) => obstacle !== collision);
        this.score += 100;
        this.puffs.push({ x: collision.x, y: collision.y, life: 0.38, size: 14 });
      } else {
        this.fail();
        return;
      }
    }

    if (this.demoMode) this.autoPlay();
    if (this.distance >= mission.distance) this.clearMission();
    if (Math.floor(this.frame * 8) % 3 === 0) this.emit(false);
  }

  spawnPattern(speed) {
    const { width } = this.canvasSize;
    const shape = OBSTACLE_SHAPES[Math.floor(Math.random() * OBSTACLE_SHAPES.length)];
    const baseY = this.groundY - shape.height;
    const obstacle = { ...shape, x: width + 50, y: baseY, rotation: Math.random() * 0.2 - 0.1 };
    this.obstacles.push(obstacle);
    if (Math.random() > 0.42) {
      this.stars.push({ x: obstacle.x + shape.width * 0.5 + 54, y: baseY - randomBetween(74, 135), size: 26, collected: false });
    }
    const mission = this.mission;
    const baseGap = randomBetween(mission.gap[0], mission.gap[1]);
    this.nextSpawn = baseGap * (0.99 - Math.min(speed / 10000, 0.05));
  }

  autoPlay() {
    const upcoming = this.obstacles.find((obstacle) => obstacle.x + obstacle.width > this.player.x - 20);
    this.demoCooldown -= 1 / 60;
    if (!upcoming || this.demoCooldown > 0) return;
    const distance = upcoming.x - (this.player.x + this.player.width);
    if (distance < 160 && distance > 35 && this.player.grounded) {
      this.jump();
      this.demoCooldown = 0.42;
    } else if (distance < 64 && !this.player.grounded && this.mission.doubleJump && this.player.jumps === 1) {
      this.jump();
      this.demoCooldown = 0.38;
    }
  }

  playerHitbox() {
    return { x: this.player.x + 14, y: this.player.y + 10, width: this.player.width - 27, height: this.player.height - 12 };
  }

  obstacleHitbox(obstacle) {
    if (obstacle.kind === "bush") return { x: obstacle.x + 8, y: obstacle.y + 15, width: obstacle.width - 14, height: obstacle.height - 12 };
    if (obstacle.kind === "wheel") return { x: obstacle.x + 7, y: obstacle.y + 7, width: obstacle.width - 14, height: obstacle.height - 14 };
    return { x: obstacle.x + 5, y: obstacle.y + 4, width: obstacle.width - 10, height: obstacle.height - 7 };
  }

  overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  clearMission() {
    this.score += 500 + this.missionIndex * 100;
    if (this.missionIndex >= MISSIONS.length - 1) {
      this.status = "complete";
    } else {
      this.missionIndex += 1;
      this.resetMission();
      this.status = "intermission";
      window.setTimeout(() => {
        if (this.status === "intermission") {
          this.status = "playing";
          this.emit();
        }
      }, 1100);
    }
    this.bestScore = Math.max(this.score, this.bestScore);
    saveBest(this.bestScore);
    this.emit();
  }

  fail() {
    this.status = "gameover";
    this.bestScore = Math.max(this.score, this.bestScore);
    saveBest(this.bestScore);
    this.emit();
  }

  emit(force = true) {
    if (!force && this.frame % 0.15 > 0.05) return;
    this.onStateChange({
      status: this.status,
      mission: this.mission,
      missionNumber: this.missionIndex + 1,
      missionTotal: MISSIONS.length,
      score: this.score,
      bestScore: this.bestScore,
      distance: Math.min(this.distance, this.mission.distance),
      target: this.mission.distance,
      doubleJump: this.mission.doubleJump,
    });
  }

  draw() {
    const { ctx } = this;
    const { width, height, pixelRatio } = this.canvasSize;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    this.drawBackdrop(ctx, width, height);
    this.drawCourse(ctx, width, height);
    if (this.status === "ready") this.drawIntroObstacle(ctx, width);
    this.drawStars(ctx);
    this.drawObstacles(ctx);
    this.drawRunner(ctx);
    this.drawPuffs(ctx);
    if (this.status === "playing" && this.bannerTimer > 0) this.drawMissionBanner(ctx, width);
  }

  drawBackdrop(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#22234b");
    gradient.addColorStop(0.55, "#363061");
    gradient.addColorStop(1, "#171834");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    const world = this.images.world;
    if (world?.complete && world.naturalWidth > 0) {
      const ratio = Math.max(width / world.naturalWidth, height / world.naturalHeight);
      const imageWidth = world.naturalWidth * ratio;
      const imageHeight = world.naturalHeight * ratio;
      ctx.globalAlpha = 0.32;
      ctx.drawImage(world, (width - imageWidth) / 2, (height - imageHeight) / 2, imageWidth, imageHeight);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "rgba(255,245,216,.86)";
    ctx.beginPath();
    ctx.arc(width * 0.75, height * 0.15, Math.min(width, height) * 0.07, 0, Math.PI * 2);
    ctx.fill();
    this.drawHills(ctx, width, height, 0.14, "#4b3c72", 0.56, 80);
    this.drawHills(ctx, width, height, 0.25, "#302951", 0.66, 118);
    this.drawHills(ctx, width, height, 0.42, "#212040", 0.74, 152);
  }

  drawHills(ctx, width, height, speedFactor, color, yRatio, amplitude) {
    const offset = (this.backgroundOffset * speedFactor) % 240;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-240, height);
    for (let x = -240; x <= width + 280; x += 110) {
      const wave = Math.sin((x + offset) * 0.022) * amplitude + Math.cos((x + offset) * 0.012) * amplitude * 0.32;
      ctx.lineTo(x, height * yRatio + wave);
    }
    ctx.lineTo(width + 280, height);
    ctx.closePath();
    ctx.fill();
  }

  drawCourse(ctx, width, height) {
    const roadTop = this.groundY;
    ctx.fillStyle = COLORS.road;
    ctx.beginPath();
    ctx.moveTo(0, roadTop);
    for (let x = 0; x <= width; x += 18) {
      const deckle = Math.sin((x + this.backgroundOffset * 0.5) * 0.18) * 4;
      ctx.lineTo(x, roadTop + deckle);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, roadTop);
    for (let x = 0; x <= width; x += 18) ctx.lineTo(x, roadTop + Math.sin((x + this.backgroundOffset * 0.5) * 0.18) * 4);
    ctx.stroke();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = COLORS.ink;
    for (let x = -60; x < width + 60; x += 46) {
      const lineX = x - (this.backgroundOffset * 0.75) % 46;
      ctx.fillRect(lineX, roadTop + 46, 25, 5);
    }
    ctx.globalAlpha = 1;
  }

  drawIntroObstacle(ctx, width) {
    const obstacleWidth = 54;
    const obstacleHeight = 54;
    const obstacleX = width * 0.7;
    const obstacleY = this.groundY - obstacleHeight;
    ctx.save();
    ctx.strokeStyle = "rgba(247,200,67,.92)";
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 7]);
    ctx.beginPath();
    ctx.arc(this.player.x + this.player.width * 0.35, this.groundY - 22, width * 0.28, Math.PI * 1.08, Math.PI * 1.77);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.translate(obstacleX + obstacleWidth / 2, obstacleY + obstacleHeight / 2);
    ctx.rotate(-0.05);
    ctx.fillStyle = COLORS.coral;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 5;
    ctx.fillRect(-obstacleWidth / 2, -obstacleHeight / 2, obstacleWidth, obstacleHeight);
    ctx.strokeRect(-obstacleWidth / 2, -obstacleHeight / 2, obstacleWidth, obstacleHeight);
    ctx.strokeStyle = COLORS.parchment;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-obstacleWidth * 0.32, -obstacleHeight * 0.32); ctx.lineTo(obstacleWidth * 0.32, obstacleHeight * 0.32);
    ctx.moveTo(obstacleWidth * 0.32, -obstacleHeight * 0.32); ctx.lineTo(-obstacleWidth * 0.32, obstacleHeight * 0.32);
    ctx.stroke();
    ctx.restore();
  }

  drawRunner(ctx) {
    const p = this.player;
    ctx.save();
    ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
    ctx.rotate(p.tilt);
    const image = this.images.runner;
    if (image?.complete && image.naturalWidth > 0) {
      ctx.drawImage(image, -p.width * 0.72, -p.height * 0.76, p.width * 1.45, p.height * 1.42);
    } else {
      this.drawFallbackRunner(ctx, p.width, p.height);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(247,200,67,.58)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x + p.width * 0.38, p.y + p.height * 0.88, 22 + Math.sin(this.frame * 14) * 2, Math.PI * 1.08, Math.PI * 1.72);
    ctx.stroke();
  }

  drawFallbackRunner(ctx, width, height) {
    ctx.lineCap = "round";
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 6;
    ctx.fillStyle = COLORS.parchment;
    ctx.beginPath();
    ctx.arc(0, -height * 0.26, width * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.06); ctx.lineTo(-3, height * 0.25);
    ctx.moveTo(-3, height * 0.04); ctx.lineTo(-width * 0.29, height * 0.18);
    ctx.moveTo(-3, height * 0.04); ctx.lineTo(width * 0.27, height * 0.11);
    ctx.moveTo(-3, height * 0.25); ctx.lineTo(-width * 0.22, height * 0.48);
    ctx.moveTo(-3, height * 0.25); ctx.lineTo(width * 0.23, height * 0.43);
    ctx.stroke();
    ctx.fillStyle = COLORS.coral;
    ctx.fillRect(-width * 0.11, -height * 0.04, width * 0.53, height * 0.1);
  }

  drawObstacles(ctx) {
    for (const obstacle of this.obstacles) {
      ctx.save();
      ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
      ctx.rotate(obstacle.kind === "wheel" ? this.frame * 4 : obstacle.rotation);
      ctx.lineWidth = 5;
      ctx.strokeStyle = COLORS.ink;
      ctx.fillStyle = COLORS.coral;
      if (obstacle.kind === "crate") {
        ctx.beginPath();
        ctx.rect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
        ctx.fill(); ctx.stroke();
        ctx.strokeStyle = COLORS.parchment;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-obstacle.width * 0.32, -obstacle.height * 0.32); ctx.lineTo(obstacle.width * 0.32, obstacle.height * 0.32);
        ctx.moveTo(obstacle.width * 0.32, -obstacle.height * 0.32); ctx.lineTo(-obstacle.width * 0.32, obstacle.height * 0.32);
        ctx.stroke();
      } else if (obstacle.kind === "bush") {
        ctx.beginPath();
        ctx.moveTo(-obstacle.width / 2, obstacle.height / 2);
        ctx.quadraticCurveTo(-obstacle.width * 0.41, -obstacle.height * 0.4, -obstacle.width * 0.19, obstacle.height * 0.03);
        ctx.quadraticCurveTo(-obstacle.width * 0.03, -obstacle.height * 0.68, obstacle.width * 0.15, -obstacle.height * 0.08);
        ctx.quadraticCurveTo(obstacle.width * 0.31, -obstacle.height * 0.53, obstacle.width / 2, obstacle.height / 2);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = COLORS.parchment;
        ctx.lineWidth = 3;
        for (let x = -obstacle.width * 0.28; x <= obstacle.width * 0.28; x += obstacle.width * 0.28) {
          ctx.beginPath(); ctx.moveTo(x, obstacle.height * 0.18); ctx.lineTo(x + 6, -obstacle.height * 0.22); ctx.stroke();
        }
      } else {
        ctx.beginPath(); ctx.arc(0, 0, obstacle.width / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = COLORS.parchment;
        ctx.beginPath(); ctx.arc(0, 0, obstacle.width * 0.16, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 3;
        for (let spoke = 0; spoke < 6; spoke += 1) {
          const angle = spoke * Math.PI / 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(angle) * obstacle.width * 0.35, Math.sin(angle) * obstacle.width * 0.35); ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  drawStars(ctx) {
    for (const star of this.stars) {
      ctx.save(); ctx.translate(star.x + star.size / 2, star.y + star.size / 2); ctx.rotate(this.frame * 3);
      ctx.fillStyle = COLORS.marigold; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let point = 0; point < 10; point += 1) {
        const radius = point % 2 === 0 ? star.size / 2 : star.size / 4.2;
        const angle = -Math.PI / 2 + point * Math.PI / 5;
        const x = Math.cos(angle) * radius; const y = Math.sin(angle) * radius;
        if (point === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
  }

  drawPuffs(ctx) {
    for (const puff of this.puffs) {
      ctx.globalAlpha = clamp(puff.life * 2.1, 0, 1);
      ctx.fillStyle = COLORS.parchment;
      ctx.beginPath(); ctx.arc(puff.x, puff.y, puff.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawMissionBanner(ctx, width) {
    const alpha = clamp(this.bannerTimer * 1.6, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(36,36,72,.78)";
    ctx.fillRect(width * 0.18, this.canvasSize.height * 0.23, width * 0.64, 58);
    ctx.strokeStyle = COLORS.marigold;
    ctx.lineWidth = 2;
    ctx.strokeRect(width * 0.18, this.canvasSize.height * 0.23, width * 0.64, 58);
    ctx.fillStyle = COLORS.parchment;
    ctx.font = "700 14px 'DM Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`MISSION ${String(this.missionIndex + 1).padStart(2, "0")} · ${this.mission.title}`, width / 2, this.canvasSize.height * 0.23 + 35);
    ctx.globalAlpha = 1;
  }
}
