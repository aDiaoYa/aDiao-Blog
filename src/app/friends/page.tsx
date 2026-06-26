import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReadingProgress from "@/components/ReadingProgress";
import { SITE, SOCIAL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "友情链接",
  description: "记录一路同行的伙伴们",
};

interface FriendLink {
  name: string;
  url: string;
  desc: string;
  avatar?: string;
}

const TECH_BLOGS: FriendLink[] = [
  {
    name: "阮一峰的网络日志",
    url: "https://www.ruanyifeng.com/blog/",
    desc: "科技爱好者周刊，记录每周值得分享的科技内容",
  },
  {
    name: "Khronos",
    url: "https://xeiaso.net/",
    desc: "Xe Iaso's blog about tech, programming & life",
  },
];

function getInitialChar(name: string): string {
  return name.charAt(0).toUpperCase();
}

const FRIEND_BADGE = "前端 × AI Agent";

export default function FriendsPage() {
  const blogPath = SITE.basePath.replace("/", "");

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

            {TECH_BLOGS.length > 0 && (
              <div className="friends-group">
                <h2>技术博客</h2>
                <div className="friends-list">
                  {TECH_BLOGS.map((friend) => (
                    <a key={friend.url} className="friend-card" href={friend.url} target="_blank" rel="noopener">
                      <span className="friend-avatar-placeholder">{getInitialChar(friend.name)}</span>
                      <div className="friend-info">
                        <strong>{friend.name}</strong>
                        <span>{friend.desc}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="friends-apply">
              <h3>交换友链</h3>
              <ul>
                <li>技术类个人博客，内容原创</li>
                <li>网站稳定运行半年以上</li>
                <li>无过多广告和恶意内容</li>
              </ul>
              <p>请先在您的站点添加本站信息，然后通过以下方式联系：</p>
              <pre>
                名称：{SITE.title}{"\n"}
                地址：{SOCIAL.github}/{blogPath}/{"\n"}
                描述：{SITE.tagline} · {FRIEND_BADGE}{"\n"}
                头像：{SOCIAL.github}/{blogPath}/favicon.svg
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
