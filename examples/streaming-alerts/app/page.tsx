import {
  Alert,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  Tag,
} from "@fourthwall-examples/ui";
import { ConnectButton } from "@/components/ConnectButton";
import { OverlayUrlCopy } from "@/components/OverlayUrlCopy";
import { PrivacyToggle } from "@/components/PrivacyToggle";
import { TestAlertButton } from "@/components/TestAlertButton";
import { DisconnectButton } from "@/components/DisconnectButton";
import { getCurrentConnection } from "@/lib/store";

// Reads in-memory connect state, so it must run fresh on every request.
export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "Fourthwall didn't return an authorization code. Try connecting again.",
  missing_app_id: "NEXT_PUBLIC_FOURTHWALL_APP_ID is not set in .env.local.",
  missing_app_secret: "FOURTHWALL_APP_SECRET is not set in .env.local.",
  missing_base_url: "NEXT_PUBLIC_BASE_URL is not set in .env.local.",
  missing_fourthwall_base_url: "NEXT_PUBLIC_FOURTHWALL_BASE_URL is not set in .env.local.",
};

export default async function ControlPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const connection = getCurrentConnection();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-8">
      <div className="w-full max-w-xl space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Streaming Alerts</h1>
          <p className="text-muted-foreground">
            On-stream alerts for your Fourthwall orders and tips.
          </p>
        </div>

        {error && (
          <Alert appearance="critical" title="Couldn’t connect">
            {ERROR_MESSAGES[error] ?? error}
          </Alert>
        )}

        {!connection ? (
          <Card>
            <CardHeader>
              <CardTitle>Connect your shop</CardTitle>
              <CardDescription>
                Authorize this app to subscribe to your shop’s order and tip webhooks. Nothing is
                stored on disk — the connection lives in memory until you disconnect or restart.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <ConnectButton />
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Shop connected</CardTitle>
                <CardDescription>Paste the overlay URL into OBS as a browser source.</CardDescription>
              </div>
              <Tag appearance="success">Connected</Tag>
            </CardHeader>
            <CardBody className="space-y-6">
              <OverlayUrlCopy url={`${baseUrl}/overlay/${connection.shopId}`} />

              <PrivacyToggle initialShowName={connection.showName} />

              <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Fire a sample alert to confirm your browser source is wired up.
                </p>
                <TestAlertButton />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-5">
                <p className="text-sm text-muted-foreground">
                  Disconnect to unregister the webhooks and forget the token.
                </p>
                <DisconnectButton />
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </main>
  );
}
