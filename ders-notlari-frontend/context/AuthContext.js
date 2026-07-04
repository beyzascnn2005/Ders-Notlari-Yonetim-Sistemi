"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

// Not: localStorage burada normal bir tarayıcı ortamında (kullanıcının kendi
// bilgisayarında çalışan Next.js sitesi) tamamen güvenli ve standart bir yöntemdir.
const STORAGE_KEY = "dersNotlariAuth";

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null); // { userId, username, email, token, expiresAt }
  const [loading, setLoading] = useState(true);

  // Sayfa ilk yüklendiğinde daha önce giriş yapılmış mı diye localStorage'a bak.
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Token süresi dolmuşsa otomatik temizle.
        if (new Date(parsed.expiresAt) > new Date()) {
          setAuth(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = (authResponse) => {
    setAuth(authResponse);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authResponse));
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalıdır.");
  return ctx;
}
