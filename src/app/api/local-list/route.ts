/**
 * 本地文章列表 API（仅开发环境使用）
 * 直接从 content/posts/ 目录读取文章列表
 */
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

// 静态导出兼容：生产构建时返回占位数据
export const dynamic = "force-static";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

interface PostInfo {
  name: string;
  path: string;
  sha: string;
  content: string;
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "仅开发环境可用" }, { status: 403 });
  }

  try {
    if (!fs.existsSync(POSTS_DIR)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
    const posts: PostInfo[] = files.map((file) => {
      const filePath = path.join(POSTS_DIR, file);
      const content = fs.readFileSync(filePath, "utf-8");
      return {
        name: file,
        path: `content/posts/${file}`,
        sha: "local",
        content,
      };
    });

    return NextResponse.json(posts);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
