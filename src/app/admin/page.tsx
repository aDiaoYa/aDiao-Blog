"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/github";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/admin/login");
    } else {
      router.push("/admin/posts");
    }
  }, [router]);

  return null;
}
