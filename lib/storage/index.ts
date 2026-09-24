import type { StorageService } from "@/lib/storage/StorageService";
import { LocalDiskStorageService } from "@/lib/storage/adapters/local-disk";
import { VercelBlobStorageService } from "@/lib/storage/adapters/vercel-blob";

let cached: StorageService | null = null;

/**
 * Server-only. Auto-detects Vercel Blob and uses it when a store is linked to
 * the project — either via the classic BLOB_READ_WRITE_TOKEN, or via the
 * newer OIDC-based connection (BLOB_STORE_ID + Vercel's auto-injected
 * identity token, which @vercel/blob resolves on its own with no further
 * config). Local disk only works for a single long-lived dev server; Vercel's
 * deployed functions have a read-only filesystem outside /tmp, so uploads
 * loudly (ENOENT) failed there until this existed. Set STORAGE_PROVIDER=local
 * to force local disk even with Blob configured (e.g. to avoid burning Blob
 * storage during local development).
 */
export function getStorageService(): StorageService {
  if (cached) return cached;

  const blobConfigured = Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID,
  );
  const provider = process.env.STORAGE_PROVIDER ?? (blobConfigured ? "vercel-blob" : "local");
  switch (provider) {
    case "local":
      cached = new LocalDiskStorageService();
      return cached;
    case "vercel-blob":
      cached = new VercelBlobStorageService();
      return cached;
    default:
      throw new Error(`Unsupported STORAGE_PROVIDER: ${provider}`);
  }
}
