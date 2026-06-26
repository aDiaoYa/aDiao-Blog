"use client";

import { useEffect, useRef, useCallback } from "react";

// ============================================================
// 原生 Canvas 云雨滴动画 — 1:1 还原 Hexo 主题 sketch-landing.js + sketch.js
// 替代 p5.js，解决 p5 v2 ESM 兼容性问题
// ============================================================

/* ---------- 工具函数 ---------- */
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randi = (min: number, max: number) => Math.floor(rand(min, max + 1));
const PI = Math.PI, TWO_PI = PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------- 颜色 ---------- */
const CLOUD_DARK = [35, 55, 95] as const;
const VINTAGE_RED = [185, 85, 75] as const;
const SKY_BLUE = [140, 180, 210] as const;
const NAVY = [45, 65, 105] as const;

function rgba(r: number, g: number, b: number, a: number) {
  return `rgba(${r},${g},${b},${a / 255})`;
}

function rgbaArr(c: readonly number[], a: number) {
  return `rgba(${c[0]},${c[1]},${c[2]},${a / 255})`;
}

/* ============================================================
   LANDING 模式：深蓝云朵 + 彩色泪滴 → 男孩
   ============================================================ */
class LandingDrop {
  xOffset: number;
  color: readonly number[];
  size: number;
  progress: number;
  swayPhase: number;
  lineLength = 1;

  constructor(idx: number, total: number) {
    const spread = 0.7;
    const t = (idx + 0.5) / total;
    this.xOffset = (t - 0.5) * spread * 2 + rand(-0.08, 0.08);
    const r = Math.random();
    this.color = r < 0.50 ? SKY_BLUE : r < 0.90 ? NAVY : VINTAGE_RED;
    this.size = rand(8, 16);
    this.progress = Math.random();
    this.swayPhase = rand(0, TWO_PI);
  }

  update() {
    this.progress += 0.8 / (this.lineLength || 1);
    if (this.progress > 1) this.progress = 0;
  }

  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number, cr: number, bY: number, time: number) {
    let x = cx + this.xOffset * cr;
    const y = lerp(cy + cr * 0.30, bY, this.progress);
    x += Math.sin(this.progress * PI * 3 + this.swayPhase + time * 0.5) * 2;
    const lineStartY = cy + cr * 0.30;

    // 连线
    ctx.beginPath();
    ctx.strokeStyle = rgba(80, 75, 70, 100);
    ctx.lineWidth = 0.4;
    ctx.moveTo(x, lineStartY);
    ctx.lineTo(x, y - this.size * 0.3);
    ctx.stroke();

    // 泪滴形状
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = rgbaArr(this.color, 220);
    ctx.beginPath();
    const s = this.size;
    ctx.moveTo(0, -s * 0.6);
    ctx.bezierCurveTo(-s * 0.5, -s * 0.2, -s * 0.5, s * 0.4, 0, s * 0.4);
    ctx.bezierCurveTo(s * 0.5, s * 0.4, s * 0.5, -s * 0.2, 0, -s * 0.6);
    ctx.closePath();
    ctx.fill();
    // 高光
    ctx.fillStyle = rgba(255, 255, 255, 40);
    ctx.beginPath();
    ctx.ellipse(-s * 0.15, s * 0.05, s * 0.1, s * 0.075, 0, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  }
}

function drawLandingCloud(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.fillStyle = rgbaArr(CLOUD_DARK, 245);
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.65, r * 0.275, 0, 0, TWO_PI);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.45, cy + r * 0.08, r * 0.35, r * 0.225, 0, 0, TWO_PI);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.4, cy + r * 0.05, r * 0.325, r * 0.2, 0, 0, TWO_PI);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.15, cy - r * 0.18, r * 0.275, r * 0.2, 0, 0, TWO_PI);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.2, cy - r * 0.15, r * 0.25, r * 0.175, 0, 0, TWO_PI);
  ctx.fill();

  // 手绘轮廓线
  ctx.strokeStyle = rgba(25, 40, 75, 60);
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let a = PI * 0.2; a < PI * 0.8; a += 0.08) {
    const px = cx + Math.cos(a) * r * 0.55 + rand(-0.8, 0.8);
    const py = cy - r * 0.15 + Math.sin(a) * r * 0.25 + rand(-0.8, 0.8);
    if (a === PI * 0.2) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

/* ============================================================
   DEFAULT 模式：白色云朵 + 蓝色风铃雨滴 + 蝴蝶
   ============================================================ */
class DefaultRaindrop {
  len: number;
  alpha: number;
  weight: number;

  constructor(public x: number, public startY: number, maxLen: number) {
    this.len = rand(20, maxLen);
    this.alpha = rand(35, 85);
    this.weight = rand(0.7, 2.2);
  }

  update() {} // 静态风铃，不做动画

  draw(ctx: CanvasRenderingContext2D) {
    const y1 = this.startY;
    const y2 = this.startY + this.len;
    const dropY = y2 + 8;

    // 风铃细丝
    ctx.beginPath();
    ctx.strokeStyle = rgba(59, 130, 246, this.alpha * 0.18);
    ctx.lineWidth = this.weight * 0.3;
    ctx.moveTo(this.x, y1);
    ctx.lineTo(this.x, y2);
    ctx.stroke();

    // 蓝色水滴
    ctx.beginPath();
    ctx.fillStyle = rgba(59, 130, 246, this.alpha);
    ctx.ellipse(this.x, dropY, this.weight * 2.5, this.weight * 3.5, 0, 0, TWO_PI);
    ctx.fill();

    // 高光
    ctx.fillStyle = rgba(255, 255, 255, 50);
    ctx.beginPath();
    ctx.ellipse(
      this.x - this.weight * 0.35,
      dropY - this.weight * 0.5,
      this.weight * 0.5,
      this.weight * 0.4,
      0, 0, TWO_PI,
    );
    ctx.fill();
  }
}

class DefaultButterfly {
  x = 0; y = 0;
  baseX = 0; baseY = 0;
  wingPhase = 0; wingSpeed = 0;
  size = 12;
  alpha = 0;
  driftPhase = 0; driftSpeed = 0;
  driftAmpX = 0; driftAmpY = 0;

  constructor(w: number, h: number, contentLeft: number, contentRight: number) {
    // 蝴蝶占下半屏，且在内容宽度内
    this.baseX = rand(contentLeft + 40, contentRight - 40);
    this.baseY = rand(h * 0.55, h * 0.88);
    this.x = this.baseX;
    this.y = this.baseY;
    this.size = rand(14, 24);
    this.wingPhase = rand(0, TWO_PI);
    this.wingSpeed = rand(0.025, 0.06);  // 慢扇翅
    this.alpha = rand(25, 55);
    this.driftPhase = rand(0, TWO_PI);
    this.driftSpeed = rand(0.002, 0.006);
    this.driftAmpX = rand(6, 20);
    this.driftAmpY = rand(4, 14);
  }

  update() {
    this.wingPhase += this.wingSpeed;
    this.driftPhase += this.driftSpeed;
    // 小幅度原地漂浮
    this.x = this.baseX + Math.sin(this.driftPhase) * this.driftAmpX;
    this.y = this.baseY + Math.cos(this.driftPhase * 1.4) * this.driftAmpY;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const wa = Math.sin(this.wingPhase) * 0.5;
    const c1 = rgba(59, 130, 246, this.alpha);
    const c2 = rgba(147, 197, 253, this.alpha * 0.7);

    // 左翅
    ctx.save();
    ctx.rotate(-wa);
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.ellipse(-this.size * 0.55, -this.size * 0.15, this.size * 0.35, this.size * 0.225, 0, 0, TWO_PI);
    ctx.fill();
    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.ellipse(-this.size * 0.4, this.size * 0.05, this.size * 0.25, this.size * 0.175, 0, 0, TWO_PI);
    ctx.fill();
    ctx.restore();

    // 右翅
    ctx.save();
    ctx.rotate(wa);
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.ellipse(this.size * 0.55, -this.size * 0.15, this.size * 0.35, this.size * 0.225, 0, 0, TWO_PI);
    ctx.fill();
    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.ellipse(this.size * 0.4, this.size * 0.05, this.size * 0.25, this.size * 0.175, 0, 0, TWO_PI);
    ctx.fill();
    ctx.restore();

    // 身体
    ctx.fillStyle = rgba(100, 116, 139, this.alpha * 0.8);
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 0.075, this.size * 0.25, 0, 0, TWO_PI);
    ctx.fill();

    ctx.restore();
  }
}

function drawDefaultCloud(
  ctx: CanvasRenderingContext2D, cx: number, cy: number
) {
  // 第一层 白色大椭圆
  ctx.fillStyle = rgba(255, 255, 255, 180);
  ctx.beginPath();
  ctx.ellipse(cx, cy, 80, 28, 0, 0, TWO_PI); ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - 70, cy + 8, 50, 21, 0, 0, TWO_PI); ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 70, cy + 8, 50, 21, 0, 0, TWO_PI); ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - 40, cy - 10, 40, 19, 0, 0, TWO_PI); ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 40, cy - 10, 40, 19, 0, 0, TWO_PI); ctx.fill();

  // 第二层
  ctx.fillStyle = rgba(240, 248, 255, 170);
  ctx.beginPath();
  ctx.ellipse(cx - 15, cy - 8, 35, 14, 0, 0, TWO_PI); ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 20, cy - 6, 30, 12, 0, 0, TWO_PI); ctx.fill();

  // 第三层
  ctx.fillStyle = rgba(219, 234, 254, 160);
  ctx.beginPath();
  ctx.ellipse(cx, cy + 10, 60, 14, 0, 0, TWO_PI); ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - 50, cy + 14, 35, 11, 0, 0, TWO_PI); ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 50, cy + 14, 35, 11, 0, 0, TWO_PI); ctx.fill();
}

/* ============================================================
   主组件
   ============================================================ */
export default function P5Canvas({ mode = "default" }: { mode?: "landing" | "default" }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef(0);
  const isLanding = mode === "landing";

  const animate = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      // --- Landing 状态 ---
      let drops: LandingDrop[] = [];
      let cloud = { x: 0, y: 0, radius: 0 };
      let boyPos = { cx: 0, cy: 0 };
      let time = 0;
      let lastTime = 0;

      function calcPositions(w: number, h: number) {
        const iw = Math.min(w * 0.28, 320);
        const ih = iw * 1.2;
        // 与 CSS .star-boy-img (right:5%, bottom:3%) 对齐
        boyPos.cx = w - w * 0.05 - iw * 0.5;
        boyPos.cy = h - h * 0.03 - ih * 0.5;
        // 云朵放在右侧，靠近抱星星男孩 — Hexo 中 canvas 在右列内
        cloud.x = w * 0.72;
        cloud.y = h * 0.08;
        cloud.radius = Math.min(w * 0.26, 200);
      }

      function resizeLanding() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;
        calcPositions(w, h);
        drops = [];
        for (let i = 0; i < 45; i++) drops.push(new LandingDrop(i, 45));
        const lineLen = boyPos.cy - (cloud.y + cloud.radius * 0.30);
        for (const d of drops) d.lineLength = lineLen;
      }

      function drawLanding(now: number) {
        const dt = lastTime ? Math.min(now - lastTime, 50) : 16;
        lastTime = now;
        time += dt * 0.001;

        const w = canvas.width;
        const h = canvas.height;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);

        drawLandingCloud(ctx, cloud.x, cloud.y, cloud.radius);

        for (const d of drops) {
          d.update();
          d.draw(ctx, cloud.x, cloud.y, cloud.radius, boyPos.cy, time);
        }
      }

      // --- Default 状态 ---
      let clouds: { x: number; y: number }[] = [];
      let raindrops: DefaultRaindrop[] = [];
      let butterflies: DefaultButterfly[] = [];
      let contentLeft = 0, contentRight = 0;

      function calcContentBounds(w: number) {
        // 与 .page-shell max-width:1100px / calc(100%-40px) 对齐
        const cw = Math.min(1100, w - 40);
        contentLeft = (w - cw) / 2;
        contentRight = contentLeft + cw;
      }

      function buildClouds(w: number, h: number) {
        clouds = [];
        const areaW = contentRight - contentLeft;
        const numClouds = Math.max(3, Math.floor(areaW / 300));
        const spacing = areaW / (numClouds + 1);
        for (let i = 0; i < numClouds; i++) {
          clouds.push({
            x: contentLeft + spacing * (i + 1) + rand(-30, 30),
            y: h * 0.06 + rand(0, 40),
          });
        }
      }

      function buildRaindrops(w: number, h: number) {
        raindrops = [];
        const areaW = contentRight - contentLeft;
        const halfH = h * 0.48;
        const count = Math.max(25, Math.floor(areaW / 15));
        for (let i = 0; i < count; i++) {
          const x = contentLeft + ((i + 0.5) / count) * areaW + rand(-8, 8);
          const startY = rand(h * 0.05, h * 0.18);
          const maxLen = Math.max(30, halfH - startY);
          raindrops.push(
            new DefaultRaindrop(x, startY, rand(25, maxLen)),
          );
        }
      }

      function resizeDefault() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;
        calcContentBounds(w);
        buildClouds(w, h);
        buildRaindrops(w, h);
        butterflies = [];
        for (let i = 0; i < 6; i++) {
          butterflies.push(new DefaultButterfly(w, h, contentLeft, contentRight));
        }
      }

      function drawDefault(_now: number) {
        const w = canvas.width;
        const h = canvas.height;

        // 背景渐变
        const topColor = { r: 239, g: 246, b: 255 };
        const bottomColor = { r: 240, g: 244, b: 248 };
        for (let y = 0; y < h; y++) {
          const t = y / h;
          const r = Math.round(topColor.r + (bottomColor.r - topColor.r) * t);
          const g = Math.round(topColor.g + (bottomColor.g - topColor.g) * t);
          const b = Math.round(topColor.b + (bottomColor.b - topColor.b) * t);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(0, y, w, 1);
        }

        // 横排多朵白云
        for (const c of clouds) {
          drawDefaultCloud(ctx, c.x, c.y);
        }

        for (const d of raindrops) {
          d.update();
          d.draw(ctx);
        }

        for (const b of butterflies) {
          b.update();
          b.draw(ctx);
        }
      }

      // 初始化和动画循环
      if (isLanding) {
        resizeLanding();
        lastTime = 0;
      } else {
        resizeDefault();
      }

      function loop(now: number) {
        if (isLanding) {
          drawLanding(now);
        } else {
          drawDefault(now);
        }
        rafRef.current = requestAnimationFrame(loop);
      }

      rafRef.current = requestAnimationFrame(loop);

      const handleResize = () => {
        if (isLanding) resizeLanding();
        else resizeDefault();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        cancelAnimationFrame(rafRef.current);
        window.removeEventListener("resize", handleResize);
      };
    },
    [isLanding],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cleanup = animate(ctx, canvas);
    return cleanup;
  }, [animate]);

  if (isLanding) {
    // Landing 模式：canvas 放在 hero-canvas 容器内
    return (
      <canvas
        ref={canvasRef}
        id="p5-landing-canvas"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    );
  }

  // Default 模式：fixed 全屏背景层
  return (
    <canvas
      ref={canvasRef}
      id="p5-canvas"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.55,
      }}
    />
  );
}
