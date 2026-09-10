import type { StorageService } from "@/lib/storage/StorageService";
import { LocalDiskStorageService } from "@/lib/storage/adapters/local-disk";

let cached: StorageService | null = null;

/** Server-only. Local disk in dev; swap in an S3-compatible adapter for production. */
export function getStorageService(): StorageService {
  if (cached) return cached;

  const provider = process.env.STORAGE_PROVIDER || "local";
  switch (provider) {
    case "local":
      cached = new LocalDiskStorageService();
      return cached;
    default:
      throw new Error(`Unsupported STORAGE_PROVIDER: ${provider}`);
  }
}
