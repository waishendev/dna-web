"use client";

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { parseBagItems, type BagItemRecord } from "@/lib/items";
import {
  formatBalance,
  getNumericBalance,
  normalizeWallet,
  resolveCurrency,
  type WalletData,
} from "@/lib/wallet";

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

const infoPanelStyle: CSSProperties = {
  borderRadius: "20px",
  border: "1px solid rgba(148, 163, 184, 0.26)",
  background: "rgba(15, 23, 42, 0.5)",
  padding: "1.8rem",
  display: "flex",
  flexDirection: "column",
  gap: "1.25rem",
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

const statusMessageStyle: CSSProperties = {
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

const errorMessageStyle: CSSProperties = {
  padding: "0.95rem 1.1rem",
  borderRadius: "12px",
  border: "1px solid rgba(248, 113, 113, 0.4)",
  background: "rgba(239, 68, 68, 0.16)",
  color: "#fecaca",
  fontSize: "0.95rem",
  lineHeight: 1.6,
};

const shopGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "1.6rem",
};

const shopCardStyle: CSSProperties = {
  borderRadius: "18px",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  background: "rgba(15, 23, 42, 0.48)",
  padding: "1.6rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  transition: "transform 0.15s ease, box-shadow 0.15s ease, border 0.15s ease",
};

const shopCardHeaderStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.45rem",
};

const shopCardTitleStyle: CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 700,
};

const shopCardDescriptionStyle: CSSProperties = {
  fontSize: "0.95rem",
  lineHeight: 1.6,
  opacity: 0.78,
};

const priceTagStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  padding: "0.45rem 0.75rem",
  borderRadius: "999px",
  border: "1px solid rgba(45, 212, 191, 0.45)",
  background: "rgba(16, 185, 129, 0.18)",
  color: "#99f6e4",
  fontSize: "0.9rem",
  fontWeight: 600,
};

const shopCardFooterStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "0.75rem",
};

const buyButtonStyle: CSSProperties = {
  padding: "0.75rem 1.25rem",
  borderRadius: "12px",
  border: "1px solid rgba(236, 72, 153, 0.35)",
  background: "rgba(236, 72, 153, 0.2)",
  color: "#fbcfe8",
  fontWeight: 600,
  fontSize: "0.95rem",
  cursor: "pointer",
  transition: "opacity 0.2s ease, transform 0.2s ease",
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.55,
  cursor: "not-allowed",
};

const placeholderStyle: CSSProperties = {
  borderRadius: "16px",
  border: "1px dashed rgba(148, 163, 184, 0.32)",
  background: "rgba(15, 23, 42, 0.42)",
  padding: "1.5rem",
  textAlign: "center",
  fontSize: "0.95rem",
  color: "#94a3b8",
};

const dialogOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.72)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
  padding: "1.5rem",
};

const dialogCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  borderRadius: "20px",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  background: "rgba(15, 23, 42, 0.95)",
  padding: "2rem",
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
  boxShadow: "0 28px 60px rgba(15, 23, 42, 0.48)",
};

const dialogTitleStyle: CSSProperties = {
  fontSize: "1.4rem",
  fontWeight: 700,
};

const dialogLabelStyle: CSSProperties = {
  fontSize: "0.95rem",
  opacity: 0.78,
};

const dialogInputStyle: CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.32)",
  background: "rgba(15, 23, 42, 0.6)",
  color: "#f8fafc",
  fontSize: "1rem",
  fontWeight: 600,
};

const dialogActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.75rem",
};

const cancelButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  padding: "0.65rem 1.2rem",
};

const confirmButtonStyle: CSSProperties = {
  ...buyButtonStyle,
  padding: "0.75rem 1.6rem",
};

type ShopItemRecord = {
  id: string | number;
  identifier: string;
  name?: string;
  description?: string;
  price: number | null;
  priceLabel?: string | null;
  currency?: string | null;
  stock?: number | null;
  imageUrl?: string | null;
  tags?: string[];
  raw: Record<string, unknown>;
};

type PurchaseCandidate = {
  url: string;
  method?: string;
  body?: Record<string, unknown>;
  headers?: HeadersInit;
  allowRetryOn400?: boolean;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function toMaybeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const normalized = trimmed.replace(/[,\s]+/g, "");
    const parsed = Number(normalized);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
}

function toMaybeString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function toMaybeStringArray(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    const items = value
      .map((entry) => toMaybeString(entry))
      .filter((entry): entry is string => entry != null);

    return items.length > 0 ? items : null;
  }

  if (typeof value === "string") {
    const parts = value
      .split(/[,/|]/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    return parts.length > 0 ? parts : null;
  }

  return null;
}

function pickFirstString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = toMaybeString(record[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

function pickFirstNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = toMaybeNumber(record[key]);
    if (value != null) {
      return value;
    }
  }

  return null;
}

function pickFirstStringArray(record: Record<string, unknown>, keys: string[]): string[] | null {
  for (const key of keys) {
    const value = toMaybeStringArray(record[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

const ID_CANDIDATES = [
  "id",
  "itemId",
  "item_id",
  "uuid",
  "tokenId",
  "token_id",
  "key",
  "code",
  "slug",
  "identifier",
  "itemKey",
  "item_key",
  "sku",
  "productId",
  "product_id",
];

const IDENTIFIER_CANDIDATES = [
  "identifier",
  "item",
  "itemId",
  "item_id",
  "itemKey",
  "item_key",
  "itemCode",
  "item_code",
  "itemSlug",
  "item_slug",
  "slug",
  "code",
  "key",
  "type",
  "name",
  "label",
];

const NAME_CANDIDATES = ["name", "itemName", "title", "label", "displayName", "productName"];
const DESCRIPTION_CANDIDATES = [
  "description",
  "desc",
  "details",
  "info",
  "text",
  "summary",
  "content",
];

const PRICE_CANDIDATES = [
  "price",
  "cost",
  "amount",
  "value",
  "coinCost",
  "coin_cost",
  "coinPrice",
  "coin_price",
  "coins",
  "coin",
  "unitPrice",
  "unit_price",
  "priceCoins",
  "price_coins",
  "priceValue",
  "price_value",
];

const CURRENCY_CANDIDATES = ["currency", "symbol", "unit", "coinUnit", "coin_unit", "denom"];
const STOCK_CANDIDATES = ["stock", "quantity", "qty", "available", "remain", "remaining", "count"];
const TAG_CANDIDATES = ["tags", "labels", "attributes", "properties", "types"];
const IMAGE_CANDIDATES = [
  "image",
  "imageUrl",
  "imageURL",
  "img",
  "icon",
  "thumbnail",
  "thumb",
  "picture",
  "art",
  "avatar",
  "cover",
  "preview",
];

function extractImageUrl(record: Record<string, unknown>): string | null {
  for (const key of IMAGE_CANDIDATES) {
    const value = record[key];
    const asString = toMaybeString(value);
    if (asString) {
      return asString;
    }

    if (isPlainObject(value)) {
      const nested = pickFirstString(value, ["url", "href", "src", "path"]);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

function extractItemId(record: Record<string, unknown>, fallbackId: string): string | number {
  for (const key of ID_CANDIDATES) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") {
      return value;
    }
  }

  const name = toMaybeString(record.name);
  if (name) {
    return name;
  }

  return fallbackId;
}

function extractIdentifier(
  record: Record<string, unknown>,
  id: string | number,
  fallbackId: string,
): string {
  for (const key of IDENTIFIER_CANDIDATES) {
    const value = toMaybeString(record[key]);
    if (value) {
      return value;
    }
  }

  if (typeof id === "string") {
    const trimmed = id.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return String(id ?? fallbackId);
}

function looksLikeShopItem(record: Record<string, unknown>): boolean {
  for (const key of PRICE_CANDIDATES) {
    if (record[key] != null) {
      return true;
    }
  }

  for (const key of IDENTIFIER_CANDIDATES) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return true;
    }
  }

  for (const key of NAME_CANDIDATES) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return true;
    }
  }

  return false;
}

const IGNORED_MAP_KEYS = new Set(["message", "error", "status", "success", "code"]);

function convertKeyedRecordToArray(record: Record<string, unknown>): Record<string, unknown>[] {
  const entries: Record<string, unknown>[] = [];

  for (const [key, value] of Object.entries(record)) {
    if (!key || IGNORED_MAP_KEYS.has(key)) {
      continue;
    }

    if (Array.isArray(value)) {
      continue;
    }

    if (isPlainObject(value)) {
      entries.push({ key, ...value });
      continue;
    }

    const quantity = toMaybeNumber(value);
    if (quantity != null) {
      entries.push({ key, quantity });
      continue;
    }

    const maybeString = toMaybeString(value);
    if (maybeString) {
      entries.push({ key, name: maybeString });
    }
  }

  return entries;
}

function collectShopEntries(source: unknown, bucket: Record<string, unknown>[]): void {
  if (Array.isArray(source)) {
    for (const entry of source) {
      collectShopEntries(entry, bucket);
    }
    return;
  }

  if (!isPlainObject(source)) {
    return;
  }

  if (looksLikeShopItem(source)) {
    bucket.push(source);
    return;
  }

  const candidateKeys = [
    "items",
    "goods",
    "products",
    "shop",
    "store",
    "catalog",
    "data",
    "list",
    "records",
    "results",
    "entries",
    "inventory",
  ];

  let matched = false;

  for (const key of candidateKeys) {
    const nested = source[key];
    if (nested == null) {
      continue;
    }

    if (Array.isArray(nested)) {
      matched = true;
      for (const entry of nested) {
        collectShopEntries(entry, bucket);
      }
      continue;
    }

    if (isPlainObject(nested)) {
      const converted = convertKeyedRecordToArray(nested);
      if (converted.length > 0) {
        matched = true;
        for (const entry of converted) {
          collectShopEntries(entry, bucket);
        }
      }
    }
  }

  if (!matched) {
    const converted = convertKeyedRecordToArray(source);
    if (converted.length > 0) {
      for (const entry of converted) {
        collectShopEntries(entry, bucket);
      }
    }
  }
}

function extractPriceInfo(record: Record<string, unknown>): {
  price: number | null;
  label: string | null;
  currency: string | null;
} {
  let price: number | null = null;
  let label: string | null = null;
  let currency: string | null = pickFirstString(record, CURRENCY_CANDIDATES);

  for (const key of PRICE_CANDIDATES) {
    const value = record[key];
    const numeric = toMaybeNumber(value);
    if (numeric != null) {
      price = numeric;
      break;
    }

    const text = toMaybeString(value);
    if (text) {
      label = text;
      if (price == null) {
        const extracted = Number(text.replace(/[^0-9.\-]+/g, ""));
        if (!Number.isNaN(extracted) && Number.isFinite(extracted)) {
          price = extracted;
        }
      }
    }

    if (isPlainObject(value)) {
      const nestedNumeric = pickFirstNumber(value, PRICE_CANDIDATES);
      if (nestedNumeric != null) {
        price = nestedNumeric;
        currency = currency ?? pickFirstString(value, CURRENCY_CANDIDATES);
        break;
      }
      const nestedText = pickFirstString(value, PRICE_CANDIDATES);
      if (nestedText) {
        label = nestedText;
      }
    }
  }

  if (!currency) {
    currency = pickFirstString(record, ["coinType", "coin_type", "currencyLabel", "currency_label"]);
  }

  if (price != null && !label) {
    const formatter = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 });
    label = `${formatter.format(price)} ${currency ?? "coins"}`;
  }

  if (!label && currency) {
    label = currency;
  }

  return { price, label, currency };
}

function normalizeShopItem(raw: unknown, fallbackId: string): ShopItemRecord | null {
  if (!isPlainObject(raw)) {
    return null;
  }

  const id = extractItemId(raw, fallbackId);
  const identifier = extractIdentifier(raw, id, fallbackId);
  const name = pickFirstString(raw, NAME_CANDIDATES) ?? undefined;
  const description = pickFirstString(raw, DESCRIPTION_CANDIDATES) ?? undefined;
  const { price, label, currency } = extractPriceInfo(raw);
  const stock = pickFirstNumber(raw, STOCK_CANDIDATES);
  const tags = pickFirstStringArray(raw, TAG_CANDIDATES) ?? undefined;
  const imageUrl = extractImageUrl(raw) ?? undefined;

  const item: ShopItemRecord = {
    id,
    identifier,
    price,
    raw,
  };

  if (name) {
    item.name = name;
  }

  if (description) {
    item.description = description;
  }

  if (label) {
    item.priceLabel = label;
  }

  if (currency) {
    item.currency = currency;
  }

  if (stock != null) {
    item.stock = stock;
  }

  if (tags) {
    item.tags = tags;
  }

  if (imageUrl) {
    item.imageUrl = imageUrl;
  }

  return item;
}

function parseShopItems(payload: unknown): ShopItemRecord[] {
  const rawItems: unknown[] = [];
  collectShopEntries(payload, rawItems);

  return rawItems
    .map((item, index) => normalizeShopItem(item, `shop-item-${index + 1}`))
    .filter((item): item is ShopItemRecord => item != null);
}

async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.clone().json();
    const message = extractMessage(data);
    if (message) {
      return message;
    }
  } catch {
    // ignore JSON parse errors
  }

  try {
    const text = await response.clone().text();
    const trimmed = text.trim();
    if (trimmed) {
      return trimmed;
    }
  } catch {
    // ignore text parse errors
  }

  return fallback;
}

function extractMessage(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const message = extractMessage(entry);
      if (message) {
        return message;
      }
    }
    return null;
  }

  if (isPlainObject(value)) {
    const candidates = ["message", "error", "detail", "msg", "description", "status"];
    for (const key of candidates) {
      const candidate = value[key];
      if (typeof candidate === "string") {
        const trimmed = candidate.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      }
    }

    const nestedKeys = ["data", "result", "payload", "response", "body"];
    for (const key of nestedKeys) {
      const nested = value[key];
      const message = extractMessage(nested);
      if (message) {
        return message;
      }
    }
  }

  return null;
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === "string") {
    return error || fallback;
  }

  return fallback;
}

const BASIC_FOOD_FALLBACK: ShopItemRecord = {
  id: "basic-food",
  identifier: "basic-food",
  name: "基础饲料",
  description: "最常见的怪兽饲料，可以快速补充少量能量。",
  price: null,
  priceLabel: "价格将在购买时结算",
  currency: "coins",
  raw: { identifier: "basic-food" },
};

function buildPurchaseBody(item: ShopItemRecord, quantity: number): Record<string, unknown> {
  return {
    item: item.identifier,
    identifier: item.identifier,
    itemId: item.identifier,
    item_id: item.identifier,
    itemKey: item.identifier,
    item_key: item.identifier,
    code: item.identifier,
    type: item.identifier,
    slug: item.identifier,
    productId: item.id,
    product_id: item.id,
    quantity,
    qty: quantity,
    amount: quantity,
    count: quantity,
  };
}

function buildPurchaseCandidates(item: ShopItemRecord, quantity: number): PurchaseCandidate[] {
  const encoded = encodeURIComponent(item.identifier);
  const body = buildPurchaseBody(item, quantity);
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const candidates: PurchaseCandidate[] = [
    { url: "/shop/purchase", method: "POST", body, headers },
    { url: "/shop/buy", method: "POST", body, headers },
    { url: "/shop/order", method: "POST", body, headers },
    { url: `/shop/${encoded}/purchase`, method: "POST", body, headers },
    { url: `/shop/${encoded}/buy`, method: "POST", body, headers },
    { url: `/shop/${encoded}`, method: "POST", body, headers, allowRetryOn400: true },
    { url: `/shop/items/${encoded}`, method: "POST", body, headers },
    { url: `/store/purchase`, method: "POST", body, headers },
    { url: `/store/buy`, method: "POST", body, headers },
  ];

  return candidates;
}

async function performPurchase(item: ShopItemRecord, quantity: number): Promise<Response> {
  const fallbackMessage = "购买失败，请稍后再试。";
  const candidates = buildPurchaseCandidates(item, quantity);
  let lastError: string | null = null;

  for (const candidate of candidates) {
    try {
      const response = await apiFetch(candidate.url, {
        method: candidate.method ?? "POST",
        headers: candidate.headers,
        body: candidate.body ? JSON.stringify(candidate.body) : undefined,
      });

      if (response.ok) {
        return response;
      }

      const message = await extractErrorMessage(response, fallbackMessage);
      lastError = message;

      if (
        response.status === 404 ||
        response.status === 405 ||
        response.status === 501 ||
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
    }
  }

  throw new Error(lastError ?? fallbackMessage);
}

async function fetchShopCatalog(): Promise<ShopItemRecord[]> {
  const fallbackMessage = "无法加载商店列表，请稍后再试。";
  const endpoints = [
    "/shop/items",
    "/shop/catalog",
    "/shop",
    "/store/items",
    "/store/catalog",
    "/store",
  ];

  let lastError: string | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await apiFetch(endpoint, { cache: "no-store" });
      if (!response.ok) {
        if (response.status === 404 || response.status === 405 || response.status === 501) {
          continue;
        }
        const message = await extractErrorMessage(response, fallbackMessage);
        throw new Error(message);
      }

      let payload: unknown = [];
      if (response.status !== 204) {
        payload = await response.json();
      }

      const items = parseShopItems(payload);
      if (items.length > 0) {
        return items;
      }
    } catch (err) {
      if (err instanceof Error) {
        lastError = err.message;
      } else {
        lastError = String(err);
      }
    }
  }

  if (lastError) {
    throw new Error(lastError);
  }

  return [];
}

function sortShopItems(a: ShopItemRecord, b: ShopItemRecord): number {
  if (a.identifier === "basic-food") {
    return -1;
  }
  if (b.identifier === "basic-food") {
    return 1;
  }

  if (a.price != null && b.price != null && a.price !== b.price) {
    return a.price - b.price;
  }

  const nameA = (a.name ?? a.identifier ?? "").toString();
  const nameB = (b.name ?? b.identifier ?? "").toString();
  return nameA.localeCompare(nameB, "zh-CN");
}

function formatQuantity(quantity: number): string {
  const safe = Number.isFinite(quantity) ? quantity : 0;
  return new Intl.NumberFormat("zh-CN").format(Math.max(0, Math.floor(safe)));
}

const WALLET_HINT_KEYS = ["balance", "coins", "available", "total", "amount", "wallet"];

function looksLikeWalletRecord(record: Record<string, unknown>): boolean {
  for (const key of WALLET_HINT_KEYS) {
    if (record[key] != null) {
      return true;
    }
  }
  return false;
}

function extractWalletPayload(payload: unknown): unknown | null {
  if (Array.isArray(payload)) {
    for (const entry of payload) {
      const result = extractWalletPayload(entry);
      if (result) {
        return result;
      }
    }
    return null;
  }

  if (!isPlainObject(payload)) {
    return null;
  }

  if (payload.wallet && isPlainObject(payload.wallet)) {
    return payload.wallet;
  }

  if (looksLikeWalletRecord(payload)) {
    return payload;
  }

  const candidateKeys = ["data", "result", "payload", "response", "body"];
  for (const key of candidateKeys) {
    const nested = payload[key];
    const result = extractWalletPayload(nested);
    if (result) {
      return result;
    }
  }

  return null;
}

export default function ShopPage() {
  const router = useRouter();
  const mountedRef = useRef(false);

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isWalletLoading, setIsWalletLoading] = useState(true);

  const [inventoryItems, setInventoryItems] = useState<BagItemRecord[]>([]);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [isInventoryLoading, setIsInventoryLoading] = useState(true);
  const [isInventorySyncing, setIsInventorySyncing] = useState(false);

  const [shopItems, setShopItems] = useState<ShopItemRecord[]>([]);
  const [shopError, setShopError] = useState<string | null>(null);
  const [isShopLoading, setIsShopLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItemRecord | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState("1");
  const [purchaseFeedback, setPurchaseFeedback] = useState<ActionFeedback | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchWallet = useCallback(async () => {
    if (!mountedRef.current) {
      return;
    }

    setIsWalletLoading(true);
    setWalletError(null);

    try {
      const response = await apiFetch("/wallet", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = normalizeWallet(await response.json());
      if (!mountedRef.current) {
        return;
      }

      setWallet(data);
    } catch (err) {
      console.error("Failed to fetch wallet for shop", err);
      if (!mountedRef.current) {
        return;
      }

      setWallet(null);
      setWalletError("无法获取钱包余额，请稍后重试。");
    } finally {
      if (mountedRef.current) {
        setIsWalletLoading(false);
      }
    }
  }, []);

  const applyInventoryItems = useCallback((items: BagItemRecord[]) => {
    setInventoryItems(items);
  }, []);

  const fetchInventory = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!mountedRef.current) {
        return;
      }

      const silent = options?.silent ?? false;
      if (silent) {
        setIsInventorySyncing(true);
      } else {
        setIsInventoryLoading(true);
      }
      setInventoryError(null);

      try {
        const response = await apiFetch("/bag", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        let payload: unknown = [];
        if (response.status !== 204) {
          payload = await response.json();
        }

        const items = parseBagItems(payload);
        if (!mountedRef.current) {
          return;
        }

        applyInventoryItems(items);
      } catch (err) {
        console.error("Failed to fetch inventory for shop", err);
        if (!mountedRef.current) {
          return;
        }

        setInventoryItems([]);
        setInventoryError("无法加载背包信息，请稍后重试。");
      } finally {
        if (!mountedRef.current) {
          return;
        }

        if (silent) {
          setIsInventorySyncing(false);
        } else {
          setIsInventoryLoading(false);
        }
      }
    },
    [applyInventoryItems],
  );

  const fetchShopItems = useCallback(async () => {
    if (!mountedRef.current) {
      return;
    }

    setIsShopLoading(true);
    setShopError(null);

    try {
      const items = await fetchShopCatalog();
      if (!mountedRef.current) {
        return;
      }

      if (items.length === 0) {
        setShopItems([BASIC_FOOD_FALLBACK]);
      } else {
        const sorted = [...items].sort(sortShopItems);
        setShopItems(sorted);
      }
    } catch (err) {
      console.error("Failed to fetch shop catalog", err);
      if (!mountedRef.current) {
        return;
      }

      setShopItems([BASIC_FOOD_FALLBACK]);
      setShopError("无法加载商店列表，已显示基础商品。");
    } finally {
      if (mountedRef.current) {
        setIsShopLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/");
      return;
    }

    void fetchWallet();
    void fetchInventory();
    void fetchShopItems();
  }, [router, fetchWallet, fetchInventory, fetchShopItems]);

  const basicFoodBagItem = useMemo(
    () => inventoryItems.find((item) => item.identifier === "basic-food") ?? null,
    [inventoryItems],
  );

  const bagSummary = useMemo(() => {
    if (isInventoryLoading) {
      return "加载中…";
    }

    if (inventoryItems.length === 0) {
      return "背包暂无道具";
    }

    const total = inventoryItems.reduce((sum, item) => sum + Math.max(0, item.quantity), 0);
    return `${inventoryItems.length} 类道具 · 共 ${formatQuantity(total)} 件`;
  }, [isInventoryLoading, inventoryItems]);

  const walletBalance = getNumericBalance(wallet);
  const walletBalanceLabel = wallet ? formatBalance(wallet) : "--";
  const walletCurrencyLabel = wallet ? resolveCurrency(wallet) ?? "coins" : "coins";

  const handleRefreshWallet = useCallback(() => {
    void fetchWallet();
  }, [fetchWallet]);

  const handleRefreshInventory = useCallback(() => {
    void fetchInventory();
  }, [fetchInventory]);

  const handleRefreshShop = useCallback(() => {
    void fetchShopItems();
  }, [fetchShopItems]);

  const handleOpenDialog = useCallback((item: ShopItemRecord) => {
    setSelectedItem(item);
    setPurchaseQuantity("1");
    setPurchaseFeedback(null);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    if (isPurchasing) {
      return;
    }
    setDialogOpen(false);
    setSelectedItem(null);
    setPurchaseFeedback(null);
  }, [isPurchasing]);

  const parsedQuantity = useMemo(() => {
    const value = Number.parseInt(purchaseQuantity, 10);
    if (!Number.isNaN(value) && Number.isFinite(value)) {
      return value;
    }
    return NaN;
  }, [purchaseQuantity]);

  const purchaseQuantityValid = Number.isInteger(parsedQuantity) && parsedQuantity > 0;

  const totalCost = useMemo(() => {
    if (!selectedItem || selectedItem.price == null) {
      return null;
    }

    if (!purchaseQuantityValid) {
      return null;
    }

    return selectedItem.price * parsedQuantity;
  }, [selectedItem, parsedQuantity, purchaseQuantityValid]);

  const insufficientBalance = useMemo(() => {
    if (totalCost == null) {
      return false;
    }

    if (walletBalance == null) {
      return false;
    }

    return walletBalance < totalCost;
  }, [totalCost, walletBalance]);

  const handleConfirmPurchase = useCallback(async () => {
    if (!dialogOpen || !selectedItem) {
      return;
    }

    if (!purchaseQuantityValid) {
      setPurchaseFeedback({ type: "error", message: "请输入合法的购买数量。" });
      return;
    }

    if (parsedQuantity > 9999) {
      setPurchaseFeedback({ type: "error", message: "单次购买数量过大，请调整后再试。" });
      return;
    }

    if (insufficientBalance) {
      setPurchaseFeedback({ type: "error", message: "余额不足，无法完成购买。" });
      return;
    }

    setIsPurchasing(true);
    const itemName = selectedItem.name ?? selectedItem.identifier;
    setPurchaseFeedback({ type: "info", message: `正在购买 ${itemName}…` });

    try {
      const response = await performPurchase(selectedItem, parsedQuantity);
      let payload: unknown = null;
      if (response.status !== 204) {
        payload = await response.json();
      }

      if (!mountedRef.current) {
        return;
      }

      setPurchaseFeedback({
        type: "success",
        message: `已成功购买 ${parsedQuantity} 个 ${itemName}。`,
      });

      if (payload != null) {
        const inventoryUpdate = parseBagItems(payload);
        if (inventoryUpdate.length > 0) {
          applyInventoryItems(inventoryUpdate);
        } else {
          void fetchInventory({ silent: true });
        }
      } else {
        void fetchInventory({ silent: true });
      }

      const walletPayload = extractWalletPayload(payload);
      if (walletPayload) {
        try {
          const normalized = normalizeWallet(walletPayload);
          setWallet(normalized);
        } catch (err) {
          console.error("Failed to normalize wallet payload after purchase", err);
        }
      }

      void fetchWallet();
      void fetchShopItems();
    } catch (err) {
      console.error("Failed to purchase item", err);
      if (!mountedRef.current) {
        return;
      }

      setPurchaseFeedback({
        type: "error",
        message: resolveErrorMessage(err, "购买失败，请稍后重试。"),
      });
    } finally {
      if (mountedRef.current) {
        setIsPurchasing(false);
      }
    }
  }, [
    dialogOpen,
    selectedItem,
    purchaseQuantityValid,
    parsedQuantity,
    insufficientBalance,
    applyInventoryItems,
    fetchInventory,
    fetchWallet,
    fetchShopItems,
  ]);

  const handleQuantityChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPurchaseQuantity(event.target.value);
  }, []);

  const shopContent = useMemo(() => {
    if (isShopLoading) {
      return <div style={placeholderStyle}>正在加载商店商品…</div>;
    }

    if (shopItems.length === 0) {
      return <div style={placeholderStyle}>暂无可购买的商品。</div>;
    }

    return (
      <div style={shopGridStyle}>
        {shopItems.map((item) => {
          const name = item.name ?? item.identifier;
          const priceLabel = item.priceLabel ??
            (item.price != null
              ? `${item.price.toLocaleString("zh-CN")}`
              : "价格待定");
          const currencyLabel = item.currency ?? "coins";
          const bagItem = inventoryItems.find((entry) => entry.identifier === item.identifier);
          const quantityLabel = bagItem ? `${formatQuantity(bagItem.quantity)} 个库存` : "背包暂无库存";

          return (
            <article key={item.identifier} style={shopCardStyle}>
              <div style={shopCardHeaderStyle}>
                <h3 style={shopCardTitleStyle}>{name}</h3>
                {item.tags && item.tags.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", opacity: 0.78 }}>
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          padding: "0.25rem 0.6rem",
                          borderRadius: "999px",
                          border: "1px solid rgba(148, 163, 184, 0.32)",
                          background: "rgba(15, 23, 42, 0.35)",
                          fontSize: "0.78rem",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              {item.description ? (
                <p style={shopCardDescriptionStyle}>{item.description}</p>
              ) : (
                <p style={{ ...shopCardDescriptionStyle, opacity: 0.65 }}>
                  商品详情暂未提供，购买后可在背包查看实际效果。
                </p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <span style={priceTagStyle}>
                  <span>{priceLabel}</span>
                  <span style={{ opacity: 0.8 }}>{currencyLabel}</span>
                </span>
                {item.stock != null ? (
                  <span style={{ fontSize: "0.85rem", opacity: 0.75 }}>
                    商店库存：{formatQuantity(item.stock)}
                  </span>
                ) : null}
                <span style={{ fontSize: "0.85rem", opacity: 0.75 }}>{quantityLabel}</span>
              </div>

              <div style={shopCardFooterStyle}>
                <button
                  type="button"
                  style={buyButtonStyle}
                  onClick={() => handleOpenDialog(item)}
                >
                  购买
                </button>
                <span style={{ fontSize: "0.85rem", opacity: 0.75 }}>
                  编号：{item.identifier}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    );
  }, [isShopLoading, shopItems, inventoryItems, handleOpenDialog]);

  return (
    <main style={pageStyle}>
      <div style={contentStyle}>
        <header style={headerStyle}>
          <div style={headingStyle}>
            <h1 style={titleStyle}>商店</h1>
            <p style={descriptionStyle}>
              在这里购买日常补给。基础饲料（basic-food）可恢复怪兽能量，购买后将自动同步到背包与钱包。
            </p>
          </div>
          <div style={headerActionsStyle}>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={handleRefreshShop}
              disabled={isShopLoading}
            >
              刷新商品
            </button>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={handleRefreshInventory}
              disabled={isInventoryLoading && !isInventorySyncing}
            >
              刷新背包
            </button>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={handleRefreshWallet}
              disabled={isWalletLoading}
            >
              刷新余额
            </button>
            <Link href="/bag" style={secondaryButtonStyle}>
              查看背包
            </Link>
          </div>
        </header>

        {shopError ? (
          <div style={{ ...statusMessageStyle, ...toneStyles.error }}>{shopError}</div>
        ) : null}

        <section style={sectionsStyle}>
          <section style={infoPanelStyle}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>钱包余额</h2>
              {isWalletLoading ? <span style={badgeStyle}>同步中…</span> : null}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>
              {walletBalanceLabel}
              <span style={{ marginLeft: "0.5rem", fontSize: "1rem", opacity: 0.75 }}>
                {walletCurrencyLabel}
              </span>
            </div>
            {walletBalance != null ? (
              <p style={{ fontSize: "0.9rem", opacity: 0.78 }}>
                可用 coins：{walletBalance.toLocaleString("zh-CN")}
              </p>
            ) : null}
            {walletError ? (
              <div style={errorMessageStyle}>{walletError}</div>
            ) : (
              <p style={{ fontSize: "0.9rem", opacity: 0.75 }}>
                购买成功后会自动扣除 coins，并立即刷新余额。
              </p>
            )}
          </section>

          <section style={infoPanelStyle}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>背包概览</h2>
              {isInventorySyncing ? <span style={badgeStyle}>同步中…</span> : null}
            </div>
            <p style={{ fontSize: "0.95rem", opacity: 0.78 }}>{bagSummary}</p>
            {basicFoodBagItem ? (
              <div
                style={{
                  borderRadius: "14px",
                  border: "1px solid rgba(45, 212, 191, 0.38)",
                  background: "rgba(16, 185, 129, 0.16)",
                  padding: "1rem 1.15rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <span style={{ fontWeight: 600 }}>basic-food 库存</span>
                <span style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                  {formatQuantity(basicFoodBagItem.quantity)}
                </span>
              </div>
            ) : (
              <div style={{ ...placeholderStyle, borderStyle: "solid", padding: "1rem 1.2rem" }}>
                背包中暂未找到 basic-food，可立即购买补充。
              </div>
            )}
            {inventoryError ? <div style={errorMessageStyle}>{inventoryError}</div> : null}
          </section>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={panelTitleStyle}>商品列表</h2>
            {isShopLoading ? <span style={badgeStyle}>加载中…</span> : null}
          </div>
          {shopContent}
        </section>
      </div>

      {dialogOpen && selectedItem ? (
        <div style={dialogOverlayStyle} role="dialog" aria-modal="true">
          <div style={dialogCardStyle}>
            <div>
              <h2 style={dialogTitleStyle}>购买 {selectedItem.name ?? selectedItem.identifier}</h2>
              <p style={dialogLabelStyle}>
                请输入需要购买的数量，购买成功后道具将进入背包。
              </p>
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <span style={dialogLabelStyle}>购买数量</span>
              <input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={purchaseQuantity}
                onChange={handleQuantityChange}
                style={dialogInputStyle}
                disabled={isPurchasing}
              />
            </label>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {selectedItem.price != null ? (
                <span style={{ fontSize: "0.95rem", opacity: 0.78 }}>
                  单价：{selectedItem.price.toLocaleString("zh-CN")}{" "}
                  {selectedItem.currency ?? "coins"}
                </span>
              ) : (
                <span style={{ fontSize: "0.95rem", opacity: 0.78 }}>
                  商品价格由后端结算，提交后自动扣费。
                </span>
              )}
              {purchaseQuantityValid && totalCost != null ? (
                <span style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                  预计总价：{totalCost.toLocaleString("zh-CN")}{" "}
                  {selectedItem.currency ?? walletCurrencyLabel}
                </span>
              ) : null}
              {walletBalance != null ? (
                <span style={{ fontSize: "0.9rem", opacity: 0.7 }}>
                  当前余额：{walletBalance.toLocaleString("zh-CN")}{" "}
                  {walletCurrencyLabel}
                </span>
              ) : null}
            </div>

            {purchaseFeedback ? (
              <div style={{ ...statusMessageStyle, ...toneStyles[purchaseFeedback.type] }}>
                {purchaseFeedback.message}
              </div>
            ) : null}

            {insufficientBalance ? (
              <div style={errorMessageStyle}>余额不足，无法完成本次购买。</div>
            ) : null}

            <div style={dialogActionsStyle}>
              <button
                type="button"
                style={cancelButtonStyle}
                onClick={handleCloseDialog}
                disabled={isPurchasing}
              >
                取消
              </button>
              <button
                type="button"
                style={{
                  ...confirmButtonStyle,
                  ...(isPurchasing || !purchaseQuantityValid ? disabledButtonStyle : {}),
                }}
                onClick={handleConfirmPurchase}
                disabled={isPurchasing || !purchaseQuantityValid}
              >
                {isPurchasing ? "购买中…" : "确认购买"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
