"use server";

import { checkoutUrl, createCart, getShop } from "../lib/fourthwall";

/**
 * Create a Fourthwall cart from the client cart and return the hosted-checkout
 * URL. The buyer is redirected there to complete payment and shipping.
 */
export async function startCheckout(
  items: { variantId: string; quantity: number }[],
): Promise<string> {
  const [shop, cartId] = await Promise.all([getShop(), createCart(items)]);
  return checkoutUrl(shop, cartId);
}
