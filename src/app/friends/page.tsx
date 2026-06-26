import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReadingProgress from "@/components/ReadingProgress";

export const metadata: Metadata = {
  title: "友情链接",
  description: "记录一路同行的伙伴们",
};

export default function FriendsPage() {
  return (
    <>
      <ReadingProgress />
      <div className="page-shell">
        <Navbar />

        <main className="layout-grid">
          <section className="content-panel">
            <section className="friends-hero">
              <h1>友情链接</h1>
              <p>记录一路同行的伙伴们</p>
            </section>

            <div className="friends-group">
              <h2>技术博客</h2>
              <div className="friends-list">
                <a className="friend-card" href="https://www.ruanyifeng.com/blog/" target="_blank" rel="noopener">
                  <span className="friend-avatar-placeholder">R</span>
                  <div className="friend-info">
                    <strong>阮一峰的网络日志</strong>
                    <span>科技爱好者周刊，记录每周值得分享的科技内容</span>
                  </div>
                </a>
                <a className="friend-card" href="https://xeiaso.net/" target="_blank" rel="noopener">
                  <span className="friend-avatar-placeholder">K</span>
                  <div className="friend-info">
                    <strong>Khronos</strong>
                    <span>Xe Iaso&apos;s blog about tech, programming &amp; life</span>
                  </div>
                </a>
              </div>
            </div>

            <div className="friends-apply">
              <h3>交换友链</h3>
              <ul>
                <li>技术类个人博客，内容原创</li>
                <li>网站稳定运行半年以上</li>
                <li>无过多广告和恶意内容</li>
              </ul>
              <p>请先在您的站点添加本站信息，然后通过以下方式联系：</p>
              <pre>
                名称：aDiaoYa · 啊叼一只鱼{"\n"}
                地址：https://adiaoYa.github.io/aDiao-Blog/{"\n"}
                描述：越努力越幸运的美少女 · 前端 × AI Agent{"\n"}
                头像：https://adiaoYa.github.io/aDiao-Blog/favicon.svg
              </pre>
            </div>
          </section>

          <Sidebar />
        </main>

        <Footer />
      </div>
    </>
  );
}
