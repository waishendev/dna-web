export type MonsterGene = string | number | Record<string, unknown> | null | undefined;

export type MonsterData = {
  id: string | number;
  name?: string | null;
  nickname?: string | null;
  species?: string | null;
  rarity?: string | null;
  level?: number | null;
  energy?: number | null;
  rank?: string | number | null;
  atk?: number | null;
  def?: number | null;
  spd?: number | null;
  hp?: number | null;
  genes?: MonsterGene[] | null;
  [key: string]: unknown;
};

export type MonsterRecord = MonsterData & {
  raw: Record<string, unknown>;
};

const POSSIBLE_ID_KEYS = ["id", "monsterId", "uuid", "tokenId", "dnaId", "_id"];
const POSSIBLE_GENE_KEYS = ["genes", "geneTags", "traits", "dna", "geneSequence", "geneList"];

const LEVEL_KEYS = ["level", "lvl", "rank", "stage"];
const ENERGY_KEYS = ["energy", "stamina", "power", "vitality", "endurance"];
const ATTACK_KEYS = ["atk", "attack", "offense", "strength"];
const DEFENSE_KEYS = ["def", "defense", "guard", "resistance", "protection"];
const SPEED_KEYS = ["spd", "speed", "agility", "dexterity"];
const HEALTH_KEYS = ["hp", "health", "hitpoints", "life", "vigor"];
const RANK_NUMBER_KEYS = ["rank", "ranking", "rankLevel", "rankScore", "score", "value", "current"];
const RANK_TEXT_KEYS = [
  "rank",
  "ranking",
  "tier",
  "class",
  "grade",
  "rankTitle",
  "title",
  "name",
  "label",
];

const STAT_CONTAINER_KEYS = [
  "stats",
  "attributes",
  "statistics",
  "baseStats",
  "base_stats",
  "details",
  "info",
  "profile",
  "meta",
  "properties",
  "values",
  "metrics",
  "numbers",
  "combat",
  "combatStats",
  "combat_stats",
  "battleStats",
  "battle_stats",
  "power",
  "growth",
  "performance",
  "summary",
  "overview",
  "data",
];

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

function collectStatContainers(
  source: Record<string, unknown>,
  bucket: Record<string, unknown>[],
  seen: WeakSet<Record<string, unknown>>,
): void {
  if (seen.has(source)) {
    return;
  }

  seen.add(source);

  for (const key of STAT_CONTAINER_KEYS) {
    const value = source[key];

    if (Array.isArray(value)) {
      for (const entry of value) {
        if (ensureRecord(entry) && !seen.has(entry)) {
          bucket.push(entry);
          collectStatContainers(entry, bucket, seen);
        }
      }
      continue;
    }

    if (ensureRecord(value) && !seen.has(value)) {
      bucket.push(value);
      collectStatContainers(value, bucket, seen);
    }
  }
}

function fillStatsFromContainers(
  normalized: MonsterRecord,
  containers: Record<string, unknown>[],
): void {
  for (const container of containers) {
    if (normalized.energy == null) {
      const candidate = pickFirstNumber(container, ENERGY_KEYS);
      if (candidate != null) {
        normalized.energy = candidate;
      }
    }

    if (normalized.level == null) {
      const candidate = pickFirstNumber(container, LEVEL_KEYS);
      if (candidate != null) {
        normalized.level = candidate;
      }
    }

    if (normalized.atk == null) {
      const candidate = pickFirstNumber(container, ATTACK_KEYS);
      if (candidate != null) {
        normalized.atk = candidate;
      }
    }

    if (normalized.def == null) {
      const candidate = pickFirstNumber(container, DEFENSE_KEYS);
      if (candidate != null) {
        normalized.def = candidate;
      }
    }

    if (normalized.spd == null) {
      const candidate = pickFirstNumber(container, SPEED_KEYS);
      if (candidate != null) {
        normalized.spd = candidate;
      }
    }

    if (normalized.hp == null) {
      const candidate = pickFirstNumber(container, HEALTH_KEYS);
      if (candidate != null) {
        normalized.hp = candidate;
      }
    }

    if (normalized.rank == null) {
      const rankNumber = pickFirstNumber(container, RANK_NUMBER_KEYS);
      if (rankNumber != null) {
        normalized.rank = rankNumber;
      } else {
        const rankText = pickFirstString(container, RANK_TEXT_KEYS);
        if (rankText) {
          normalized.rank = rankText;
        }
      }
    }
  }
}

export function normalizeMonster(raw: unknown, fallbackId: string): MonsterRecord | null {
  if (!ensureRecord(raw)) {
    return null;
  }

  const id = extractId(raw, fallbackId);
  const genes = extractGenes(raw);
  const levelValue = pickFirstNumber(raw, LEVEL_KEYS);
  const energyValue = pickFirstNumber(raw, ENERGY_KEYS);
  const nameValue = pickFirstString(raw, ["name", "displayName"]);
  const nicknameValue = pickFirstString(raw, ["nickname", "alias"]);
  const speciesValue = pickFirstString(raw, ["species", "type", "element"]);
  const rarityValue = pickFirstString(raw, ["rarity", "tier", "grade", "rarityLevel"]);
  const rankNumber = pickFirstNumber(raw, RANK_NUMBER_KEYS);
  const rankString = pickFirstString(raw, RANK_TEXT_KEYS);
  const attackValue = pickFirstNumber(raw, ATTACK_KEYS);
  const defenseValue = pickFirstNumber(raw, DEFENSE_KEYS);
  const speedValue = pickFirstNumber(raw, SPEED_KEYS);
  const healthValue = pickFirstNumber(raw, HEALTH_KEYS);

  const normalized: MonsterRecord = {
    id,
    name: nameValue ?? undefined,
    nickname: nicknameValue ?? undefined,
    species: speciesValue ?? undefined,
    rarity: rarityValue ?? undefined,
    level: levelValue ?? undefined,
    energy: energyValue ?? undefined,
    rank: rankNumber ?? rankString ?? undefined,
    atk: attackValue ?? undefined,
    def: defenseValue ?? undefined,
    spd: speedValue ?? undefined,
    hp: healthValue ?? undefined,
    genes,
    raw,
  };

  const statContainers: Record<string, unknown>[] = [];
  collectStatContainers(raw, statContainers, new WeakSet());
  if (statContainers.length > 0) {
    fillStatsFromContainers(normalized, statContainers);
  }

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

const MONSTER_PAYLOAD_KEYS = [
  "monster",
  "data",
  "result",
  "record",
  "entity",
  "updated",
  "updatedMonster",
  "target",
  "response",
  "payload",
  "body",
];

function extractMonsterFromPayloadInternal(
  payload: unknown,
  fallbackId: string,
  seen: WeakSet<object>,
): MonsterRecord | null {
  const direct = normalizeMonster(payload, fallbackId);
  if (direct) {
    return direct;
  }

  if (Array.isArray(payload)) {
    if (seen.has(payload as unknown as object)) {
      return null;
    }
    seen.add(payload as unknown as object);

    for (const entry of payload) {
      const candidate = extractMonsterFromPayloadInternal(entry, fallbackId, seen);
      if (candidate) {
        return candidate;
      }
    }
    return null;
  }

  if (!ensureRecord(payload)) {
    return null;
  }

  if (seen.has(payload)) {
    return null;
  }
  seen.add(payload);

  for (const key of MONSTER_PAYLOAD_KEYS) {
    if (!(key in payload)) {
      continue;
    }

    const candidate = extractMonsterFromPayloadInternal(payload[key], fallbackId, seen);
    if (candidate) {
      return candidate;
    }
  }

  for (const value of Object.values(payload)) {
    if (value == null) {
      continue;
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      continue;
    }

    const candidate = extractMonsterFromPayloadInternal(value, fallbackId, seen);
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

export function extractMonsterFromPayload(
  payload: unknown,
  fallbackId: string,
): MonsterRecord | null {
  return extractMonsterFromPayloadInternal(payload, fallbackId, new WeakSet());
}

const MERGE_PRESERVE_KEYS: (keyof MonsterRecord)[] = [
  "atk",
  "def",
  "spd",
  "hp",
  "rank",
  "energy",
  "level",
  "experience",
];

function shouldPreserveValue(value: unknown): boolean {
  if (value == null) {
    return true;
  }

  if (typeof value === "number") {
    return !Number.isFinite(value);
  }

  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  return false;
}

export function mergeMonsterRecords(
  previous: MonsterRecord | null,
  incoming: MonsterRecord | null,
): MonsterRecord | null {
  if (!previous && !incoming) {
    return null;
  }

  if (!previous) {
    return incoming;
  }

  if (!incoming) {
    return previous;
  }

  const merged: MonsterRecord = {
    ...previous,
    ...incoming,
    raw: {
      ...previous.raw,
      ...incoming.raw,
    },
  };

  for (const key of MERGE_PRESERVE_KEYS) {
    const incomingValue = incoming[key];
    if (shouldPreserveValue(incomingValue)) {
      const previousValue = previous[key];
      if (previousValue !== undefined && previousValue !== null) {
        (merged as Record<string, unknown>)[key] = previousValue as unknown;
      }
    }
  }

  return merged;
}
