/**
 * P5Canvas 常量 — 颜色、图形数据、配置
 * Landing 模式：深蓝云朵 + 彩色泪滴
 * Default 模式：白云 + 蓝色雨滴 + 蝴蝶
 */

import { PI, TWO_PI } from "./P5Canvas.math";

export { PI, TWO_PI };

// ── 颜色 ──
export const COLOR = {
  CLOUD_DARK: [35, 55, 95] as const,
  VINTAGE_RED: [185, 85, 75] as const,
  SKY_BLUE: [140, 180, 210] as const,
  NAVY: [45, 65, 105] as const,
} as const;

// ── 工具函数 ──
export const rand = (min: number, max: number) => min + Math.random() * (max - min);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function rgba(r: number, g: number, b: number, a: number) {
  return `rgba(${r},${g},${b},${a / 255})`;
}

export function rgbaArr([r, g, b]: readonly number[], a: number) {
  return `rgba(${r},${g},${b},${a / 255})`;
}

// ── 预计算颜色缓存 ──
const RAIN_LINE_COLORS: Record<number, string> = {};
const RAIN_DROP_COLORS: Record<number, string> = {};

export function rainLineColor(alpha: number) {
  const k = alpha | 0;
  if (!RAIN_LINE_COLORS[k]) {
    RAIN_LINE_COLORS[k] = `rgba(59,130,246,${((alpha * 0.22) / 255).toFixed(3)})`;
  }
  return RAIN_LINE_COLORS[k];
}

export function rainDropColor(alpha: number) {
  const k = alpha | 0;
  if (!RAIN_DROP_COLORS[k]) {
    RAIN_DROP_COLORS[k] = `rgba(59,130,246,${(alpha / 255).toFixed(3)})`;
  }
  return RAIN_DROP_COLORS[k];
}

// ── DPR 缓存 ──
let cachedDPR = 0;
export function dpr() {
  if (!cachedDPR) cachedDPR = Math.min(window.devicePixelRatio || 1, 2);
  return cachedDPR;
}

// ── Landing 云朵椭圆数据 ──
export const LANDING_CLOUD_ELLIPSES: [number, number, number, number][] = [
  [0, 0, 0.65, 0.275],
  [-0.45, 0.08, 0.35, 0.225],
  [0.4, 0.05, 0.325, 0.2],
  [-0.15, -0.18, 0.275, 0.2],
  [0.2, -0.15, 0.25, 0.175],
];

// ── Default 云朵图层数据 ──
export const DEFAULT_CLOUD_LAYERS: [number, number, number, number, string][] = [
  [0, 0.30, 0.55, 0.26, "rgba(230,240,252,0.314)"],
  [0, 0, 0.57, 0.62, "rgba(255,255,255,0.686)"],
  [-0.48, 0.16, 0.36, 0.46, "rgba(255,255,255,0.686)"],
  [0.48, 0.16, 0.36, 0.46, "rgba(255,255,255,0.686)"],
  [-0.27, -0.22, 0.29, 0.42, "rgba(255,255,255,0.686)"],
  [0.27, -0.22, 0.29, 0.42, "rgba(255,255,255,0.686)"],
  [-0.10, -0.17, 0.25, 0.30, "rgba(240,248,255,0.647)"],
  [0.14, -0.12, 0.21, 0.26, "rgba(240,248,255,0.647)"],
  [0, 0.22, 0.43, 0.30, "rgba(219,234,254,0.608)"],
  [-0.34, 0.28, 0.26, 0.24, "rgba(219,234,254,0.608)"],
  [0.34, 0.28, 0.26, 0.24, "rgba(219,234,254,0.608)"],
];

// ── 配置 ──
export const LANDING_DROP_COUNT = 45;
export const DEFAULT_CLOUD_MIN = 3;
export const DEFAULT_RAIN_MIN = 50;
export const DEFAULT_BUTTERFLY_COUNT = 10;
export const DEFAULT_CANVAS_OPACITY = 0.55;
export const RESIZE_DEBOUNCE = 150;
