"use client";

import { usePathname } from "next/navigation";
import P5Canvas from "@/components/P5Canvas";

/** 在非后台页面才渲染 P5Canvas 背景效果 */
export default function P5CanvasWrapper() {
  const pathname = usePathname();
  // 后台管理页面不显示背景动画
  if (pathname.startsWith("/admin")) return null;
  return <P5Canvas />;
}
