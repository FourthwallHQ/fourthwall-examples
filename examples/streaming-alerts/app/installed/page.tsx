import { Alert } from "@fourthwall-examples/ui";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "Fourthwall didn't return an authorization code. Try installing again.",
  missing_app_id: "NEXT_PUBLIC_FOURTHWALL_APP_ID is not set in .env.local.",
  missing_app_secret: "FOURTHWALL_APP_SECRET is not set in .env.local.",
  missing_base_url: "NEXT_PUBLIC_BASE_URL is not set in .env.local.",
  missing_fourthwall_base_url: "NEXT_PUBLIC_FOURTHWALL_BASE_URL is not set in .env.local.",
};

/**
 * /installed — where the OAuth install callback lands the browser.
 *
 * The real settings live inside the Fourthwall dashboard (this app is embedded),
 * so this page is just a confirmation: install succeeded, manage it from there.
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
        <h1 className="text-2xl font-semibold tracking-tight">Streaming Alerts</h1>
        {error ? (
          <Alert appearance="critical" title="Install failed">
            {ERROR_MESSAGES[error] ?? error}
          </Alert>
        ) : (
          <Alert appearance="success" title="Installed">
            Webhooks are registered. Open the Alerts app from your Fourthwall dashboard to grab your
            overlay URL and manage settings.
          </Alert>
        )}
      </div>
    </main>
  );
}
