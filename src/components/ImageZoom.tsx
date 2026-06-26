"use client";

import { useEffect, useRef } from "react";

export default function ImageZoom() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const img = imgRef.current;
    if (!overlay || !img) return;

    function close() {
      overlay!.classList.remove("active");
      document.body.style.overflow = "";
    }

    function open(src: string, alt: string) {
      img!.src = src;
      img!.alt = alt;
      overlay!.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" && target.closest(".article-body")) {
        open((target as HTMLImageElement).src, (target as HTMLImageElement).alt || "");
      }
    }

    function handleOverlayClick(e: MouseEvent) {
      if (e.target === overlay || (e.target as HTMLElement).classList.contains("img-zoom-close")) {
        close();
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("click", handleClick);
    overlay.addEventListener("click", handleOverlayClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("click", handleClick);
      overlay.removeEventListener("click", handleOverlayClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div ref={overlayRef} className="img-zoom-overlay">
      <img ref={imgRef} src="" alt="" />
      <button className="img-zoom-close" aria-label="关闭">
        ×
      </button>
    </div>
  );
}
