"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getApiBaseUrl } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

type WalletData = {
  balance?: number | string;
  available?: number | string;
  total?: number | string;
  amount?: number | string;
  currency?: string | null;
  symbol?: string | null;
  unit?: string | null;
  address?: string | null;
  walletAddress?: string | null;
  [key: string]: unknown;
};

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function toMaybeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
}

function toMaybeString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function normalizeWallet(payload: unknown): WalletData {
  if (isPlainObject(payload)) {
    if (payload.wallet && isPlainObject(payload.wallet)) {
      return payload.wallet as WalletData;
    }

    return payload as WalletData;
  }

  return { balance: payload as number | string };
}

function pickBalanceValue(wallet: WalletData): unknown {
  if (wallet.balance != null) {
    return wallet.balance;
  }

  if (wallet.available != null) {
    return wallet.available;
  }

  if (wallet.total != null) {
    return wallet.total;
  }

  if (wallet.amount != null) {
    return wallet.amount;
  }

  return null;
}

function formatBalance(wallet: WalletData): string {
  const candidate = pickBalanceValue(wallet);
  const numeric = toMaybeNumber(candidate);
  if (numeric != null) {
    return numeric.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  }

  const text = toMaybeString(candidate);
  if (text) {
    return text;
  }

  return "--";
}

function resolveCurrency(wallet: WalletData): string | null {
  const currency =
    toMaybeString(wallet.currency) ??
    toMaybeString(wallet.symbol) ??
    toMaybeString(wallet.unit);

  return currency ?? null;
}

function resolveAddress(wallet: WalletData): string | null {
  const address =
    toMaybeString(wallet.address) ?? toMaybeString(wallet.walletAddress);
  return address ?? null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
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

  const apiBaseUrl = getApiBaseUrl();
  const balanceLabel = wallet ? formatBalance(wallet) : "--";
  const currencyLabel = wallet ? resolveCurrency(wallet) : null;
  const addressLabel = wallet ? resolveAddress(wallet) : null;

  return (
    <main style={containerStyle}>
      <section style={cardStyle}>
        <header style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <h1 style={{ fontSize: "2.4rem", fontWeight: 700 }}>欢迎回到 DNA 控制台</h1>
          <p style={{ opacity: 0.75, lineHeight: 1.6, fontSize: "1rem" }}>
            当前 API 地址：{apiBaseUrl || "未配置"}
            <br />
            在这里查看您的钱包余额并前往怪兽实验室。
          </p>
        </header>

        <section style={walletPanelStyle}>
          <div>
            <span style={{ ...sectionTitleStyle, display: "block", marginBottom: "0.4rem" }}>
              钱包余额
            </span>
            <div style={balanceStyle}>
              {balanceLabel}
              {currencyLabel ? (
                <span style={{ fontSize: "1.1rem", marginLeft: "0.65rem", opacity: 0.8 }}>
                  {currencyLabel}
                </span>
              ) : null}
            </div>
          </div>

          {addressLabel ? (
            <div style={balanceMetaStyle}>
              <span>钱包地址：{addressLabel}</span>
            </div>
          ) : null}

          {isLoading ? (
            <p style={{ opacity: 0.7 }}>正在获取钱包信息…</p>
          ) : error ? (
            <div style={errorStyle}>{error}</div>
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
              background: "#2563eb",
              color: "#ffffff",
            }}
            onClick={handleOpenLab}
          >
            前往怪兽实验室
          </button>
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
