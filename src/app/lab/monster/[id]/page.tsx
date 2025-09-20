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
import MonsterCard, { type StatChangeMap } from "@/components/MonsterCard";
import MonsterAvatar from "@/components/MonsterAvatar";
import ActionBar from "@/components/ActionBar";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  MonsterRecord,
  extractMonsterFromPayload,
  mergeMonsterRecords,
} from "@/lib/monsters";

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

const heroAvatarShellStyle: CSSProperties = {
  alignSelf: "center",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const heroAvatarRingStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1.4rem",
  borderRadius: "999px",
  background: "rgba(15, 23, 42, 0.6)",
  border: "1px solid rgba(148, 163, 184, 0.32)",
  boxShadow: "0 36px 75px rgba(15, 23, 42, 0.45)",
  overflow: "hidden",
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

type FeedbackTone = "info" | "success" | "error";

type ActionFeedback = {
  type: FeedbackTone;
  message: string;
};

const MIN_TRAIN_ENERGY = 10;
const TRAIN_ENERGY_COST = 10;
const TRAIN_EXP_GAIN = 20;
const FEED_ENERGY_GAIN = 25;

function parseNumericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function createUpdatedMonster(
  monster: MonsterRecord,
  updates: Partial<Pick<MonsterRecord, "energy" | "experience" | "level">>,
): MonsterRecord {
  return {
    ...monster,
    ...updates,
    raw: {
      ...monster.raw,
      ...updates,
    },
  };
}

function applyFeedPreview(monster: MonsterRecord): MonsterRecord {
  const energyValue = parseNumericValue(monster.energy);
  const nextEnergy = energyValue == null ? FEED_ENERGY_GAIN : energyValue + FEED_ENERGY_GAIN;
  return createUpdatedMonster(monster, { energy: nextEnergy });
}

function applyTrainPreview(monster: MonsterRecord): MonsterRecord {
  const energyValue = parseNumericValue(monster.energy);
  const experienceValue = parseNumericValue(monster.experience);
  const levelValue = parseNumericValue(monster.level);

  const updates: Partial<Pick<MonsterRecord, "energy" | "experience" | "level">> = {};

  if (energyValue != null) {
    updates.energy = Math.max(0, energyValue - TRAIN_ENERGY_COST);
  }

  if (experienceValue != null) {
    const nextExperience = experienceValue + TRAIN_EXP_GAIN;
    updates.experience = nextExperience;

    if (levelValue != null) {
      const levelThreshold = (levelValue + 1) * 100;
      if (experienceValue < levelThreshold && nextExperience >= levelThreshold) {
        updates.level = levelValue + 1;
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return monster;
  }

  return createUpdatedMonster(monster, updates);
}

async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const cloned = response.clone();
    const data = (await cloned.json()) as Record<string, unknown> | null;
    if (data && typeof data === "object") {
      const keys = ["message", "error", "detail", "msg"] as const;
      for (const key of keys) {
        const value = data[key];
        if (typeof value === "string" && value.trim().length > 0) {
          return value.trim();
        }
      }
    }
  } catch {
    // ignore parsing error
  }

  try {
    const text = await response.clone().text();
    const trimmed = text.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  } catch {
    // ignore text parsing error
  }

  return fallback;
}

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

type NumericStatKey = "atk" | "def" | "spd" | "hp";

const NUMERIC_STATS: NumericStatKey[] = ["atk", "def", "spd", "hp"];

function computeStatHighlights(
  previous: MonsterRecord | null,
  next: MonsterRecord | null,
): StatChangeMap | null {
  if (!previous || !next) {
    return null;
  }

  const highlights: StatChangeMap = {};
  let hasChange = false;

  for (const key of NUMERIC_STATS) {
    const previousValue = parseNumericValue(previous[key]);
    const nextValue = parseNumericValue(next[key]);

    if (previousValue == null && nextValue == null) {
      continue;
    }

    if (previousValue == null && nextValue != null) {
      highlights[key] = nextValue !== 0 ? { delta: nextValue, changed: true } : { changed: true };
      hasChange = true;
      continue;
    }

    if (previousValue != null && nextValue != null && nextValue !== previousValue) {
      highlights[key] = { delta: nextValue - previousValue, changed: true };
      hasChange = true;
    }
  }

  const previousRankNumber = parseNumericValue(previous.rank);
  const nextRankNumber = parseNumericValue(next.rank);

  if (previousRankNumber != null && nextRankNumber != null) {
    const delta = nextRankNumber - previousRankNumber;
    if (delta !== 0) {
      highlights.rank = { delta, changed: true };
      hasChange = true;
    }
  } else {
    const previousRankText = formatMaybeString(previous.rank);
    const nextRankText = formatMaybeString(next.rank);
    if (previousRankText !== nextRankText && (previousRankText || nextRankText)) {
      highlights.rank = { changed: true };
      hasChange = true;
    }
  }

  return hasChange ? highlights : null;
}

export default function MonsterDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const monsterId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [monster, setMonster] = useState<MonsterRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFeeding, setIsFeeding] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const [statHighlights, setStatHighlights] = useState<StatChangeMap | null>(null);
  const mountedRef = useRef(false);
  const statHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (statHighlightTimeoutRef.current) {
        clearTimeout(statHighlightTimeoutRef.current);
        statHighlightTimeoutRef.current = null;
      }
    };
  }, []);

  const clearStatHighlights = useCallback(() => {
    if (statHighlightTimeoutRef.current) {
      clearTimeout(statHighlightTimeoutRef.current);
      statHighlightTimeoutRef.current = null;
    }
    setStatHighlights(null);
  }, []);

  const triggerStatHighlights = useCallback(
    (previous: MonsterRecord | null, next: MonsterRecord | null) => {
      const highlights = computeStatHighlights(previous, next);
      if (!highlights) {
        return;
      }

      if (statHighlightTimeoutRef.current) {
        clearTimeout(statHighlightTimeoutRef.current);
      }

      setStatHighlights(highlights);
      statHighlightTimeoutRef.current = setTimeout(() => {
        setStatHighlights(null);
        statHighlightTimeoutRef.current = null;
      }, 2400);
    },
    [],
  );

  const fetchMonster = useCallback(async () => {
    if (!mountedRef.current) {
      return;
    }

    if (!monsterId) {
      clearStatHighlights();
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
          clearStatHighlights();
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

      const normalized = extractMonsterFromPayload(payload, String(monsterId));
      if (!normalized) {
        throw new Error("Unexpected monster payload");
      }

      clearStatHighlights();
      setMonster(normalized);
    } catch (err) {
      console.error("Failed to fetch monster detail", err);
      if (!mountedRef.current) {
        return;
      }

      clearStatHighlights();
      setMonster(null);
      setError("无法加载怪兽详情，请稍后重试。");
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [monsterId, clearStatHighlights]);

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
  const energyValue = monster ? parseNumericValue(monster.energy) : null;
  const trainHelperText =
    energyValue != null && energyValue < MIN_TRAIN_ENERGY
      ? `训练需要至少 ${MIN_TRAIN_ENERGY} 点能量，请先喂食补充能量。`
      : null;

  const feedDisabled = !monster || isLoading || isFeeding || isTraining;
  const trainDisabled =
    !monster ||
    isLoading ||
    isTraining ||
    isFeeding ||
    (energyValue != null && energyValue < MIN_TRAIN_ENERGY);

  const handleFeed = useCallback(async () => {
    if (!monster || isFeeding || isTraining) {
      return;
    }

    if (!monsterId) {
      setActionFeedback({ type: "error", message: "无法识别怪兽编号。" });
      return;
    }

    const snapshot = monster;
    const optimistic = applyFeedPreview(monster);
    clearStatHighlights();
    setMonster(optimistic);
    setIsFeeding(true);
    setActionFeedback({ type: "info", message: "正在喂食，能量即将恢复…" });

    try {
      const response = await apiFetch(`/monsters/${encodeURIComponent(monsterId)}/feed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ item: "basic-food" }),
      });

      if (!response.ok) {
        const message = await extractErrorMessage(response, "喂食失败，请稍后再试。");
        if (mountedRef.current) {
          setMonster(snapshot);
          clearStatHighlights();
          setActionFeedback({ type: "error", message });
          setIsFeeding(false);
        }
        return;
      }

      let updatedMonster: MonsterRecord | null = null;
      if (response.status !== 204) {
        const payload = await response.json();
        updatedMonster = extractMonsterFromPayload(payload, String(monsterId));
      }

      if (!mountedRef.current) {
        return;
      }

      if (updatedMonster) {
        const merged = mergeMonsterRecords(snapshot, updatedMonster) ?? updatedMonster;
        setMonster(merged);
        triggerStatHighlights(snapshot, merged);
      } else {
        clearStatHighlights();
        void fetchMonster();
      }

      setActionFeedback({ type: "success", message: "喂食成功，能量已恢复。" });
    } catch (err) {
      console.error("Failed to feed monster", err);
      if (mountedRef.current) {
        setMonster(snapshot);
        clearStatHighlights();
        setActionFeedback({
          type: "error",
          message:
            err instanceof Error && err.message
              ? err.message
              : "喂食失败，请稍后再试。",
        });
      }
    } finally {
      if (mountedRef.current) {
        setIsFeeding(false);
      }
    }
  }, [
    monster,
    isFeeding,
    isTraining,
    monsterId,
    fetchMonster,
    clearStatHighlights,
    triggerStatHighlights,
  ]);

  const handleTrain = useCallback(async () => {
    if (!monster || isTraining || isFeeding) {
      return;
    }

    if (!monsterId) {
      setActionFeedback({ type: "error", message: "无法识别怪兽编号。" });
      return;
    }

    const currentEnergy = parseNumericValue(monster.energy);
    if (currentEnergy != null && currentEnergy < MIN_TRAIN_ENERGY) {
      setActionFeedback({
        type: "error",
        message: `能量不足，至少需要 ${MIN_TRAIN_ENERGY} 点能量才能训练。`,
      });
      return;
    }

    const snapshot = monster;
    const optimistic = applyTrainPreview(monster);
    clearStatHighlights();
    setMonster(optimistic);
    setIsTraining(true);
    setActionFeedback({ type: "info", message: "正在训练怪兽…" });

    try {
      const response = await apiFetch(`/monsters/${encodeURIComponent(monsterId)}/train`, {
        method: "POST",
      });

      if (!response.ok) {
        const message = await extractErrorMessage(response, "训练失败，请稍后再试。");
        if (mountedRef.current) {
          setMonster(snapshot);
          clearStatHighlights();
          setActionFeedback({ type: "error", message });
          setIsTraining(false);
        }
        return;
      }

      let updatedMonster: MonsterRecord | null = null;
      if (response.status !== 204) {
        const payload = await response.json();
        updatedMonster = extractMonsterFromPayload(payload, String(monsterId));
      }

      if (!mountedRef.current) {
        return;
      }

      if (updatedMonster) {
        const merged = mergeMonsterRecords(snapshot, updatedMonster) ?? updatedMonster;
        setMonster(merged);
        triggerStatHighlights(snapshot, merged);
      } else {
        clearStatHighlights();
        void fetchMonster();
      }

      setActionFeedback({ type: "success", message: "训练完成！怪兽的能力有所提升。" });
    } catch (err) {
      console.error("Failed to train monster", err);
      if (mountedRef.current) {
        setMonster(snapshot);
        clearStatHighlights();
        setActionFeedback({
          type: "error",
          message:
            err instanceof Error && err.message
              ? err.message
              : "训练失败，请稍后再试。",
        });
      }
    } finally {
      if (mountedRef.current) {
        setIsTraining(false);
      }
    }
  }, [
    monster,
    isTraining,
    isFeeding,
    monsterId,
    fetchMonster,
    clearStatHighlights,
    triggerStatHighlights,
  ]);

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
            {monsterId ? (
              <div style={heroAvatarShellStyle}>
                <div style={heroAvatarRingStyle}>
                  <MonsterAvatar id={monsterId} size={160} />
                </div>
              </div>
            ) : null}
            <MonsterCard
              monster={monster}
              highlight
              statHighlights={statHighlights ?? undefined}
              footer={
                <ActionBar
                  onFeed={handleFeed}
                  onTrain={handleTrain}
                  isFeeding={isFeeding}
                  isTraining={isTraining}
                  feedDisabled={feedDisabled}
                  trainDisabled={trainDisabled}
                  helperText={trainHelperText}
                  feedback={actionFeedback}
                />
              }
            />

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
