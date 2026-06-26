"use client";

import { useEffect, useRef } from "react";

export default function P5Canvas({ mode = "default" }: { mode?: "landing" | "default" }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let instance: unknown = null;

    async function init() {
      const p5 = (await import("p5")).default;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sketch = (p: any) => {
        const isLanding = mode === "landing";
        const stars: { x: number; y: number; r: number; speed: number; alpha: number }[] = [];
        const NUM = isLanding ? 120 : 60;

        p.setup = () => {
          const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
          canvas.parent(canvasRef.current!);
          p.noStroke();
          for (let i = 0; i < NUM; i++) {
            stars.push({
              x: p.random(p.width),
              y: p.random(p.height),
              r: p.random(1, isLanding ? 3 : 2),
              speed: p.random(0.2, isLanding ? 1 : 0.6),
              alpha: p.random(60, isLanding ? 200 : 120),
            });
          }
        };

        p.draw = () => {
          p.clear();
          stars.forEach((s) => {
            s.y -= s.speed;
            if (s.y < -10) {
              s.y = p.height + 10;
              s.x = p.random(p.width);
            }
            p.fill(255, 255, 255, s.alpha);
            p.circle(s.x, s.y, s.r);
          });
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight);
        };
      };

      instance = new p5(sketch);
    }

    init();
    return () => {
      if (instance && typeof (instance as { remove: () => void }).remove === "function") {
        (instance as { remove: () => void }).remove();
      }
    };
  }, [mode]);

  return (
    <>
      <div ref={canvasRef} id="p5-canvas" />
      {mode === "landing" && (
        <div ref={containerRef} id="hero-canvas" className="hero-visual" aria-hidden="true" />
      )}
    </>
  );
}
