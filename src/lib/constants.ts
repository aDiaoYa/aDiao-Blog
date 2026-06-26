/**
 * ============================================================
 * 全局常量 — 一处修改，全局生效
 * ============================================================
 */

// ── 站点元数据 ──
export const SITE = {
  title: 'aDiaoYa · 啊叼一只鱼',
  shortName: 'aDiaoYa',
  tagline: '越努力越幸运的美少女',
  description: '前端工程与 AI Agent 技术探索，记录构建智能应用的思考与实践。',
  keywords: ['前端', 'AI Agent', 'React', 'TypeScript', 'Next.js', 'MCP'],
  author: 'aDiaoYa',
  icon: '🐟',
  /** 注意：与 next.config.ts 中的 basePath 保持一致 */
  basePath: '/aDiao-Blog',
} as const;

// ── 导航 ──
export const NAV_ITEMS = [
  { href: '/', label: '关于' },
  { href: '/home', label: '文章' },
  { href: '/archives', label: '归档' },
  { href: '/plan', label: '计划' },
  { href: '/news', label: '资讯' },
] as const;

// ── 社交链接 ──
export const SOCIAL = {
  github: 'https://github.com/aDiaoYa',
} as const;

// ── 首页 Hero ──
export const HERO = {
  badge: 'Frontend × AI Agent',
  name: 'aDiaoYa · 啊叼一只鱼',
  subtitle: '对于可控的事情保持谨慎，对于不可控的事情保持乐观。',
  bio: '你好，我是啊叼一只鱼(aDiaoYa)，一名努力升级进化的前端开发工程师，目前专注于前端与AI Agent相关技术探索和实践，奉行"人有多大胆，地有多大产"的理念。对了，我的麦子快熟了，你要陪我一起静候再静候嘛？',
  btnPrimary: '阅读文章',
  btnSecondary: '查看归档',
} as const;

// ── 页脚版权 ──
export const FOOTER = {
  copyrightYear: 2026,
  license: 'CC BY-NC-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
  poweredBy: 'Next.js',
  poweredByUrl: 'https://nextjs.org',
} as const;
