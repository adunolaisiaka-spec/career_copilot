import type { StorageService } from "@/lib/storage/StorageService";
import { LocalDiskStorageService } from "@/lib/storage/adapters/local-disk";
import { VercelBlobStorageService } from "@/lib/storage/adapters/vercel-blob";

let cached: StorageService | null = null;

/**
 * Server-only. Auto-detects Vercel Blob via BLOB_READ_WRITE_TOKEN (set
 * automatically once a Blob store is linked to the Vercel project) and uses
 * it when present — local disk only works for a single long-lived dev
 * server; Vercel's deployed functions have a read-only filesystem outside
 * /tmp, so uploads silently (well, loudly: ENOENT) failed there until this
 * existed. Set STORAGE_PROVIDER=local to force local disk even with a token
 * present (e.g. to avoid burning Blob storage during local development).
 */
export function getStorageService(): StorageService {
  if (cached) return cached;

  const provider = process.env.STORAGE_PROVIDER ?? (process.env.BLOB_READ_WRITE_TOKEN ? "vercel-blob" : "local");
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
