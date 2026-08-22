"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Unable to sign in.");
        return;
      }

      router.push("/admin/issues");
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-aside"><span className="admin-mark">L</span><p className="admin-eyebrow">LOOBAY / PRIVATE SPACE</p><h1>Keep every player heard.</h1><p>Review support reports, follow the thread, and help the local game keep moving.</p><span className="admin-aside-note">SUPPORT OPERATIONS · 2026</span></div>
      <section className="admin-login-card">
        <div className="admin-card-top"><span className="admin-lock">LOCKED AREA</span><span className="admin-dot" /></div>
        <h2>Welcome back.</h2>
        <p className="admin-intro">Sign in to review private support reports.</p>
        <form onSubmit={submit}>
          <label>Username<input name="username" autoComplete="username" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}<span aria-hidden="true">→</span></button>
        </form>
      </section>
    </main>
  );
}