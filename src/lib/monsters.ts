export type MonsterGene = string | number | Record<string, unknown> | null | undefined;

export type MonsterData = {
  id: string | number;
  name?: string | null;
  nickname?: string | null;
  species?: string | null;
  rarity?: string | null;
  level?: number | null;
  energy?: number | null;
  genes?: MonsterGene[] | null;
  [key: string]: unknown;
};

export type MonsterRecord = MonsterData & {
  raw: Record<string, unknown>;
};

const POSSIBLE_ID_KEYS = ["id", "monsterId", "uuid", "tokenId", "dnaId", "_id"];
const POSSIBLE_GENE_KEYS = ["genes", "geneTags", "traits", "dna", "geneSequence", "geneList"];

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

function extractId(record: Record<string, unknown>, fallbackId: string): string | number {
  for (const key of POSSIBLE_ID_KEYS) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") {
      return value;
    }
  }

  return fallbackId;
}

function extractGenes(record: Record<string, unknown>): MonsterGene[] {
  for (const key of POSSIBLE_GENE_KEYS) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value as MonsterGene[];
    }

    if (typeof value === "string") {
      const parts = value
        .split(/[,|]/)
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
      if (parts.length > 0) {
        return parts;
      }
    }
  }

  return [];
}

function pickFirstString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const maybeString = toMaybeString(record[key]);
    if (maybeString) {
      return maybeString;
    }
  }

  return null;
}

function pickFirstNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const maybeNumber = toMaybeNumber(record[key]);
    if (maybeNumber != null) {
      return maybeNumber;
    }
  }

  return null;
}

export function normalizeMonster(raw: unknown, fallbackId: string): MonsterRecord | null {
  if (!ensureRecord(raw)) {
    return null;
  }

  const id = extractId(raw, fallbackId);
  const genes = extractGenes(raw);
  const levelValue = pickFirstNumber(raw, ["level", "lvl", "rank", "stage"]);
  const energyValue = pickFirstNumber(raw, ["energy", "stamina", "power", "vitality", "endurance"]);
  const nameValue = pickFirstString(raw, ["name", "displayName"]);
  const nicknameValue = pickFirstString(raw, ["nickname", "alias"]);
  const speciesValue = pickFirstString(raw, ["species", "type", "element"]);
  const rarityValue = pickFirstString(raw, ["rarity", "tier", "grade", "rarityLevel"]);

  const normalized: MonsterRecord = {
    id,
    name: nameValue ?? undefined,
    nickname: nicknameValue ?? undefined,
    species: speciesValue ?? undefined,
    rarity: rarityValue ?? undefined,
    level: levelValue ?? undefined,
    energy: energyValue ?? undefined,
    genes,
    raw,
  };

  const descriptionValue = pickFirstString(raw, ["description", "bio", "story"]);
  if (descriptionValue) {
    normalized.description = descriptionValue;
  }

  const statusValue = pickFirstString(raw, ["status", "state"]);
  if (statusValue) {
    normalized.status = statusValue;
  }

  const ownerValue = pickFirstString(raw, ["owner", "trainer", "holder", "walletAddress"]);
  if (ownerValue) {
    normalized.owner = ownerValue;
  }

  const experienceValue = pickFirstNumber(raw, ["experience", "exp"]);
  if (experienceValue != null) {
    normalized.experience = experienceValue;
  } else {
    const experienceText = pickFirstString(raw, ["experience", "exp"]);
    if (experienceText) {
      normalized.experience = experienceText;
    }
  }

  const generationValue = pickFirstNumber(raw, ["generation"]);
  if (generationValue != null) {
    normalized.generation = generationValue;
  }

  const createdAtValue = pickFirstString(raw, ["createdAt", "created_at", "created"]);
  if (createdAtValue) {
    normalized.createdAt = createdAtValue;
  }

  const updatedAtValue = pickFirstString(raw, ["updatedAt", "updated_at", "updated"]);
  if (updatedAtValue) {
    normalized.updatedAt = updatedAtValue;
  }

  return normalized;
}

export function parseMonsterList(payload: unknown): MonsterRecord[] {
  const items: unknown[] = [];

  if (Array.isArray(payload)) {
    items.push(...payload);
  } else if (ensureRecord(payload)) {
    const candidates = ["monsters", "data", "items", "results", "list", "records"];
    for (const key of candidates) {
      const value = payload[key];
      if (Array.isArray(value)) {
        items.push(...value);
      }
    }

    if (items.length === 0) {
      for (const value of Object.values(payload)) {
        if (Array.isArray(value)) {
          items.push(...value);
        }
      }
    }
  }

  return items
    .map((item, index) => normalizeMonster(item, `monster-${index + 1}`))
    .filter((item): item is MonsterRecord => item != null);
}
