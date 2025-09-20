"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getApiBaseUrl } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import {
  WalletData,
  formatBalance,
  getNumericBalance,
  normalizeWallet,
  resolveAddress,
  resolveCurrency,
} from "@/lib/wallet";

const containerStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2.5rem 1.5rem",
  background: "linear-gradient(135deg, #0f172a 0%, #1f2937 100%)",
  color: "#f8fafc",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "720px",
  borderRadius: "20px",
  padding: "3rem",
  background: "rgba(15, 23, 42, 0.6)",
  color: "inherit",
  boxShadow: "0 28px 65px rgba(15, 23, 42, 0.35)",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  backdropFilter: "blur(16px)",
  display: "flex",
  flexDirection: "column",
  gap: "2.25rem",
};

const walletPanelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1.25rem",
  background: "rgba(15, 23, 42, 0.45)",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  borderRadius: "16px",
  padding: "1.5rem",
};

const balanceStyle: CSSProperties = {
  fontSize: "2.4rem",
  fontWeight: 700,
  lineHeight: 1.2,
};

const balanceMetaStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  fontSize: "0.95rem",
  opacity: 0.8,
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "0.9rem",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  opacity: 0.7,
};

const errorStyle: CSSProperties = {
  padding: "1rem 1.25rem",
  borderRadius: "12px",
  background: "rgba(239, 68, 68, 0.12)",
  border: "1px solid rgba(248, 113, 113, 0.45)",
  color: "#fecaca",
  fontSize: "0.95rem",
  lineHeight: 1.6,
};

const successStyle: CSSProperties = {
  padding: "1rem 1.25rem",
  borderRadius: "12px",
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(134, 239, 172, 0.35)",
  color: "#bbf7d0",
  fontSize: "0.95rem",
  lineHeight: 1.6,
};

const infoStyle: CSSProperties = {
  padding: "1rem 1.25rem",
  borderRadius: "12px",
  background: "rgba(59, 130, 246, 0.12)",
  border: "1px solid rgba(147, 197, 253, 0.35)",
  color: "#dbeafe",
  fontSize: "0.95rem",
  lineHeight: 1.6,
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "1rem",
};

const buttonStyle: CSSProperties = {
  flex: "1 1 180px",
  padding: "0.95rem 1.25rem",
  borderRadius: "12px",
  border: "none",
  fontWeight: 600,
  fontSize: "1rem",
  cursor: "pointer",
  transition: "transform 0.2s ease, opacity 0.2s ease",
};

type FeedbackTone = "info" | "success" | "error";

type ActionFeedback = {
  type: FeedbackTone;
  message: string;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function extractMessage(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (isPlainObject(value)) {
    const keys = ["message", "error", "detail", "msg"];
    for (const key of keys) {
      const candidate = value[key];
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
  }

  return null;
}

async function extractErrorMessage(response: Response, fallback: string) {
  try {
    const text = await response.text();
    if (!text) {
      return fallback;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(trimmed);
      const message = extractMessage(parsed);
      if (message) {
        return message;
      }
    } catch {
      const message = extractMessage(trimmed);
      if (message) {
        return message;
      }
    }

    return trimmed;
  } catch {
    return fallback;
  }
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const [isGranting, setIsGranting] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchWallet = useCallback(async () => {
    if (!mountedRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch("/wallet", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = normalizeWallet(await response.json());
      if (!mountedRef.current) {
        return;
      }

      setWallet(data);
    } catch (err) {
      console.error("Failed to fetch wallet", err);
      if (!mountedRef.current) {
        return;
      }

      setWallet(null);
      setError("无法获取钱包信息，请稍后重试。");
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/");
      return;
    }

    void fetchWallet();
  }, [router, fetchWallet]);

  const handleLogout = () => {
    clearToken();
    router.replace("/");
  };

  const handleOpenLab = () => {
    router.push("/lab");
  };

  const handleOpenGacha = () => {
    router.push("/gacha");
  };

  const handleGrantCoins = useCallback(async () => {
    if (isGranting) {
      return;
    }

    setActionFeedback(null);
    setIsGranting(true);

    try {
      const response = await apiFetch("/wallet/grant", { method: "POST" });
      if (!response.ok) {
        const fallback = `加币失败（${response.status}）`;
        const message = await extractErrorMessage(response, fallback);
        throw new Error(message);
      }

      setActionFeedback({
        type: "success",
        message: "已为您发放 1000 coins（开发环境测试）。",
      });
      await fetchWallet();
    } catch (err) {
      setActionFeedback({
        type: "error",
        message: resolveErrorMessage(err, "加币失败，请稍后重试。"),
      });
    } finally {
      setIsGranting(false);
    }
  }, [fetchWallet, isGranting]);

  const apiBaseUrl = getApiBaseUrl();
  const balanceLabel = wallet ? formatBalance(wallet) : "--";
  const currencyLabel = wallet ? resolveCurrency(wallet) : null;
  const addressLabel = wallet ? resolveAddress(wallet) : null;
  const coinBalance = getNumericBalance(wallet);
  const coinUnitLabel = currencyLabel ?? "coins";
  const isProduction = process.env.NODE_ENV === "production";

  const renderActionFeedback = () => {
    if (!actionFeedback) {
      return null;
    }

    if (actionFeedback.type === "success") {
      return <div style={successStyle}>{actionFeedback.message}</div>;
    }

    if (actionFeedback.type === "info") {
      return <div style={infoStyle}>{actionFeedback.message}</div>;
    }

    return <div style={errorStyle}>{actionFeedback.message}</div>;
  };

  return (
    <main style={containerStyle}>
      <section style={cardStyle}>
        <header style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <h1 style={{ fontSize: "2.4rem", fontWeight: 700 }}>欢迎回到 DNA 控制台</h1>
          <p style={{ opacity: 0.75, lineHeight: 1.6, fontSize: "1rem" }}>
            当前 API 地址：{apiBaseUrl || "未配置"}
            <br />
            在这里查看您的 coins 余额、进行扭蛋或前往怪兽实验室。
          </p>
        </header>

        <section style={walletPanelStyle}>
          <div>
            <span style={{ ...sectionTitleStyle, display: "block", marginBottom: "0.4rem" }}>
              钱包余额
            </span>
            <div style={balanceStyle}>
              {balanceLabel}
              <span style={{ fontSize: "1.1rem", marginLeft: "0.65rem", opacity: 0.8 }}>
                {coinUnitLabel}
              </span>
            </div>
          </div>

          {addressLabel ? (
            <div style={balanceMetaStyle}>
              <span>钱包地址：{addressLabel}</span>
            </div>
          ) : null}

          {coinBalance != null ? (
            <div style={balanceMetaStyle}>
              <span>可用 coins：{coinBalance.toLocaleString("zh-CN")}</span>
            </div>
          ) : null}

          {isLoading ? (
            <p style={{ opacity: 0.7 }}>正在获取钱包信息…</p>
          ) : error ? (
            <div style={errorStyle}>{error}</div>
          ) : actionFeedback ? (
            renderActionFeedback()
          ) : null}
          {!isLoading && !error && !actionFeedback ? (
            <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>
              coins 可用于扭蛋和怪兽实验室的其他功能。
            </p>
          ) : null}
        </section>

        <div style={buttonRowStyle}>
          <button
            type="button"
            style={{
              ...buttonStyle,
              background: "rgba(59, 130, 246, 0.18)",
              color: "#bfdbfe",
              opacity: isLoading ? 0.65 : 1,
              cursor: isLoading ? "wait" : "pointer",
            }}
            onClick={() => {
              if (!isLoading) {
                setActionFeedback(null);
                void fetchWallet();
              }
            }}
            disabled={isLoading}
          >
            刷新钱包
          </button>
          <button
            type="button"
            style={{
              ...buttonStyle,
              background: "rgba(236, 72, 153, 0.18)",
              color: "#fbcfe8",
            }}
            onClick={handleOpenGacha}
          >
            前往扭蛋机
          </button>
          <button
            type="button"
            style={{
              ...buttonStyle,
              background: "#2563eb",
              color: "#ffffff",
            }}
            onClick={handleOpenLab}
          >
            前往怪兽实验室
          </button>
          {!isProduction ? (
            <button
              type="button"
              style={{
                ...buttonStyle,
                background: "rgba(16, 185, 129, 0.2)",
                color: "#a7f3d0",
                opacity: isGranting ? 0.65 : 1,
                cursor: isGranting ? "wait" : "pointer",
              }}
              onClick={() => {
                if (!isGranting) {
                  void handleGrantCoins();
                }
              }}
              disabled={isGranting}
            >
              {isGranting ? "加币中…" : "开发态：+1000"}
            </button>
          ) : null}
          <button
            type="button"
            style={{
              ...buttonStyle,
              background: "rgba(255, 255, 255, 0.08)",
              color: "inherit",
            }}
            onClick={handleLogout}
          >
            退出登录
          </button>
        </div>
      </section>
    </main>
  );
}
