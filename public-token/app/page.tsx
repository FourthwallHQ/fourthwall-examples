'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ShopDetails() {
  const searchParams = useSearchParams();
  const domain = searchParams.get('domain');
  const publicToken = searchParams.get('public_token');
  const expiresIn = searchParams.get('expires_in');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black p-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            OAuth
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Completed OAuth
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
          <div className="p-8 space-y-6">
            {/* Shop Domain */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                Shop Domain
              </label>
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                {domain ? (
                  <p className="text-lg font-mono text-zinc-900 dark:text-zinc-100 break-all">
                    {domain}.{process.env.NEXT_PUBLIC_FOURTHWALL_BASE_URL}
                  </p>
                ) : (
                  <p className="text-zinc-400 dark:text-zinc-500 italic">
                    No domain provided
                  </p>
                )}
              </div>
            </div>

            {/* Public Token */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                Public Token
              </label>
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                {publicToken ? (
                  <p className="text-lg font-mono text-zinc-900 dark:text-zinc-100 break-all">
                    {publicToken}
                  </p>
                ) : (
                  <p className="text-zinc-400 dark:text-zinc-500 italic">
                    No token provided
                  </p>
                )}
              </div>
            </div>

            {/* Expires In */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                Expires In
              </label>
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                {expiresIn ? (
                  <p className="text-lg font-mono text-zinc-900 dark:text-zinc-100">
                    {expiresIn} seconds
                  </p>
                ) : (
                  <p className="text-zinc-400 dark:text-zinc-500 italic">
                    No expiration provided
                  </p>
                )}
              </div>
            </div>
          </div>

          {(!domain || !publicToken) && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800 p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ Missing required parameters. Please ensure both <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">domain</code> and <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">public_token</code> are provided in the URL.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    }>
      <ShopDetails />
    </Suspense>
  );
}
