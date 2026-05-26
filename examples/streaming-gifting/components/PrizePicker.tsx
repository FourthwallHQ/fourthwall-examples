'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Select,
} from '@fourthwall-examples/ui';
import type { Product } from '@/lib/fourthwall';

interface PrizePickerProps {
  shopId: string;
  products: Product[];
  initialOfferId?: string;
  initialThreshold: number;
  onSaved?: (settings: { offerId: string; threshold: number }) => void;
}

/**
 * Selects the prize `offerId` from the connected shop's product list and the
 * trigger threshold N, then POSTs `/api/settings`.
 */
export function PrizePicker({
  shopId,
  products,
  initialOfferId,
  initialThreshold,
  onSaved,
}: PrizePickerProps) {
  // Flatten products → selectable offers (one per redeemable variant).
  const offers = useMemo(
    () =>
      products.flatMap((product) =>
        product.variants.map((variant) => ({
          id: variant.id,
          label:
            variant.name && variant.name !== product.name
              ? `${product.name} — ${variant.name}`
              : product.name,
        })),
      ),
    [products],
  );

  const [offerId, setOfferId] = useState(initialOfferId ?? offers[0]?.id ?? '');
  const [threshold, setThreshold] = useState(initialThreshold);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/settings?shopId=${encodeURIComponent(shopId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, threshold }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save settings');
      setSaved(true);
      onSaved?.({ offerId, threshold });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Giveaway setup</CardTitle>
        <CardDescription>Pick the prize and how often a purchase opens a draw.</CardDescription>
      </CardHeader>
      <CardBody className="space-y-5">
        {saved && (
          <Alert appearance="success" title="Saved" onDismiss={() => setSaved(false)}>
            Prize and trigger threshold updated.
          </Alert>
        )}
        {error && (
          <Alert appearance="critical" title="Couldn’t save">
            {error}
          </Alert>
        )}

        {offers.length === 0 ? (
          <Alert appearance="alert" title="No products found">
            This shop has no products to give away. Add a product in Fourthwall, then reconnect.
          </Alert>
        ) : (
          <Select
            label="Prize (offer winners redeem)"
            value={offerId}
            onChange={(e) => setOfferId(e.target.value)}
          >
            {offers.map((offer) => (
              <option key={offer.id} value={offer.id}>
                {offer.label}
              </option>
            ))}
          </Select>
        )}

        <Input
          label="Trigger threshold (every Nth purchase opens a draw)"
          type="number"
          min={1}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
        />
      </CardBody>
      <CardFooter>
        <Button
          appearance="primary"
          loading={saving}
          disabled={offers.length === 0 || !offerId}
          onClick={save}
        >
          Save settings
        </Button>
      </CardFooter>
    </Card>
  );
}
