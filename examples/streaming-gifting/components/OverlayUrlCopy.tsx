'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@fourthwall-examples/ui';

/** Shows and one-click-copies the `/overlay/:shopId` URL for OBS. */
export function OverlayUrlCopy({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>OBS overlay</CardTitle>
        <CardDescription>Paste this URL as a browser source in OBS — it stays live.</CardDescription>
      </CardHeader>
      <CardBody className="flex items-center gap-3">
        <code className="min-w-0 flex-1 truncate rounded-control border border-border bg-muted px-3.5 py-2.5 font-mono text-sm">
          {url}
        </code>
        <Button appearance="secondary" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </CardBody>
    </Card>
  );
}
