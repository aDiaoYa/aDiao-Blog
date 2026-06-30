"use client";

import { useEffect, useRef, Component } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// 使用 CJS 路径避免 Next.js 静态导出时 ESM 解析失败
import { oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { slugify } from "@/lib/utils";

// 语法高亮容错包装：渲染失败时回退到纯 <pre><code>
class HighlightErrorBoundary extends Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// 简单的 tree walker，替代 unist-util-visit 避免额外的类型依赖
function walkElements(node: unknown, test: (n: Record<string, unknown>) => boolean, fn: (n: Record<string, unknown>) => void) {
  const n = node as Record<string, unknown>;
  if (n.type === "element" && test(n)) {
    fn(n);
  }
  if (Array.isArray((n as { children?: unknown[] }).children)) {
    for (const child of (n as { children: unknown[] }).children) {
      walkElements(child, test, fn);
    }
  }
}

/** 将 React children 安全转为纯文本字符串 */
function arrayToString(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(arrayToString).join("");
  if (children && typeof children === "object" && "props" in children) {
    return arrayToString((children as { props: { children?: React.ReactNode } }).props.children);
  }
  return "";
}

/**
 * 自定义 rehype 插件：为标题添加 ID（使用项目的 slugify 函数）
 * 确保 TOC 锚点与渲染后的标题 ID 一致
 */
function rehypeCustomSlug() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tree: any) => {
    walkElements(
      tree,
      (n) => /^h[1-6]$/.test(String(n.tagName || "")),
      (n) => {
        const children = (n as { children?: { type?: string; value?: string }[] }).children;
        const text = children
          ? children.map((c) => (c.type === "text" ? c.value || "" : "")).join("")
          : "";
        if (text && n.properties) {
          (n.properties as Record<string, string>).id = slugify(text);
        }
      }
    );
  };
}

export default function MarkdownRenderer({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Code copy buttons
    const pres = ref.current.querySelectorAll("pre");
    pres.forEach((pre) => {
      if (pre.querySelector(".code-copy-btn")) return;
      const btn = document.createElement("button");
      btn.className = "code-copy-btn";
      btn.textContent = "复制";
      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code") || pre;
        try {
          await navigator.clipboard.writeText(code.textContent || "");
          btn.textContent = "已复制";
          btn.classList.add("copied");
          setTimeout(() => {
            btn.textContent = "复制";
            btn.classList.remove("copied");
          }, 2000);
        } catch {
          btn.textContent = "复制失败";
          setTimeout(() => { btn.textContent = "复制"; }, 2000);
        }
      });
      (pre as HTMLElement).style.position = "relative";
      pre.appendChild(btn);
    });
  }, [content]);

  return (
    <div ref={ref}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeCustomSlug]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            // 安全提取代码文本：react-markdown 的 code children 可能是 string 或 React 元素数组
            const codeStr = (typeof children === "string" ? children : arrayToString(children)).replace(/\n$/, "");
            const isBlock = match || codeStr.includes("\n");
            if (isBlock && match) {
              const fallback = (
                <pre className={className}>
                  <code {...props}>{codeStr}</code>
                </pre>
              );
              return (
                <HighlightErrorBoundary fallback={fallback}>
                  <SyntaxHighlighter
                    style={oneLight}
                    language={match[1]}
                    PreTag="div"
                  >
                    {codeStr}
                  </SyntaxHighlighter>
                </HighlightErrorBoundary>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          img({ src, alt }) {
            return <img src={src} alt={alt || ""} loading="lazy" />;
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
