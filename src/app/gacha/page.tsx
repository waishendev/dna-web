"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MonsterCard from "@/components/MonsterCard";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { MonsterRecord, normalizeMonster } from "@/lib/monsters";
import {
  WalletData,
  formatBalance,
  getNumericBalance,
  normalizeWallet,
  resolveCurrency,
} from "@/lib/wallet";

const layoutStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2.5rem 1.5rem",
  background: "linear-gradient(135deg, #0f172a 0%, #1f2937 100%)",
  color: "#f8fafc",
};

const contentStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1100px",
  borderRadius: "24px",
  padding: "3rem",
  background: "rgba(15, 23, 42, 0.62)",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  boxShadow: "0 32px 70px rgba(15, 23, 42, 0.35)",
  backdropFilter: "blur(18px)",
  display: "flex",
  flexDirection: "column",
  gap: "2.5rem",
};

const headerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.8rem",
};

const titleStyle: CSSProperties = {
  fontSize: "2.35rem",
  fontWeight: 700,
};

const descriptionStyle: CSSProperties = {
  opacity: 0.78,
  fontSize: "1rem",
  lineHeight: 1.6,
  maxWidth: "680px",
};

const walletSectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
};

const walletCardStyle: CSSProperties = {
  borderRadius: "18px",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  background: "rgba(15, 23, 42, 0.45)",
  padding: "1.75rem",
  display: "flex",
  flexDirection: "column",
  gap: "1.1rem",
};

const walletHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1rem",
  flexWrap: "wrap",
};

const walletTitleStyle: CSSProperties = {
  fontSize: "1rem",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  opacity: 0.7,
};

const walletBalanceStyle: CSSProperties = {
  fontSize: "2.4rem",
  fontWeight: 700,
  lineHeight: 1.2,
};

const walletMetaStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  fontSize: "0.95rem",
  opacity: 0.78,
};

const walletActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "1rem",
};

const secondaryButtonStyle: CSSProperties = {
  flex: "1 1 180px",
  padding: "0.85rem 1.2rem",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  background: "rgba(59, 130, 246, 0.16)",
  color: "#bfdbfe",
  fontWeight: 600,
  fontSize: "0.95rem",
  cursor: "pointer",
  transition: "opacity 0.2s ease, transform 0.2s ease",
};

const gachaPanelStyle: CSSProperties = {
  borderRadius: "20px",
  border: "1px solid rgba(147, 197, 253, 0.25)",
  background: "rgba(30, 64, 175, 0.28)",
  padding: "2.5rem 2rem",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "2.5rem",
  alignItems: "center",
};

const orbContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1.25rem",
};

const orbCaptionStyle: CSSProperties = {
  fontSize: "0.95rem",
  opacity: 0.78,
  textAlign: "center",
  lineHeight: 1.6,
};

const gachaActionsStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1.2rem",
};

const pullButtonStyle: CSSProperties = {
  padding: "1.1rem 1.5rem",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(135deg, #f59e0b, #f97316)",
  color: "#0f172a",
  fontWeight: 700,
  fontSize: "1.1rem",
  cursor: "pointer",
  boxShadow: "0 18px 40px rgba(249, 115, 22, 0.35)",
  transition: "transform 0.2s ease, opacity 0.2s ease",
};

const disabledPullStyle: CSSProperties = {
  opacity: 0.65,
  cursor: "not-allowed",
};

const helperTextStyle: CSSProperties = {
  fontSize: "0.9rem",
  opacity: 0.75,
  lineHeight: 1.6,
};

const errorMessageStyle: CSSProperties = {
  padding: "1rem 1.25rem",
  borderRadius: "12px",
  background: "rgba(239, 68, 68, 0.12)",
  border: "1px solid rgba(248, 113, 113, 0.4)",
  color: "#fecaca",
  fontSize: "0.95rem",
  lineHeight: 1.6,
};

const successMessageStyle: CSSProperties = {
  padding: "1rem 1.25rem",
  borderRadius: "12px",
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(134, 239, 172, 0.35)",
  color: "#bbf7d0",
  fontSize: "0.95rem",
  lineHeight: 1.6,
};

const resultSectionStyle: CSSProperties = {
  borderRadius: "20px",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  background: "rgba(15, 23, 42, 0.48)",
  padding: "2rem",
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
};

const resultHeaderStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.9rem",
};

const resultTitleStyle: CSSProperties = {
  fontSize: "1.6rem",
  fontWeight: 700,
};

const placeholderStyle: CSSProperties = {
  borderRadius: "16px",
  border: "1px dashed rgba(148, 163, 184, 0.35)",
  background: "rgba(15, 23, 42, 0.38)",
  padding: "2.2rem 1.5rem",
  textAlign: "center",
  fontSize: "0.95rem",
  opacity: 0.75,
  lineHeight: 1.6,
};

const cardLinkStyle: CSSProperties = {
  textDecoration: "none",
  color: "inherit",
  display: "block",
};

const cardFooterStyle: CSSProperties = {
  marginTop: "1.2rem",
  fontSize: "0.9rem",
  opacity: 0.75,
  display: "flex",
  alignItems: "center",
  gap: "0.35rem",
};

const PULL_COST = 100;

type FeedbackTone = "success" | "error";

type PullFeedback = {
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

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

const MONSTER_HINT_KEYS = [
  "monsterId",
  "monster_id",
  "monsterID",
  "dnaId",
  "tokenId",
  "name",
  "nickname",
  "species",
  "rarity",
  "level",
  "energy",
  "genes",
  "element",
  "type",
  "class",
];

const WALLET_HINT_KEYS = [
  "balance",
  "available",
  "amount",
  "coins",
  "currency",
  "unit",
  "symbol",
  "wallet",
  "walletAddress",
  "address",
  "total",
];

function looksLikeMonster(record: Record<string, unknown>): boolean {
  let hintCount = 0;

  for (const key of MONSTER_HINT_KEYS) {
    if (!(key in record)) {
      continue;
    }

    const value = record[key];
    if (key === "genes" && Array.isArray(value) && value.length === 0) {
      continue;
    }

    if (value != null) {
      hintCount += 1;
      if (hintCount >= 2) {
        break;
      }
    }
  }

  const hasId =
    record.id != null ||
    record.monsterId != null ||
    record.monster_id != null ||
    record.monsterID != null ||
    record.dnaId != null ||
    record.tokenId != null;

  const walletIndicatorCount = WALLET_HINT_KEYS.reduce((count, key) => {
    return count + (record[key] != null ? 1 : 0);
  }, 0);

  const informativeKeys = Object.keys(record).filter((key) => {
    return !WALLET_HINT_KEYS.includes(key);
  });

  if (hintCount >= 2) {
    return true;
  }

  if (hasId && hintCount >= 1) {
    return true;
  }

  if (hintCount === 0) {
    if (hasId && informativeKeys.length >= 2 && walletIndicatorCount <= 1) {
      return true;
    }

    return false;
  }

  if (hasId) {
    const genes = record.genes;
    if (Array.isArray(genes) && genes.length > 0) {
      return true;
    }
  }

  return false;
}

function pickFirstMonster(payload: unknown): MonsterRecord | null {
  const visited = new Set<unknown>();
  const fallbackBase = `gacha-${Date.now()}`;
  let counter = 0;

  const traverse = (value: unknown): MonsterRecord | null => {
    if (value == null) {
      return null;
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return null;
    }

    if (visited.has(value)) {
      return null;
    }

    if (Array.isArray(value)) {
      visited.add(value);
      for (const item of value) {
        const candidate = traverse(item);
        if (candidate) {
          return candidate;
        }
      }
      return null;
    }

    if (typeof value === "object") {
      visited.add(value);
      const record = value as Record<string, unknown>;

      const prioritizedKeys = [
        "monster",
        "creature",
        "reward",
        "result",
        "data",
        "item",
        "entity",
        "card",
        "prize",
        "summon",
      ];

      for (const key of prioritizedKeys) {
        if (key in record) {
          const candidate = traverse(record[key]);
          if (candidate) {
            return candidate;
          }
        }
      }

      if (looksLikeMonster(record)) {
        const normalized = normalizeMonster(record, `${fallbackBase}-${counter++}`);
        if (normalized) {
          return normalized;
        }
      }

      for (const nested of Object.values(record)) {
        const candidate = traverse(nested);
        if (candidate) {
          return candidate;
        }
      }
    }

    return null;
  };

  return traverse(payload);
}

export default function GachaPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isWalletLoading, setIsWalletLoading] = useState(true);
  const [pulling, setPulling] = useState(false);
  const [feedback, setFeedback] = useState<PullFeedback | null>(null);
  const [result, setResult] = useState<MonsterRecord | null>(null);
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

    setIsWalletLoading(true);
    setWalletError(null);

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
      setWalletError("无法获取钱包余额，请稍后重试。");
    } finally {
      if (mountedRef.current) {
        setIsWalletLoading(false);
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

  const handleRefresh = () => {
    if (!isWalletLoading) {
      void fetchWallet();
    }
  };

  const handleOpenDashboard = () => {
    router.push("/dashboard");
  };

  const coinBalance = getNumericBalance(wallet);
  const currencyLabel = wallet ? resolveCurrency(wallet) : null;
  const balanceLabel = wallet ? formatBalance(wallet) : "--";
  const coinUnitLabel = currencyLabel ?? "coins";
  const insufficientBalance = coinBalance != null && coinBalance < PULL_COST;

  const handlePull = useCallback(async () => {
    if (pulling) {
      return;
    }

    setFeedback(null);

    const currentBalance = getNumericBalance(wallet);
    if (currentBalance != null && currentBalance < PULL_COST) {
      setFeedback({ type: "error", message: "余额不足，无法抽卡。" });
      return;
    }

    setPulling(true);
    setResult(null);

    try {
      const response = await apiFetch("/gacha/pull", { method: "POST" });
      if (!response.ok) {
        const fallback = `抽卡失败（${response.status}）`;
        const message = await extractErrorMessage(response, fallback);
        throw new Error(message);
      }

      const payload = await response.json();
      if (!mountedRef.current) {
        return;
      }

      const monster = pickFirstMonster(payload);
      setResult(monster);

      if (monster) {
        const displayName =
          monster.name ?? monster.nickname ?? monster.species ?? `编号 ${monster.id}`;
        setFeedback({
          type: "success",
          message: `恭喜获得 ${displayName}！`,
        });
      } else {
        setFeedback({
          type: "success",
          message: "抽卡完成，但未获取到怪兽信息，请前往实验室查看。",
        });
      }

      void fetchWallet();
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }

      setFeedback({
        type: "error",
        message: resolveErrorMessage(err, "抽卡失败，请稍后重试。"),
      });
    } finally {
      if (mountedRef.current) {
        setPulling(false);
      }
    }
  }, [wallet, pulling, fetchWallet]);

  return (
    <main style={layoutStyle}>
      <section style={contentStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>DNA 扭蛋机</h1>
          <p style={descriptionStyle}>
            投入 {PULL_COST} coins，随机唤醒一只全新的 DNA 怪兽。祝你好运！
          </p>
        </header>

        <section style={walletSectionStyle}>
          <div style={walletCardStyle}>
            <div style={walletHeaderStyle}>
              <span style={walletTitleStyle}>当前余额</span>
              <span style={walletTitleStyle}>扭蛋消耗：{PULL_COST} coins</span>
            </div>
            <div style={walletBalanceStyle}>
              {balanceLabel}
              <span style={{ fontSize: "1.1rem", marginLeft: "0.65rem", opacity: 0.8 }}>
                {coinUnitLabel}
              </span>
            </div>
            {coinBalance != null ? (
              <div style={walletMetaStyle}>
                <span>可用 coins：{coinBalance.toLocaleString("zh-CN")}</span>
              </div>
            ) : null}
            {isWalletLoading ? (
              <p style={{ opacity: 0.7 }}>正在获取钱包余额…</p>
            ) : walletError ? (
              <div style={errorMessageStyle}>{walletError}</div>
            ) : insufficientBalance ? (
              <div style={errorMessageStyle}>
                当前余额不足，请前往控制台或开发态加币后再试。
              </div>
            ) : (
              <p style={helperTextStyle}>coins 会在抽卡后自动扣除，并实时同步到余额。</p>
            )}
          </div>
          <div style={walletActionsStyle}>
            <button
              type="button"
              style={{
                ...secondaryButtonStyle,
                opacity: isWalletLoading ? 0.65 : 1,
                cursor: isWalletLoading ? "wait" : secondaryButtonStyle.cursor,
              }}
              onClick={handleRefresh}
              disabled={isWalletLoading}
            >
              刷新余额
            </button>
            <button
              type="button"
              style={{
                ...secondaryButtonStyle,
                background: "rgba(236, 72, 153, 0.2)",
                color: "#fbcfe8",
                border: "1px solid rgba(244, 114, 182, 0.35)",
              }}
              onClick={handleOpenDashboard}
            >
              返回控制台
            </button>
          </div>
        </section>

        <section style={gachaPanelStyle}>
          <div style={orbContainerStyle}>
            <div className={`gacha-orb${pulling ? " spinning" : ""}`}>
              {pulling ? "抽卡中" : "READY"}
            </div>
            <p style={orbCaptionStyle}>
              {pulling
                ? "神秘能量正在聚集，请稍候…"
                : "点击按钮，消耗 100 coins 进行一次扭蛋抽取。"}
            </p>
          </div>
          <div style={gachaActionsStyle}>
            <button
              type="button"
              style={{
                ...pullButtonStyle,
                ...(pulling ? disabledPullStyle : {}),
              }}
              onClick={handlePull}
              disabled={pulling}
            >
              {pulling ? "抽卡进行中…" : "抽一次（100 coins）"}
            </button>
            <p style={helperTextStyle}>
              抽卡结果将展示在下方。抽到的怪兽会自动加入您的怪兽实验室，可随时查看详情。
            </p>
            {feedback ? (
              <div style={feedback.type === "success" ? successMessageStyle : errorMessageStyle}>
                {feedback.message}
              </div>
            ) : null}
          </div>
        </section>

        <section style={resultSectionStyle}>
          <div style={resultHeaderStyle}>
            <h2 style={resultTitleStyle}>抽卡结果</h2>
            <p style={helperTextStyle}>
              {result
                ? "点击下方卡片可进入怪兽详情页面。"
                : "暂未抽到新的怪兽，快去试试手气吧！"}
            </p>
          </div>

          {result ? (
            <Link
              href={`/lab/monster/${encodeURIComponent(String(result.id))}`}
              style={cardLinkStyle}
            >
              <MonsterCard
                monster={result}
                highlight
                footer={
                  <div style={cardFooterStyle}>
                    <span>点击查看详情</span>
                    <span aria-hidden>→</span>
                  </div>
                }
              />
            </Link>
          ) : (
            <div style={placeholderStyle}>
              抽卡后可在此查看最新获得的怪兽信息。
            </div>
          )}
        </section>
      </section>

      <style jsx>{`
        .gacha-orb {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(147, 197, 253, 0.95), rgba(37, 99, 235, 0.55) 60%, rgba(15, 23, 42, 0.95));
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e0f2fe;
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          box-shadow: 0 24px 55px rgba(59, 130, 246, 0.35);
          transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
        }

        .gacha-orb.spinning {
          animation: gachaPulse 1.2s ease-in-out infinite;
        }

        @keyframes gachaPulse {
          0%,
          100% {
            transform: scale(1);
            box-shadow: 0 24px 55px rgba(59, 130, 246, 0.35);
          }
          50% {
            transform: scale(1.08);
            box-shadow: 0 32px 70px rgba(147, 197, 253, 0.5);
          }
        }
      `}</style>
    </main>
  );
}
