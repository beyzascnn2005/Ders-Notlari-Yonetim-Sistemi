"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { auth, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(auth ? "/notlar" : "/giris");
  }, [auth, loading, router]);

  return (
    <main className="flex-1 flex items-center justify-center">
      <p className="text-muted">Yönlendiriliyor...</p>
    </main>
  );
}
