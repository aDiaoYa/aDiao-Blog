/**
 * p5.js — 蓝色复古系：云朵风铃雨滴 + 蝴蝶（内页）
 *
 * 用于文章页、归档页等非首页页面。
 * 顶部云朵 + 风铃雨滴 + 少量蝴蝶，蓝色系，性能优先。
 */
let cloudX, cloudY;
let raindrops = [];
let butterflies = [];

class Raindrop {
  constructor(x, startY, maxLen) {
    this.x = x;
    this.startY = startY;
    this.maxLen = maxLen;
    this.len = random(30, maxLen);
    this.offset = random(TWO_PI);
    this.alpha = random(50, 120);
    this.weight = random(0.5, 1.5);
  }

  update() {
    this.offset += 0.008;
    this.len += sin(this.offset + this.x * 0.01) * 0.3;
    this.len = constrain(this.len, 20, this.maxLen);
  }

  draw() {
    const y1 = this.startY;
    const y2 = this.startY + this.len;
    const dropY = y2 + 6;
    stroke(147, 197, 253, this.alpha * 0.5);
    strokeWeight(this.weight * 0.6);
    line(this.x, y1, this.x, y2);
    noStroke();
    fill(147, 197, 253, this.alpha);
    ellipse(this.x, dropY, this.weight * 4, this.weight * 6);
  }
}

class Butterfly {
  constructor() {
    this.reset();
    this.x = random(width);
    this.y = random(height);
    this.progress = random(1);
  }

  reset() {
    this.startX = random(-60, width + 60);
    this.startY = random(height * 0.2, height * 0.8);
    this.endX = this.startX + random(-200, 200);
    this.endY = this.startY + random(-150, 150);
    this.endX = constrain(this.endX, -60, width + 60);
    this.endY = constrain(this.endY, height * 0.1, height * 0.9);
    this.progress = 0;
    this.speed = random(0.001, 0.003);
    this.size = random(12, 22);
    this.wingPhase = random(TWO_PI);
    this.wingSpeed = random(0.04, 0.1);
    this.colorShift = random(0.6, 1);
    this.alpha = random(30, 70);
  }

  update() {
    this.progress += this.speed;
    this.wingPhase += this.wingSpeed;
    if (this.progress >= 1) this.reset();
    const t = this.progress;
    const cx = lerp(this.startX, this.endX, 0.5) + sin(t * PI * 2) * 50;
    const cy = lerp(this.startY, this.endY, 0.5) + cos(t * PI * 3) * 40;
    this.x = bezierPoint(this.startX, cx, cx, this.endX, t);
    this.y = bezierPoint(this.startY, cy, cy, this.endY, t);
  }

  draw() {
    push();
    translate(this.x, this.y);
    const wingAngle = sin(this.wingPhase) * 0.5;
    const c1 = color(147, 197, 253, this.alpha);
    const c2 = color(191, 219, 254, this.alpha * this.colorShift);
    noStroke();
    push(); rotate(-wingAngle);
    fill(c1); ellipse(-this.size * 0.55, -this.size * 0.15, this.size * 0.7, this.size * 0.45);
    fill(c2); ellipse(-this.size * 0.4, this.size * 0.05, this.size * 0.5, this.size * 0.35);
    pop();
    push(); rotate(wingAngle);
    fill(c1); ellipse(this.size * 0.55, -this.size * 0.15, this.size * 0.7, this.size * 0.45);
    fill(c2); ellipse(this.size * 0.4, this.size * 0.05, this.size * 0.5, this.size * 0.35);
    pop();
    fill(100, 116, 139, this.alpha * 0.8);
    ellipse(0, 0, this.size * 0.15, this.size * 0.5);
    pop();
  }
}

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("p5-canvas");
  pixelDensity(1);
  cloudX = width / 2;
  cloudY = height * 0.12;
  const dropCount = min(floor(width / 16), 70);
  for (let i = 0; i < dropCount; i++) {
    const x = cloudX + (i - dropCount / 2) * 14 + random(-6, 6);
    raindrops.push(new Raindrop(x, cloudY + random(40, 70), random(80, 200)));
  }
  for (let i = 0; i < 6; i++) butterflies.push(new Butterfly());
  frameRate(30);
}

function draw() {
  const topColor = color(239, 246, 255);
  const bottomColor = color(240, 244, 248);
  for (let y = 0; y < height; y++) {
    const inter = map(y, 0, height, 0, 1);
    stroke(lerpColor(topColor, bottomColor, inter));
    line(0, y, width, y);
  }
  drawCloud();
  for (const drop of raindrops) { drop.update(); drop.draw(); }
  for (const b of butterflies) { b.update(); b.draw(); }
}

function drawCloud() {
  noStroke();
  const cx = cloudX, cy = cloudY;
  const c1 = color(255, 255, 255, 180);
  const c2 = color(240, 248, 255, 170);
  const c3 = color(219, 234, 254, 160);
  fill(c1);
  ellipse(cx, cy, 160, 56);
  ellipse(cx - 70, cy + 8, 100, 42);
  ellipse(cx + 70, cy + 8, 100, 42);
  ellipse(cx - 40, cy - 10, 80, 38);
  ellipse(cx + 40, cy - 10, 80, 38);
  fill(c2);
  ellipse(cx - 15, cy - 8, 70, 28);
  ellipse(cx + 20, cy - 6, 60, 24);
  fill(c3);
  ellipse(cx, cy + 10, 120, 28);
  ellipse(cx - 50, cy + 14, 70, 22);
  ellipse(cx + 50, cy + 14, 70, 22);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  cloudX = width / 2; cloudY = height * 0.12;
  raindrops = [];
  const dropCount = min(floor(width / 16), 70);
  for (let i = 0; i < dropCount; i++) {
    const x = cloudX + (i - dropCount / 2) * 14 + random(-6, 6);
    raindrops.push(new Raindrop(x, cloudY + random(40, 70), random(80, 200)));
  }
  // 重建蝴蝶
  butterflies = [];
  const bflyCount = min(floor(width / 200), 4);
  for (let i = 0; i < bflyCount; i++) {
    butterflies.push(new Butterfly());
  }
}
