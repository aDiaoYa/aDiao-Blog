/**
 * GitHub API 操作工具
 * 通过 GitHub REST API 直接操作仓库中的 Markdown 文件
 */

const REPO_OWNER = "aDiaoYa";
const REPO_NAME = "aDiao-Blog";
const POSTS_PATH = "content/posts";
const IMAGES_PATH = "public/images/posts";
const API_BASE = "https://api.github.com";

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  content?: string;
  encoding?: string;
}

interface CommitResult {
  sha: string;
  url: string;
}

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("gh_token") || "";
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
  };
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { ...authHeaders(), ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `GitHub API Error: ${res.status}`);
  }
  return res.json();
}

/** 验证 Token 是否有效 */
export async function validateToken(token: string): Promise<{ login: string }> {
  const res = await fetch(`${API_BASE}/user`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
  });
  if (!res.ok) throw new Error("Token 无效");
  return res.json();
}

/** 获取 content/posts 下所有文章 */
export async function listPosts(): Promise<GitHubFile[]> {
  return api<GitHubFile[]>(`${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_PATH}`);
}

/** Base64 解码 */
function fromBase64(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/** 获取单篇文章内容 */
export async function getPostContent(slug: string): Promise<{ content: string; sha: string }> {
  const data = await api<GitHubFile>(
    `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_PATH}/${slug}.md`
  );
  const content = data.content ? fromBase64(data.content) : "";
  return { content, sha: data.sha };
}

/** 将字符串安全编码为 Base64（支持中文） */
function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** 创建新文章 */
export async function createPost(slug: string, content: string): Promise<CommitResult> {
  const isDev = process.env.NODE_ENV === "development";

  // 开发环境：优先保存到本地 content/posts/
  if (isDev) {
    const res = await fetch("/aDiao-Blog/api/local-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, content }),
    });
    const result = await res.json().catch(() => ({ ok: false }));
    if (!result.ok) throw new Error("本地保存失败: " + result.message);
  }

  try {
    return await api<CommitResult>(
      `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_PATH}/${slug}.md`,
      {
        method: "PUT",
        body: JSON.stringify({
          message: `post: 新增文章 ${slug}`,
          content: toBase64(content),
        }),
      }
    );
  } catch (e) {
    // 开发环境：本地已保存成功，GitHub 失败不阻塞
    if (isDev) {
      console.warn("[GitHub 推送] 失败，文章已保存到本地:", (e as Error).message);
      return { sha: "", url: "" };
    }
    throw e;
  }
}

/** 更新已有文章 */
export async function updatePost(
  slug: string,
  content: string,
  sha: string
): Promise<CommitResult> {
  const isDev = process.env.NODE_ENV === "development";

  // 开发环境：优先保存到本地 content/posts/
  if (isDev) {
    const res = await fetch("/aDiao-Blog/api/local-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, content }),
    });
    const result = await res.json().catch(() => ({ ok: false }));
    if (!result.ok) throw new Error("本地保存失败: " + result.message);
  }

  try {
    return await api<CommitResult>(
      `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_PATH}/${slug}.md`,
      {
        method: "PUT",
        body: JSON.stringify({
          message: `post: 更新文章 ${slug}`,
          content: toBase64(content),
          sha,
        }),
      }
    );
  } catch (e) {
    // 开发环境：本地已保存成功，GitHub 失败不阻塞
    if (isDev) {
      console.warn("[GitHub 推送] 失败，文章已保存到本地:", (e as Error).message);
      return { sha: "", url: "" };
    }
    throw e;
  }
}

/** 删除文章 */
export async function deletePost(slug: string, sha: string): Promise<void> {
  await api(`${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_PATH}/${slug}.md`, {
    method: "DELETE",
    body: JSON.stringify({ message: `post: 删除文章 ${slug}`, sha }),
  });
}

/** 上传图片到 public/images/posts/ */
export async function uploadImage(file: File): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${timestamp}_${safeName}`;

  // 读取文件为 base64
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  });

  await api<CommitResult>(
    `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${IMAGES_PATH}/${fileName}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message: `upload: 上传图片 ${fileName}`,
        content: base64,
      }),
    }
  );

  // 返回图片 URL
  return `/aDiao-Blog/images/posts/${fileName}`;
}

/** 获取仓库中现有图片列表 */
export async function listImages(): Promise<GitHubFile[]> {
  try {
    return await api<GitHubFile[]>(
      `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${IMAGES_PATH}`
    );
  } catch {
    return [];
  }
}

/** 保存 Token 到本地 */
export function saveToken(token: string): void {
  localStorage.setItem("gh_token", token);
}

/** 检查是否已登录 */
export function isLoggedIn(): boolean {
  return !!getToken();
}

/** 退出登录 */
export function logout(): void {
  localStorage.removeItem("gh_token");
}
