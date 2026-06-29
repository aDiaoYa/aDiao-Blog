/**
 * 本地文件系统同步 API（仅开发环境使用）
 * POST   - 将文章写入本地 content/posts/
 * DELETE - 删除本地文章 ?slug=xxx
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// 静态导出兼容：生产构建时返回占位数据
export const dynamic = "force-static";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

// GET 用于静态导出构建
export async function GET() {
  return NextResponse.json({ ok: true, static: true });
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false, message: "仅开发环境可用" }, { status: 403 });
  }

  try {
    const { slug, content } = await request.json();
    if (!slug || !content) {
      return NextResponse.json({ ok: false, message: "缺少 slug 或 content" }, { status: 400 });
    }

    const sanitized = slug.replace(/[<>:"/\\|?*]/g, "_");
    const filePath = path.join(POSTS_DIR, `${sanitized}.md`);

    if (!fs.existsSync(POSTS_DIR)) {
      fs.mkdirSync(POSTS_DIR, { recursive: true });
    }

    fs.writeFileSync(filePath, content, "utf-8");
    return NextResponse.json({ ok: true, message: `已保存到 ${filePath}` });
  } catch (err) {
    return NextResponse.json({ ok: false, message: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false, message: "仅开发环境可用" }, { status: 403 });
  }

  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ ok: false, message: "缺少 slug 参数" }, { status: 400 });
  }

  try {
    const sanitized = slug.replace(/[<>:"/\\|?*]/g, "_");
    const filePath = path.join(POSTS_DIR, `${sanitized}.md`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return NextResponse.json({ ok: true, message: `已删除 ${slug}` });
  } catch (err) {
    return NextResponse.json({ ok: false, message: (err as Error).message }, { status: 500 });
  }
}
