import fs from "fs/promises";
import path from "path";
import type { StorageService } from "@/lib/storage/StorageService";

const ROOT = path.join(process.cwd(), "storage");

function resolveSafe(key: string): string {
  const resolved = path.join(ROOT, key);
  if (!resolved.startsWith(ROOT)) {
    throw new Error("Invalid storage key");
  }
  return resolved;
}

export class LocalDiskStorageService implements StorageService {
  async save(key: string, data: Buffer): Promise<void> {
    const filePath = resolveSafe(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
  }

  async read(key: string): Promise<Buffer | null> {
    try {
      return await fs.readFile(resolveSafe(key));
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    await fs.rm(resolveSafe(key), { force: true });
  }
}
