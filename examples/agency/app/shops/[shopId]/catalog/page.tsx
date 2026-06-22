"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert } from "@fourthwall-examples/ui";
import { useCatalog } from "@/hooks/useCatalog";
import { SubaccountBar } from "@/components/SubaccountBar";
import { CatalogToolbar } from "@/components/CatalogToolbar";
import { ProductGrid } from "@/components/ProductGrid";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 12;

/** F3 · Subaccount catalog — open-api + X-ShopId (read-only). */
export default function CatalogPage() {
  return (
    <Suspense fallback={null}>
      <CatalogView />
    </Suspense>
  );
}

function CatalogView() {
  const params = useParams<{ shopId: string }>();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const shopId = params.shopId;
  const { data, loading, error } = useCatalog(shopId, { search, page, size: PAGE_SIZE });

  return (
    <div className="min-h-screen">
      <SubaccountBar
        shopId={shopId}
        name={searchParams.get("name") ?? undefined}
        face="open-api · X-ShopId"
      />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        <CatalogToolbar
          shopId={shopId}
          search={search}
          onSearch={(v) => {
            setSearch(v);
            setPage(0);
          }}
        />

        {error ? (
          <Alert appearance="critical" title="Couldn&apos;t load the catalog">
            {error}
          </Alert>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-panel border border-border bg-card"
              />
            ))}
          </div>
        ) : data ? (
          <>
            <ProductGrid products={data.results} />
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              onChange={setPage}
            />
          </>
        ) : null}
      </main>
    </div>
  );
}
