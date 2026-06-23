'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  Blueprint,
  Channel,
  PreviewRequest,
  PreviewResult,
  ProductLink,
  ProductOptions,
  RegisteredImage,
  Shop,
  UploadTicket,
} from './types';
import { getStoredShop, setStoredShop } from './shop-storage';

/**
 * Client data hooks — the ONLY thing the components touch. Each hook calls
 * exactly one `/api/*` route (the upload hook chains upload-url → PUT → media,
 * but that is one logical "upload artwork" action) and exposes typed loading /
 * data / error state. No component imports `lib/fourthwall` or holds the
 * credential; the browser only ever talks to the app's own routes.
 */

/* ----------------------------- shared async state ----------------------------- */

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface MutationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? `Request failed (${res.status}).`;
  } catch {
    return `Request failed (${res.status}).`;
  }
}

/** GET /api/templates — the blank-product list. Pure fetch, no React state. */
async function fetchTemplates(): Promise<Blueprint[]> {
  const res = await fetch('/api/templates');
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as Blueprint[];
}

/**
 * GET /api/links — the dashboard product list. Pure fetch, no React state.
 * Sends the client-held shop id as `x-shop-id`; absent ⇒ the server returns [].
 */
async function fetchLinks(): Promise<ProductLink[]> {
  const res = await fetch('/api/links', {
    headers: { 'x-shop-id': getStoredShop()?.id ?? '' },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as ProductLink[];
}

/* --------------------------------- queries --------------------------------- */

/**
 * `useProductTemplates` — the blank-product picker. Calls GET /api/templates.
 */
export function useProductTemplates() {
  const [state, setState] = useState<QueryState<Blueprint[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchTemplates();
        if (active) setState({ data, loading: false, error: null });
      } catch (error) {
        if (active) setState({ data: null, loading: false, error: errorMessage(error) });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(() => {
    setState({ data: null, loading: true, error: null });
    void fetchTemplates()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => setState({ data: null, loading: false, error: errorMessage(error) }));
  }, []);

  return { ...state, refresh };
}

/**
 * `useProductOptions` — the picked template's selectable options (regions,
 * colors, sizes). Calls GET /api/templates/[productId]. Idle (no fetch, no
 * error) until a productId is set; re-fetches when the productId changes.
 */
export function useProductOptions(productId: string | undefined) {
  const [state, setState] = useState<QueryState<ProductOptions>>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!productId) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let active = true;
    setState({ data: null, loading: true, error: null });
    (async () => {
      try {
        const res = await fetch(`/api/templates/${encodeURIComponent(productId)}`);
        if (!res.ok) throw new Error(await parseError(res));
        const data = (await res.json()) as ProductOptions;
        if (active) setState({ data, loading: false, error: null });
      } catch (error) {
        if (active) setState({ data: null, loading: false, error: errorMessage(error) });
      }
    })();
    return () => {
      active = false;
    };
  }, [productId]);

  return state;
}

/**
 * `useChannel` — the connected channel, for the dashboard header. Calls
 * GET /api/channel (the channel bearer is resolved server-side).
 */
export function useChannel() {
  const [state, setState] = useState<QueryState<Channel>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/channel');
        if (!res.ok) throw new Error(await parseError(res));
        const data = (await res.json()) as Channel;
        if (active) setState({ data, loading: false, error: null });
      } catch (error) {
        if (active) setState({ data: null, loading: false, error: errorMessage(error) });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return state;
}

/**
 * `useShop` — the shop this app has provisioned, for the dashboard header. The
 * shop id + name live in the BROWSER's localStorage (survives refreshes AND
 * dev-server restarts), so this reads from there rather than the server. It is
 * `null` until the first publish creates one — the creator names their shop
 * before that; once it exists this returns the persisted name. `refresh`
 * re-reads localStorage after a publish (which `usePublish` just wrote to).
 *
 * Initialized in an effect (not lazily) because localStorage is client-only:
 * starting `{ data: null, loading: true }` keeps SSR and the first client render
 * identical, avoiding a hydration mismatch.
 */
export function useShop() {
  const [state, setState] = useState<QueryState<Shop | null>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    setState({ data: getStoredShop(), loading: false, error: null });
  }, []);

  const refresh = useCallback(() => {
    setState({ data: getStoredShop(), loading: false, error: null });
  }, []);

  return { ...state, refresh };
}

/**
 * `useLinks` — the dashboard product list. Calls GET /api/links. Returns an
 * empty array (the EmptyState) until a shop exists; that is the first-run
 * experience, not an error.
 */
export function useLinks() {
  const [state, setState] = useState<QueryState<ProductLink[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchLinks();
        if (active) setState({ data, loading: false, error: null });
      } catch (error) {
        if (active) setState({ data: null, loading: false, error: errorMessage(error) });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    void fetchLinks()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => setState({ data: null, loading: false, error: errorMessage(error) }));
  }, []);

  return { ...state, refresh };
}

/* -------------------------------- mutations -------------------------------- */

/**
 * `useUploadArtwork` — upload artwork then register it. One logical action
 * behind three steps: POST /api/upload-url → PUT the bytes to the presigned
 * URL → POST /api/media with the file URL + dimensions. Returns the registered
 * `imageId` reused by preview and publish.
 */
export function useUploadArtwork() {
  const [state, setState] = useState<MutationState<RegisteredImage>>({
    data: null,
    loading: false,
    error: null,
  });

  const upload = useCallback(async (file: File) => {
    setState({ data: null, loading: true, error: null });
    try {
      // 1. Request a presigned upload URL.
      const urlRes = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: file.type || 'image/png',
          fileName: file.name,
          size: file.size,
        }),
      });
      if (!urlRes.ok) throw new Error(await parseError(urlRes));
      const ticket = (await urlRes.json()) as UploadTicket;

      // 2. PUT the raw bytes straight to storage (not through the BFF).
      //    order signs the GCS URL with TWO things the PUT must echo exactly, or
      //    GCS returns 403 SignatureDoesNotMatch: the Content-Type, and an
      //    `x-goog-content-length-range: 0,<size>` extension header (the size is
      //    the byte count we sent to /api/upload-url). Both must match the values
      //    used at signing time, so reuse the same `file.type`/`file.size`.
      const putRes = await fetch(ticket.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'image/png',
          'x-goog-content-length-range': `0,${file.size}`,
        },
        body: file,
      });
      if (!putRes.ok) throw new Error(`Upload failed (${putRes.status}).`);

      // 3. Read the dimensions, then register the image in the media library.
      const { width, height } = await readDimensions(file);
      const mediaRes = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: ticket.fileUrl, width, height }),
      });
      if (!mediaRes.ok) throw new Error(await parseError(mediaRes));
      const image = (await mediaRes.json()) as RegisteredImage;
      setState({ data: image, loading: false, error: null });
      return image;
    } catch (error) {
      setState({ data: null, loading: false, error: errorMessage(error) });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, upload, reset };
}

/** Read an image file's pixel dimensions via a detached <img>. */
function readDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const { naturalWidth, naturalHeight } = img;
      URL.revokeObjectURL(url);
      resolve({ width: naturalWidth, height: naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read artwork image.'));
    };
    img.src = url;
  });
}

/**
 * `usePreview` — render live preview images, synchronously, with no shop.
 * Calls POST /api/previews with the exact inputs that will later be published.
 */
export function usePreview() {
  const [state, setState] = useState<MutationState<PreviewResult>>({
    data: null,
    loading: false,
    error: null,
  });

  const preview = useCallback(async (request: PreviewRequest) => {
    setState({ data: null, loading: true, error: null });
    try {
      const res = await fetch('/api/previews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!res.ok) throw new Error(await parseError(res));
      const data = (await res.json()) as PreviewResult;
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      setState({ data: null, loading: false, error: errorMessage(error) });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, preview, reset };
}

/**
 * `usePublish` — the shop-bound create. Posts multipart FormData (the raw
 * artwork file plus the design inputs) to POST /api/publish, which provisions a
 * shop on first publish, re-uploads the artwork into that shop, then creates the
 * product scoped to it.
 *
 * The client sends the shop id it holds (localStorage) as the `shopId` field so
 * the server reuses it; on the first publish there is none and the server
 * provisions one, returning `{ link, shop }`. We persist `shop` to localStorage
 * and resolve with the new ProductLink.
 */
export function usePublish() {
  const [state, setState] = useState<MutationState<ProductLink>>({
    data: null,
    loading: false,
    error: null,
  });

  const publish = useCallback(async (form: FormData) => {
    setState({ data: null, loading: true, error: null });
    try {
      // Thread the client-held shop id so the server reuses it (absent on first
      // publish, where the server provisions a shop and returns it).
      const storedShopId = getStoredShop()?.id;
      if (storedShopId) form.append('shopId', storedShopId);
      // No explicit Content-Type — the browser sets the multipart boundary.
      const res = await fetch('/api/publish', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error(await parseError(res));
      const body = (await res.json()) as { link: ProductLink; shop: Shop };
      setStoredShop(body.shop); // persist so the shop survives restarts
      setState({ data: body.link, loading: false, error: null });
      return body.link;
    } catch (error) {
      setState({ data: null, loading: false, error: errorMessage(error) });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, publish, reset };
}

/**
 * `useToggleVisibility` — show/hide a product on the storefront. Calls
 * PUT /api/links/[id]/visibility. Optimistically applied by the caller.
 */
export function useToggleVisibility() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = useCallback(async (id: string, visible: boolean) => {
    setLoadingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/links/${encodeURIComponent(id)}/visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-shop-id': getStoredShop()?.id ?? '',
        },
        body: JSON.stringify({ visible }),
      });
      if (!res.ok) throw new Error(await parseError(res));
    } catch (err) {
      setError(errorMessage(err));
      throw err;
    } finally {
      setLoadingId(null);
    }
  }, []);

  return { loadingId, error, toggle };
}

/**
 * `useDeleteLink` — archive a product. Calls DELETE /api/links/[id].
 */
export function useDeleteLink() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: string) => {
    setLoadingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/links/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'x-shop-id': getStoredShop()?.id ?? '' },
      });
      if (!res.ok) throw new Error(await parseError(res));
    } catch (err) {
      setError(errorMessage(err));
      throw err;
    } finally {
      setLoadingId(null);
    }
  }, []);

  return { loadingId, error, remove };
}
