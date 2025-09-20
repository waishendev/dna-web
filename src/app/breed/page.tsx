"use client";

import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import MonsterPicker from "@/components/MonsterPicker";
import MonsterCard from "@/components/MonsterCard";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { MonsterRecord, normalizeMonster, parseMonsterList } from "@/lib/monsters";

type FeedbackTone = "info" | "success" | "error";

type Feedback = {
  type: FeedbackTone;
  message: string;
};

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
  maxWidth: "1180px",
  borderRadius: "26px",
  padding: "3rem",
  background: "rgba(15, 23, 42, 0.64)",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  boxShadow: "0 36px 80px rgba(15, 23, 42, 0.38)",
  backdropFilter: "blur(18px)",
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
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1.25rem",
};

const titleStyle: CSSProperties = {
  fontSize: "2.25rem",
  fontWeight: 700,
};

const descriptionStyle: CSSProperties = {
  fontSize: "1rem",
  opacity: 0.8,
  lineHeight: 1.7,
  maxWidth: "760px",
};

const refreshButtonStyle: CSSProperties = {
  padding: "0.85rem 1.45rem",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  background: "rgba(59, 130, 246, 0.16)",
  color: "#bfdbfe",
  fontWeight: 600,
  fontSize: "0.95rem",
  cursor: "pointer",
  transition: "opacity 0.2s ease, transform 0.2s ease",
};

const pickerGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "1.8rem",
};

const feedbackSectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1.1rem",
};

const messageBaseStyle: CSSProperties = {
  borderRadius: "14px",
  padding: "0.9rem 1.1rem",
  border: "1px solid transparent",
  fontSize: "0.95rem",
  lineHeight: 1.6,
};

const messageToneStyles: Record<FeedbackTone, CSSProperties> = {
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

const helperTextStyle: CSSProperties = {
  fontSize: "0.9rem",
  opacity: 0.75,
};

const breedButtonStyle: CSSProperties = {
  alignSelf: "flex-start",
  padding: "0.95rem 1.6rem",
  borderRadius: "14px",
  border: "1px solid rgba(96, 165, 250, 0.5)",
  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(96, 165, 250, 0.35))",
  color: "#e0f2fe",
  fontSize: "1rem",
  fontWeight: 700,
  cursor: "pointer",
  transition: "transform 0.18s ease, opacity 0.18s ease",
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.6,
  cursor: "not-allowed",
};

const fetchErrorStyle: CSSProperties = {
  ...messageBaseStyle,
  ...messageToneStyles.error,
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
  gap: "0.65rem",
};

const modalTitleStyle: CSSProperties = {
  fontSize: "1.8rem",
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
    // ignore json parsing errors
  }

  try {
    const text = await response.clone().text();
    const trimmed = text.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  } catch {
    // ignore text parsing errors
  }

  return fallback;
}

function extractMonsterFromPayload(payload: unknown, fallbackId: string): MonsterRecord | null {
  const list = parseMonsterList(payload);
  if (list.length > 0) {
    return list[0] ?? null;
  }

  if (isRecord(payload)) {
    const candidateKeys = [
      "monster",
      "data",
      "result",
      "child",
      "offspring",
      "baby",
      "record",
    ];

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

export default function BreedPage() {
  const router = useRouter();
  const mountedRef = useRef(false);
  const [monsters, setMonsters] = useState<MonsterRecord[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [leftSelectionId, setLeftSelectionId] = useState<string | null>(null);
  const [rightSelectionId, setRightSelectionId] = useState<string | null>(null);
  const [isBreeding, setIsBreeding] = useState(false);
  const [breedFeedback, setBreedFeedback] = useState<Feedback | null>(null);
  const [offspring, setOffspring] = useState<MonsterRecord | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchMonsters = useCallback(async () => {
    setIsFetching(true);
    setFetchError(null);

    try {
      const response = await apiFetch("/monsters/my", { cache: "no-store" });

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

      const parsed = parseMonsterList(payload);
      setMonsters(parsed);
      if (parsed.length === 0) {
        setLeftSelectionId(null);
        setRightSelectionId(null);
      }
    } catch (err) {
      console.error("Failed to fetch owned monsters", err);
      if (!mountedRef.current) {
        return;
      }

      setMonsters([]);
      setFetchError("无法加载怪兽列表，请稍后再试。");
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
      }
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/");
      return;
    }

    void fetchMonsters();
  }, [router, fetchMonsters]);

  useEffect(() => {
    if (!leftSelectionId) {
      return;
    }

    const exists = monsters.some((monster) => String(monster.id) === leftSelectionId);
    if (!exists) {
      setLeftSelectionId(null);
    }
  }, [monsters, leftSelectionId]);

  useEffect(() => {
    if (!rightSelectionId) {
      return;
    }

    const exists = monsters.some((monster) => String(monster.id) === rightSelectionId);
    if (!exists) {
      setRightSelectionId(null);
    }
  }, [monsters, rightSelectionId]);

  const selectedLeft = useMemo(() => {
    if (!leftSelectionId) {
      return null;
    }
    return monsters.find((monster) => String(monster.id) === leftSelectionId) ?? null;
  }, [monsters, leftSelectionId]);

  const selectedRight = useMemo(() => {
    if (!rightSelectionId) {
      return null;
    }
    return monsters.find((monster) => String(monster.id) === rightSelectionId) ?? null;
  }, [monsters, rightSelectionId]);

  const helperMessage = useMemo(() => {
    if (isFetching) {
      return "正在刷新怪兽列表…";
    }

    if (!selectedLeft && !selectedRight) {
      return "请选择两只怪兽作为父母来生成子代。";
    }

    if (!selectedLeft) {
      return "请在左侧先选择父母 A。";
    }

    if (!selectedRight) {
      return "请在右侧选择父母 B。";
    }

    if (selectedLeft && selectedRight && String(selectedLeft.id) === String(selectedRight.id)) {
      return "左右父母不能是同一只怪兽。";
    }

    return null;
  }, [isFetching, selectedLeft, selectedRight]);

  const handleSelectLeft = useCallback(
    (monster: MonsterRecord) => {
      const monsterId = String(monster.id);
      if (rightSelectionId && rightSelectionId === monsterId) {
        setBreedFeedback({ type: "error", message: "左右父母不能选择同一只怪兽。" });
        return;
      }

      setBreedFeedback(null);
      setLeftSelectionId(monsterId);
    },
    [rightSelectionId],
  );

  const handleSelectRight = useCallback(
    (monster: MonsterRecord) => {
      const monsterId = String(monster.id);
      if (leftSelectionId && leftSelectionId === monsterId) {
        setBreedFeedback({ type: "error", message: "左右父母不能选择同一只怪兽。" });
        return;
      }

      setBreedFeedback(null);
      setRightSelectionId(monsterId);
    },
    [leftSelectionId],
  );

  const handleClearLeft = useCallback(() => {
    setLeftSelectionId(null);
  }, []);

  const handleClearRight = useCallback(() => {
    setRightSelectionId(null);
  }, []);

  const handleRefresh = useCallback(() => {
    void fetchMonsters();
  }, [fetchMonsters]);

  const handleBreed = useCallback(async () => {
    if (isBreeding) {
      return;
    }

    if (!selectedLeft || !selectedRight) {
      setBreedFeedback({ type: "error", message: "请先选择左右两只怪兽。" });
      return;
    }

    if (String(selectedLeft.id) === String(selectedRight.id)) {
      setBreedFeedback({ type: "error", message: "不能选择同一只怪兽作为双亲。" });
      return;
    }

    setIsBreeding(true);
    setBreedFeedback({ type: "info", message: "正在进行繁殖模拟，请稍候…" });

    try {
      const response = await apiFetch("/monsters/breed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentAId: selectedLeft.id,
          parentBId: selectedRight.id,
        }),
      });

      if (!response.ok) {
        const message = await extractErrorMessage(
          response,
          "繁殖失败，可能是能量不足或校验未通过，请稍后再试。",
        );
        if (mountedRef.current) {
          setBreedFeedback({ type: "error", message });
        }
        return;
      }

      let payload: unknown = null;
      if (response.status !== 204) {
        payload = await response.json();
      }

      if (!mountedRef.current) {
        return;
      }

      const child = extractMonsterFromPayload(payload, "offspring");
      if (child) {
        setOffspring(child);
        setIsResultModalOpen(true);
        setBreedFeedback({ type: "success", message: "繁殖成功，新的子代已经诞生！" });
      } else {
        setOffspring(null);
        setIsResultModalOpen(false);
        setBreedFeedback({ type: "success", message: "繁殖成功！" });
      }

      void fetchMonsters();
    } catch (err) {
      console.error("Failed to breed monsters", err);
      if (mountedRef.current) {
        setBreedFeedback({
          type: "error",
          message:
            err instanceof Error && err.message
              ? err.message
              : "繁殖失败，请稍后再试。",
        });
      }
    } finally {
      if (mountedRef.current) {
        setIsBreeding(false);
      }
    }
  }, [
    fetchMonsters,
    isBreeding,
    selectedLeft,
    selectedRight,
  ]);

  const handleCloseModal = useCallback(() => {
    setIsResultModalOpen(false);
  }, []);

  const handleViewOffspring = useCallback(() => {
    if (!offspring) {
      return;
    }

    setIsResultModalOpen(false);
    const childId = encodeURIComponent(String(offspring.id));
    router.push(`/lab/monster/${childId}`);
  }, [offspring, router]);

  const breedDisabled =
    isBreeding || !selectedLeft || !selectedRight ||
    (selectedLeft && selectedRight && String(selectedLeft.id) === String(selectedRight.id));

  return (
    <div style={layoutStyle}>
      <div style={contentStyle}>
        <header style={headerStyle}>
          <div style={titleRowStyle}>
            <h1 style={titleStyle}>怪兽繁殖实验室</h1>
            <button type="button" style={refreshButtonStyle} onClick={handleRefresh}>
              刷新列表
            </button>
          </div>
          <p style={descriptionStyle}>
            选择两只怪兽作为父母，实验室将模拟它们的基因融合并生成全新的子代。
            子代将继承部分特性，同时会消耗父母一定的能量。请确保能量充足再开始实验。
          </p>
        </header>

        {fetchError ? <div style={fetchErrorStyle}>{fetchError}</div> : null}

        <div style={pickerGridStyle}>
          <MonsterPicker
            label="父母 A"
            monsters={monsters}
            selectedId={leftSelectionId}
            selectedMonster={selectedLeft}
            onSelect={handleSelectLeft}
            onClear={selectedLeft ? handleClearLeft : undefined}
            disabledMonsterId={rightSelectionId}
            isLoading={isFetching}
            emptyMessage="暂无可繁殖的怪兽，请先培养或领取。"
          />
          <MonsterPicker
            label="父母 B"
            monsters={monsters}
            selectedId={rightSelectionId}
            selectedMonster={selectedRight}
            onSelect={handleSelectRight}
            onClear={selectedRight ? handleClearRight : undefined}
            disabledMonsterId={leftSelectionId}
            isLoading={isFetching}
            emptyMessage="暂无可繁殖的怪兽，请先培养或领取。"
          />
        </div>

        <div style={feedbackSectionStyle}>
          {breedFeedback ? (
            <div style={{ ...messageBaseStyle, ...messageToneStyles[breedFeedback.type] }}>
              {breedFeedback.message}
            </div>
          ) : null}
          {helperMessage ? <div style={helperTextStyle}>{helperMessage}</div> : null}
          <button
            type="button"
            style={{
              ...breedButtonStyle,
              ...(breedDisabled ? disabledButtonStyle : {}),
            }}
            disabled={breedDisabled}
            onClick={handleBreed}
          >
            {isBreeding ? "繁殖中…" : "生成子代"}
          </button>
        </div>
      </div>

      {isResultModalOpen && offspring ? (
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
              <h2 style={modalTitleStyle}>新生子代诞生！</h2>
              <p style={modalDescriptionStyle}>
                恭喜，实验成功生成了一只全新的子代怪兽。点击下方按钮查看它的详细数据。
              </p>
            </div>
            <MonsterCard monster={offspring} highlight />
            <div style={modalActionsStyle}>
              <button type="button" style={modalSecondaryButtonStyle} onClick={handleCloseModal}>
                继续繁殖
              </button>
              <button type="button" style={modalPrimaryButtonStyle} onClick={handleViewOffspring}>
                查看子代详情
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
