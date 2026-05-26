'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Tag,
} from '@fourthwall-examples/ui';
import { PrizePicker } from '@/components/PrizePicker';
import { DrawPanel } from '@/components/DrawPanel';
import { WinnerPanel } from '@/components/WinnerPanel';
import { OverlayUrlCopy } from '@/components/OverlayUrlCopy';
import { useDrawStream } from '@/lib/useDrawStream';
import { idleDraw, type Draw } from '@/lib/draw';
import type { Product } from '@/lib/fourthwall';

interface Snapshot {
  connected: boolean;
  shopId?: string;
  domain?: string;
  products?: Product[];
  offerId?: string;
  prizeName?: string;
  threshold?: number;
  webhooksActive?: boolean;
  baseUrl?: string;
  draw?: Draw;
}

const SCOPE = 'giveaway_write webhook_write offer_read';

function authorizeUrl(): string | null {
  const appId = process.env.NEXT_PUBLIC_FOURTHWALL_APP_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const fwBase = process.env.NEXT_PUBLIC_FOURTHWALL_BASE_URL ?? 'fourthwall.com';
  if (!appId || !baseUrl) return null;
  const params = new URLSearchParams({
    client_id: appId,
    response_type: 'code',
    redirect_uri: `${baseUrl}/oauth`,
    scope: SCOPE,
  });
  return `https://${fwBase}/admin/platform-apps/authorize?${params.toString()}`;
}

function ConnectCard() {
  const url = authorizeUrl();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect your shop</CardTitle>
        <CardDescription>
          Authorize the <code className="font-mono">giveaway_write</code> scope to start running
          on-stream giveaways.
        </CardDescription>
      </CardHeader>
      <CardBody className="space-y-4">
        {!url && (
          <Alert appearance="critical" title="Missing configuration">
            Set <code className="font-mono">NEXT_PUBLIC_FOURTHWALL_APP_ID</code> and{' '}
            <code className="font-mono">NEXT_PUBLIC_BASE_URL</code> in <code>.env.local</code>.
          </Alert>
        )}
        <Alert appearance="info" title="Using your shop’s admin host">
          The authorize link points at your configured Fourthwall instance. If your shop lives on a
          subdomain (e.g. <code className="font-mono">my-shop.fourthwall.com</code>), use that host.
        </Alert>
      </CardBody>
      <CardFooter>
        <Button
          appearance="primary"
          disabled={!url}
          onClick={() => {
            if (url) window.location.href = url;
          }}
        >
          Connect with Fourthwall
        </Button>
      </CardFooter>
    </Card>
  );
}

function ControlPage() {
  const searchParams = useSearchParams();
  const shopId = searchParams.get('shopId') ?? undefined;
  const connectError = searchParams.get('error');
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const liveDraw = useDrawStream(shopId);

  useEffect(() => {
    if (!shopId) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/state?shopId=${encodeURIComponent(shopId)}`);
      const data = (await res.json()) as Snapshot;
      if (!cancelled) setSnapshot(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [shopId]);

  const connected = Boolean(shopId && snapshot?.connected);
  const draw = liveDraw ?? snapshot?.draw ?? idleDraw();
  const hasPrize = Boolean(draw.offerId || snapshot?.offerId);
  const overlayUrl = `${snapshot?.baseUrl ?? ''}/overlay/${shopId ?? ''}`;

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Streaming gifting</h1>
          <p className="text-muted-foreground">
            Turn purchases into on-stream giveaways — the operator cockpit.
          </p>
        </div>
        <Tag appearance={connected ? 'success' : 'neutral'}>
          {connected ? 'Connected' : 'Not connected'}
        </Tag>
      </header>

      {!connected ? (
        <div className="space-y-6">
          {connectError && (
            <Alert appearance="critical" title="Couldn’t connect your shop">
              {connectError}
            </Alert>
          )}
          <ConnectCard />
        </div>
      ) : (
        <>
          {snapshot && snapshot.webhooksActive === false && (
            <Alert appearance="alert" title="Purchase webhooks not registered">
              This app couldn’t register purchase webhooks (it needs a public URL Fourthwall can
              reach). The Nth-purchase trigger is off — open draws manually below and enter from the{' '}
              <Link href="/chat" className="font-medium text-text-brand underline">
                mock chat
              </Link>
              .
            </Alert>
          )}

          <PrizePicker
            shopId={shopId!}
            products={snapshot?.products ?? []}
            initialOfferId={snapshot?.offerId}
            initialThreshold={snapshot?.threshold ?? 5}
            onSaved={({ offerId, threshold }) =>
              setSnapshot((prev) => (prev ? { ...prev, offerId, threshold } : prev))
            }
          />

          <DrawPanel shopId={shopId!} draw={draw} hasPrize={hasPrize} />

          {draw.status === 'finished' && <WinnerPanel draw={draw} />}

          <OverlayUrlCopy url={overlayUrl} />

          <p className="text-sm text-muted-foreground">
            Tip: open the{' '}
            <Link href="/chat" className="font-medium text-text-brand underline">
              mock chat
            </Link>{' '}
            in another tab to post <code className="font-mono">!enter</code> as viewers.
          </p>
        </>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <ControlPage />
    </Suspense>
  );
}
