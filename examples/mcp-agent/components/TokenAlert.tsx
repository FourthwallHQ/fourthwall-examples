import { Alert, Button } from "@fourthwall-examples/ui";

export function TokenAlert({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Alert appearance="critical" onDismiss={onDismiss}>
      <div className="flex flex-col items-start gap-2.5">
        <span>
          <strong className="text-foreground">Fourthwall session expired.</strong> Reconnect
          your account to keep going — this restarts the conversation.
        </span>
        <Button
          appearance="primary"
          size="xsmall"
          onClick={() => (window.location.href = "/api/auth/login")}
        >
          Reconnect Fourthwall
        </Button>
      </div>
    </Alert>
  );
}
