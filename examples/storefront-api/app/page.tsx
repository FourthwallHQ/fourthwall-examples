import { Alert } from "@fourthwall-examples/ui";
import { ProfileHeader } from "../components/ProfileHeader";
import { EmbedWidget } from "../components/EmbedWidget";
import { DirectCheckoutWidget } from "../components/DirectCheckoutWidget";
import { profile } from "../lib/profile";
import { getFeaturedCollection, getShop, isConfigured, type Collection, type Shop } from "../lib/fourthwall";

async function load(): Promise<{ shop: Shop; collection: Collection | null } | null> {
  if (!isConfigured()) return null;
  try {
    const [shop, collection] = await Promise.all([
      getShop(),
      getFeaturedCollection(process.env.FOURTHWALL_COLLECTION_SLUG),
    ]);
    return { shop, collection };
  } catch (err) {
    console.error("Failed to load Fourthwall shop", err);
    return null;
  }
}

export default async function LinkPage() {
  const data = await load();
  const collection = data?.collection;

  return (
    // The host "link in bio" page — profile and links live out here, around the embeds.
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-5 py-12">
      <ProfileHeader profile={profile} />

      {collection && collection.products.length > 0 && (
        <>
          {/* Version 1 — cart + checkout */}
          <EmbedWidget collection={collection} />
          {/* Version 2 — no cart; each card links straight to hosted checkout */}
          <DirectCheckoutWidget collection={collection} shop={data!.shop} />
        </>
      )}

      {!isConfigured() && (
        <Alert appearance="alert" title="Shop not connected">
          Set <code className="font-mono">FOURTHWALL_STOREFRONT_TOKEN</code> in{" "}
          <code className="font-mono">.env.local</code> to embed live products from your
          Fourthwall shop. See the README for how to mint a public token.
        </Alert>
      )}
    </main>
  );
}
