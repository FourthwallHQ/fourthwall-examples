import { NextResponse } from 'next/server';

/**
 * Tiny BFF helpers shared by the route handlers. Every route resolves the
 * channel bearer via `getChannelToken` from the `fourthwall` client; these just
 * standardise error handling so a route is a few lines of forwarding.
 */

/** Turn any thrown error into a 500 with its message. */
export function handleError(error: unknown): Response {
  const message = error instanceof Error ? error.message : 'server_error';
  console.error('[api]', message, error);
  return NextResponse.json({ error: message }, { status: 500 });
}

/** Read a JSON request body, rejecting invalid JSON. */
export async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}
