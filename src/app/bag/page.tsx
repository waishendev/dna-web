"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MonsterPicker from "@/components/MonsterPicker";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { BagItemRecord, parseBagItems } from "@/lib/items";
import { MonsterRecord, normalizeMonster, parseMonsterList } from "@/lib/monsters";

type FeedbackTone = "info" | "success" | "error";

type ActionFeedback = {
  type: FeedbackTone;
  message: string;
};

const pageStyle: CSSProperties = {
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
  borderRadius: "24px",
  padding: "3rem",
  background: "rgba(15, 23, 42, 0.62)",
  border: "1px solid rgba(148, 163, 184, 0.24)",
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
  fontSize: "2.15rem",
  fontWeight: 700,
};

const descriptionStyle: CSSProperties = {
  opacity: 0.78,
  fontSize: "1rem",
  lineHeight: 1.6,
  maxWidth: "640px",
};

const headerActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  alignItems: "center",
};

const secondaryButtonStyle: CSSProperties = {
  padding: "0.75rem 1.35rem",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.32)",
  background: "rgba(15, 23, 42, 0.35)",
  color: "#e2e8f0",
  fontWeight: 600,
  fontSize: "0.95rem",
  cursor: "pointer",
  textDecoration: "none",
  transition: "opacity 0.2s ease, transform 0.2s ease",
};

const sectionsStyle: CSSProperties = {
  display: "grid",
  gap: "2rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
};

const panelStyle: CSSProperties = {
  borderRadius: "20px",
  border: "1px solid rgba(148, 163, 184, 0.26)",
  background: "rgba(15, 23, 42, 0.5)",
  padding: "1.8rem",
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
};

const panelHeaderStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
};

const panelTitleStyle: CSSProperties = {
  fontSize: "1.4rem",
  fontWeight: 700,
};

const panelMetaStyle: CSSProperties = {
  fontSize: "0.85rem",
  opacity: 0.72,
  display: "flex",
  alignItems: "center",
  gap: "0.55rem",
};

const badgeStyle: CSSProperties = {
  padding: "0.35rem 0.75rem",
  borderRadius: "999px",
  border: "1px solid rgba(59, 130, 246, 0.32)",
  background: "rgba(59, 130, 246, 0.18)",
  color: "#bfdbfe",
  fontSize: "0.78rem",
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const itemListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.85rem",
  maxHeight: "520px",
  overflowY: "auto",
  paddingRight: "0.35rem",
};

const itemButtonStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.65rem",
  padding: "1.1rem 1.25rem",
  borderRadius: "16px",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  background: "rgba(15, 23, 42, 0.45)",
  color: "#e2e8f0",
  textAlign: "left",
  cursor: "pointer",
  transition: "transform 0.15s ease, box-shadow 0.15s ease, border 0.15s ease",
};

const selectedItemStyle: CSSProperties = {
  borderColor: "rgba(45, 212, 191, 0.48)",
  boxShadow: "0 18px 38px rgba(16, 185, 129, 0.28)",
  background: "rgba(16, 185, 129, 0.16)",
};

const depletedItemStyle: CSSProperties = {
  opacity: 0.58,
};

const itemTopRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  fontSize: "0.85rem",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  opacity: 0.75,
};

const itemNameStyle: CSSProperties = {
  fontSize: "1.12rem",
  fontWeight: 600,
};

const quantityBadgeStyle: CSSProperties = {
  padding: "0.4rem 0.75rem",
  borderRadius: "999px",
  border: "1px solid rgba(45, 212, 191, 0.4)",
  background: "rgba(16, 185, 129, 0.2)",
  color: "#99f6e4",
  fontWeight: 600,
  fontSize: "0.85rem",
};

const depletedQuantityBadgeStyle: CSSProperties = {
  borderColor: "rgba(148, 163, 184, 0.32)",
  background: "rgba(148, 163, 184, 0.18)",
  color: "#cbd5f5",
};

const itemMetaStyle: CSSProperties = {
  fontSize: "0.88rem",
  opacity: 0.78,
  display: "flex",
  flexWrap: "wrap",
  gap: "0.6rem",
};

const itemDescriptionStyle: CSSProperties = {
  fontSize: "0.92rem",
  opacity: 0.78,
  lineHeight: 1.6,
};

const loadingStyle: CSSProperties = {
  fontSize: "0.95rem",
  opacity: 0.75,
};

const emptyStateStyle: CSSProperties = {
  borderRadius: "16px",
  border: "1px dashed rgba(148, 163, 184, 0.3)",
  background: "rgba(15, 23, 42, 0.4)",
  padding: "1.6rem",
  textAlign: "center",
  fontSize: "0.95rem",
  color: "#94a3b8",
};

const detailPanelStyle: CSSProperties = {
  ...panelStyle,
  gap: "1.7rem",
};

const detailHeaderStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const detailTitleStyle: CSSProperties = {
  fontSize: "1.35rem",
  fontWeight: 700,
};

const detailSummaryStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "1.1rem",
  alignItems: "center",
};

const quantityDisplayStyle: CSSProperties = {
  fontSize: "2.2rem",
  fontWeight: 700,
};

const helperStyle: CSSProperties = {
  fontSize: "0.9rem",
  opacity: 0.78,
  lineHeight: 1.6,
};

const descriptionBoxStyle: CSSProperties = {
  borderRadius: "16px",
  border: "1px solid rgba(148, 163, 184, 0.26)",
  background: "rgba(15, 23, 42, 0.42)",
  padding: "1rem 1.15rem",
  fontSize: "0.95rem",
  lineHeight: 1.6,
  color: "#cbd5f5",
};

const placeholderStyle: CSSProperties = {
  borderRadius: "16px",
  border: "1px dashed rgba(148, 163, 184, 0.3)",
  background: "rgba(15, 23, 42, 0.38)",
  padding: "1.6rem",
  textAlign: "center",
  color: "#94a3b8",
  fontSize: "0.95rem",
};

const detailActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  alignItems: "center",
};

const feedButtonStyle: CSSProperties = {
  padding: "0.9rem 1.45rem",
  borderRadius: "12px",
  border: "1px solid rgba(45, 212, 191, 0.45)",
  background: "rgba(16, 185, 129, 0.2)",
  color: "#99f6e4",
  fontWeight: 600,
  fontSize: "0.98rem",
  cursor: "pointer",
  transition: "opacity 0.2s ease, transform 0.2s ease",
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.55,
  cursor: "not-allowed",
};

const detailLinkStyle: CSSProperties = {
  ...secondaryButtonStyle,
  padding: "0.75rem 1.3rem",
};

const messageBoxStyle: CSSProperties = {
  padding: "0.85rem 1.05rem",
  borderRadius: "12px",
  fontSize: "0.92rem",
  lineHeight: 1.6,
  border: "1px solid transparent",
};

const toneStyles: Record<FeedbackTone, CSSProperties> = {
  info: {
    background: "rgba(59, 130, 246, 0.16)",
    borderColor: "rgba(147, 197, 253, 0.32)",
    color: "#dbeafe",
  },
  success: {
    background: "rgba(22, 163, 74, 0.18)",
    borderColor: "rgba(34, 197, 94, 0.32)",
    color: "#bbf7d0",
  },
  error: {
    background: "rgba(239, 68, 68, 0.16)",
    borderColor: "rgba(248, 113, 113, 0.38)",
    color: "#fecaca",
  },
};

const errorBannerStyle: CSSProperties = {
  padding: "0.95rem 1.1rem",
  borderRadius: "12px",
  border: "1px solid rgba(248, 113, 113, 0.4)",
  background: "rgba(239, 68, 68, 0.16)",
  color: "#fecaca",
  fontSize: "0.95rem",
  lineHeight: 1.6,
};

const monsterSummaryStyle: CSSProperties = {
  borderRadius: "16px",
  border: "1px solid rgba(148, 163, 184, 0.26)",
  background: "rgba(15, 23, 42, 0.4)",
  padding: "1rem 1.15rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.55rem",
};

const monsterSummaryNameStyle: CSSProperties = {
  fontSize: "1.05rem",
  fontWeight: 600,
};

const monsterSummaryMetaStyle: CSSProperties = {
  fontSize: "0.85rem",
  opacity: 0.75,
  display: "flex",
  flexWrap: "wrap",
  gap: "0.6rem",
};

function sortBagItems(a: BagItemRecord, b: BagItemRecord): number {
  if (b.quantity !== a.quantity) {
    return b.quantity - a.quantity;
  }

  const labelA = (a.name ?? a.identifier ?? "").toString();
  const labelB = (b.name ?? b.identifier ?? "").toString();
  return labelA.localeCompare(labelB, "zh-CN");
}

function toMonsterKey(monster: MonsterRecord): string {
  const { id } = monster;
  if (typeof id === "string" && id) {
    return id;
  }

  if (typeof id === "number" && Number.isFinite(id)) {
    return String(id);
  }

  return String(id ?? "");
}

function formatQuantity(quantity: number): string {
  const safe = Number.isFinite(quantity) ? quantity : 0;
  return new Intl.NumberFormat("zh-CN").format(Math.max(0, Math.floor(safe)));
}

function buildItemMeta(item: BagItemRecord): string[] {
  const meta: string[] = [];
  if (item.type) {
    meta.push(item.type);
  }
  if (item.category && item.category !== item.type) {
    meta.push(item.category);
  }
  if (item.rarity) {
    meta.push(`稀有度：${item.rarity}`);
  }
  if (item.tags && item.tags.length > 0) {
    meta.push(item.tags.join(" / "));
  }
  return meta;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function extractMessage(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (isPlainObject(value)) {
    const candidates = ["message", "error", "detail", "msg", "description"];
    for (const key of candidates) {
      const candidate = value[key];
      if (typeof candidate === "string") {
        const trimmed = candidate.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      }
    }
  }

  return null;
}

async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
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

function extractMonsterFromPayload(payload: unknown, fallbackId: string): MonsterRecord | null {
  const direct = normalizeMonster(payload, fallbackId);
  if (direct) {
    return direct;
  }

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      const candidate = extractMonsterFromPayload(entry, fallbackId);
      if (candidate) {
        return candidate;
      }
    }
    return null;
  }

  if (isPlainObject(payload)) {
    const keys = [
      "monster",
      "data",
      "result",
      "record",
      "entity",
      "updated",
      "updatedMonster",
      "target",
      "response",
    ];

    for (const key of keys) {
      if (!(key in payload)) {
        continue;
      }

      const candidate = extractMonsterFromPayload(payload[key], fallbackId);
      if (candidate) {
        return candidate;
      }
    }
  }

  return null;
}

export default function BagPage() {
  const router = useRouter();
  const [items, setItems] = useState<BagItemRecord[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isRefreshingInventory, setIsRefreshingInventory] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  const [monsters, setMonsters] = useState<MonsterRecord[]>([]);
  const [isLoadingMonsters, setIsLoadingMonsters] = useState(true);
  const [monsterError, setMonsterError] = useState<string | null>(null);

  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);
  const [isFeeding, setIsFeeding] = useState(false);

  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const applyInventoryUpdate = useCallback((list: BagItemRecord[]) => {
    const sorted = [...list].sort(sortBagItems);
    setItems(sorted);
    setSelectedItemKey((current) => {
      if (sorted.length === 0) {
        return null;
      }

      if (current && sorted.some((item) => item.identifier === current)) {
        return current;
      }

      const fallback = sorted.find((item) => item.quantity > 0) ?? sorted[0];
      return fallback ? fallback.identifier : null;
    });
  }, []);

  const fetchInventory = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!mountedRef.current) {
        return;
      }

      const silent = options?.silent ?? false;
      if (silent) {
        setIsRefreshingInventory(true);
      } else {
        setIsLoadingItems(true);
      }
      setItemError(null);

      try {
        const response = await apiFetch("/bag", { cache: "no-store" });
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

        const list = parseBagItems(payload);
        applyInventoryUpdate(list);
      } catch (err) {
        console.error("Failed to fetch bag items", err);
        if (!mountedRef.current) {
          return;
        }

        setItems([]);
        setSelectedItemKey(null);
        setItemError("无法加载背包内容，请稍后重试。");
      } finally {
        if (!mountedRef.current) {
          return;
        }

        if (silent) {
          setIsRefreshingInventory(false);
        } else {
          setIsLoadingItems(false);
        }
      }
    },
    [applyInventoryUpdate],
  );

  const fetchMonsters = useCallback(async () => {
    if (!mountedRef.current) {
      return;
    }

    setIsLoadingMonsters(true);
    setMonsterError(null);

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
      setSelectedMonsterId((current) => {
        if (list.length === 0) {
          return null;
        }

        if (current && list.some((monster) => toMonsterKey(monster) === current)) {
          return current;
        }

        const fallback = list[0];
        return fallback ? toMonsterKey(fallback) : null;
      });
    } catch (err) {
      console.error("Failed to fetch monsters for bag", err);
      if (!mountedRef.current) {
        return;
      }

      setMonsters([]);
      setSelectedMonsterId(null);
      setMonsterError("无法加载怪兽列表，请稍后重试。");
    } finally {
      if (mountedRef.current) {
        setIsLoadingMonsters(false);
      }
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/");
      return;
    }

    void fetchInventory();
    void fetchMonsters();
  }, [router, fetchInventory, fetchMonsters]);

  const selectedItem = useMemo(() => {
    if (!selectedItemKey) {
      return null;
    }

    return items.find((item) => item.identifier === selectedItemKey) ?? null;
  }, [items, selectedItemKey]);

  const selectedMonster = useMemo(() => {
    if (!selectedMonsterId) {
      return null;
    }

    return (
      monsters.find((monster) => toMonsterKey(monster) === selectedMonsterId) ?? null
    );
  }, [monsters, selectedMonsterId]);

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + Math.max(0, item.quantity), 0),
    [items],
  );

  const inventorySummary = isLoadingItems
    ? "加载中…"
    : items.length === 0
      ? "背包暂无道具"
      : `${items.length} 类道具 · 共 ${formatQuantity(totalQuantity)} 件`;

  const handleRefreshInventory = useCallback(() => {
    void fetchInventory();
  }, [fetchInventory]);

  const handleRefreshMonsters = useCallback(() => {
    void fetchMonsters();
  }, [fetchMonsters]);

  const handleSelectItem = useCallback((item: BagItemRecord) => {
    setSelectedItemKey(item.identifier);
    setFeedback(null);
  }, []);

  const handleSelectMonster = useCallback((monster: MonsterRecord) => {
    setSelectedMonsterId(toMonsterKey(monster));
    setFeedback(null);
  }, []);

  const handleClearMonster = useCallback(() => {
    setSelectedMonsterId(null);
  }, []);

  const handleFeed = useCallback(async () => {
    if (isFeeding) {
      return;
    }

    const item = selectedItem;
    if (!item) {
      setFeedback({ type: "error", message: "请选择要使用的道具。" });
      return;
    }

    if (item.quantity <= 0) {
      setFeedback({
        type: "error",
        message: `${item.name ?? item.identifier} 的库存已用尽。`,
      });
      return;
    }

    const monster = selectedMonster;
    if (!monster) {
      setFeedback({ type: "error", message: "请选择要喂食的怪兽。" });
      return;
    }

    const monsterKey = toMonsterKey(monster);
    if (!monsterKey) {
      setFeedback({ type: "error", message: "无法识别怪兽编号。" });
      return;
    }

    const itemLabel = item.name ?? item.identifier;

    setIsFeeding(true);
    setFeedback({ type: "info", message: `正在使用 ${itemLabel}…` });

    try {
      const response = await apiFetch(`/monsters/${encodeURIComponent(monsterKey)}/feed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ item: item.identifier }),
      });

      if (!response.ok) {
        const message = await extractErrorMessage(response, "喂食失败，请稍后再试。");
        if (mountedRef.current) {
          setFeedback({ type: "error", message });
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

      if (payload != null) {
        const updatedMonster = extractMonsterFromPayload(payload, monsterKey);
        if (updatedMonster) {
          const monsterIdentifier = toMonsterKey(updatedMonster);
          setMonsters((current) => {
            const next = current.map((entry) =>
              toMonsterKey(entry) === monsterIdentifier ? updatedMonster : entry,
            );

            if (!next.some((entry) => toMonsterKey(entry) === monsterIdentifier)) {
              next.push(updatedMonster);
            }

            return next;
          });
          setSelectedMonsterId(monsterIdentifier);
        }

        const inventoryUpdate = parseBagItems(payload);
        if (inventoryUpdate.length > 0) {
          applyInventoryUpdate(inventoryUpdate);
        } else {
          void fetchInventory({ silent: true });
        }
      } else {
        void fetchInventory({ silent: true });
      }

      setFeedback({
        type: "success",
        message: `已使用 1 个 ${itemLabel}，目标怪兽的能量已补充。`,
      });
    } catch (err) {
      console.error("Failed to feed monster from bag", err);
      if (mountedRef.current) {
        setFeedback({
          type: "error",
          message: resolveErrorMessage(err, "喂食失败，请稍后再试。"),
        });
      }
    } finally {
      if (mountedRef.current) {
        setIsFeeding(false);
      }
    }
  }, [
    isFeeding,
    selectedItem,
    selectedMonster,
    applyInventoryUpdate,
    fetchInventory,
  ]);

  const feedDisabled =
    isFeeding || !selectedItem || selectedItem.quantity <= 0 || !selectedMonster;

  const feedButtonLabel = isFeeding ? "喂食中…" : "使用并喂食";

  return (
    <main style={pageStyle}>
      <div style={contentStyle}>
        <header style={headerStyle}>
          <div style={headingStyle}>
            <h1 style={titleStyle}>背包</h1>
            <p style={descriptionStyle}>
              快速查看道具库存，选择目标怪兽，一键完成喂食。你也可以前往怪兽详情页使用道具。
            </p>
          </div>
          <div style={headerActionsStyle}>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={handleRefreshInventory}
              disabled={isLoadingItems && !isRefreshingInventory}
            >
              刷新背包
            </button>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={handleRefreshMonsters}
              disabled={isLoadingMonsters}
            >
              刷新怪兽
            </button>
            <Link href="/lab" style={secondaryButtonStyle}>
              前往我的怪兽
            </Link>
          </div>
        </header>

        {feedback ? (
          <div style={{ ...messageBoxStyle, ...toneStyles[feedback.type] }}>{feedback.message}</div>
        ) : null}

        <section style={sectionsStyle}>
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>我的道具</h2>
              <div style={panelMetaStyle}>
                <span>{inventorySummary}</span>
                {isRefreshingInventory ? <span style={badgeStyle}>同步中…</span> : null}
              </div>
            </div>

            {itemError ? (
              <div style={errorBannerStyle}>{itemError}</div>
            ) : isLoadingItems ? (
              <div style={loadingStyle}>正在加载背包内容…</div>
            ) : items.length === 0 ? (
              <div style={emptyStateStyle}>背包空空如也，快去探索更多资源吧。</div>
            ) : (
              <div style={itemListStyle}>
                {items.map((item) => {
                  const label = item.name ?? item.identifier;
                  const meta = buildItemMeta(item);
                  const isSelected = selectedItemKey === item.identifier;
                  const isDepleted = item.quantity <= 0;
                  const buttonStyle = {
                    ...itemButtonStyle,
                    ...(isSelected ? selectedItemStyle : {}),
                    ...(isDepleted ? depletedItemStyle : {}),
                  } satisfies CSSProperties;
                  const badgeStyleToUse = {
                    ...quantityBadgeStyle,
                    ...(isDepleted ? depletedQuantityBadgeStyle : {}),
                  } satisfies CSSProperties;

                  return (
                    <button
                      type="button"
                      key={item.identifier}
                      style={buttonStyle}
                      onClick={() => handleSelectItem(item)}
                    >
                      <div style={itemTopRowStyle}>
                        <span>{item.type ?? item.category ?? "道具"}</span>
                        <span style={badgeStyleToUse}>剩余 {formatQuantity(item.quantity)}</span>
                      </div>
                      <div style={itemNameStyle}>{label}</div>
                      {meta.length > 0 ? <div style={itemMetaStyle}>{meta.join(" · ")}</div> : null}
                      {item.description ? (
                        <div style={itemDescriptionStyle}>{item.description}</div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section style={detailPanelStyle}>
            <div style={detailHeaderStyle}>
              <h2 style={detailTitleStyle}>使用道具</h2>
              {selectedItem ? (
                <div style={detailSummaryStyle}>
                  <div>
                    <div style={itemNameStyle}>{selectedItem.name ?? selectedItem.identifier}</div>
                    <div style={itemMetaStyle}>
                      剩余 <span style={quantityDisplayStyle}>{formatQuantity(selectedItem.quantity)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={placeholderStyle}>请选择一个要使用的道具。</div>
              )}

              {selectedItem?.description ? (
                <div style={descriptionBoxStyle}>{selectedItem.description}</div>
              ) : null}

              <div style={detailActionsStyle}>
                <button
                  type="button"
                  style={{ ...feedButtonStyle, ...(feedDisabled ? disabledButtonStyle : {}) }}
                  onClick={handleFeed}
                  disabled={feedDisabled}
                >
                  {feedButtonLabel}
                </button>
                {selectedMonster ? (
                  <Link
                    href={`/lab/monster/${encodeURIComponent(toMonsterKey(selectedMonster))}`}
                    style={detailLinkStyle}
                  >
                    查看怪兽详情
                  </Link>
                ) : null}
                <div style={helperStyle}>
                  选择一只怪兽后点击“使用并喂食”，道具会立即消耗且背包数量同步更新。
                </div>
              </div>
            </div>

            {monsterError ? <div style={errorBannerStyle}>{monsterError}</div> : null}

            {selectedMonster ? (
              <div style={monsterSummaryStyle}>
                <div style={monsterSummaryNameStyle}>
                  {selectedMonster.nickname ?? selectedMonster.name ?? `怪兽 ${toMonsterKey(selectedMonster)}`}
                </div>
                <div style={monsterSummaryMetaStyle}>
                  <span>能量：{selectedMonster.energy ?? "未知"}</span>
                  <span>等级：{selectedMonster.level ?? "未知"}</span>
                  {selectedMonster.rarity ? <span>稀有度：{selectedMonster.rarity}</span> : null}
                </div>
              </div>
            ) : (
              <div style={placeholderStyle}>请选择要喂食的怪兽。</div>
            )}

            <MonsterPicker
              label="选择怪兽"
              monsters={monsters}
              selectedId={selectedMonsterId}
              selectedMonster={selectedMonster}
              onSelect={handleSelectMonster}
              onClear={handleClearMonster}
              isLoading={isLoadingMonsters}
              emptyMessage="暂无可用怪兽，先去孵化或探索吧。"
            />
          </section>
        </section>
      </div>
    </main>
  );
}
