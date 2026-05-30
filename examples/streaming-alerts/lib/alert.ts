/**
 * Payload shaping.
 *
 * Turns a raw Fourthwall webhook envelope (ORDER_PLACED / DONATION) into the
 * flat `AlertPayload` the overlay renders. This is the one place the
 * name-privacy transform and the deterministic name-fallback chain live, so
 * orders and tips (and the test alert) all behave identically.
 */

export interface AlertPayload {
  kind: "order" | "tip";
  /** Display name, after privacy + fallback chain. */
  name: string;
  /** Formatted amount, e.g. "$42.00". */
  amount: string;
  /** Product name (order) or supporter message (tip). */
  detail: string;
  /** Order primary image. Absent → overlay renders an initials chip. */
  image?: string;
  /** Event id — the overlay's dedupe / animation key. */
  id: string;
}

/** Raw money shape carried by both event types. */
interface Money {
  value: number;
  currency: string;
}

interface OrderData {
  id: string;
  amounts?: { total?: Money };
  offers?: Array<{
    name?: string;
    primaryImage?: string | null;
    variant?: { size?: string } | null;
  }>;
  shipping?: { name?: string | null } | null;
  billing?: { name?: string | null } | null;
}

interface DonationData {
  id: string;
  amount?: Money;
  username?: string | null;
  email?: string | null;
  message?: string | null;
}

const ANONYMOUS = "Anonymous";

/** Format a money value as a currency string; tolerant of odd currencies. */
function formatAmount(money?: Money): string {
  if (!money || typeof money.value !== "number") {
    return "";
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: money.currency || "USD",
    }).format(money.value);
  } catch {
    return `${money.value} ${money.currency ?? ""}`.trim();
  }
}

/** First non-empty candidate, trimmed; "Someone" if all are blank. */
function pickName(candidates: Array<string | null | undefined>): string {
  for (const candidate of candidates) {
    if (candidate && candidate.trim()) {
      return candidate.trim();
    }
  }
  return "Someone";
}

/** The local-part of an email, e.g. "fan@example.com" → "fan". */
function emailLocalPart(email?: string | null): string | undefined {
  if (!email) return undefined;
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : email;
}

/**
 * Apply the privacy transform: when `showName` is off, the real name never
 * leaves the server — the overlay only ever sees "Anonymous".
 */
function displayName(realName: string, showName: boolean): string {
  return showName ? realName : ANONYMOUS;
}

/** Shape an ORDER_PLACED payload. Name comes from shipping/billing. */
export function handleOrder(data: OrderData, showName: boolean): AlertPayload {
  const offers = data.offers ?? [];
  const first = offers[0];
  const realName = pickName([data.shipping?.name, data.billing?.name]);

  const productName = first?.name?.trim() || "an order";
  const detail =
    offers.length > 1 ? `${productName} +${offers.length - 1} more` : productName;

  return {
    kind: "order",
    name: displayName(realName, showName),
    amount: formatAmount(data.amounts?.total),
    detail,
    image: first?.primaryImage ?? undefined,
    id: data.id,
  };
}

/**
 * Shape a DONATION payload. The name source is weaker than an order's — only a
 * nullable `username` and `email`, no address — so the fallback chain
 * (username → email local-part → "Someone") carries the load.
 */
export function handleDonation(data: DonationData, showName: boolean): AlertPayload {
  const realName = pickName([data.username, emailLocalPart(data.email)]);

  return {
    kind: "tip",
    name: displayName(realName, showName),
    amount: formatAmount(data.amount),
    detail: data.message?.trim() || "sent a tip",
    id: data.id,
  };
}
