"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getApiBaseUrl } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

type HealthState = "checking" | "ok" | "error";

type HealthResponse = {
  ok?: boolean;
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

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "640px",
  borderRadius: "18px",
  padding: "2.5rem",
  background: "rgba(15, 23, 42, 0.45)",
  color: "inherit",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.3)",
  backdropFilter: "blur(14px)",
  border: "1px solid rgba(148, 163, 184, 0.25)",
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  gap: "1rem",
  marginTop: "2rem",
};

const buttonStyle: CSSProperties = {
  padding: "0.75rem 1.5rem",
  borderRadius: "12px",
  border: "none",
  fontWeight: 600,
  cursor: "pointer",
  transition: "opacity 0.2s ease",
};

export default function DashboardPage() {
  const router = useRouter();
  const [state, setState] = useState<HealthState>("checking");
  const [message, setMessage] = useState("正在检测 API 状态…");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const updateState = useCallback((nextState: HealthState, nextMessage: string) => {
    if (!mountedRef.current) {
      return;
    }

    setState(nextState);
    setMessage(nextMessage);
  }, []);

  const runHealthCheck = useCallback(async () => {
    updateState("checking", "正在检测 API 状态…");
    try {
      const response = await apiFetch("/health", { cache: "no-store" });

      if (!response.ok) {
        updateState("error", `API 返回状态码 ${response.status}`);
        return;
      }

      try {
        const data = (await response.json()) as HealthResponse;
        if (data?.ok) {
          updateState("ok", "API 连接正常，欢迎回来！");
        } else {
          updateState("error", "API 返回了意料之外的响应");
        }
      } catch (error) {
        console.error("Failed to parse /health response", error);
        updateState("error", "无法解析 API 响应");
      }
    } catch (error) {
      console.error("Unable to reach API", error);
      updateState("error", "无法连接到 API，请稍后再试");
    }
  }, [updateState]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/");
      return;
    }

    void runHealthCheck();
  }, [router, runHealthCheck]);

  const handleLogout = () => {
    clearToken();
    router.replace("/");
  };

  const apiBaseUrl = getApiBaseUrl();

  return (
    <main style={containerStyle}>
      <section style={cardStyle}>
        <header style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            控制台
          </h1>
          <p style={{ opacity: 0.75, lineHeight: 1.6 }}>
            当前 API 地址：{apiBaseUrl || "未配置"}
            <br />
            状态：{state === "checking" ? "检测中" : state === "ok" ? "正常" : "异常"}
          </p>
        </header>
        <p style={{ lineHeight: 1.7 }}>{message}</p>
        <div style={buttonRowStyle}>
          <button
            type="button"
            disabled={state === "checking"}
            style={{
              ...buttonStyle,
              background: "#1d4ed8",
              color: "white",
              opacity: state === "checking" ? 0.6 : 1,
              cursor: state === "checking" ? "wait" : "pointer",
            }}
            onClick={() => {
              void runHealthCheck();
            }}
          >
            刷新状态
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, background: "rgba(255, 255, 255, 0.08)", color: "inherit" }}
            onClick={handleLogout}
          >
            退出登录
          </button>
        </div>
      </section>
    </main>
  );
}
