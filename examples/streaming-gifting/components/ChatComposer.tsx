'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Tag,
} from '@fourthwall-examples/ui';

interface PostedMessage {
  id: number;
  userName: string;
  text: string;
  entered: boolean;
  entrants: number;
}

/** Derive a stable userId from a username so entering twice as the same name dedupes. */
function userIdFor(userName: string): string {
  return `u_${userName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`;
}

/**
 * Post mock chat messages as a specific viewer. The viewer's name comes from the
 * `?user=` query param, so you can be *any* username — and open several tabs with
 * different `?user=` values to populate a draw with distinct entrants. POSTs
 * `/api/chat`, where `!enter` adds the sender to the open draw's participant set.
 */
function ChatComposerInner() {
  const params = useSearchParams();
  const queryUser = (params.get('user') ?? '').trim();
  const userName = queryUser || 'guest';
  const userId = userIdFor(userName);

  const [text, setText] = useState('!enter');
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState<PostedMessage[]>([]);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userName, text }),
      });
      const result = (await res.json()) as { entered?: boolean; entrants?: number };
      setLog((prev) => [
        {
          id: Date.now(),
          userName,
          text,
          entered: Boolean(result.entered),
          entrants: result.entrants ?? 0,
        },
        ...prev,
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mock chat</CardTitle>
        <CardDescription>
          Posting as <span className="font-semibold text-foreground">{userName}</span>. While a draw
          is open, <code className="font-mono">!enter</code> adds the sender to the participant set.
        </CardDescription>
      </CardHeader>
      <CardBody className="space-y-4">
        {!queryUser && (
          <p className="rounded-control border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground">
            Add <code className="font-mono">?user=alice</code> to the URL to post as “alice”. Open
            more tabs with different <code className="font-mono">?user=</code> values to enter as
            distinct viewers. Defaulting to <span className="font-semibold">guest</span>.
          </p>
        )}
        <Input
          label="Message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void send();
          }}
        />

        {log.length > 0 && (
          <ul className="space-y-2">
            {log.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-control border border-border bg-muted px-4 py-2.5"
              >
                <span className="min-w-0 truncate text-base">
                  <span className="font-semibold text-foreground">{entry.userName}</span>{' '}
                  <span className="text-muted-foreground">{entry.text}</span>
                </span>
                {entry.entered ? (
                  <Tag appearance="success">entered · {entry.entrants}</Tag>
                ) : (
                  <Tag appearance="neutral">ignored</Tag>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
      <CardFooter>
        <Button appearance="secondary" onClick={() => setText('!enter')}>
          Set “!enter”
        </Button>
        <Button appearance="primary" loading={sending} onClick={send}>
          Send
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ChatComposer() {
  return (
    <Suspense fallback={null}>
      <ChatComposerInner />
    </Suspense>
  );
}
