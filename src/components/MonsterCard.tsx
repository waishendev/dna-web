"use client";

import { CSSProperties, ReactNode } from "react";
import { MonsterData, MonsterGene } from "@/lib/monsters";

type MonsterCardProps = {
  monster: MonsterData;
  footer?: ReactNode;
  highlight?: boolean;
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

const headerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
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

const statCardStyle: CSSProperties = {
  borderRadius: "14px",
  padding: "0.85rem 1rem",
  background: "rgba(15, 23, 42, 0.45)",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  display: "flex",
  flexDirection: "column",
  gap: "0.3rem",
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

const MonsterCard = ({ monster, footer, highlight = false }: MonsterCardProps) => {
  const idLabel = `#${monster.id}`;
  const displayName = monster.name ?? monster.nickname ?? null;
  const species = monster.species ?? "未知物种";
  const rarity = formatRarity(monster.rarity);
  const level = formatLevel(monster.level);
  const energy = formatNumber(monster.energy);
  const genes = Array.isArray(monster.genes) ? monster.genes : [];

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
      <header style={headerStyle}>
        <span style={badgeStyle}>{idLabel}</span>
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
