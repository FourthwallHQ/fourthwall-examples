import { Alert } from '@fourthwall-examples/ui';

export const dynamic = 'force-dynamic';

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "Fourthwall didn't return an authorization code. Try installing again.",
  missing_base_url: 'NEXT_PUBLIC_BASE_URL is not set in .env.local.',
  install_failed: 'The install could not be completed. Check the server logs and try again.',
};

/**
 * /installed — the OAuth callback's fallback landing.
 *
 * On success the callback sends the creator back to the app's page in the
 * Fourthwall dashboard (where the embedded settings live), so this page is only
 * reached to show an install error, or as a confirmation when the shop domain
 * couldn't be resolved for the dashboard redirect.
 */
export default async function InstalledPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Streaming Gifting</h1>
        {error ? (
          <Alert appearance="critical" title="Install failed">
            {ERROR_MESSAGES[error] ?? error}
          </Alert>
        ) : (
          <Alert appearance="success" title="Installed">
            Webhooks are registered. Open the Gifting app from your Fourthwall dashboard to set your
            gifting rules and run giveaways.
          </Alert>
        )}
      </div>
    </main>
  );
}
