"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Switch,
} from "@fourthwall-examples/ui";
import { useOnboard } from "@/hooks/useOnboard";
import { PayoutFieldset } from "./PayoutFieldset";
import { OnboardSuccess } from "./OnboardSuccess";
import type { PayoutInput } from "@/lib/types";

interface OnboardModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/** F2 — onboard a creator: form → success handoff (modal launched from the fleet). */
export function OnboardModal({ open, onClose, onCreated }: OnboardModalProps) {
  const { onboard, loading, error, result, reset } = useOnboard();

  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [payoutEnabled, setPayoutEnabled] = useState(false);
  const [payout, setPayout] = useState<PayoutInput>({ country: "US", businessType: "INDIVIDUAL" });

  function close() {
    reset();
    setName("");
    setOwnerEmail("");
    setPayoutEnabled(false);
    onClose();
  }

  async function submit() {
    const created = await onboard({
      name,
      ownerEmail: ownerEmail.trim() || undefined,
      payout: payoutEnabled ? payout : undefined,
    });
    if (created) onCreated();
  }

  const succeeded = Boolean(result);

  return (
    <Modal open={open} onClose={close} size="medium">
      <ModalHeader>{succeeded ? "Creator onboarded" : "Onboard a creator"}</ModalHeader>
      <ModalBody className="text-foreground">
        {succeeded && result ? (
          <OnboardSuccess result={result} onDone={close} />
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Creates a subaccount shop on the agency channel and, optionally, invites the owner and
              starts payout onboarding.
            </p>
            <Input
              label="Shop name"
              required
              value={name}
              placeholder="Nova Vance Store"
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Owner email (optional)"
              type="email"
              value={ownerEmail}
              placeholder="creator@example.com"
              onChange={(e) => setOwnerEmail(e.target.value)}
            />
            <div className="space-y-3 border-t border-border pt-4">
              <Switch
                checked={payoutEnabled}
                onChange={(e) => setPayoutEnabled(e.target.checked)}
                label="Set up payouts now"
              />
              {payoutEnabled && <PayoutFieldset value={payout} onChange={setPayout} />}
            </div>
            {error && (
              <Alert appearance="critical" title="Couldn&apos;t create the shop">
                {error}
              </Alert>
            )}
          </div>
        )}
      </ModalBody>
      {!succeeded && (
        <ModalFooter>
          <Button onClick={close}>Cancel</Button>
          <Button appearance="primary" loading={loading} disabled={!name.trim()} onClick={submit}>
            Create shop
          </Button>
        </ModalFooter>
      )}
    </Modal>
  );
}
