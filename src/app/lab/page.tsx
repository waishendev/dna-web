"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MonsterCard from "@/components/MonsterCard";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { MonsterRecord, parseMonsterList } from "@/lib/monsters";

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
  borderRadius: "22px",
  padding: "3rem",
  background: "rgba(15, 23, 42, 0.62)",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  boxShadow: "0 32px 70px rgba(15, 23, 42, 0.35)",
  backdropFilter: "blur(16px)",
  display: "flex",
  flexDirection: "column",
  gap: "2rem",
};

const headerStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1.25rem",
};

const headingStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
};

const titleStyle: CSSProperties = {
  fontSize: "2.2rem",
  fontWeight: 700,
};

const descriptionStyle: CSSProperties = {
  opacity: 0.78,
  fontSize: "1rem",
  lineHeight: 1.6,
  maxWidth: "640px",
};

const refreshButtonStyle: CSSProperties = {
  padding: "0.85rem 1.4rem",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  background: "rgba(59, 130, 246, 0.15)",
  color: "#bfdbfe",
  fontWeight: 600,
  fontSize: "0.95rem",
  cursor: "pointer",
  transition: "opacity 0.2s ease, transform 0.2s ease",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "1.75rem",
};

const loadingStyle: CSSProperties = {
  fontSize: "0.95rem",
  opacity: 0.75,
};

const messageBoxStyle: CSSProperties = {
  padding: "1rem 1.25rem",
  borderRadius: "12px",
  fontSize: "0.95rem",
  lineHeight: 1.6,
};

const successMessageStyle: CSSProperties = {
  ...messageBoxStyle,
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(134, 239, 172, 0.35)",
  color: "#bbf7d0",
};

const errorMessageStyle: CSSProperties = {
  ...messageBoxStyle,
  background: "rgba(239, 68, 68, 0.12)",
  border: "1px solid rgba(248, 113, 113, 0.4)",
  color: "#fecaca",
};

const emptyStateStyle: CSSProperties = {
  borderRadius: "18px",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  background: "rgba(15, 23, 42, 0.45)",
  padding: "3rem 1.5rem",
  display: "flex",
  flexDirection: "column",
  gap: "1.25rem",
  alignItems: "center",
  textAlign: "center",
};

const emptyTitleStyle: CSSProperties = {
  fontSize: "1.35rem",
  fontWeight: 600,
};

const emptyDescriptionStyle: CSSProperties = {
  fontSize: "0.95rem",
  opacity: 0.75,
  maxWidth: "420px",
};

const claimButtonStyle: CSSProperties = {
  padding: "0.9rem 1.6rem",
  borderRadius: "12px",
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 600,
  fontSize: "1rem",
  cursor: "pointer",
  transition: "opacity 0.2s ease, transform 0.2s ease",
};

const cardLinkStyle: CSSProperties = {
  textDecoration: "none",
  color: "inherit",
  display: "block",
  height: "100%",
};

const cardFooterStyle: CSSProperties = {
  fontSize: "0.9rem",
  opacity: 0.7,
  display: "flex",
  alignItems: "center",
  gap: "0.35rem",
};

type FetchOptions = {
  preserveSuccess?: boolean;
};

export default function LabPage() {
  const router = useRouter();
  const [monsters, setMonsters] = useState<MonsterRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchMonsters = useCallback(
    async (options?: FetchOptions) => {
      if (!mountedRef.current) {
        return;
      }

      setIsLoading(true);
      setError(null);
      if (!options?.preserveSuccess) {
        setSuccessMessage(null);
      }

      try {
        const response = await apiFetch("/monsters/my", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        let payload: unknown = [];
        if (response.status !== 204) {
          payload = await response.json();
        }

        if (!mountedRef.current) {
          return;
        }

        const list = parseMonsterList(payload);
        setMonsters(list);
      } catch (err) {
        console.error("Failed to fetch monsters", err);
        if (!mountedRef.current) {
          return;
        }

        setError("无法获取怪兽列表，请稍后重试。");
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/");
      return;
    }

    void fetchMonsters();
  }, [router, fetchMonsters]);

  const handleClaimStarter = useCallback(async () => {
    if (isClaiming) {
      return;
    }

    setIsClaiming(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await apiFetch("/monsters/claim-starter", { method: "POST" });
      if (!response.ok) {
        throw new Error(`Claim failed with status ${response.status}`);
      }

      await fetchMonsters({ preserveSuccess: true });
      if (mountedRef.current) {
        setSuccessMessage("领取成功！新的怪兽已加入队伍。");
      }
    } catch (err) {
      console.error("Failed to claim starter monster", err);
      if (mountedRef.current) {
        setError("领取初始怪失败，请稍后再试。");
      }
    } finally {
      if (mountedRef.current) {
        setIsClaiming(false);
      }
    }
  }, [fetchMonsters, isClaiming]);

  const hasMonsters = monsters.length > 0;

  return (
    <main style={layoutStyle}>
      <section style={contentStyle}>
        <header style={headerStyle}>
          <div style={headingStyle}>
            <h1 style={titleStyle}>怪兽实验室</h1>
            <p style={descriptionStyle}>
              管理你的怪兽队伍，查看它们的稀有度、等级与基因特征。点击任意怪兽卡片即可查看详细信息。
            </p>
          </div>
          <button
            type="button"
            style={{
              ...refreshButtonStyle,
              opacity: isLoading || isClaiming ? 0.65 : 1,
              cursor: isLoading || isClaiming ? "wait" : "pointer",
            }}
            onClick={() => {
              if (!isLoading && !isClaiming) {
                void fetchMonsters();
              }
            }}
            disabled={isLoading || isClaiming}
          >
            刷新列表
          </button>
        </header>

        {successMessage ? <div style={successMessageStyle}>{successMessage}</div> : null}
        {error ? <div style={errorMessageStyle}>{error}</div> : null}
        {isLoading && !hasMonsters ? <p style={loadingStyle}>正在加载怪兽数据…</p> : null}
        {isLoading && hasMonsters ? <p style={loadingStyle}>正在刷新怪兽列表…</p> : null}

        {hasMonsters ? (
          <div style={gridStyle}>
            {monsters.map((monster) => {
              const monsterId = encodeURIComponent(String(monster.id));
              return (
                <Link key={monsterId} href={`/lab/monster/${monsterId}`} style={cardLinkStyle}>
                  <MonsterCard
                    monster={monster}
                    footer={<div style={cardFooterStyle}>查看详情 →</div>}
                  />
                </Link>
              );
            })}
          </div>
        ) : null}

        {!isLoading && !hasMonsters ? (
          <div style={emptyStateStyle}>
            <h2 style={emptyTitleStyle}>你的实验室还没有怪兽</h2>
            <p style={emptyDescriptionStyle}>
              领取你的第一只怪兽，开启探索 DNA 宇宙的旅程。初始怪会自动添加到你的队伍中。
            </p>
            <button
              type="button"
              style={{
                ...claimButtonStyle,
                opacity: isClaiming ? 0.7 : 1,
                cursor: isClaiming ? "wait" : "pointer",
              }}
              onClick={() => {
                if (!isClaiming) {
                  void handleClaimStarter();
                }
              }}
              disabled={isClaiming}
            >
              {isClaiming ? "领取中…" : "领取初始怪"}
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
