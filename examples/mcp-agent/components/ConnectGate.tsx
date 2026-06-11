import { Alert, Button } from "@fourthwall-examples/ui";

export function ConnectGate({ authError }: { authError?: string }) {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center gap-5 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-[18px] bg-primary text-primary-foreground">
        <svg viewBox="0 0 16 16" className="size-7" fill="currentColor" aria-hidden>
          <path d="M8 0c.62 4.06 3.42 6.92 8 8-4.58 1.08-7.38 3.94-8 8-.62-4.06-3.42-6.92-8-8 4.58-1.08 7.38-3.94 8-8Z" />
        </svg>
      </div>
      <div className="flex max-w-[440px] flex-col gap-2">
        <span className="text-xl font-semibold">Connect your Fourthwall account</span>
        <span className="text-base text-muted-foreground">
          The assistant answers from your live shop data through the Fourthwall MCP server.
          Connecting opens Fourthwall&apos;s login page.
        </span>
      </div>
      <Button appearance="primary" onClick={() => (window.location.href = "/api/auth/login")}>
        Connect Fourthwall
      </Button>
      {authError && (
        <Alert appearance="critical" className="max-w-[440px] text-left">
          <strong className="text-foreground">Login failed.</strong> {authError}
        </Alert>
      )}
    </div>
  );
}
