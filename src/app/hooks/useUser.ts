'use client';

import { useState, useEffect, useCallback } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      setUser(data.user ?? null);
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Login failed");
      await fetchUser();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) throw new Error("Registration failed");
      await login(email, password); // auto login after register
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const logout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout failed");
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  return { user, loading, login, register, logout };
}
