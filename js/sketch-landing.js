/**
 * p5.js — 复古手绘雨滴云朵
 * 深蓝云朵 + 彩色泪滴下落 + 旧纸张噪点质感
 */

// ── 全局状态 ──
let drops = [];
let cloud = {};
let boyPos = {};
let time = 0;

// ── 配色方案 ──
const PALETTE = {
  cloud: [35, 55, 95],        // 深蓝云朵
  vintageRed: [185, 85, 75],  // 复古红
  skyBlue: [140, 180, 210],   // 浅天蓝
  navy: [45, 65, 105],        // 藏深蓝
};

// ── 可调参数 ──
const CONFIG = {
  DROP_COUNT: 45,
  DROP_SIZE_MIN: 8,
  DROP_SIZE_MAX: 16,
  FALL_SPEED: 0.8,
  LINE_WIDTH: 0.4,
};

// ============================================
// 泪滴类
// ============================================
class Drop {
  constructor(idx, total) {
    this.idx = idx;

    // 在云朵宽度内均匀分布，带随机偏移
    let spread = 0.7; // 云朵使用宽度比例
    let t = (idx + 0.5) / total;
    this.xOffset = (t - 0.5) * spread * 2;
    this.xOffset += random(-0.08, 0.08); // 随机偏移

    // 随机配色：浅蓝50%、藏蓝40%、复古红10%
    let r = random();
    if (r < 0.50) this.color = PALETTE.skyBlue;
    else if (r < 0.90) this.color = PALETTE.navy;
    else this.color = PALETTE.vintageRed;

    this.size = random(CONFIG.DROP_SIZE_MIN, CONFIG.DROP_SIZE_MAX);

    // 垂直线长度（云朵到男孩的距离）
    this.lineLength = 0;

    // 下落进度 0~1
    this.progress = random(0, 1);

    // 轻微摆动相位
    this.swayPhase = random(TWO_PI);
  }

  update() {
    this.progress += CONFIG.FALL_SPEED / this.lineLength;
    if (this.progress > 1) {
      this.progress = 0;
    }
  }

  draw(cloudX, cloudY, cloudR, boyY) {
    // 计算实际位置
    let x = cloudX + this.xOffset * cloudR;
    let y = lerp(cloudY + cloudR * 0.30, boyY, this.progress);

    // 轻微水平摆动（手绘感）
    let sway = sin(this.progress * PI * 3 + this.swayPhase + time * 0.5) * 2;
    x += sway;

    // 线条起点（云朵底部）
    let lineStartY = cloudY + cloudR * 0.30;

    // ── 细线 ──
    push();
    stroke(80, 75, 70, 100);
    strokeWeight(CONFIG.LINE_WIDTH);
    noFill();
    line(x, lineStartY, x, y - this.size * 0.3);
    pop();

    // ── 泪滴 ──
    push();
    translate(x, y);
    noStroke();
    fill(this.color[0], this.color[1], this.color[2], 220);

    let s = this.size;
    // 泪滴形状：上尖下圆（尖头朝上）
    beginShape();
    vertex(0, -s * 0.6);
    bezierVertex(-s * 0.5, -s * 0.2, -s * 0.5, s * 0.4, 0, s * 0.4);
    bezierVertex(s * 0.5, s * 0.4, s * 0.5, -s * 0.2, 0, -s * 0.6);
    endShape(CLOSE);

    // 轻微高光
    fill(255, 255, 255, 40);
    ellipse(-s * 0.15, s * 0.05, s * 0.2, s * 0.15);

    pop();
  }
}

// ============================================
// 绘制深蓝云朵（手绘拼贴风）
// ============================================
function drawCloud() {
  let cx = cloud.x, cy = cloud.y;
  let r = cloud.radius;

  push();
  noStroke();

  // 主体深蓝
  fill(PALETTE.cloud[0], PALETTE.cloud[1], PALETTE.cloud[2], 245);

  // 中心大椭圆
  ellipse(cx, cy, r * 1.3, r * 0.55);
  // 左侧
  ellipse(cx - r * 0.45, cy + r * 0.08, r * 0.7, r * 0.45);
  // 右侧
  ellipse(cx + r * 0.4, cy + r * 0.05, r * 0.65, r * 0.4);
  // 顶部鼓包
  ellipse(cx - r * 0.15, cy - r * 0.18, r * 0.55, r * 0.4);
  ellipse(cx + r * 0.2, cy - r * 0.15, r * 0.5, r * 0.35);

  // 手绘轮廓（淡）
  noFill();
  stroke(25, 40, 75, 60);
  strokeWeight(0.6);

  // 顶部弧线带抖动
  beginShape();
  for (let a = PI * 0.2; a < PI * 0.8; a += 0.08) {
    let px = cx + cos(a) * r * 0.55;
    let py = cy - r * 0.15 + sin(a) * r * 0.25;
    px += random(-0.8, 0.8);
    py += random(-0.8, 0.8);
    vertex(px, py);
  }
  endShape();

  pop();
}



// ============================================
// 位置计算
// ============================================
function calcPositions(w, h) {
  // 男孩在右下角
  let imgWidth = min(w * 0.28, 320);
  let imgHeight = imgWidth * 1.2;
  let imgRight = w * 0.03;
  let imgBottom = h * 0.04;

  boyPos.cx = w - imgRight - imgWidth * 0.5;
  boyPos.cy = h - imgBottom - imgHeight * 0.5;

  // 云朵：屏幕顶部居中
  cloud.x = w * 0.5;
  cloud.y = h * 0.08;
  cloud.radius = min(w * 0.26, 240);
}

// ============================================
// p5.js setup
// ============================================
function setup() {
  const container = document.getElementById("hero-canvas");
  let cw = windowWidth, ch = windowHeight;
  if (container) {
    cw = container.clientWidth;
    ch = container.clientHeight;
  }
  const canvas = createCanvas(cw, ch);
  if (container) {
    canvas.parent("hero-canvas");
  } else {
    canvas.parent("p5-canvas");
  }
  pixelDensity(1);

  calcPositions(width, height);

  // 创建泪滴
  drops = [];
  for (let i = 0; i < CONFIG.DROP_COUNT; i++) {
    drops.push(new Drop(i, CONFIG.DROP_COUNT));
  }

  // 计算线长度
  let lineLen = boyPos.cy - (cloud.y + cloud.radius * 0.30);
  for (let d of drops) {
    d.lineLength = lineLen;
  }

  frameRate(30);
}

// ============================================
// p5.js draw
// ============================================
function draw() {
  time += deltaTime * 0.001;

  // 纯白背景
  background(255, 255, 255);

  // 深蓝云朵
  drawCloud();

  // 更新并绘制泪滴
  for (let d of drops) {
    d.update();
    d.draw(cloud.x, cloud.y, cloud.radius, boyPos.cy);
  }
}

function windowResized() {
  const container = document.getElementById("hero-canvas");
  let cw = windowWidth, ch = windowHeight;
  if (container && windowWidth > 900) {
    cw = container.clientWidth;
    ch = container.clientHeight;
  }
  resizeCanvas(cw, ch);

  calcPositions(width, height);

  // 重新计算线长度
  let lineLen = boyPos.cy - (cloud.y + cloud.radius * 0.30);
  for (let d of drops) {
    d.lineLength = lineLen;
  }
}
