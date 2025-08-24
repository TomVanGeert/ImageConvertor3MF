'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../hooks/useUser";

export default function LoginForm() {
  const { login } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // clear previous errors

    const success = await login(email, password);
    if (success) {
      // ✅ Redirect after login
      router.push("/");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-4">
      {error && <p className="text-red-600">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
      >
        Login
      </button>
    </form>
  );
}
