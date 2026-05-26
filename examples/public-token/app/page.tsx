'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
  Tag,
} from '@fourthwall-examples/ui';

function Field({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="rounded-control border border-border bg-muted px-4 py-3">
        {value ? (
          <p className={mono ? 'break-all font-mono text-base text-foreground' : 'text-base text-foreground'}>
            {value}
          </p>
        ) : (
          <p className="text-base italic text-muted-foreground">Not provided</p>
        )}
      </div>
    </div>
  );
}

function ShopDetails() {
  const searchParams = useSearchParams();
  const domain = searchParams.get('domain');
  const publicToken = searchParams.get('public_token');
  const expiresIn = searchParams.get('expires_in');
  const complete = Boolean(domain && publicToken);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">OAuth</h1>
          <p className="text-muted-foreground">Public token integration example</p>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Authorization result</CardTitle>
              <CardDescription>Values returned to your redirect URL.</CardDescription>
            </div>
            <Tag appearance={complete ? 'success' : 'alert'}>
              {complete ? 'Connected' : 'Incomplete'}
            </Tag>
          </CardHeader>

          <CardBody className="space-y-5">
            <Field
              label="Shop Domain"
              mono
              value={domain ? `${domain}.${process.env.NEXT_PUBLIC_FOURTHWALL_BASE_URL ?? 'fourthwall.com'}` : null}
            />
            <Field label="Public Token" mono value={publicToken} />
            <Field label="Expires In" value={expiresIn ? `${expiresIn} seconds` : null} />

            {!complete && (
              <Alert appearance="alert" title="Missing required parameters">
                Ensure both <code className="font-mono">domain</code> and{' '}
                <code className="font-mono">public_token</code> are present in the redirect URL.
              </Alert>
            )}
          </CardBody>

          <CardFooter>
            <Button
              appearance="secondary"
              disabled={!publicToken}
              onClick={() => publicToken && navigator.clipboard.writeText(publicToken)}
            >
              Copy token
            </Button>
            <Button appearance="primary">Continue</Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>}>
      <ShopDetails />
    </Suspense>
  );
}
