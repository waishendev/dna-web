"use client";

import { CSSProperties } from "react";
import MonsterCard from "./MonsterCard";
import { MonsterRecord } from "@/lib/monsters";

type MonsterPickerProps = {
  label: string;
  monsters: MonsterRecord[];
  selectedId: string | null;
  selectedMonster: MonsterRecord | null;
  onSelect: (monster: MonsterRecord) => void;
  onClear?: () => void;
  disabledMonsterId?: string | null;
  isLoading?: boolean;
  emptyMessage?: string;
};

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1.4rem",
  padding: "1.75rem",
  borderRadius: "22px",
  background: "rgba(15, 23, 42, 0.58)",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  minHeight: 0,
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  flexWrap: "wrap",
};

const labelStyle: CSSProperties = {
  fontSize: "1.2rem",
  fontWeight: 700,
};

const badgeStyle: CSSProperties = {
  padding: "0.35rem 0.75rem",
  borderRadius: "999px",
  background: "rgba(59, 130, 246, 0.18)",
  border: "1px solid rgba(59, 130, 246, 0.32)",
  color: "#bfdbfe",
  fontSize: "0.82rem",
  fontWeight: 600,
  letterSpacing: "0.05em",
};

const selectedSectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.8rem",
};

const placeholderStyle: CSSProperties = {
  borderRadius: "18px",
  border: "1px dashed rgba(148, 163, 184, 0.32)",
  background: "rgba(15, 23, 42, 0.42)",
  padding: "1.4rem",
  textAlign: "center",
  fontSize: "0.95rem",
  color: "#94a3b8",
};

const clearButtonStyle: CSSProperties = {
  alignSelf: "flex-start",
  padding: "0.55rem 1rem",
  borderRadius: "999px",
  border: "1px solid rgba(148, 163, 184, 0.32)",
  background: "rgba(15, 23, 42, 0.35)",
  color: "#e2e8f0",
  fontSize: "0.85rem",
  fontWeight: 600,
  cursor: "pointer",
  transition: "opacity 0.2s ease, transform 0.2s ease",
};

const listSectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.7rem",
  maxHeight: "420px",
  overflowY: "auto",
  paddingRight: "0.35rem",
};

const loadingStyle: CSSProperties = {
  fontSize: "0.92rem",
  opacity: 0.72,
};

const emptyStyle: CSSProperties = {
  fontSize: "0.92rem",
  opacity: 0.75,
  borderRadius: "16px",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  background: "rgba(15, 23, 42, 0.4)",
  padding: "1.2rem 1.4rem",
  textAlign: "center",
};

const itemButtonStyle: CSSProperties = {
  width: "100%",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "16px",
  background: "rgba(15, 23, 42, 0.45)",
  padding: "1rem 1.2rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.55rem",
  textAlign: "left",
  cursor: "pointer",
  transition: "transform 0.15s ease, box-shadow 0.15s ease, border 0.15s ease",
  color: "#e2e8f0",
};

const selectedItemStyle: CSSProperties = {
  borderColor: "rgba(59, 130, 246, 0.55)",
  boxShadow: "0 18px 38px rgba(37, 99, 235, 0.35)",
  background: "rgba(59, 130, 246, 0.18)",
};

const disabledItemStyle: CSSProperties = {
  opacity: 0.55,
  cursor: "not-allowed",
};

const itemTopRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  fontSize: "0.82rem",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  opacity: 0.8,
};

const itemNameStyle: CSSProperties = {
  fontSize: "1.05rem",
  fontWeight: 600,
};

const itemMetaStyle: CSSProperties = {
  fontSize: "0.9rem",
  opacity: 0.78,
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
};

const selectedBadgeStyle: CSSProperties = {
  alignSelf: "flex-start",
  padding: "0.3rem 0.65rem",
  borderRadius: "999px",
  background: "rgba(59, 130, 246, 0.22)",
  color: "#bfdbfe",
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.05em",
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

function buildSummary(monster: MonsterRecord): { rarity: string; level: string; energy: string } {
  const rarity = formatMaybeString(monster.rarity) ?? "未知";
  const level = formatMaybeString(monster.level) ?? "未知";
  const energy = formatMaybeString(monster.energy) ?? "未知";

  return { rarity, level, energy };
}

export default function MonsterPicker({
  label,
  monsters,
  selectedId,
  selectedMonster,
  onSelect,
  onClear,
  disabledMonsterId = null,
  isLoading = false,
  emptyMessage = "暂无可用怪兽。",
}: MonsterPickerProps) {
  const countLabel = isLoading ? "加载中…" : `${monsters.length} 只可选`;

  return (
    <section style={containerStyle}>
      <header style={headerStyle}>
        <h3 style={labelStyle}>{label}</h3>
        <span style={badgeStyle}>{countLabel}</span>
      </header>

      <div style={selectedSectionStyle}>
        {selectedMonster ? (
          <>
            <MonsterCard monster={selectedMonster} highlight />
            {onClear ? (
              <button type="button" style={clearButtonStyle} onClick={onClear}>
                清除选择
              </button>
            ) : null}
          </>
        ) : (
          <div style={placeholderStyle}>请选择一只怪兽作为{label}。</div>
        )}
      </div>

      <div style={listSectionStyle}>
        {isLoading ? (
          <span style={loadingStyle}>正在加载怪兽列表…</span>
        ) : monsters.length === 0 ? (
          <div style={emptyStyle}>{emptyMessage}</div>
        ) : (
          monsters.map((monster) => {
            const monsterKey = String(monster.id);
            const isSelected = selectedId === monsterKey;
            const isDisabled =
              disabledMonsterId != null && disabledMonsterId === monsterKey && !isSelected;
            const { rarity, level, energy } = buildSummary(monster);
            const displayName = monster.name ?? monster.nickname ?? null;
            const species = monster.species ?? "未知物种";

            return (
              <button
                key={monsterKey}
                type="button"
                style={{
                  ...itemButtonStyle,
                  ...(isSelected ? selectedItemStyle : {}),
                  ...(isDisabled ? disabledItemStyle : {}),
                }}
                disabled={isDisabled}
                onClick={() => {
                  if (!isDisabled) {
                    onSelect(monster);
                  }
                }}
              >
                <div style={itemTopRowStyle}>
                  <span>#{monsterKey}</span>
                  <span>{rarity}</span>
                </div>
                <div style={itemNameStyle}>{species}</div>
                {displayName ? <div style={{ opacity: 0.7 }}>{displayName}</div> : null}
                <div style={itemMetaStyle}>
                  <span>等级 {level}</span>
                  <span>能量 {energy}</span>
                </div>
                {isSelected ? <span style={selectedBadgeStyle}>已选择</span> : null}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
