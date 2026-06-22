/** Shared formatting helpers. */

/** Format a Money wire object ({ value, currency }) as a localized price. */
export function formatPrice(money: { value: number; currency: string }): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: money.currency }).format(
      money.value,
    );
  } catch {
    return `${money.value} ${money.currency}`;
  }
}

/** Up to two uppercase initials from a shop/creator name, for avatars. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
