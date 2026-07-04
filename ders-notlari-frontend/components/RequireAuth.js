"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RequireAuth({ children }) {
  const { auth, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !auth) router.replace("/giris");
  }, [auth, loading, router]);

  if (loading || !auth) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted">Yükleniyor...</p>
      </main>
    );
  }

  return children;
}
