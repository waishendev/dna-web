/* eslint-disable @next/next/no-img-element */

import { CSSProperties } from "react";
import { getApiBaseUrl } from "@/lib/api";

type MonsterAvatarProps = {
  id: string;
  size?: number;
};

const imageStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
  objectFit: "contain",
};

export default function MonsterAvatar({ id, size = 96 }: MonsterAvatarProps) {
  const base = getApiBaseUrl();
  const path = `/monsters/${encodeURIComponent(id)}/avatar`;
  const src = base ? `${base}${path}` : path;

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
