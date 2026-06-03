import Link from 'next/link';
import { Alert } from '@fourthwall-examples/ui';
import { ChatComposer } from '@/components/ChatComposer';

/**
 * The mock Twitch chat — the deliberately-isolated entry-collection surface. A
 * real integration swaps this whole page (and `POST /api/chat`) for Twitch
 * EventSub, Discord, or a web form; the Fourthwall calls stay unchanged.
 */
export default function MockChatPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Mock chat</h1>
        <p className="text-muted-foreground">
          A stand-in for stream chat so the example runs without a real Twitch integration.
        </p>
      </header>

      <Alert appearance="brand" title="This is the swappable seam">
        Entry collection is isolated here. Replace this surface with Twitch EventSub, Discord, or a
        web form — the only contract with Fourthwall is the participant list handed to Finish
        Giveaway.
      </Alert>

      <ChatComposer />

      <p className="text-sm text-muted-foreground">
        Open the giveaway settings from your Fourthwall dashboard to open a draw, then post{' '}
        <code className="font-mono">!enter</code> here. Add <code className="font-mono">?user=</code>{' '}
        to the URL to choose your viewer name, and open more tabs (e.g.{' '}
        <Link href="/chat?user=alice" className="font-medium text-text-brand underline">
          ?user=alice
        </Link>
        ,{' '}
        <Link href="/chat?user=bob" className="font-medium text-text-brand underline">
          ?user=bob
        </Link>
        ) to enter as distinct viewers.
      </p>
    </main>
  );
}
