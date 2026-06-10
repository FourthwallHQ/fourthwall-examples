import { Alert } from "@fourthwall-examples/ui";

export function TokenAlert({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Alert appearance="critical" onDismiss={onDismiss}>
      <strong className="text-foreground">Fourthwall MCP token expired.</strong> Mint a new
      token with the MCP inspector&apos;s Quick OAuth flow, update{" "}
      <code className="font-mono text-sm">FOURTHWALL_MCP_TOKEN</code> in{" "}
      <code className="font-mono text-sm">.env.local</code>, and restart the dev server.
    </Alert>
  );
}
