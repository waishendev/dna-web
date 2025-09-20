export type BagItemRecord = {
  id: string | number;
  identifier: string;
  name?: string;
  description?: string;
  quantity: number;
  type?: string;
  category?: string;
  rarity?: string;
  imageUrl?: string;
  tags?: string[];
  raw: Record<string, unknown>;
};

function ensureRecord(value: unknown): value is Record<string, unknown> {
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

    const parsed = Number(trimmed);
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

const NAME_CANDIDATES = ["name", "itemName", "title", "label", "displayName"];
const DESCRIPTION_CANDIDATES = ["description", "desc", "details", "info", "text"];
const TYPE_CANDIDATES = ["type", "category", "kind", "itemType", "classification"];
const RARITY_CANDIDATES = ["rarity", "quality", "tier", "grade", "level"];
const QUANTITY_CANDIDATES = [
  "quantity",
  "qty",
  "count",
  "amount",
  "stock",
  "balance",
  "owned",
  "have",
  "num",
  "number",
  "available",
];
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
const TAG_CANDIDATES = ["tags", "labels", "attributes", "properties", "types"];

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

function extractImageUrl(record: Record<string, unknown>): string | null {
  for (const key of IMAGE_CANDIDATES) {
    const value = record[key];
    const asString = toMaybeString(value);
    if (asString) {
      return asString;
    }

    if (ensureRecord(value)) {
      const nested = pickFirstString(value, ["url", "href", "src", "path"]);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

const ITEM_LIKE_KEYS = new Set([
  ...QUANTITY_CANDIDATES,
  ...NAME_CANDIDATES,
  ...IDENTIFIER_CANDIDATES,
  ...TYPE_CANDIDATES,
  ...RARITY_CANDIDATES,
  ...TAG_CANDIDATES,
]);

function looksLikeItemRecord(record: Record<string, unknown>): boolean {
  for (const key of QUANTITY_CANDIDATES) {
    if (record[key] != null) {
      return true;
    }
  }

  for (const key of ITEM_LIKE_KEYS) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return true;
    }
  }

  if (typeof record.key === "string" && record.key.trim().length > 0) {
    return true;
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

    if (ensureRecord(value)) {
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

function collectRawItems(source: unknown, bucket: unknown[]): void {
  if (Array.isArray(source)) {
    for (const entry of source) {
      collectRawItems(entry, bucket);
    }
    return;
  }

  if (!ensureRecord(source)) {
    return;
  }

  if (looksLikeItemRecord(source)) {
    bucket.push(source);
    return;
  }

  const candidateKeys = [
    "items",
    "inventory",
    "bag",
    "data",
    "list",
    "records",
    "results",
    "entries",
    "contents",
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
        collectRawItems(entry, bucket);
      }
      continue;
    }

    if (ensureRecord(nested)) {
      const converted = convertKeyedRecordToArray(nested);
      if (converted.length > 0) {
        matched = true;
        for (const entry of converted) {
          collectRawItems(entry, bucket);
        }
      }
    }
  }

  if (!matched) {
    const converted = convertKeyedRecordToArray(source);
    if (converted.length > 0) {
      for (const entry of converted) {
        collectRawItems(entry, bucket);
      }
    }
  }
}

export function normalizeBagItem(raw: unknown, fallbackId: string): BagItemRecord | null {
  if (!ensureRecord(raw)) {
    return null;
  }

  const id = extractItemId(raw, fallbackId);
  const identifier = extractIdentifier(raw, id, fallbackId);
  const quantity = pickFirstNumber(raw, QUANTITY_CANDIDATES) ?? 0;
  const name = pickFirstString(raw, NAME_CANDIDATES) ?? undefined;
  const description = pickFirstString(raw, DESCRIPTION_CANDIDATES) ?? undefined;
  const type = pickFirstString(raw, TYPE_CANDIDATES) ?? undefined;
  const rarity = pickFirstString(raw, RARITY_CANDIDATES) ?? undefined;
  const imageUrl = extractImageUrl(raw) ?? undefined;
  const tags = pickFirstStringArray(raw, TAG_CANDIDATES) ?? undefined;

  const normalized: BagItemRecord = {
    id,
    identifier,
    quantity,
    raw,
  };

  if (name) {
    normalized.name = name;
  }

  if (description) {
    normalized.description = description;
  }

  if (type) {
    normalized.type = type;
  }

  if (rarity) {
    normalized.rarity = rarity;
  }

  if (imageUrl) {
    normalized.imageUrl = imageUrl;
  }

  if (tags && tags.length > 0) {
    normalized.tags = tags;
  }

  const category = pickFirstString(raw, ["category", "group", "family", "series"]);
  if (category) {
    normalized.category = category;
  }

  return normalized;
}

export function parseBagItems(payload: unknown): BagItemRecord[] {
  const rawItems: unknown[] = [];
  collectRawItems(payload, rawItems);

  return rawItems
    .map((item, index) => normalizeBagItem(item, `item-${index + 1}`))
    .filter((item): item is BagItemRecord => item != null);
}
