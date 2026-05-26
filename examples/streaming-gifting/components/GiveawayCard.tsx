'use client';

import type { Draw } from '@/lib/draw';

/**
 * The on-stream card with two live states keyed off `draw.status`: the entry
 * prompt (prize + `!enter` + count) while open, and the winner reveal (name +
 * redeem URL, success accent) when finished. Self-contained high-contrast styling
 * so it reads over any OBS scene.
 */
export function GiveawayCard({ draw }: { draw: Draw | null }) {
  if (!draw || draw.status === 'idle') {
    return (
      <div className="rounded-3xl bg-black/70 px-12 py-10 text-center text-white shadow-2xl backdrop-blur-sm">
        <p className="text-3xl font-semibold opacity-80">Giveaway starting soon…</p>
      </div>
    );
  }

  if (draw.status === 'open') {
    return (
      <div className="rounded-3xl bg-black/80 px-16 py-12 text-center text-white shadow-2xl backdrop-blur-sm">
        <p className="text-xl font-medium uppercase tracking-[0.3em] text-white/60">Giveaway</p>
        <p className="mt-4 text-5xl font-bold">{draw.prizeName}</p>
        <p className="mt-8 text-3xl">
          Type{' '}
          <span className="rounded-lg bg-white/15 px-3 py-1 font-mono font-bold text-emerald-300">
            !enter
          </span>{' '}
          to win
        </p>
        <p className="mt-10 text-2xl font-semibold text-emerald-300">
          {draw.entrants.length} entered
        </p>
      </div>
    );
  }

  // finished
  const winner = draw.winner;
  return (
    <div className="rounded-3xl bg-black/85 px-16 py-12 text-center text-white shadow-2xl ring-2 ring-emerald-400/60 backdrop-blur-sm">
      {winner ? (
        <>
          <p className="text-xl font-medium uppercase tracking-[0.3em] text-emerald-300">Winner</p>
          <p className="mt-4 text-6xl font-extrabold">{winner.userName}</p>
          <p className="mt-6 text-2xl text-white/80">won {draw.prizeName}</p>
          {draw.redeemUrl && (
            <p className="mt-10 break-all font-mono text-xl text-emerald-200">{draw.redeemUrl}</p>
          )}
        </>
      ) : (
        <>
          <p className="text-4xl font-bold">No entrants this time</p>
          <p className="mt-4 text-xl text-white/70">The prize returned to the shop.</p>
        </>
      )}
    </div>
  );
}
