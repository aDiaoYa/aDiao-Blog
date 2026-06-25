<p align="center">
  <img width="80" src="./source/favicon.svg" alt="aDiaoYa">
</p>
<h1 align="center">aDiaoYa</h1>
<p align="center"><em>啊叼一只鱼 · 代码与智能的边界</em></p>
<p align="center">
  <a href="https://adiaoYa.github.io/aDiao-Blog/"><img src="https://img.shields.io/badge/预览-在线-blue?style=flat-square" alt="在线预览"></a>
  <a href="https://hexo.io/"><img src="https://img.shields.io/badge/Hexo-7.3-0e83cd?style=flat-square&logo=hexo" alt="Hexo"></a>
  <a href="https://github.com/aDiaoYa/aDiao-Blog/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License"></a>
</p>

---

## 🐟 关于

基于 [Hexo](https://hexo.io/) 的个人技术博客，主题 **Quiet** 为自研简洁风格。

记录前端工程、AI Agent 与智能应用开发中的探索与实践。

## ✨ 特性

- 📝 **Markdown** 写作，支持代码高亮
- 🌗 **亮色 / 暗色** 主题自动切换
- 📅 **日历热力图** 可视化发文频率
- 📆 **今日黄历** 展示农历干支宜忌
- 🌍 **RSS / Sitemap / SEO** 开箱即用
- 🗜️ **资源压缩**（neat）优化加载速度
- 🔗 **外部链接 nofollow** 友好 SEO

## 🛠️ 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | Hexo 7.3 |
| 模板 | EJS |
| 样式 | CSS（自定义变量 + 暗色模式） |
| 部署 | GitHub Pages（gh-pages） |
| 插件 | abbrlink / feed / search / sitemap / neat |

## 🚀 本地运行

```bash
# 克隆
git clone git@github.com:aDiaoYa/aDiao-Blog.git
cd aDiao-Blog

# 安装依赖
npm install

# 本地预览
npm run server

# 清除缓存 & 生成静态文件
npm run clean
npm run build

# 部署到 GitHub Pages
npm run deploy
```

## 📂 项目结构

```
aDiao-Blog
├── source/            # 文章与页面
│   ├── _posts/        # Markdown 文章
│   ├── friends/       # 友链
│   └── 404.html       # 自定义 404
├── themes/Quiet/      # 自研主题
│   ├── layout/        # EJS 模板
│   └── source/        # CSS / JS / 静态资源
├── _config.yml        # 网站配置
├── scaffolds/         # 文章脚手架
└── public/            # 构建输出（gitignore）
```

## 📝 写作

```bash
# 新建文章
npx hexo new "我的文章标题"

# 后台管理面板
npm run admin
```

## 📄 License

MIT © [aDiaoYa](https://github.com/aDiaoYa)
