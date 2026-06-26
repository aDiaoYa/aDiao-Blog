"use client";

import Link from "next/link";
import { useEffect } from "react";
import P5Canvas from "@/components/P5Canvas";

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.classList.add("no-dark");
    return () => document.documentElement.classList.remove("no-dark");
  }, []);

  return (
    <>
      <P5Canvas mode="landing" />
      <div className="page-shell landing-page">
        <section className="landing-hero">
          <div className="hero-content">
            <div className="hero-badge">Frontend × AI Agent</div>
            <h1 className="hero-name">aDiaoYa · 啊叼一只鱼</h1>
            <p className="hero-title">
              对于可控的事情保持谨慎，对于不可控的事情保持乐观。
            </p>
            <p className="hero-bio">
              你好，我是啊叼一只鱼(aDiaoYa)，一名努力升级进化的前端开发工程师，目前专注于前端与AI
              Agent相关技术探索和实践，奉行&ldquo;人有多大胆，地有多大产&rdquo;的理念。
            </p>
            <div className="hero-actions">
              <Link className="btn-primary" href="/home">
                阅读文章
              </Link>
              <Link className="btn-secondary" href="/archives">
                查看归档
              </Link>
            </div>
          </div>

          <div className="hero-visual" id="hero-canvas" aria-hidden="true" />
          <img
            className="star-boy-img"
            src="/aDiao-Blog/images/star-boy.png"
            alt="爱做梦的小孩"
          />
        </section>
      </div>
    </>
  );
}
