"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
} from "@fourthwall-examples/ui";
import { AlertCard } from "@/components/AlertCard";
import type { AlertPayload } from "@/lib/alert";

interface SettingsState {
  installed: boolean;
  enabled: boolean;
  showSupporterName: boolean;
  shopId: string;
  overlayUrl: string;
}

interface SettingsProps {
  initial: SettingsState;
  auth: { shopId: string; hmac: string; timestamp: string };
}

const PREVIEW: AlertPayload = {
  kind: "order",
  name: "Jane D.",
  amount: "$45.00",
  detail: "Black Hoodie · Size L",
  id: "preview",
};

/**
 * The embedded settings UI. Every API call carries the signed query params it
 * was loaded with, so the server can re-verify the shop on each request. Reports
 * its height to the Fourthwall parent frame so the iframe resizes to fit.
 */
export function Settings({ initial, auth }: SettingsProps) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [showName, setShowName] = useState(initial.showSupporterName);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testState, setTestState] = useState<"idle" | "firing" | "done">("idle");

  const signed = new URLSearchParams({
    shop_id: auth.shopId,
    hmac: auth.hmac,
    timestamp: auth.timestamp,
  }).toString();

  // Keep the embedding iframe sized to our content.
  useEffect(() => {
    const send = () =>
      parent.postMessage({ type: "SET_HEIGHT", data: { height: document.documentElement.scrollHeight } }, "*");
    send();
    const observer = new ResizeObserver(send);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  async function patch(next: Partial<Pick<SettingsState, "enabled" | "showSupporterName">>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/settings?${signed}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch {
      // Revert optimistic state on failure.
      setEnabled(initial.enabled);
      setShowName(initial.showSupporterName);
    } finally {
      setSaving(false);
    }
  }

  async function copyOverlayUrl() {
    try {
      await navigator.clipboard.writeText(initial.overlayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be unavailable on insecure origins; the field is selectable.
    }
  }

  async function testFire() {
    setTestState("firing");
    try {
      await fetch(`/api/test-alert?${signed}`, { method: "POST" });
      setTestState("done");
    } catch {
      setTestState("idle");
    }
    setTimeout(() => setTestState("idle"), 2000);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overlay URL</CardTitle>
          <CardDescription>Add this as a Browser Source in OBS (the page is transparent).</CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex gap-2">
            <input
              readOnly
              value={initial.overlayUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-control border border-border bg-muted px-4 py-3 font-mono text-sm text-foreground outline-none"
            />
            <Button appearance="secondary" onClick={copyOverlayUrl}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">Fire a sample alert to confirm your source is wired up.</p>
            <Button appearance="primary" onClick={testFire} loading={testState === "firing"}>
              {testState === "done" ? "Sent" : "Send test alert"}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>How an alert appears on your stream.</CardDescription>
        </CardHeader>
        <CardBody>
          <div className="flex justify-center rounded-panel bg-gradient-to-br from-slate-800 to-slate-950 p-6">
            <AlertCard payload={showName ? PREVIEW : { ...PREVIEW, name: "Someone" }} exiting={false} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardBody className="divide-y divide-border">
          <SettingRow
            label="Alerts"
            description="Master kill switch. When off, no events fire to any connected overlay."
            checked={enabled}
            disabled={saving}
            onChange={(value) => {
              setEnabled(value);
              patch({ enabled: value });
            }}
          />
          <SettingRow
            label="Show supporter names"
            description="When off, alerts show “Someone” instead of the real name."
            checked={showName}
            disabled={saving}
            onChange={(value) => {
              setShowName(value);
              patch({ showSupporterName: value });
            }}
          />
        </CardBody>
      </Card>
    </div>
  );
}

function SettingRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-base font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} disabled={disabled} onChange={(e) => onChange(e.currentTarget.checked)} />
    </div>
  );
}
