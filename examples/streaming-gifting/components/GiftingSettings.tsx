'use client';

import { useState } from 'react';
import { Alert, Button, Checkbox, Input, Select, Switch } from '@fourthwall-examples/ui';
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
    <Section
      title="Gifting settings"
      description="The rules applied when a supporter gifts on your live storefront."
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
          label="Gift while live"
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
  );
}
