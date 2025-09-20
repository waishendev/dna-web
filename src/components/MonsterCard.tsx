"use client";

import { CSSProperties, ReactNode } from "react";
import MonsterAvatar from "./MonsterAvatar";
import RankBadge from "./RankBadge";
import { MonsterData, MonsterGene } from "@/lib/monsters";

export type StatChange = {
  delta?: number | null;
  changed?: boolean;
};

export type StatChangeMap = Partial<Record<"atk" | "def" | "spd" | "hp" | "rank", StatChange>>;

type MonsterCardProps = {
  monster: MonsterData;
  footer?: ReactNode;
  highlight?: boolean;
  statHighlights?: StatChangeMap | null;
};

const cardStyle: CSSProperties = {
  width: "100%",
  borderRadius: "18px",
  padding: "1.75rem",
  background: "rgba(15, 23, 42, 0.55)",
  color: "#f8fafc",
  boxShadow: "0 20px 45px rgba(15, 23, 42, 0.3)",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
  height: "100%",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

const avatarWrapperStyle: CSSProperties = {
  alignSelf: "center",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0.8rem",
  borderRadius: "999px",
  background: "rgba(15, 23, 42, 0.58)",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  boxShadow: "0 24px 48px rgba(15, 23, 42, 0.38)",
  overflow: "hidden",
  transition: "box-shadow 0.2s ease, border 0.2s ease, background 0.2s ease",
};

const headerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
};

const badgeRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "0.5rem",
};

const badgeStyle: CSSProperties = {
  alignSelf: "flex-start",
  padding: "0.35rem 0.7rem",
  borderRadius: "999px",
  background: "rgba(37, 99, 235, 0.24)",
  color: "#bfdbfe",
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  fontSize: "1.6rem",
  fontWeight: 700,
  lineHeight: 1.2,
};

const subtitleStyle: CSSProperties = {
  fontSize: "0.95rem",
  opacity: 0.75,
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "0.95rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  opacity: 0.75,
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "0.85rem",
};

const battleStatsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "0.85rem",
};

const statCardStyle: CSSProperties = {
  borderRadius: "14px",
  padding: "0.85rem 1rem",
  background: "rgba(15, 23, 42, 0.45)",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  display: "flex",
  flexDirection: "column",
  gap: "0.3rem",
};

const statCardPositiveHighlightStyle: CSSProperties = {
  border: "1px solid rgba(250, 204, 21, 0.55)",
  boxShadow: "0 0 0 1px rgba(250, 204, 21, 0.2)",
  background: "rgba(250, 204, 21, 0.12)",
};

const statCardNegativeHighlightStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.55)",
  boxShadow: "0 0 0 1px rgba(248, 113, 113, 0.22)",
  background: "rgba(248, 113, 113, 0.12)",
};

const statLabelStyle: CSSProperties = {
  fontSize: "0.78rem",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  opacity: 0.6,
};

const statValueStyle: CSSProperties = {
  fontSize: "1.15rem",
  fontWeight: 700,
};

const statValuePositiveHighlightStyle: CSSProperties = {
  color: "#fef08a",
  textShadow: "0 0 18px rgba(250, 204, 21, 0.45)",
};

const statValueNegativeHighlightStyle: CSSProperties = {
  color: "#fecaca",
  textShadow: "0 0 18px rgba(248, 113, 113, 0.42)",
};

const statDeltaStyle: CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: 700,
  letterSpacing: "0.04em",
};

const statDeltaPositiveStyle: CSSProperties = {
  color: "#facc15",
  textShadow: "0 0 12px rgba(250, 204, 21, 0.38)",
};

const statDeltaNegativeStyle: CSSProperties = {
  color: "#fca5a5",
  textShadow: "0 0 12px rgba(248, 113, 113, 0.35)",
};

const geneListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.6rem",
};

const geneChipStyle: CSSProperties = {
  padding: "0.45rem 0.85rem",
  borderRadius: "999px",
  background: "rgba(59, 130, 246, 0.22)",
  color: "#dbeafe",
  fontSize: "0.82rem",
  fontWeight: 600,
  letterSpacing: "0.02em",
  lineHeight: 1.2,
};

const emptyGeneStyle: CSSProperties = {
  opacity: 0.65,
  fontSize: "0.85rem",
};

function resolveGeneLabel(gene: MonsterGene, index: number): string {
  if (gene == null) {
    return `基因 ${index + 1}`;
  }

  if (typeof gene === "string" || typeof gene === "number") {
    const label = String(gene).trim();
    return label.length > 0 ? label : `基因 ${index + 1}`;
  }

  if (typeof gene === "object") {
    const labelLikeKeys = ["label", "name", "trait", "title"];
    for (const key of labelLikeKeys) {
      const value = gene[key];
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    }

    if ("type" in gene) {
      const typeValue = gene.type;
      const valueValue = "value" in gene ? gene.value : undefined;
      if (typeof typeValue === "string" && typeValue.trim().length > 0) {
        const typeText = typeValue.trim();
        if (typeof valueValue === "string" && valueValue.trim().length > 0) {
          return `${typeText}: ${valueValue.trim()}`;
        }
        return typeText;
      }
    }

    const firstPrimitive = Object.values(gene).find((value) => {
      if (typeof value === "string") {
        return value.trim().length > 0;
      }
      if (typeof value === "number") {
        return Number.isFinite(value);
      }
      return false;
    });

    if (typeof firstPrimitive === "string") {
      return firstPrimitive.trim();
    }
    if (typeof firstPrimitive === "number") {
      return String(firstPrimitive);
    }
  }

  return `基因 ${index + 1}`;
}

function formatNumber(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return "--";
}

function formatDeltaValue(delta: number): string {
  const formatted = Number.isInteger(delta)
    ? delta.toString()
    : delta.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  if (delta > 0 && !formatted.startsWith("+")) {
    return `+${formatted}`;
  }
  return formatted;
}

function formatLevel(level: unknown): string {
  if (typeof level === "number" && Number.isFinite(level)) {
    return `Lv. ${level}`;
  }

  if (typeof level === "string" && level.trim().length > 0) {
    return level.startsWith("Lv.") ? level : `Lv. ${level.trim()}`;
  }

  return "未知";
}

function formatRarity(rarity: unknown): string {
  if (typeof rarity === "string" && rarity.trim().length > 0) {
    return rarity.trim();
  }

  return "未知";
}

const MonsterCard = ({ monster, footer, highlight = false, statHighlights }: MonsterCardProps) => {
  const idLabel = `#${monster.id}`;
  const displayName = monster.name ?? monster.nickname ?? null;
  const species = monster.species ?? "未知物种";
  const rarity = formatRarity(monster.rarity);
  const level = formatLevel(monster.level);
  const energy = formatNumber(monster.energy);
  const genes = Array.isArray(monster.genes) ? monster.genes : [];
  const rankHighlight = statHighlights?.rank;
  const rankDelta = rankHighlight?.delta ?? null;
  const rankActive = Boolean(rankHighlight?.changed || (rankDelta != null && rankDelta !== 0));
  const rankValue = monster.rank;
  const hasRank =
    rankValue != null && !(typeof rankValue === "string" && rankValue.trim().length === 0);
  const battleStats = [
    { key: "atk" as const, label: "攻击", value: monster.atk },
    { key: "def" as const, label: "防御", value: monster.def },
    { key: "spd" as const, label: "速度", value: monster.spd },
    { key: "hp" as const, label: "生命", value: monster.hp },
  ];
  const hasBattleStats = battleStats.some(({ value }) => value != null);

  return (
    <article
      style={{
        ...cardStyle,
        transform: highlight ? "translateY(-4px)" : undefined,
        boxShadow: highlight
          ? "0 28px 60px rgba(37, 99, 235, 0.35)"
          : cardStyle.boxShadow,
        border: highlight
          ? "1px solid rgba(59, 130, 246, 0.5)"
          : cardStyle.border,
      }}
    >
      <div
        style={{
          ...avatarWrapperStyle,
          border: highlight
            ? "1px solid rgba(59, 130, 246, 0.48)"
            : avatarWrapperStyle.border,
          background: highlight
            ? "rgba(59, 130, 246, 0.18)"
            : avatarWrapperStyle.background,
          boxShadow: highlight
            ? "0 32px 60px rgba(37, 99, 235, 0.38)"
            : avatarWrapperStyle.boxShadow,
        }}
      >
        <MonsterAvatar id={String(monster.id)} />
      </div>
      <header style={headerStyle}>
        <div style={badgeRowStyle}>
          <span style={badgeStyle}>{idLabel}</span>
          {hasRank || rankActive ? (
            <RankBadge
              rank={rankValue}
              highlight={rankActive}
              delta={rankDelta}
              changed={Boolean(rankHighlight?.changed)}
            />
          ) : null}
        </div>
        {displayName ? <span style={subtitleStyle}>{displayName}</span> : null}
        <h2 style={titleStyle}>{species}</h2>
      </header>

      <section>
        <h3 style={sectionTitleStyle}>基础属性</h3>
        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <span style={statLabelStyle}>稀有度</span>
            <strong style={statValueStyle}>{rarity}</strong>
          </div>
          <div style={statCardStyle}>
            <span style={statLabelStyle}>等级</span>
            <strong style={statValueStyle}>{level}</strong>
          </div>
          <div style={statCardStyle}>
            <span style={statLabelStyle}>能量</span>
            <strong style={statValueStyle}>{energy}</strong>
          </div>
        </div>
      </section>

      {hasBattleStats ? (
        <section>
          <h3 style={sectionTitleStyle}>战斗属性</h3>
          <div style={battleStatsGridStyle}>
            {battleStats.map(({ key, label, value }) => {
              const highlightInfo = statHighlights?.[key];
              const delta = highlightInfo?.delta ?? null;
              const hasDelta = delta != null && delta !== 0;
              const isNegative = delta != null && delta < 0;
              const isActive = Boolean(highlightInfo?.changed || hasDelta);
              const cardHighlightStyle = isNegative
                ? statCardNegativeHighlightStyle
                : statCardPositiveHighlightStyle;
              const valueHighlightStyle = isNegative
                ? statValueNegativeHighlightStyle
                : statValuePositiveHighlightStyle;
              const deltaHighlightStyle = isNegative
                ? statDeltaNegativeStyle
                : statDeltaPositiveStyle;

              return (
                <div
                  key={key}
                  style={{
                    ...statCardStyle,
                    ...(isActive ? cardHighlightStyle : null),
                  }}
                >
                  <span style={statLabelStyle}>{label}</span>
                  <strong
                    style={{
                      ...statValueStyle,
                      ...(isActive ? valueHighlightStyle : null),
                    }}
                  >
                    {formatNumber(value)}
                  </strong>
                  {hasDelta ? (
                    <span style={{ ...statDeltaStyle, ...deltaHighlightStyle }}>
                      {formatDeltaValue(delta)}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section>
        <h3 style={sectionTitleStyle}>基因</h3>
        {genes.length > 0 ? (
          <div style={geneListStyle}>
            {genes.map((gene, index) => (
              <span key={index} style={geneChipStyle}>
                {resolveGeneLabel(gene, index)}
              </span>
            ))}
          </div>
        ) : (
          <p style={emptyGeneStyle}>暂无基因数据</p>
        )}
      </section>

      {footer ? footer : null}
    </article>
  );
};

export default MonsterCard;
