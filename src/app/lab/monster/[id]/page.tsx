"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import MonsterCard from "@/components/MonsterCard";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { MonsterRecord, normalizeMonster } from "@/lib/monsters";

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
  maxWidth: "980px",
  borderRadius: "24px",
  padding: "3rem",
  background: "rgba(15, 23, 42, 0.62)",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  boxShadow: "0 32px 70px rgba(15, 23, 42, 0.35)",
  backdropFilter: "blur(18px)",
  display: "flex",
  flexDirection: "column",
  gap: "2.25rem",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1rem",
};

const backLinkStyle: CSSProperties = {
  color: "#93c5fd",
  textDecoration: "none",
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
};

const refreshButtonStyle: CSSProperties = {
  padding: "0.8rem 1.35rem",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  background: "rgba(59, 130, 246, 0.18)",
  color: "#bfdbfe",
  fontWeight: 600,
  fontSize: "0.95rem",
  cursor: "pointer",
  transition: "opacity 0.2s ease, transform 0.2s ease",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "0.92rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  opacity: 0.72,
};

const loadingStyle: CSSProperties = {
  fontSize: "0.95rem",
  opacity: 0.75,
};

const errorStyle: CSSProperties = {
  padding: "1rem 1.25rem",
  borderRadius: "12px",
  background: "rgba(239, 68, 68, 0.12)",
  border: "1px solid rgba(248, 113, 113, 0.42)",
  color: "#fecaca",
  fontSize: "0.95rem",
  lineHeight: 1.6,
};

const descriptionBoxStyle: CSSProperties = {
  borderRadius: "18px",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  background: "rgba(15, 23, 42, 0.45)",
  padding: "1.5rem",
  fontSize: "0.98rem",
  lineHeight: 1.7,
  opacity: 0.88,
};

const metadataGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1.15rem",
};

const metadataItemStyle: CSSProperties = {
  borderRadius: "16px",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  background: "rgba(15, 23, 42, 0.45)",
  padding: "1.1rem 1.25rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",
};

const metadataLabelStyle: CSSProperties = {
  fontSize: "0.78rem",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  opacity: 0.65,
};

const metadataValueStyle: CSSProperties = {
  fontSize: "1.08rem",
  fontWeight: 600,
  lineHeight: 1.4,
};

type DetailRow = {
  label: string;
  value: string;
};

function formatMaybeString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function formatNumber(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
}

function formatLevel(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `Lv. ${value}`;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }
    return trimmed.startsWith("Lv.") ? trimmed : `Lv. ${trimmed}`;
  }

  return null;
}

function buildDetailRows(monster: MonsterRecord): DetailRow[] {
  const rows: DetailRow[] = [];

  const pushRow = (label: string, value: string | null) => {
    if (value) {
      rows.push({ label, value });
    }
  };

  pushRow("编号", `#${String(monster.id)}`);
  pushRow("名称", formatMaybeString(monster.name ?? monster.nickname));
  pushRow("物种", formatMaybeString(monster.species));
  pushRow("稀有度", formatMaybeString(monster.rarity));
  pushRow("等级", formatLevel(monster.level));
  pushRow("能量", formatNumber(monster.energy));
  pushRow("经验", formatNumber(monster.experience));
  pushRow("世代", formatNumber(monster.generation));
  pushRow("状态", formatMaybeString(monster.status));
  pushRow("拥有者", formatMaybeString(monster.owner));
  pushRow("创建时间", formatMaybeString(monster.createdAt));
  pushRow("更新时间", formatMaybeString(monster.updatedAt));

  return rows;
}

export default function MonsterDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const monsterId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [monster, setMonster] = useState<MonsterRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchMonster = useCallback(async () => {
    if (!mountedRef.current) {
      return;
    }

    if (!monsterId) {
      setMonster(null);
      setError("无法识别怪兽编号。");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/monsters/${encodeURIComponent(monsterId)}`, {
        cache: "no-store",
      });

      if (response.status === 404) {
        if (mountedRef.current) {
          setMonster(null);
          setError("未找到对应的怪兽。");
        }
        return;
      }

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      let payload: unknown = null;
      if (response.status !== 204) {
        payload = await response.json();
      }

      if (!mountedRef.current) {
        return;
      }

      const normalized = normalizeMonster(payload, String(monsterId));
      if (!normalized) {
        throw new Error("Unexpected monster payload");
      }

      setMonster(normalized);
    } catch (err) {
      console.error("Failed to fetch monster detail", err);
      if (!mountedRef.current) {
        return;
      }

      setMonster(null);
      setError("无法加载怪兽详情，请稍后重试。");
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [monsterId]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/");
      return;
    }

    void fetchMonster();
  }, [router, fetchMonster]);

  const detailRows = monster ? buildDetailRows(monster) : [];
  const descriptionText = monster ? formatMaybeString(monster.description) : null;

  return (
    <main style={layoutStyle}>
      <section style={contentStyle}>
        <div style={actionRowStyle}>
          <Link href="/lab" style={backLinkStyle}>
            <span aria-hidden="true">←</span>
            返回怪兽实验室
          </Link>
          <button
            type="button"
            style={{
              ...refreshButtonStyle,
              opacity: isLoading ? 0.65 : 1,
              cursor: isLoading ? "wait" : "pointer",
            }}
            onClick={() => {
              if (!isLoading) {
                void fetchMonster();
              }
            }}
            disabled={isLoading}
          >
            刷新详情
          </button>
        </div>

        {error ? <div style={errorStyle}>{error}</div> : null}
        {isLoading ? <p style={loadingStyle}>正在加载怪兽详情…</p> : null}

        {monster ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <MonsterCard monster={monster} highlight />

            {descriptionText ? (
              <section style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <h2 style={sectionTitleStyle}>怪兽描述</h2>
                <div style={descriptionBoxStyle}>{descriptionText}</div>
              </section>
            ) : null}

            {detailRows.length > 0 ? (
              <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h2 style={sectionTitleStyle}>基础信息</h2>
                <div style={metadataGridStyle}>
                  {detailRows.map((row) => (
                    <div key={row.label} style={metadataItemStyle}>
                      <span style={metadataLabelStyle}>{row.label}</span>
                      <span style={metadataValueStyle}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        {!monster && !isLoading && !error ? (
          <p style={loadingStyle}>未能找到怪兽数据。</p>
        ) : null}
      </section>
    </main>
  );
}
