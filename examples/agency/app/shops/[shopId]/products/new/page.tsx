"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { usePreview } from "@/hooks/usePreview";
import { usePublish } from "@/hooks/usePublish";
import { useProductTemplates } from "@/hooks/useProductTemplates";
import { SubaccountBar } from "@/components/SubaccountBar";
import { DesignControls } from "@/components/DesignControls";
import { PreviewPane } from "@/components/PreviewPane";

/** F4 · Design & publish — preview (channel-api) then publish (open-api + X-ShopId). */
export default function StudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioView />
    </Suspense>
  );
}

function StudioView() {
  const params = useParams<{ shopId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const shopId = params.shopId;
  const name = searchParams.get("name") ?? undefined;

  const { templates, loading: templatesLoading } = useProductTemplates(shopId);
  const preview = usePreview();
  const publish = usePublish(shopId);

  // On publish, the product appears in the F3 catalog — that's the confirmation.
  useEffect(() => {
    if (publish.result) {
      router.push(`/shops/${shopId}/catalog${name ? `?name=${encodeURIComponent(name)}` : ""}`);
    }
  }, [publish.result, router, shopId, name]);

  return (
    <div className="min-h-screen">
      <SubaccountBar shopId={shopId} name={name} face="open-api · X-ShopId" />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Design &amp; publish</h1>
          <p className="text-muted-foreground">
            Render an instant preview, then publish a live design product on this subaccount.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DesignControls
            templates={templates}
            templatesLoading={templatesLoading}
            onPreview={preview.preview}
            onPublish={publish.publish}
            previewLoading={preview.loading}
            publishLoading={publish.loading}
            publishError={publish.error}
          />
          <PreviewPane loading={preview.loading} error={preview.error} result={preview.result} />
        </div>
      </main>
    </div>
  );
}
