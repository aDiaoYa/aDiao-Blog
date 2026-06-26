"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  PI, TWO_PI, rand, lerp, rgba, rgbaArr,
  COLOR, dpr,
  LANDING_CLOUD_ELLIPSES,
  LANDING_DROP_COUNT,
  DEFAULT_BUTTERFLY_COUNT, RESIZE_DEBOUNCE,
} from "./P5Canvas.constants";

// ============================================================
// LANDING 模式 — LandingDrop 类
// ============================================================
class LandingDrop {
  xOffset: number;
  color: readonly number[];
  size: number;
  progress: number;
  swayPhase: number;
  lineLength = 1;

  constructor(idx: number, total: number) {
    const t = (idx + 0.5) / total;
    this.xOffset = (t - 0.5) * 1.4 + rand(-0.08, 0.08);
    const r = Math.random();
    this.color = r < 0.5 ? COLOR.SKY_BLUE : r < 0.9 ? COLOR.NAVY : COLOR.VINTAGE_RED;
    this.size = rand(8, 16);
    this.progress = Math.random();
    this.swayPhase = rand(0, TWO_PI);
  }

  update() {
    this.progress += 0.8 / (this.lineLength || 1);
    if (this.progress > 1) this.progress = 0;
  }

  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number, cr: number, bY: number, time: number) {
    const lineStartY = cy + cr * 0.3;
    let x = cx + this.xOffset * cr;
    const y = lerp(lineStartY, bY, this.progress);
    x += Math.sin(this.progress * PI * 3 + this.swayPhase + time * 0.5) * 2;

    // 连线
    ctx.beginPath();
    ctx.strokeStyle = rgba(80, 75, 70, 100);
    ctx.lineWidth = 0.4;
    ctx.moveTo(x, lineStartY);
    ctx.lineTo(x, y - this.size * 0.3);
    ctx.stroke();

    // 泪滴
    const s = this.size;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = rgbaArr(this.color, 220);
    ctx.beginPath();
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

// ============================================================
// LANDING 云朵绘制
// ============================================================
function drawLandingCloud(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.fillStyle = rgbaArr(COLOR.CLOUD_DARK, 245);
  for (const [dx, dy, rx, ry] of LANDING_CLOUD_ELLIPSES) {
    ctx.beginPath();
    ctx.ellipse(cx + dx * r, cy + dy * r, r * rx, r * ry, 0, 0, TWO_PI);
    ctx.fill();
  }
  // 手绘轮廓线
  ctx.strokeStyle = rgba(25, 40, 75, 60);
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let a = PI * 0.2; a < PI * 0.8; a += 0.08) {
    const px = cx + Math.cos(a) * r * 0.55 + rand(-0.8, 0.8);
    const py = cy - r * 0.15 + Math.sin(a) * r * 0.25 + rand(-0.8, 0.8);
    a === PI * 0.2 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.stroke();
}

// ============================================================
// DEFAULT 模式 — DefaultButterfly 类 + drawWing
// ============================================================

function drawWing(ctx: CanvasRenderingContext2D, angle: number, sz: number, c1: string, c2: string) {
  ctx.save();
  ctx.rotate(angle);
  const sign = sz > 0 ? 1 : -1;
  const absSz = Math.abs(sz);
  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.ellipse(sign * absSz * 0.55, -absSz * 0.15, absSz * 0.35, absSz * 0.225, 0, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = c2;
  ctx.beginPath();
  ctx.ellipse(sign * absSz * 0.4, absSz * 0.05, absSz * 0.25, absSz * 0.175, 0, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

class DefaultButterfly {
  baseX: number;
  baseY: number;
  x = 0; y = 0;
  size: number;
  alpha: number;
  wingPhase: number;
  wingSpeed: number;
  driftPhase: number;
  driftSpeed: number;
  driftAmpX: number;
  driftAmpY: number;
  private wing1Color: string;
  private wing2Color: string;
  private bodyColor: string;

  constructor(w: number, h: number) {
    const onLeft = Math.random() < 0.5;
    const margin = Math.min(40, w * 0.04);
    this.baseX = onLeft ? rand(margin, w * 0.28) : rand(w * 0.72, w - margin);
    this.baseY = rand(h * 0.62, h * 0.93);
    this.x = this.baseX;
    this.y = this.baseY;
    this.size = rand(22, 34);
    this.alpha = rand(20, 45);
    this.wingPhase = rand(0, TWO_PI);
    this.wingSpeed = rand(0.018, 0.04);
    this.driftPhase = rand(0, TWO_PI);
    this.driftSpeed = rand(0.0015, 0.004);
    this.driftAmpX = rand(4, 12);
    this.driftAmpY = rand(3, 9);
    const a255 = this.alpha / 255;
    this.wing1Color = `rgba(59,130,246,${a255.toFixed(3)})`;
    this.wing2Color = `rgba(147,197,253,${(a255 * 0.7).toFixed(3)})`;
    this.bodyColor = `rgba(100,116,139,${(a255 * 0.8).toFixed(3)})`;
  }

  update() {
    this.wingPhase += this.wingSpeed;
    this.driftPhase += this.driftSpeed;
    this.x = this.baseX + Math.sin(this.driftPhase) * this.driftAmpX;
    this.y = this.baseY + Math.cos(this.driftPhase * 1.4) * this.driftAmpY;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { x, y, size: sz, wingPhase, wing1Color, wing2Color, bodyColor } = this;
    const wa = Math.sin(wingPhase) * 0.5;
    ctx.save();
    ctx.translate(x, y);
    drawWing(ctx, -wa, -sz, wing1Color, wing2Color);
    drawWing(ctx, wa, sz, wing1Color, wing2Color);
    // 身体
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, sz * 0.075, sz * 0.25, 0, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  }
}

// ============================================================
// 主组件
// ============================================================
const CANVAS_STYLE: Record<string, React.CSSProperties> = {
  landing: {
    position: "absolute", top: 0, left: 0,
    width: "100%", height: "100%", display: "block",
  },
  default: {
    position: "fixed", top: 0, left: 0,
    width: "100%", height: "100%",
    zIndex: 0, pointerEvents: "none", opacity: 0.55,
  },
};

export default function P5Canvas({ mode = "default" }: { mode?: "landing" | "default" }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef(0);
  const isLanding = mode === "landing";

  const animate = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      // ── 共享状态 ──
      let drops: LandingDrop[] = [];
      let cloud = { x: 0, y: 0, radius: 0 };
      let boyPos = { cx: 0, cy: 0 };
      let time = 0;
      let lastTime = 0;
      let butterflies: DefaultButterfly[] = [];
      let gradient: CanvasGradient | null = null;

      // ── Landing init/draw ──
      const calcLandingPositions = (w: number, h: number) => {
        const iw = Math.min(w * 0.28, 320);
        boyPos.cx = w - w * 0.05 - iw * 0.5;
        boyPos.cy = h - h * 0.03 - iw * 1.2 * 0.5;
        cloud.x = w * 0.72;
        cloud.y = h * 0.08;
        cloud.radius = Math.min(w * 0.26, 200);
      };

      function initLanding() {
        const w = window.innerWidth * dpr();
        const h = window.innerHeight * dpr();
        canvas.width = w;
        canvas.height = h;
        calcLandingPositions(w, h);
        drops = Array.from({ length: LANDING_DROP_COUNT }, (_, i) => new LandingDrop(i, LANDING_DROP_COUNT));
        const lineLen = boyPos.cy - (cloud.y + cloud.radius * 0.3);
        for (const d of drops) d.lineLength = lineLen;
      }

      function drawLanding(now: number) {
        const dt = lastTime ? Math.min(now - lastTime, 50) : 16;
        lastTime = now;
        time += dt * 0.001;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawLandingCloud(ctx, cloud.x, cloud.y, cloud.radius);
        for (const d of drops) {
          d.update();
          d.draw(ctx, cloud.x, cloud.y, cloud.radius, boyPos.cy, time);
        }
      }

      // ── Default init/draw ──
      function initDefault() {
        const w = window.innerWidth * dpr();
        const h = window.innerHeight * dpr();
        canvas.width = w;
        canvas.height = h;
        gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, "rgb(239,246,255)");
        gradient.addColorStop(1, "rgb(240,244,248)");

        butterflies = Array.from({ length: DEFAULT_BUTTERFLY_COUNT }, () => new DefaultButterfly(w, h));
      }

      function drawDefault() {
        ctx.fillStyle = gradient!;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (const b of butterflies) { b.update(); b.draw(ctx); }
      }

      // ── 启动 ──
      if (isLanding) {
        initLanding();
        lastTime = 0;
      } else {
        initDefault();
      }

      function loop(now: number) {
        isLanding ? drawLanding(now) : drawDefault();
        rafRef.current = requestAnimationFrame(loop);
      }
      rafRef.current = requestAnimationFrame(loop);

      // ── Resize ──
      let resizeTimer: ReturnType<typeof setTimeout>;
      function handleResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (isLanding) { initLanding(); lastTime = 0; } else { initDefault(); }
        }, RESIZE_DEBOUNCE);
      }
      window.addEventListener("resize", handleResize);

      return () => {
        cancelAnimationFrame(rafRef.current);
        window.removeEventListener("resize", handleResize);
        clearTimeout(resizeTimer);
      };
    },
    [isLanding],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    return animate(ctx, canvas);
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      id={isLanding ? "p5-landing-canvas" : "p5-canvas"}
      style={CANVAS_STYLE[isLanding ? "landing" : "default"]}
    />
  );
}
