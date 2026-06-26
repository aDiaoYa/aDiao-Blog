import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import P5Canvas from "@/components/P5Canvas";
import ReadingProgress from "@/components/ReadingProgress";

export const metadata: Metadata = {
  title: "友情链接",
  description: "记录一路同行的伙伴们",
};

export default function FriendsPage() {
  return (
    <>
      <P5Canvas />
      <ReadingProgress />
      <div className="page-shell">
        <Navbar />

        <main className="layout-grid">
          <section className="content-panel">
            <section className="friends-hero">
              <p className="eyebrow">Friends</p>
              <h1>友情链接</h1>
            </section>

            <div className="article-body">
              <blockquote>
                记录一路同行的伙伴们，交换友链请留言或在 GitHub 提 Issue。
              </blockquote>

              <div className="friends-group">
                <h2>技术博客</h2>
                <div className="friends-list">
                  <div className="friend-card">
                    <span className="friend-avatar-placeholder">R</span>
                    <div className="friend-info">
                      <strong>阮一峰的网络日志</strong>
                      <span>科技爱好者周刊，记录每周值得分享的科技内容</span>
                    </div>
                  </div>
                  <div className="friend-card">
                    <span className="friend-avatar-placeholder">K</span>
                    <div className="friend-info">
                      <strong>Khronos</strong>
                      <span>Xe Iaso&apos;s blog about tech, programming &amp; life</span>
                    </div>
                  </div>
                </div>
              </div>

              <h2>申请友链</h2>
              <p>欢迎交换友链，要求：</p>
              <ul>
                <li>技术类个人博客，内容原创</li>
                <li>网站稳定运行半年以上</li>
                <li>无过多广告和恶意内容</li>
              </ul>
              <p>请先添加本站信息后，在评论区留言：</p>
              <ul>
                <li>
                  <strong>名称</strong>：aDiaoYa
                </li>
                <li>
                  <strong>地址</strong>：<code>https://adiaoYa.github.io</code>
                </li>
                <li>
                  <strong>描述</strong>：啊叼一只鱼 · 越努力越幸运的美少女
                </li>
                <li>
                  <strong>头像</strong>：<code>https://adiaoYa.github.io/favicon.svg</code>
                </li>
              </ul>
            </div>
          </section>

          <Sidebar />
        </main>

        <Footer />
      </div>
    </>
  );
}
