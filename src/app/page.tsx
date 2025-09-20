"use client";

import { FormEvent, useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api";
import { getToken, setToken } from "@/lib/auth";

type FormState = {
  value: string;
  error: string | null;
};

const containerStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem",
  background: "linear-gradient(135deg, #0f172a 0%, #1f2937 100%)",
  color: "#f8fafc",
};

const panelStyle: CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  background: "rgba(15, 23, 42, 0.65)",
  borderRadius: "16px",
  padding: "2.5rem",
  boxShadow: "0 20px 45px rgba(15, 23, 42, 0.25)",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  backdropFilter: "blur(12px)",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontWeight: 600,
  marginBottom: "0.75rem",
  fontSize: "0.95rem",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "0.875rem 1rem",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.4)",
  background: "rgba(15, 23, 42, 0.35)",
  color: "inherit",
  fontSize: "0.95rem",
  outline: "none",
  transition: "border-color 0.2s ease",
};

const buttonStyle: CSSProperties = {
  width: "100%",
  marginTop: "1.5rem",
  padding: "0.875rem 1rem",
  borderRadius: "12px",
  border: "none",
  background: "#2563eb",
  color: "white",
  fontWeight: 600,
  fontSize: "1rem",
  cursor: "pointer",
  transition: "transform 0.2s ease, opacity 0.2s ease",
};

const errorStyle: CSSProperties = {
  color: "#f97316",
  marginTop: "0.75rem",
  fontSize: "0.875rem",
};

export default function LoginPage() {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [formState, setFormState] = useState<FormState>({ value: "", error: null });

  useEffect(() => {
    const existingToken = getToken();
    if (existingToken) {
      router.replace("/dashboard");
      return;
    }

    setIsCheckingSession(false);
  }, [router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = formState.value.trim();

    if (!trimmed) {
      setFormState((state) => ({ ...state, error: "请输入有效的访问令牌" }));
      return;
    }

    setToken(trimmed);
    router.replace("/dashboard");
  };

  if (isCheckingSession) {
    return (
      <main style={containerStyle}>
        <p style={{ opacity: 0.7 }}>正在检查登录状态…</p>
      </main>
    );
  }

  const apiBaseUrl = getApiBaseUrl();

  return (
    <main style={containerStyle}>
      <section style={panelStyle}>
        <header style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            登录 DNA Web
          </h1>
          <p style={{ opacity: 0.7, lineHeight: 1.6 }}>
            请粘贴 API 访问令牌以进入控制台。
            <br />
            当前 API 地址：{apiBaseUrl || "未配置"}
          </p>
        </header>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="token" style={labelStyle}>
            访问令牌
          </label>
          <input
            id="token"
            type="password"
            name="token"
            autoComplete="off"
            placeholder="例如：eyJhbGci..."
            style={inputStyle}
            value={formState.value}
            onChange={(event) =>
              setFormState({ value: event.target.value, error: null })
            }
          />
          {formState.error ? <p style={errorStyle}>{formState.error}</p> : null}
          <button type="submit" style={buttonStyle}>
            进入控制台
          </button>
        </form>
      </section>
    </main>
  );
}
