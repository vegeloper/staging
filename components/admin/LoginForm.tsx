"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import styles from "./Admin.module.css";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className={styles.card}
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
          user?: { role?: string };
        };
        setPending(false);
        if (!response.ok) {
          setError(data.error || "ورود ناموفق بود.");
          return;
        }
        const requested = searchParams.get("returnTo") || "/admin";
        let destination = requested.startsWith("/admin") ? requested : "/admin";
        if (
          data.user?.role === "content_creator" &&
          !destination.startsWith("/admin/content")
        ) {
          destination = "/admin/content";
        }
        if (data.user?.role === "operator" && destination.startsWith("/admin/content")) {
          destination = "/admin";
        }
        router.push(destination);
        router.refresh();
      }}
    >
      <div className={styles.brand}>دات‌وان تریپ</div>
      <h1>ورود کاربران داخلی</h1>
      <p>مدیر وب‌سایت، اپراتور و تولیدکننده محتوا از اینجا وارد می‌شوند.</p>
      <label>
        نام کاربری
        <input
          className="control"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          style={{ display: "block", width: "100%", margin: "8px 0 16px", minHeight: 44, borderRadius: 12, border: "1px solid rgba(23,23,23,.12)", padding: "0 12px" }}
        />
      </label>
      <label>
        رمز عبور
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          style={{ display: "block", width: "100%", margin: "8px 0 16px", minHeight: 44, borderRadius: 12, border: "1px solid rgba(23,23,23,.12)", padding: "0 12px" }}
        />
      </label>
      {error ? <p style={{ color: "#b42318" }}>{error}</p> : null}
      <button className="button button-brand" type="submit" disabled={pending}>
        {pending ? "در حال ورود..." : "ورود"}
      </button>
    </form>
  );
}
