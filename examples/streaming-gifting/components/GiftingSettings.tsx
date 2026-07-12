'use client';

import { useMemo, useState } from 'react';
import { Alert, Button, Checkbox, Input, Select, Switch, Tag } from '@fourthwall-examples/ui';
import { Section } from '@/components/Section';
import type { GiftingConfig, Product, ProductsPolicy, ShippingPolicy } from '@/lib/fourthwall';
import type { EmbeddedAuth } from '@/lib/embeddedSettings';

interface GiftingSettingsProps {
  auth: EmbeddedAuth;
  products: Product[];
  initial: GiftingConfig;
  onSaved?: (config: GiftingConfig) => void;
}

/**
 * The shop's gifting rules — the same fields the Twitch gifting page exposes,
 * persisted through `PUT /open-api/v1.0/gifting/config`: master flag, entry time
 * limit (20–180s), shipping policy, and giftable-products policy.
 */
export function GiftingSettings({ auth, products, initial, onSaved }: GiftingSettingsProps) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [seconds, setSeconds] = useState(initial.entryTimeLimitSeconds);
  const [shippingType, setShippingType] = useState<ShippingPolicy['type']>(initial.shipping.type);
  const [maxCreator, setMaxCreator] = useState(
    initial.shipping.type === 'MAX_CREATOR' ? initial.shipping.max : 10,
  );
  const [productsType, setProductsType] = useState<ProductsPolicy['type']>(initial.products.type);
  const [offerIds, setOfferIds] = useState<string[]>(
    initial.products.type === 'ALL' ? [] : initial.products.offerIds,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The offer the public /gift page will hand to POST /api/checkout. Selection is
  // client-side (in-memory only) — the URL below is the persistence: whoever holds
  // it holds the choice. Lazy-initialized to the first product so an out-of-the-box
  // demo has a valid URL without a click; the operator can pick another anytime.
  const [publicOfferId, setPublicOfferId] = useState<string>(() => products[0]?.id ?? '');
  const [copied, setCopied] = useState(false);

  // Built in the browser so an ngrok/tunnel URL is picked up automatically. Empty
  // string during SSR — the input just hasn't hydrated yet.
  const publicGiftUrl = useMemo(() => {
    if (!publicOfferId) return '';
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/gift?offerId=${encodeURIComponent(publicOfferId)}`;
  }, [publicOfferId]);

  async function copyUrl() {
    if (!publicGiftUrl) return;
    try {
      await navigator.clipboard.writeText(publicGiftUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (permissions / non-secure origin) — silently no-op; the
      // input value is selectable so the operator can copy by hand.
    }
  }

  // Another integration already owns the shop's single gifting slot — the write
  // would be rejected server-side by the one-platform-per-shop mutex.
  const conflicted = initial.platform === 'TWITCH' || initial.platform === 'STREAMELEMENTS';

  function buildShipping(): ShippingPolicy {
    switch (shippingType) {
      case 'MAX_CREATOR':
        return { type: 'MAX_CREATOR', max: maxCreator };
      case 'ALL_WINNER':
        return { type: 'ALL_WINNER' };
      case 'ALL_CREATOR':
        return { type: 'ALL_CREATOR' };
    }
  }

  function buildProducts(): ProductsPolicy {
    switch (productsType) {
      case 'ALL':
        return { type: 'ALL' };
      case 'SELECTED':
        return { type: 'SELECTED', offerIds };
      case 'EXCLUDED':
        return { type: 'EXCLUDED', offerIds };
    }
  }

  function toggleOffer(id: string) {
    setOfferIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const signed = new URLSearchParams({
        shop_id: auth.shopId,
        hmac: auth.hmac,
        timestamp: auth.timestamp,
      }).toString();
      const res = await fetch(`/api/settings?${signed}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          entryTimeLimitSeconds: Math.min(180, Math.max(20, Math.floor(seconds))),
          shipping: buildShipping(),
          products: buildProducts(),
        }),
      });
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? 'Failed to save');
      setSaved(true);
      onSaved?.((await res.json()) as GiftingConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  const showOfferList = productsType !== 'ALL';

  return (
    <div className="space-y-8">
      <Section
        title="Public gifting page"
        description="Pick the gift offer this app's public /gift page sends to the paid checkout endpoint, then share its URL. Supporters open it and are redirected straight to Fourthwall checkout — no live stream, no modal."
        aside={<Tag appearance={publicOfferId ? 'success' : 'neutral'}>{publicOfferId ? 'Ready to share' : 'Pick an offer'}</Tag>}
      >
        <div className="space-y-4">
          {products.length === 0 ? (
            <Alert appearance="alert" title="No products found">
              Add a product to this shop before sharing a public gift link.
            </Alert>
          ) : (
            <Select
              label="Gift offer"
              value={publicOfferId}
              onChange={(e) => setPublicOfferId(e.target.value)}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Shareable URL"
                readOnly
                value={publicGiftUrl}
                placeholder="Select an offer to generate the URL"
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>
            <Button
              type="button"
              appearance="secondary"
              onClick={copyUrl}
              disabled={!publicGiftUrl}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <a
              href={publicGiftUrl || undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!publicGiftUrl}
              tabIndex={publicGiftUrl ? 0 : -1}
              className={publicGiftUrl ? '' : 'pointer-events-none opacity-50'}
            >
              <Button type="button" appearance="secondary" disabled={!publicGiftUrl}>
                Open
              </Button>
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            The URL carries <code className="font-mono">offerId</code> — supporters click{' '}
            <strong>Gift now</strong> and the app creates the paid checkout on their behalf.
          </p>
        </div>
      </Section>

      <Section
        title="Gifting settings"
        description="The rules applied to gifts issued after a supporter pays through the public gift page."
        footer={
          <Button appearance="primary" loading={saving} disabled={conflicted} onClick={save}>
            Save settings
          </Button>
        }
      >
      <div className="space-y-5">
        {conflicted && (
          <Alert appearance="alert" title={`Another platform owns gifting (${initial.platform})`}>
            This shop’s gifting slot is held by {initial.platform}. Switch it to this app in Fourthwall
            before saving — the write is blocked while another platform owns the slot.
          </Alert>
        )}
        {saved && (
          <Alert appearance="success" title="Saved" onDismiss={() => setSaved(false)}>
            Gifting rules updated.
          </Alert>
        )}
        {error && (
          <Alert appearance="critical" title="Couldn’t save">
            {error}
          </Alert>
        )}

        <Switch
          label="Gifting enabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.currentTarget.checked)}
        />

        <Input
          label="Entry time limit (seconds, 20–180)"
          type="number"
          min={20}
          max={180}
          value={seconds}
          onChange={(e) => setSeconds(Number(e.target.value))}
        />

        <div className="space-y-3">
          <Select
            label="Shipping"
            value={shippingType}
            onChange={(e) => setShippingType(e.target.value as ShippingPolicy['type'])}
          >
            <option value="ALL_CREATOR">Creator pays all shipping</option>
            <option value="ALL_WINNER">Winner pays all shipping</option>
            <option value="MAX_CREATOR">Creator pays up to a max</option>
          </Select>
          {shippingType === 'MAX_CREATOR' && (
            <Input
              label="Max the creator covers"
              type="number"
              min={0}
              step={0.01}
              value={maxCreator}
              onChange={(e) => setMaxCreator(Number(e.target.value))}
            />
          )}
        </div>

        <div className="space-y-3">
          <Select
            label="Giftable products"
            value={productsType}
            onChange={(e) => setProductsType(e.target.value as ProductsPolicy['type'])}
          >
            <option value="ALL">All products</option>
            <option value="SELECTED">Only selected products</option>
            <option value="EXCLUDED">All except selected products</option>
          </Select>
          {showOfferList &&
            (products.length === 0 ? (
              <Alert appearance="alert" title="No products found">
                This shop has no products to choose from.
              </Alert>
            ) : (
              <div className="space-y-2">
                {products.map((product) => (
                  <Checkbox
                    key={product.id}
                    label={product.name}
                    checked={offerIds.includes(product.id)}
                    onChange={() => toggleOffer(product.id)}
                  />
                ))}
              </div>
            ))}
        </div>
      </div>
    </Section>
    </div>
  );
}
