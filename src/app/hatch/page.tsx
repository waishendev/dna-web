"use client";

import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import MonsterCard from "@/components/MonsterCard";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { EggRecord, parseEggList } from "@/lib/eggs";
import { MonsterRecord, normalizeMonster, parseMonsterList } from "@/lib/monsters";

type FeedbackTone = "info" | "success" | "error";
type Feedback = { type: FeedbackTone; message: string };
type EggAction = "start" | "complete";

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
  maxWidth: "1120px",
  borderRadius: "24px",
  padding: "3rem",
  background: "rgba(15, 23, 42, 0.62)",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  boxShadow: "0 32px 70px rgba(15, 23, 42, 0.35)",
  display: "flex",
  flexDirection: "column",
  gap: "2.4rem",
};

const headerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const titleRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1.25rem",
  flexWrap: "wrap",
};

const titleStyle: CSSProperties = {
  fontSize: "2.35rem",
  fontWeight: 700,
};

const descriptionStyle: CSSProperties = {
  fontSize: "1rem",
  opacity: 0.78,
  lineHeight: 1.7,
  maxWidth: "720px",
};

const refreshButtonStyle: CSSProperties = {
  padding: "0.85rem 1.4rem",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  background: "rgba(59, 130, 246, 0.16)",
  color: "#bfdbfe",
  fontWeight: 600,
  fontSize: "0.95rem",
  cursor: "pointer",
  transition: "opacity 0.2s ease, transform 0.2s ease",
};

const eggsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "1.6rem",
};

const eggCardStyle: CSSProperties = {
  borderRadius: "18px",
  border: "1px solid rgba(148, 163, 184, 0.26)",
  background: "rgba(15, 23, 42, 0.6)",
  padding: "1.9rem",
  boxShadow: "0 24px 50px rgba(15, 23, 42, 0.28)",
  display: "flex",
  flexDirection: "column",
  gap: "1.2rem",
};

const eggImageContainerStyle: CSSProperties = {
  alignSelf: "center",
  width: "110px",
  height: "110px",
  borderRadius: "999px",
  background: "rgba(59, 130, 246, 0.16)",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  boxShadow: "0 18px 36px rgba(15, 23, 42, 0.32)",
  position: "relative",
};

const eggImageStyle: CSSProperties = {
  objectFit: "cover",
};

const eggPlaceholderStyle: CSSProperties = {
  fontSize: "2.2rem",
  opacity: 0.7,
};

const eggHeaderStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const eggTitleRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  flexWrap: "wrap",
};

const eggTitleStyle: CSSProperties = {
  fontSize: "1.4rem",
  fontWeight: 700,
};

const eggStatusBadgeStyle: CSSProperties = {
  padding: "0.35rem 0.7rem",
  borderRadius: "999px",
  background: "rgba(148, 163, 184, 0.18)",
  color: "#e2e8f0",
  fontSize: "0.78rem",
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const eggMetaStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.6rem",
  fontSize: "0.88rem",
  opacity: 0.75,
};

const eggDescriptionStyle: CSSProperties = {
  fontSize: "0.95rem",
  lineHeight: 1.7,
  opacity: 0.78,
};

const progressSectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.45rem",
};

const progressLabelRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: "0.85rem",
  fontWeight: 600,
  opacity: 0.78,
};

const progressValueStyle: CSSProperties = {
  fontSize: "0.88rem",
  fontWeight: 700,
  color: "#facc15",
};

const progressBarContainerStyle: CSSProperties = {
  height: "8px",
  borderRadius: "999px",
  background: "rgba(148, 163, 184, 0.2)",
  overflow: "hidden",
};

const progressBarFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, rgba(96, 165, 250, 0.85), rgba(59, 130, 246, 0.9))",
};

const eggInfoListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
  fontSize: "0.88rem",
  opacity: 0.75,
};

const cardFooterStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.9rem",
};

const actionButtonStyle: CSSProperties = {
  padding: "0.95rem 1.45rem",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.32), rgba(37, 99, 235, 0.45))",
  color: "#eff6ff",
  fontWeight: 700,
  fontSize: "1rem",
  cursor: "pointer",
  transition: "transform 0.18s ease, opacity 0.18s ease",
};

const secondaryActionStyle: CSSProperties = {
  padding: "0.8rem 1.3rem",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.32)",
  background: "transparent",
  color: "#dbeafe",
  fontWeight: 600,
  fontSize: "0.95rem",
  cursor: "pointer",
  alignSelf: "flex-start",
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.6,
  cursor: "not-allowed",
};

const statusMessageStyle: CSSProperties = {
  fontSize: "0.9rem",
  opacity: 0.78,
};

const feedbackBoxBaseStyle: CSSProperties = {
  borderRadius: "14px",
  padding: "0.9rem 1.1rem",
  border: "1px solid transparent",
  fontSize: "0.95rem",
  lineHeight: 1.6,
};

const feedbackToneStyles: Record<FeedbackTone, CSSProperties> = {
  info: {
    color: "#cbd5f5",
    background: "rgba(59, 130, 246, 0.14)",
    borderColor: "rgba(59, 130, 246, 0.28)",
  },
  success: {
    color: "#bbf7d0",
    background: "rgba(22, 163, 74, 0.18)",
    borderColor: "rgba(34, 197, 94, 0.32)",
  },
  error: {
    color: "#fecaca",
    background: "rgba(239, 68, 68, 0.16)",
    borderColor: "rgba(248, 113, 113, 0.38)",
  },
};

const emptyStateStyle: CSSProperties = {
  borderRadius: "18px",
  border: "1px dashed rgba(148, 163, 184, 0.32)",
  background: "rgba(15, 23, 42, 0.45)",
  padding: "2.4rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  alignItems: "center",
  textAlign: "center",
};

const emptyTitleStyle: CSSProperties = {
  fontSize: "1.45rem",
  fontWeight: 700,
};

const emptyDescriptionStyle: CSSProperties = {
  fontSize: "0.95rem",
  opacity: 0.78,
  maxWidth: "520px",
  lineHeight: 1.7,
};

const emptyActionRowStyle: CSSProperties = {
  display: "flex",
  gap: "0.8rem",
  flexWrap: "wrap",
  justifyContent: "center",
};

const emptyLinkStyle: CSSProperties = {
  padding: "0.85rem 1.35rem",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.32)",
  color: "#bfdbfe",
  fontWeight: 600,
  fontSize: "0.95rem",
  textDecoration: "none",
};

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.75)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1.5rem",
  zIndex: 1000,
};

const modalContentStyle: CSSProperties = {
  width: "100%",
  maxWidth: "720px",
  borderRadius: "24px",
  background: "rgba(15, 23, 42, 0.92)",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  boxShadow: "0 40px 80px rgba(15, 23, 42, 0.45)",
  padding: "2.4rem",
  display: "flex",
  flexDirection: "column",
  gap: "1.6rem",
};

const modalHeaderStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.7rem",
};

const modalTitleStyle: CSSProperties = {
  fontSize: "1.9rem",
  fontWeight: 700,
};

const modalDescriptionStyle: CSSProperties = {
  fontSize: "1rem",
  opacity: 0.8,
  lineHeight: 1.7,
};

const modalActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.9rem",
  justifyContent: "flex-end",
};

const modalPrimaryButtonStyle: CSSProperties = {
  padding: "0.9rem 1.4rem",
  borderRadius: "12px",
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 600,
  fontSize: "0.98rem",
  cursor: "pointer",
};

const modalSecondaryButtonStyle: CSSProperties = {
  padding: "0.85rem 1.3rem",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  background: "transparent",
  color: "#e2e8f0",
  fontWeight: 600,
  fontSize: "0.95rem",
  cursor: "pointer",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
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
    // ignore json parse errors
  }

  try {
    const text = await response.clone().text();
    const trimmed = text.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  } catch {
    // ignore text parse errors
  }

  return fallback;
}

async function parseResponseJson(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  try {
    return await response.clone().json();
  } catch {
    try {
      const text = await response.clone().text();
      const trimmed = text.trim();
      if (!trimmed) {
        return null;
      }
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
}

function extractMonsterFromPayload(payload: unknown, fallbackId: string): MonsterRecord | null {
  const list = parseMonsterList(payload);
  if (list.length > 0) {
    return list[0] ?? null;
  }

  if (isRecord(payload)) {
    const candidateKeys = ["monster", "data", "result", "child", "offspring", "pet", "record", "reward"];
    for (const key of candidateKeys) {
      const value = payload[key];
      if (value == null) {
        continue;
      }

      const nested = extractMonsterFromPayload(value, `${fallbackId}-${key}`);
      if (nested) {
        return nested;
      }
    }

    const normalized = normalizeMonster(payload, fallbackId);
    if (normalized) {
      return normalized;
    }
  }

  return normalizeMonster(payload, fallbackId);
}

type ActionCandidate = {
  url: string;
  init?: RequestInit;
  allowRetryOn400?: boolean;
};

function buildActionCandidates(egg: EggRecord, action: EggAction): ActionCandidate[] {
  const urls = action === "start" ? egg.actionUrls.start : egg.actionUrls.complete;
  const normalizedUrls = Array.from(
    new Set(
      urls
        .map((url) => (typeof url === "string" ? url.trim() : ""))
        .filter((url) => url.length > 0),
    ),
  );

  const candidates: ActionCandidate[] = normalizedUrls.map((url) => ({ url }));

  const idString = String(egg.id);
  const encodedId = encodeURIComponent(idString);

  const fallbackStartPaths = [
    `/eggs/${encodedId}/start`,
    `/eggs/${encodedId}/start-hatch`,
    `/eggs/${encodedId}/hatch/start`,
    `/eggs/${encodedId}/begin`,
    `/eggs/${encodedId}/incubate`,
  ];
  const fallbackCompletePaths = [
    `/eggs/${encodedId}/complete`,
    `/eggs/${encodedId}/complete-hatch`,
    `/eggs/${encodedId}/hatch/complete`,
    `/eggs/${encodedId}/finish`,
    `/eggs/${encodedId}/claim`,
    `/eggs/${encodedId}/open`,
    `/eggs/${encodedId}/reveal`,
    `/eggs/${encodedId}/collect`,
  ];

  const fallbackPaths = action === "start" ? fallbackStartPaths : fallbackCompletePaths;
  for (const path of fallbackPaths) {
    if (!normalizedUrls.includes(path)) {
      candidates.push({ url: path });
    }
  }

  const hatchPath = `/eggs/${encodedId}/hatch`;
  const bodyCandidates: ActionCandidate[] = [];

  if (!normalizedUrls.includes(hatchPath)) {
    bodyCandidates.push({ url: hatchPath, allowRetryOn400: true });

    const actions = action === "start" ? ["start"] : ["complete", "finish", "claim"];
    for (const actionName of actions) {
      bodyCandidates.push({
        url: hatchPath,
        init: {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: actionName }),
        },
      });
    }
  }

  const allCandidates = [...candidates, ...bodyCandidates];
  const seen = new Set<string>();
  const deduped: ActionCandidate[] = [];

  for (const candidate of allCandidates) {
    const methodKey = candidate.init?.method ?? "POST";
    const bodyKey = typeof candidate.init?.body === "string" ? candidate.init.body : "";
    const key = `${methodKey}::${candidate.url}::${bodyKey}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(candidate);
  }

  return deduped;
}

async function performEggAction(egg: EggRecord, action: EggAction): Promise<Response> {
  const fallbackMessage = action === "start" ? "无法开始孵化，请稍后再试。" : "无法完成孵化，请稍后再试。";
  const candidates = buildActionCandidates(egg, action);
  let lastError: string | null = null;

  for (const candidate of candidates) {
    try {
      const response = await apiFetch(candidate.url, {
        method: candidate.init?.method ?? "POST",
        headers: candidate.init?.headers,
        body: candidate.init?.body,
      });

      if (response.ok) {
        return response;
      }

      const message = await extractErrorMessage(response, fallbackMessage);
      lastError = message;

      if (
        response.status === 404 ||
        response.status === 405 ||
        (response.status === 400 && candidate.allowRetryOn400)
      ) {
        continue;
      }

      throw new Error(message);
    } catch (err) {
      if (err instanceof Error) {
        lastError = err.message;
      } else {
        lastError = String(err);
      }
      break;
    }
  }

  throw new Error(lastError ?? fallbackMessage);
}

function resolveEggStatusLabel(egg: EggRecord): string {
  if (egg.status) {
    return egg.status;
  }

  if (egg.canComplete) {
    return "可完成";
  }

  if (egg.isCompleted) {
    return "已孵化";
  }

  if (egg.hasStarted) {
    return "孵化中";
  }

  return "待孵化";
}

function resolvePrimaryAction(egg: EggRecord): { type: EggAction; label: string } | null {
  if (egg.canComplete) {
    return { type: "complete", label: "完成孵化" };
  }

  if (egg.canStart) {
    return { type: "start", label: "开始孵化" };
  }

  return null;
}

function formatProgressLabel(egg: EggRecord): string | null {
  if (egg.progressLabel) {
    return egg.progressLabel;
  }

  if (typeof egg.progress === "number") {
    return `${Math.round(egg.progress * 100)}%`;
  }

  return null;
}

export default function HatchPage() {
  const router = useRouter();
  const mountedRef = useRef(false);
  const [eggs, setEggs] = useState<EggRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [actionState, setActionState] = useState<{ eggId: string; action: EggAction } | null>(null);
  const [resultMonster, setResultMonster] = useState<MonsterRecord | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchEggs = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const response = await apiFetch("/eggs", { cache: "no-store" });

      if (!response.ok) {
        const message = await extractErrorMessage(response, "无法加载蛋的列表，请稍后再试。");
        throw new Error(message);
      }

      const payload = await parseResponseJson(response);
      if (!mountedRef.current) {
        return;
      }

      const list = parseEggList(payload);
      setEggs(list);
    } catch (err) {
      console.error("Failed to fetch eggs", err);
      if (!mountedRef.current) {
        return;
      }

      setEggs([]);
      setFetchError(err instanceof Error ? err.message : "无法加载蛋的列表，请稍后再试。");
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

    void fetchEggs();
  }, [router, fetchEggs]);

  const orderedEggs = useMemo(() => {
    return [...eggs].sort((a, b) => {
      const score = (egg: EggRecord) => {
        if (egg.canComplete) {
          return 0;
        }
        if (egg.canStart) {
          return 1;
        }
        if (egg.hasStarted && !egg.isCompleted) {
          return 2;
        }
        if (egg.isCompleted) {
          return 3;
        }
        return 4;
      };

      const scoreDiff = score(a) - score(b);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return String(a.id).localeCompare(String(b.id));
    });
  }, [eggs]);

  const handleRefresh = useCallback(() => {
    void fetchEggs();
  }, [fetchEggs]);

  const handleStart = useCallback(
    async (egg: EggRecord) => {
      if (actionState) {
        return;
      }

      const eggId = String(egg.id);
      setFeedback(null);
      setActionState({ eggId, action: "start" });

      try {
        await performEggAction(egg, "start");
        if (!mountedRef.current) {
          return;
        }

        setFeedback({ type: "success", message: "孵化已开始，耐心等待完成吧。" });
        await fetchEggs();
      } catch (err) {
        if (mountedRef.current) {
          setFeedback({
            type: "error",
            message: err instanceof Error ? err.message : "开始孵化失败，请稍后再试。",
          });
        }
      } finally {
        if (mountedRef.current) {
          setActionState(null);
        }
      }
    },
    [actionState, fetchEggs],
  );

  const handleComplete = useCallback(
    async (egg: EggRecord) => {
      if (actionState) {
        return;
      }

      const eggId = String(egg.id);
      setFeedback(null);
      setActionState({ eggId, action: "complete" });
      setResultMonster(null);

      try {
        const response = await performEggAction(egg, "complete");
        const payload = await parseResponseJson(response);
        if (!mountedRef.current) {
          return;
        }

        const monster = extractMonsterFromPayload(payload, `egg-${eggId}-result`);
        setResultMonster(monster);
        setIsResultModalOpen(true);
        setFeedback({
          type: "success",
          message: monster ? "孵化成功，新的怪兽已经诞生！" : "孵化完成！",
        });

        await fetchEggs();
      } catch (err) {
        if (mountedRef.current) {
          setFeedback({
            type: "error",
            message: err instanceof Error ? err.message : "完成孵化失败，请稍后再试。",
          });
        }
      } finally {
        if (mountedRef.current) {
          setActionState(null);
        }
      }
    },
    [actionState, fetchEggs],
  );

  const handleCloseModal = useCallback(() => {
    setIsResultModalOpen(false);
  }, []);

  const handleViewMonster = useCallback(() => {
    if (!resultMonster) {
      return;
    }

    setIsResultModalOpen(false);
    const monsterId = encodeURIComponent(String(resultMonster.id));
    router.push(`/lab/monster/${monsterId}`);
  }, [resultMonster, router]);

  const handleViewExistingMonster = useCallback(
    (monster: MonsterRecord) => {
      const monsterId = encodeURIComponent(String(monster.id));
      router.push(`/lab/monster/${monsterId}`);
    },
    [router],
  );

  const activeActionEggId = actionState?.eggId ?? null;
  const activeActionType = actionState?.action ?? null;
  const showEmptyState = !isLoading && !fetchError && orderedEggs.length === 0;

  return (
    <div style={layoutStyle}>
      <div style={contentStyle}>
        <header style={headerStyle}>
          <div style={titleRowStyle}>
            <h1 style={titleStyle}>孵化中心</h1>
            <button type="button" style={refreshButtonStyle} onClick={handleRefresh} disabled={isLoading}>
              {isLoading ? "刷新中…" : "刷新列表"}
            </button>
          </div>
          <p style={descriptionStyle}>
            收集到的蛋会在这里孵化。开始孵化后请耐心等待，孵化完成时即可领取全新的怪兽伙伴。
          </p>
        </header>

        {feedback ? (
          <div style={{ ...feedbackBoxBaseStyle, ...feedbackToneStyles[feedback.type] }}>{feedback.message}</div>
        ) : null}

        {fetchError ? (
          <div style={{ ...feedbackBoxBaseStyle, ...feedbackToneStyles.error }}>{fetchError}</div>
        ) : null}

        {isLoading && eggs.length === 0 && !fetchError ? (
          <div style={{ ...feedbackBoxBaseStyle, ...feedbackToneStyles.info }}>正在加载蛋的列表…</div>
        ) : null}

        {showEmptyState ? (
          <div style={emptyStateStyle}>
            <h2 style={emptyTitleStyle}>目前没有待孵化的蛋</h2>
            <p style={emptyDescriptionStyle}>
              老练的训练师似乎已经孵化完所有的蛋啦。可以前往扭蛋机或实验室获取新的怪兽胚胎，再回到这里开启孵化旅程。
            </p>
            <div style={emptyActionRowStyle}>
              <Link href="/gacha" style={emptyLinkStyle}>
                前往扭蛋机
              </Link>
              <Link href="/lab" style={emptyLinkStyle}>
                查看怪兽实验室
              </Link>
            </div>
          </div>
        ) : (
          <div style={eggsGridStyle}>
            {orderedEggs.map((egg) => {
              const eggId = String(egg.id);
              const action = resolvePrimaryAction(egg);
              const progressLabel = formatProgressLabel(egg);
              const progressPercent =
                typeof egg.progress === "number" ? Math.max(0, Math.min(1, egg.progress)) * 100 : null;
              const isActionLoading = activeActionEggId === eggId;
              const buttonLabel =
                action?.type === "start"
                  ? isActionLoading && activeActionType === "start"
                    ? "启动中…"
                    : "开始孵化"
                  : action?.type === "complete"
                    ? isActionLoading && activeActionType === "complete"
                      ? "领取中…"
                      : "完成孵化"
                    : "";
              const statusLabel = resolveEggStatusLabel(egg);
              const hatched = egg.hatchedMonster ?? null;

              return (
                <div key={eggId} style={eggCardStyle}>
                  <div style={eggImageContainerStyle}>
                    {egg.imageUrl ? (
                      <Image
                        src={egg.imageUrl}
                        alt={egg.name ?? `蛋 ${eggId}`}
                        fill
                        sizes="110px"
                        style={eggImageStyle}
                        unoptimized
                      />
                    ) : (
                      <span style={eggPlaceholderStyle}>🥚</span>
                    )}
                  </div>

                  <div style={eggHeaderStyle}>
                    <div style={eggTitleRowStyle}>
                      <h2 style={eggTitleStyle}>{egg.name ?? `蛋 #${eggId}`}</h2>
                      <span style={eggStatusBadgeStyle}>{statusLabel}</span>
                    </div>
                    <div style={eggMetaStyle}>
                      {egg.rarity ? <span>稀有度：{egg.rarity}</span> : null}
                      {egg.species ? <span>品类：{egg.species}</span> : null}
                      {egg.stage ? <span>阶段：{egg.stage}</span> : null}
                    </div>
                  </div>

                  {egg.description ? <p style={eggDescriptionStyle}>{egg.description}</p> : null}

                  {progressPercent != null ? (
                    <div style={progressSectionStyle}>
                      <div style={progressLabelRowStyle}>
                        <span>孵化进度</span>
                        <span style={progressValueStyle}>{progressLabel}</span>
                      </div>
                      <div style={progressBarContainerStyle}>
                        <div style={{ ...progressBarFillStyle, width: `${progressPercent}%` }} />
                      </div>
                    </div>
                  ) : progressLabel ? (
                    <div style={progressLabelRowStyle}>
                      <span>当前状态</span>
                      <span style={progressValueStyle}>{progressLabel}</span>
                    </div>
                  ) : null}

                  <div style={eggInfoListStyle}>
                    {egg.readyAt ? <span>准备完成时间：{egg.readyAt}</span> : null}
                    {egg.startedAt ? <span>开始孵化时间：{egg.startedAt}</span> : null}
                    {egg.completedAt ? <span>完成时间：{egg.completedAt}</span> : null}
                  </div>

                  <div style={cardFooterStyle}>
                    {action ? (
                      <button
                        type="button"
                        style={{
                          ...actionButtonStyle,
                          ...(isActionLoading ? disabledButtonStyle : {}),
                        }}
                        disabled={isActionLoading}
                        onClick={() => {
                          if (action.type === "start") {
                            void handleStart(egg);
                          } else {
                            void handleComplete(egg);
                          }
                        }}
                      >
                        {buttonLabel}
                      </button>
                    ) : (
                      <div style={statusMessageStyle}>
                        {egg.isCompleted
                          ? "孵化已经完成，可在实验室查看新怪兽。"
                          : egg.hasStarted
                            ? "孵化进行中，请稍候。"
                            : "当前暂无法孵化，等待条件达成。"}
                      </div>
                    )}

                    {egg.isCompleted && hatched ? (
                      <button
                        type="button"
                        style={secondaryActionStyle}
                        onClick={() => handleViewExistingMonster(hatched)}
                      >
                        查看怪兽
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isResultModalOpen ? (
        <div
          style={modalOverlayStyle}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={modalTitleStyle}>孵化完成！</h2>
              <p style={modalDescriptionStyle}>
                {resultMonster
                  ? "新的怪兽已经诞生，快去认识你的伙伴吧。"
                  : "孵化已完成，稍后可在怪兽实验室查看详细信息。"}
              </p>
            </div>
            {resultMonster ? <MonsterCard monster={resultMonster} highlight /> : null}
            <div style={modalActionsStyle}>
              <button type="button" style={modalSecondaryButtonStyle} onClick={handleCloseModal}>
                继续孵化
              </button>
              {resultMonster ? (
                <button type="button" style={modalPrimaryButtonStyle} onClick={handleViewMonster}>
                  查看怪兽
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
