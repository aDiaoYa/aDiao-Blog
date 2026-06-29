/**
 * 同步 GitHub 文章到本地（仅开发环境使用）
 * GET  - 同步单篇文章 ?slug=xxx
 * POST - 同步所有文章
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const REPO_OWNER = "aDiaoYa";
const REPO_NAME = "aDiao-Blog";
const API_BASE = "https://api.github.com";

async function fetchFromGitHub(slug: string) {
  const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/content/posts/${slug}.md`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.content) return null;
  return Buffer.from(data.content, "base64").toString("utf-8");
}

async function fetchPostList(): Promise<{ name: string }[]> {
  const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/content/posts`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  return await res.json();
}

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false, message: "仅开发环境可用" }, { status: 403 });
  }

  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ ok: false, message: "缺少 slug 参数" }, { status: 400 });
  }

  try {
    const content = await fetchFromGitHub(slug);
    if (!content) {
      return NextResponse.json({ ok: false, message: "GitHub 上未找到该文章" }, { status: 404 });
    }

    const sanitized = slug.replace(/[<>:"/\\|?*]/g, "_");
    const filePath = path.join(POSTS_DIR, `${sanitized}.md`);

    if (!fs.existsSync(POSTS_DIR)) {
      fs.mkdirSync(POSTS_DIR, { recursive: true });
    }

    fs.writeFileSync(filePath, content, "utf-8");
    return NextResponse.json({ ok: true, message: `已同步 ${slug}` });
  } catch (err) {
    return NextResponse.json({ ok: false, message: (err as Error).message }, { status: 500 });
  }
}

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false, message: "仅开发环境可用" }, { status: 403 });
  }

  try {
    const files = await fetchPostList();
    if (!fs.existsSync(POSTS_DIR)) {
      fs.mkdirSync(POSTS_DIR, { recursive: true });
    }

    let count = 0;
    for (const file of files) {
      if (!file.name.endsWith(".md")) continue;
      const slug = file.name.replace(/\.md$/, "");
      const content = await fetchFromGitHub(slug);
      if (content) {
        fs.writeFileSync(path.join(POSTS_DIR, file.name), content, "utf-8");
        count++;
      }
    }

    return NextResponse.json({ ok: true, message: `已同步 ${count} 篇文章` });
  } catch (err) {
    return NextResponse.json({ ok: false, message: (err as Error).message }, { status: 500 });
  }
}
