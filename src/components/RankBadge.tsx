"use client";

import { CSSProperties } from "react";

type RankBadgeProps = {
  rank: string | number | null | undefined;
  highlight?: boolean;
  delta?: number | null;
  changed?: boolean;
};

const containerStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.45rem",
  padding: "0.3rem 0.75rem",
  borderRadius: "999px",
  background: "rgba(148, 163, 184, 0.15)",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  color: "#e2e8f0",
  fontSize: "0.78rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  transition: "all 0.3s ease",
};

const labelStyle: CSSProperties = {
  opacity: 0.7,
  fontSize: "0.72rem",
};

const valueStyle: CSSProperties = {
  fontSize: "0.95rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
};

const deltaBaseStyle: CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 700,
};

const deltaPositiveStyle: CSSProperties = {
  color: "#facc15",
  textShadow: "0 0 16px rgba(250, 204, 21, 0.45)",
};

const deltaNegativeStyle: CSSProperties = {
  color: "#fca5a5",
  textShadow: "0 0 16px rgba(248, 113, 113, 0.4)",
};

function formatRankValue(rank: string | number | null | undefined): string {
  if (typeof rank === "number" && Number.isFinite(rank)) {
    return rank.toLocaleString("zh-CN");
  }

  if (typeof rank === "string") {
    const trimmed = rank.trim();
    if (trimmed.length === 0) {
      return "--";
    }
    return trimmed;
  }

  return "--";
}

function formatDelta(delta: number): string {
  const rounded = Number.isInteger(delta)
    ? delta.toString()
    : delta.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  if (delta > 0 && !rounded.startsWith("+")) {
    return `+${rounded}`;
  }
  return rounded;
}

export default function RankBadge({
  rank,
  highlight = false,
  delta = null,
  changed = false,
}: RankBadgeProps) {
  const hasDelta = delta != null && delta !== 0;
  const deltaLabel = hasDelta ? formatDelta(delta) : null;
  const isNegativeDelta = hasDelta && delta != null && delta < 0;
  const isActive = highlight || hasDelta || changed;

  return (
    <span
      style={{
        ...containerStyle,
        background: isActive ? "rgba(250, 204, 21, 0.18)" : containerStyle.background,
        border: isActive
          ? "1px solid rgba(250, 204, 21, 0.6)"
          : containerStyle.border,
        color: isActive ? "#fef9c3" : containerStyle.color,
        boxShadow: isActive ? "0 0 0 1px rgba(250, 204, 21, 0.25)" : undefined,
        transform: isActive ? "translateY(-1px)" : undefined,
      }}
    >
      <span style={labelStyle}>Rank</span>
      <strong style={valueStyle}>{formatRankValue(rank)}</strong>
      {deltaLabel ? (
        <span
          style={{
            ...deltaBaseStyle,
            ...(isNegativeDelta ? deltaNegativeStyle : deltaPositiveStyle),
          }}
        >
          {deltaLabel}
        </span>
      ) : null}
    </span>
  );
}

