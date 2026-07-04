"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NotebookText, Archive, LogOut, GraduationCap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { auth, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!auth) return null;

  const linkClass = (href) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-primary text-white"
        : "text-foreground/70 hover:bg-black/5"
    }`;

  const handleLogout = () => {
    logout();
    router.replace("/giris");
  };

  const initial = auth.username?.charAt(0)?.toUpperCase() || "?";

  return (
    <header className="border-b border-border bg-surface sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <span className="font-display text-lg font-bold text-primary flex items-center gap-1.5">
            <GraduationCap size={22} strokeWidth={2.2} />
            Ders Notlarım
          </span>
          <nav className="flex items-center gap-1">
            <Link href="/notlar" className={linkClass("/notlar")}>
              <NotebookText size={16} />
              Notlarım
            </Link>
            <Link href="/arsiv" className={linkClass("/arsiv")}>
              <Archive size={16} />
              Arşiv
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
              {initial}
            </span>
            <span className="text-sm text-muted">{auth.username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-danger hover:text-danger-hover transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Çıkış yap</span>
          </button>
        </div>
      </div>
    </header>
  );
}
