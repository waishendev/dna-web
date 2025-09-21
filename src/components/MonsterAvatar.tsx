/* eslint-disable @next/next/no-img-element */

import { CSSProperties } from "react";
import { getApiBaseUrl } from "@/lib/api";

type MonsterAvatarProps = {
  id: string;
  size?: number;
  appearanceRevision?: number | string | null;
};

const imageStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
  objectFit: "contain",
};

export default function MonsterAvatar({ id, size = 96, appearanceRevision }: MonsterAvatarProps) {
  const base = getApiBaseUrl();
  const path = `/monsters/${encodeURIComponent(id)}/avatar`;
  const revisionValue =
    typeof appearanceRevision === "number"
      ? Number.isFinite(appearanceRevision)
        ? String(appearanceRevision)
        : null
      : typeof appearanceRevision === "string"
        ? appearanceRevision.trim() || null
        : null;
  const baseSrc = base ? `${base}${path}` : path;
  const src = revisionValue ? `${baseSrc}?rev=${encodeURIComponent(revisionValue)}` : baseSrc;

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt="Monster avatar"
      style={imageStyle}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}
