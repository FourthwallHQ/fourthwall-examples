"use client";

import { Alert, Button } from "@fourthwall-examples/ui";
import type { OnboardResult } from "@/lib/types";

interface OnboardSuccessProps {
  result: OnboardResult;
  onDone: () => void;
}

// The design-system Button renders a <button>, so for a real navigable link we
// style an <a> to match the primary/small Button (opens the hosted flow in a
// new tab; the URL stays visible below so the operator can still hand it off).
const linkButtonClass =
  "relative inline-flex h-10 items-center justify-center gap-2.5 whitespace-nowrap rounded-control bg-primary px-4 text-base font-semibold text-primary-foreground outline-none transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** The handoff: what was created, the owner invite, and the payout link to open or send. */
export function OnboardSuccess({ result, onDone }: OnboardSuccessProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Shop created</p>
        <p className="text-lg font-semibold text-foreground">{result.shopName}</p>
        <p className="font-mono text-xs text-muted-foreground">{result.shopId}</p>
      </div>

      {result.invitationStatus && (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Owner invitation</p>
          <p className="text-base text-foreground">
            <span className="font-medium">{result.invitationStatus}</span>
            {result.invitationEmail ? ` · ${result.invitationEmail}` : ""}
          </p>
        </div>
      )}

      {result.payoutOnboardingUrl && (
        <div className="space-y-2 border-t border-border pt-5">
          <p className="text-sm font-medium text-foreground">Creator payout onboarding</p>
          <p className="text-sm text-muted-foreground">
            Greenroom can&apos;t complete payouts for them — open Fourthwall&apos;s hosted flow to
            finish ID and bank verification, or send the creator this link.
          </p>
          <a
            href={result.payoutOnboardingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={linkButtonClass}
          >
            Open payout onboarding ↗
          </a>
          <p className="break-all font-mono text-xs text-muted-foreground">
            {result.payoutOnboardingUrl}
          </p>
          <Alert appearance="alert" title="Payouts are pending until verified">
            Returning from this link means the creator left the hosted flow, not that payouts are
            verified. The link is single-use and short-lived.
          </Alert>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button appearance="primary" onClick={onDone}>
          Back to fleet
        </Button>
      </div>
    </div>
  );
}
