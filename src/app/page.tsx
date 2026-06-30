"use client";

import Link from "next/link";
import { useEffect } from "react";
import P5Canvas from "@/components/P5Canvas";
import { HERO, SITE } from "@/lib/constants";

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.classList.add("no-dark");
    document.body.classList.add("landing-page");
    return () => {
      document.documentElement.classList.remove("no-dark");
      document.body.classList.remove("landing-page");
    };
  }, []);

  return (
    <>
      {/* 右侧视觉区：人物图片 + 云朵雨滴动画 */}
      <div className="hero-visual" id="hero-canvas" aria-hidden="true">
        <P5Canvas mode="landing" />
      </div>
      <img
        className="star-boy-img"
        src={`${SITE.basePath}/images/star-boy.png`}
        alt="爱做梦的小孩"
        fetchPriority="high"
      />
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-badge">{HERO.badge}</div>
          <h1 className="hero-name">{HERO.name}</h1>
          <p className="hero-title">{HERO.subtitle}</p>
          <p className="hero-bio">{HERO.bio}</p>
          <div className="hero-actions">
            <Link className="btn-primary" href="/home">
              {HERO.btnPrimary}
            </Link>
            <Link className="btn-secondary" href="/archives">
              {HERO.btnSecondary}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
