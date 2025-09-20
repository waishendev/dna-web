import { MonsterRecord, normalizeMonster, parseMonsterList } from "./monsters";

type EggActionType = "start" | "complete";

export type EggRecord = {
  id: string | number;
  name?: string;
  status?: string;
  stage?: string;
  species?: string;
  rarity?: string;
  description?: string;
  progress?: number;
  progressLabel?: string;
  readyAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string;
  hasStarted?: boolean;
  isCompleted?: boolean;
  canStart?: boolean;
  canComplete?: boolean;
  hatchedMonster?: MonsterRecord | null;
  actionUrls: {
    start: string[];
    complete: string[];
  };
  raw: Record<string, unknown>;
};

function ensureRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function normalizeKeyName(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
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

function toMaybeBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    if (["true", "1", "yes", "y", "on", "ready", "available", "enabled"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "n", "off", "disabled", "unavailable"].includes(normalized)) {
      return false;
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

function pickFirstBoolean(record: Record<string, unknown>, keys: string[]): boolean | null {
  for (const key of keys) {
    const value = toMaybeBoolean(record[key]);
    if (value != null) {
      return value;
    }
  }

  return null;
}

function extractEggId(record: Record<string, unknown>, fallbackId: string): string | number {
  const candidates = ["id", "eggId", "tokenId", "uuid", "_id", "egg_id", "eggID"];
  for (const key of candidates) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") {
      return value;
    }
  }

  return fallbackId;
}

function extractImageUrl(record: Record<string, unknown>): string | null {
  const keys = [
    "image",
    "imageUrl",
    "imageURL",
    "img",
    "thumbnail",
    "thumb",
    "icon",
    "picture",
    "cover",
    "preview",
    "art",
    "avatar",
  ];

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
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

function determineActionFromKey(key: string, type: EggActionType): boolean {
  const normalized = normalizeKeyName(key);
  if (!normalized) {
    return false;
  }

  const parts = normalized.split("_").filter((part) => part.length > 0);
  if (parts.length === 0) {
    return false;
  }

  const startKeywords = ["start", "begin", "init", "launch", "activate", "incubate", "kickoff", "commence"];
  const completeKeywords = [
    "complete",
    "finish",
    "final",
    "claim",
    "collect",
    "redeem",
    "deliver",
    "open",
    "reveal",
    "settle",
    "close",
    "finalize",
  ];

  const targetKeywords = type === "start" ? startKeywords : completeKeywords;
  for (const part of parts) {
    for (const keyword of targetKeywords) {
      if (part === keyword || part.startsWith(`${keyword}`)) {
        return true;
      }
    }
  }

  if (type === "complete") {
    for (const part of parts) {
      if (part.includes("claim")) {
        return true;
      }
    }
  }

  return false;
}

function determineActionFromName(name: string | null | undefined, type: EggActionType): boolean {
  if (!name) {
    return false;
  }

  return determineActionFromKey(name, type);
}

function valueLooksLikeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return true;
  }

  if (trimmed.startsWith("/")) {
    return true;
  }

  if (trimmed.includes("/")) {
    return true;
  }

  return false;
}

function addCandidateUrl(urls: Set<string>, value: unknown) {
  if (typeof value === "string" && valueLooksLikeUrl(value)) {
    urls.add(value.trim());
    return;
  }

  if (ensureRecord(value)) {
    const nested = pickFirstString(value, ["href", "url", "endpoint", "link", "path"]);
    if (nested && valueLooksLikeUrl(nested)) {
      urls.add(nested.trim());
    }
  }
}

function gatherActionUrls(record: Record<string, unknown>, type: EggActionType): string[] {
  const urls = new Set<string>();
  const visited = new WeakSet<Record<string, unknown>>();

  const traverse = (value: unknown, contextKey?: string, depth = 0) => {
    if (value == null || depth > 4) {
      return;
    }

    if (typeof value === "string") {
      if (!contextKey || determineActionFromKey(contextKey, type)) {
        addCandidateUrl(urls, value);
      }
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          if (!contextKey || determineActionFromKey(contextKey, type)) {
            addCandidateUrl(urls, item);
          }
          continue;
        }

        if (ensureRecord(item)) {
          if (visited.has(item)) {
            continue;
          }

          visited.add(item);

          const inferredName =
            toMaybeString(item.rel) ??
            toMaybeString(item.name) ??
            toMaybeString(item.action) ??
            toMaybeString(item.type) ??
            toMaybeString(item.key);

          if ((contextKey && determineActionFromKey(contextKey, type)) || determineActionFromName(inferredName, type)) {
            addCandidateUrl(urls, item);
          }

          traverse(item, contextKey, depth + 1);
        }
      }

      return;
    }

    if (!ensureRecord(value)) {
      return;
    }

    if (visited.has(value)) {
      return;
    }

    visited.add(value);

    const inferredName =
      toMaybeString(value.rel) ??
      toMaybeString(value.name) ??
      toMaybeString(value.action) ??
      toMaybeString(value.type) ??
      toMaybeString(value.key);

    const directMatch = contextKey ? determineActionFromKey(contextKey, type) : false;
    const nameMatch = determineActionFromName(inferredName, type);

    if (directMatch || nameMatch) {
      addCandidateUrl(urls, value);
    }

    for (const [childKey, childValue] of Object.entries(value)) {
      if (childValue == null) {
        continue;
      }

      if (determineActionFromKey(childKey, type)) {
        traverse(childValue, childKey, depth + 1);
        continue;
      }

      if (directMatch || nameMatch) {
        addCandidateUrl(urls, childValue);
      }
    }
  };

  for (const [key, value] of Object.entries(record)) {
    if (value == null) {
      continue;
    }

    if (determineActionFromKey(key, type)) {
      traverse(value, key);
      continue;
    }

    const normalizedKey = normalizeKeyName(key);
    const containerKeys = [
      "actions",
      "links",
      "_links",
      "operations",
      "endpoints",
      "available_actions",
      "availableActions",
      "hatch_actions",
      "hatchActions",
      "hatch_links",
      "hatchLinks",
      "hatch",
      "api",
      "action_links",
      "actionLinks",
      "resources",
    ].map((candidate) => normalizeKeyName(candidate));

    if (Array.isArray(value) || ensureRecord(value)) {
      if (containerKeys.includes(normalizedKey)) {
        traverse(value, key);
      }
    }
  }

  return Array.from(urls);
}

function extractMonsterCandidate(value: unknown, fallbackId: string): MonsterRecord | null {
  if (value == null) {
    return null;
  }

  const list = parseMonsterList(value);
  if (list.length > 0) {
    return list[0] ?? null;
  }

  if (ensureRecord(value)) {
    const nestedKeys = [
      "monster",
      "data",
      "result",
      "record",
      "child",
      "offspring",
      "creature",
      "pet",
      "reward",
      "entry",
      "item",
      "value",
    ];

    for (const key of nestedKeys) {
      const nested = value[key];
      if (nested == null) {
        continue;
      }

      const extracted = extractMonsterCandidate(nested, `${fallbackId}-${key}`);
      if (extracted) {
        return extracted;
      }
    }
  }

  const normalized = normalizeMonster(value, fallbackId);
  return normalized;
}

function normalizeProgress(value: number | null): number | undefined {
  if (value == null || Number.isNaN(value)) {
    return undefined;
  }

  if (!Number.isFinite(value)) {
    return undefined;
  }

  if (value <= 0) {
    return 0;
  }

  let normalized = value;
  if (normalized > 1.01) {
    if (normalized > 100) {
      normalized = 100;
    }
    normalized = normalized / 100;
  }

  if (normalized < 0) {
    normalized = 0;
  } else if (normalized > 1) {
    normalized = 1;
  }

  return normalized;
}

function detectHasStarted(
  record: Record<string, unknown>,
  statusText: string | undefined,
  progress: number | undefined,
  startedAt: string | undefined,
  completedAt: string | undefined,
): boolean {
  const startedFlag = pickFirstBoolean(record, [
    "hasStarted",
    "started",
    "isStarted",
    "hasBegun",
    "hasLaunched",
    "hatching",
    "isHatching",
    "hatchInProgress",
    "incubating",
    "isIncubating",
    "inProgress",
    "isInProgress",
    "active",
    "isActive",
    "running",
    "processing",
  ]);

  if (startedFlag != null) {
    return startedFlag;
  }

  if (startedAt) {
    return true;
  }

  if (completedAt) {
    return true;
  }

  if (typeof progress === "number" && progress > 0) {
    return true;
  }

  if (!statusText) {
    return false;
  }

  if (/(hatching|incubat|progress|running|processing|active|ongoing)/i.test(statusText)) {
    return true;
  }

  return false;
}

function detectCompleted(
  record: Record<string, unknown>,
  statusText: string | undefined,
  completedAt: string | undefined,
): boolean {
  const completeFlag = pickFirstBoolean(record, [
    "isCompleted",
    "completed",
    "complete",
    "isComplete",
    "isFinished",
    "finished",
    "isDone",
    "done",
    "claimed",
    "isClaimed",
    "isCollected",
    "collected",
    "isHatched",
    "hatched",
    "redeemed",
    "isRedeemed",
    "opened",
    "isOpened",
    "revealed",
    "isRevealed",
  ]);

  if (completeFlag != null) {
    return completeFlag;
  }

  if (completedAt) {
    return true;
  }

  if (!statusText) {
    return false;
  }

  if (/\bincomplete\b/i.test(statusText)) {
    return false;
  }

  if (/\b(completed?|finished|done|claimed|collected|hatched|opened|revealed|redeemed)\b/i.test(statusText)) {
    return true;
  }

  return false;
}

function normalizeEgg(raw: unknown, fallbackId: string): EggRecord | null {
  if (!ensureRecord(raw)) {
    return null;
  }

  const id = extractEggId(raw, fallbackId);
  const statusValue = pickFirstString(raw, ["status", "state", "hatchStatus", "progressStatus"]);
  const stageValue = pickFirstString(raw, ["stage", "phase", "step", "tier"]);
  const nameValue = pickFirstString(raw, ["name", "displayName", "eggName", "title", "label"]);
  const speciesValue = pickFirstString(raw, ["species", "type", "element", "breed", "family", "lineage"]);
  const rarityValue = pickFirstString(raw, ["rarity", "rarityLevel", "grade", "tier", "class"]);
  const descriptionValue = pickFirstString(raw, ["description", "desc", "details", "summary", "story", "note"]);
  const readyAtValue = pickFirstString(raw, [
    "readyAt",
    "hatchReadyAt",
    "availableAt",
    "unlockAt",
    "completionAvailableAt",
    "readyTime",
    "ready_at",
  ]);
  const startedAtValue = pickFirstString(raw, [
    "startedAt",
    "startTime",
    "start_at",
    "hatchStartedAt",
    "hatchingStartedAt",
    "incubationStartedAt",
    "incubatingStartedAt",
    "beginAt",
    "started_at",
  ]);
  const completedAtValue = pickFirstString(raw, [
    "completedAt",
    "completeTime",
    "finishedAt",
    "hatchCompletedAt",
    "hatchingCompletedAt",
    "claimedAt",
    "collectedAt",
    "revealedAt",
    "openedAt",
    "doneAt",
    "completed_at",
  ]);
  const createdAtValue = pickFirstString(raw, ["createdAt", "created_at", "created", "timestamp", "createdOn", "createdon"]);
  const updatedAtValue = pickFirstString(raw, ["updatedAt", "updated_at", "updated", "modifiedAt", "modified_at"]);
  const progressRaw = pickFirstNumber(raw, [
    "progress",
    "progressPercent",
    "progressPercentage",
    "completion",
    "completionPercent",
    "completionPercentage",
    "progressValue",
    "percentComplete",
    "percentage",
  ]);
  const progress = normalizeProgress(progressRaw);
  const progressLabelValue =
    pickFirstString(raw, ["progressText", "progressLabel", "progressDescription", "progressStatus"]) ??
    (typeof progress === "number" ? `${Math.round(progress * 100)}%` : null);
  const imageUrl = extractImageUrl(raw);

  const statusText = statusValue ?? stageValue ?? undefined;
  const hasStarted = detectHasStarted(raw, statusText, progress, startedAtValue ?? undefined, completedAtValue ?? undefined);
  const isCompleted = detectCompleted(raw, statusText, completedAtValue ?? undefined);

  const startFlag = pickFirstBoolean(raw, [
    "canStart",
    "startAllowed",
    "startable",
    "canBegin",
    "canInitiate",
    "canLaunch",
    "canActivate",
    "canIncubate",
    "canHatch",
    "readyToStart",
    "readyToBegin",
    "availableToStart",
    "startReady",
    "isStartAvailable",
    "allowStart",
  ]);
  const completeFlag = pickFirstBoolean(raw, [
    "canComplete",
    "completeAllowed",
    "completable",
    "canFinish",
    "canFinalize",
    "canClaim",
    "canCollect",
    "readyToComplete",
    "readyToClaim",
    "readyToHatch",
    "readyToReveal",
    "readyToOpen",
    "claimable",
    "isClaimable",
    "canRedeem",
    "redeemable",
    "canDeliver",
    "deliverable",
  ]);

  let canStart = startFlag ?? undefined;
  let canComplete = completeFlag ?? undefined;

  if (isCompleted) {
    canStart = false;
    canComplete = false;
  } else {
    if (canStart == null && !hasStarted) {
      const readyFlag = pickFirstBoolean(raw, ["ready", "isReady", "readyState"]);
      if (readyFlag != null) {
        canStart = readyFlag;
      } else if (
        statusText &&
        /\b(ready|available|pending|idle|new|unhatched|waiting|stored|fresh)\b/i.test(statusText) &&
        !/\b(claimed|collected|hatched|finished|done|completed)\b/i.test(statusText)
      ) {
        canStart = true;
      }
    }

    if (canComplete == null && hasStarted) {
      const readyFlag = pickFirstBoolean(raw, [
        "readyToComplete",
        "readyToClaim",
        "readyToHatch",
        "readyToOpen",
        "readyToReveal",
        "readyToFinish",
        "readyFlag",
      ]);
      if (readyFlag != null) {
        canComplete = readyFlag;
      } else if (statusText) {
        const readyPattern = /\b(ready|awaiting|available|ripe|mature|unlock|claim|open|reveal)\b/i;
        if (readyPattern.test(statusText) && !/\bincomplete\b/i.test(statusText)) {
          canComplete = true;
        } else if (/\bcomplete\b/i.test(statusText) && !/\bincomplete\b/i.test(statusText)) {
          canComplete = true;
        }
      }

      if (canComplete == null && typeof progress === "number" && progress >= 0.999) {
        canComplete = true;
      }
    }
  }

  const idString = String(id);
  const encodedId = encodeURIComponent(idString);
  const fallbackStartUrls = [
    `/eggs/${encodedId}/start`,
    `/eggs/${encodedId}/start-hatch`,
    `/eggs/${encodedId}/hatch/start`,
    `/eggs/${encodedId}/begin`,
    `/eggs/${encodedId}/incubate`,
  ];
  const fallbackCompleteUrls = [
    `/eggs/${encodedId}/complete`,
    `/eggs/${encodedId}/complete-hatch`,
    `/eggs/${encodedId}/hatch/complete`,
    `/eggs/${encodedId}/finish`,
    `/eggs/${encodedId}/claim`,
    `/eggs/${encodedId}/open`,
    `/eggs/${encodedId}/reveal`,
    `/eggs/${encodedId}/collect`,
  ];
  const startUrls = Array.from(new Set([...gatherActionUrls(raw, "start"), ...fallbackStartUrls]));
  const completeUrls = Array.from(new Set([...gatherActionUrls(raw, "complete"), ...fallbackCompleteUrls]));

  let hatchedMonster: MonsterRecord | null = null;
  const monsterKeys = [
    "monster",
    "creature",
    "pet",
    "result",
    "reward",
    "hatchResult",
    "hatchedMonster",
    "revealedMonster",
    "claimReward",
    "claimResult",
    "monsterData",
    "monsterResult",
    "record",
  ];

  for (const key of monsterKeys) {
    const candidate = extractMonsterCandidate(raw[key], `${idString}-${key}`);
    if (candidate) {
      hatchedMonster = candidate;
      break;
    }
  }

  const normalized: EggRecord = {
    id,
    name: nameValue ?? undefined,
    status: statusValue ?? undefined,
    stage: stageValue ?? undefined,
    species: speciesValue ?? undefined,
    rarity: rarityValue ?? undefined,
    description: descriptionValue ?? undefined,
    progress,
    progressLabel: progressLabelValue ?? undefined,
    readyAt: readyAtValue ?? undefined,
    startedAt: startedAtValue ?? undefined,
    completedAt: completedAtValue ?? undefined,
    createdAt: createdAtValue ?? undefined,
    updatedAt: updatedAtValue ?? undefined,
    imageUrl: imageUrl ?? undefined,
    hasStarted,
    isCompleted,
    canStart,
    canComplete,
    hatchedMonster,
    actionUrls: {
      start: startUrls,
      complete: completeUrls,
    },
    raw,
  };

  if (!normalized.name) {
    normalized.name = `蛋 #${idString}`;
  }

  if (!normalized.status && statusText) {
    normalized.status = statusText;
  }

  return normalized;
}

export function parseEggList(payload: unknown, seen: Set<unknown> = new Set()): EggRecord[] {
  if (payload != null && typeof payload === "object") {
    if (seen.has(payload)) {
      return [];
    }
    seen.add(payload);
  }

  const items: unknown[] = [];

  if (Array.isArray(payload)) {
    items.push(...payload);
  } else if (ensureRecord(payload)) {
    const candidateKeys = ["eggs", "items", "data", "results", "list", "records", "entries", "nodes", "edges"];
    for (const key of candidateKeys) {
      const value = payload[key];
      if (Array.isArray(value)) {
        if (key.toLowerCase() === "edges") {
          for (const edge of value) {
            if (ensureRecord(edge) && "node" in edge) {
              items.push((edge as Record<string, unknown>).node);
            } else {
              items.push(edge);
            }
          }
        } else {
          items.push(...value);
        }
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

  const normalized = items
    .map((item, index) => normalizeEgg(item, `egg-${index + 1}`))
    .filter((item): item is EggRecord => item != null);

  if (normalized.length > 0) {
    return normalized;
  }

  if (ensureRecord(payload)) {
    const nestedCandidates = ["eggs", "data", "result", "payload", "response", "value", "record"];
    for (const key of nestedCandidates) {
      const nested = payload[key];
      if (nested != null && typeof nested === "object") {
        const nestedList = parseEggList(nested, seen);
        if (nestedList.length > 0) {
          return nestedList;
        }
      }
    }
  }

  return [];
}
