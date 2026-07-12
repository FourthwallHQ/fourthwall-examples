import Link from 'next/link';
import { Alert } from '@fourthwall-examples/ui';
import { firstConnection } from '@/lib/store';
import { listProducts, type Product } from '@/lib/fourthwall';
import { GiftNowButton } from './GiftNowButton';

// Reads signed-out request params + the in-memory connection, so it must run
// fresh per request.
export const dynamic = 'force-dynamic';

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * /gift — the public supporter-facing gifting page.
 *
 * This is the stable URL the creator shares from the embedded settings page. It
 * takes an `offerId` in the query string, resolves the corresponding offer
 * against the single-shop connection this example holds, and shows one
 * `Gift now` action. Clicking it opens a paid gifting checkout (via
 * `POST /api/checkout`) and redirects the browser straight to the returned
 * `checkoutUrl`. There is no live-stream gate, no variant picker, no modal —
 * variant selection happens inside Fourthwall's checkout.
 *
 * Unlike the embedded settings page, this route is intentionally unauthenticated
 * — it is the public link supporters click.
 */
export default async function PublicGiftingPage({
  searchParams,
}: {
  searchParams: Promise<{ offerId?: string | string[] }>;
}) {
  const params = await searchParams;
  const offerId = firstParam(params.offerId);

  if (!offerId) {
    return (
      <ErrorShell title="This gift link is missing an offer">
        Ask the creator for a fresh link — the URL needs an <code className="font-mono">offerId</code>{' '}
        query parameter.
      </ErrorShell>
    );
  }

  const connection = firstConnection();
  if (!connection) {
    return (
      <ErrorShell title="Gifting isn’t available right now">
        This shop isn’t connected. Try again in a moment.
      </ErrorShell>
    );
  }

  let product: Product | undefined;
  try {
    const products = await listProducts(connection.accessToken);
    product = products.find((p) => p.id === offerId);
  } catch {
    // Upstream products call failed — fall through to the invalid-offer error so
    // we never leak platform internals to supporters.
  }

  if (!product) {
    return (
      <ErrorShell title="This gift offer isn’t available">
        The creator may have replaced it. Ask them for a fresh link.
      </ErrorShell>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
      <header className="flex items-center justify-between border-b border-border pb-6">
        <span className="text-lg font-bold">{connection.domain ?? 'Creator Shop'}</span>
        <span className="text-xs text-muted-foreground">Community gifting</span>
      </header>

      <section className="grid flex-1 items-center gap-14 py-16 md:grid-cols-2">
        <div className="grid min-h-[420px] place-items-center rounded-2xl border border-border bg-muted">
          <div className="grid h-40 w-40 place-items-center rounded-3xl bg-background text-7xl shadow-2xl">
            🎁
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-text-brand">
            Gift the community
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Make someone’s day.
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Buy a gift for the community. After payment, viewers get a chance to enter chat and one
            community member takes it home.
          </p>

          <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-background p-4">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-muted text-2xl">👕</div>
            <div className="flex-1">
              <strong className="block text-sm">{product.name}</strong>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Choose size and color in checkout · 1 gift
              </span>
            </div>
          </div>

          <div className="mt-4">
            <GiftNowButton offerId={product.id} />
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            You’ll continue directly to secure Fourthwall checkout.
          </p>
        </div>
      </section>
    </main>
  );
}

function ErrorShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-8">
      <Alert appearance="critical" title={title}>
        {children}
      </Alert>
      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/" className="underline">
          Back to the creator dashboard
        </Link>
      </p>
    </main>
  );
}
