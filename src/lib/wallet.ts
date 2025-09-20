export type WalletData = {
  balance?: number | string;
  available?: number | string;
  total?: number | string;
  amount?: number | string;
  coins?: number | string;
  currency?: string | null;
  symbol?: string | null;
  unit?: string | null;
  address?: string | null;
  walletAddress?: string | null;
  [key: string]: unknown;
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

export function normalizeWallet(payload: unknown): WalletData {
  if (isPlainObject(payload)) {
    if (payload.wallet && isPlainObject(payload.wallet)) {
      return payload.wallet as WalletData;
    }

    return payload as WalletData;
  }

  return { balance: payload as number | string };
}

export function pickBalanceValue(wallet: WalletData): unknown {
  if (wallet.coins != null) {
    return wallet.coins;
  }

  if (wallet.balance != null) {
    return wallet.balance;
  }

  if (wallet.available != null) {
    return wallet.available;
  }

  if (wallet.total != null) {
    return wallet.total;
  }

  if (wallet.amount != null) {
    return wallet.amount;
  }

  return null;
}

export function formatBalance(wallet: WalletData): string {
  const candidate = pickBalanceValue(wallet);
  const numeric = toMaybeNumber(candidate);
  if (numeric != null) {
    return numeric.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  }

  const text = toMaybeString(candidate);
  if (text) {
    return text;
  }

  return "--";
}

export function resolveCurrency(wallet: WalletData): string | null {
  const currency =
    toMaybeString(wallet.currency) ??
    toMaybeString(wallet.symbol) ??
    toMaybeString(wallet.unit);

  return currency ?? null;
}

export function resolveAddress(wallet: WalletData): string | null {
  const address =
    toMaybeString(wallet.address) ?? toMaybeString(wallet.walletAddress);
  return address ?? null;
}

export function getNumericBalance(wallet: WalletData | null): number | null {
  if (!wallet) {
    return null;
  }

  const candidate = pickBalanceValue(wallet);
  return toMaybeNumber(candidate);
}
