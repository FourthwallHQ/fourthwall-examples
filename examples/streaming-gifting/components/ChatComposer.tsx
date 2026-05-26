'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Tag,
} from '@fourthwall-examples/ui';

/** A handful of stand-in viewers so you can populate a draw from one browser. */
const MOCK_USERS = [
  { userId: 'u_ava', userName: 'ava_plays' },
  { userId: 'u_kai', userName: 'kai_stream' },
  { userId: 'u_mia', userName: 'mia_gg' },
  { userId: 'u_leo', userName: 'leo_live' },
  { userId: 'u_zoe', userName: 'zoe_vods' },
];

interface PostedMessage {
  id: number;
  userName: string;
  text: string;
  entered: boolean;
  entrants: number;
}

/**
 * Pick a mock user and post a message; POSTs `/api/chat` so `!enter` populates
 * the open draw's participant set.
 */
export function ChatComposer() {
  const [userId, setUserId] = useState(MOCK_USERS[0].userId);
  const [text, setText] = useState('!enter');
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState<PostedMessage[]>([]);

  async function send() {
    const user = MOCK_USERS.find((u) => u.userId === userId);
    if (!user || !text.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId, userName: user.userName, text }),
      });
      const result = (await res.json()) as { entered?: boolean; entrants?: number };
      setLog((prev) => [
        {
          id: Date.now(),
          userName: user.userName,
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
          Post as a viewer. While a draw is open, <code className="font-mono">!enter</code> adds the
          sender to the participant set.
        </CardDescription>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Select
            label="Send as"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="sm:max-w-48"
          >
            {MOCK_USERS.map((user) => (
              <option key={user.userId} value={user.userId}>
                {user.userName}
              </option>
            ))}
          </Select>
          <Input
            label="Message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void send();
            }}
            className="flex-1"
          />
        </div>

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
