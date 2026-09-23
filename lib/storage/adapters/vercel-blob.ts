import { put, get, del } from "@vercel/blob";
import type { StorageService } from "@/lib/storage/StorageService";

export class VercelBlobStorageService implements StorageService {
  async save(key: string, data: Buffer): Promise<void> {
    await put(key, data, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  }

  async read(key: string): Promise<Buffer | null> {
    const result = await get(key, { access: "private" });
    if (!result?.stream) return null;
    const arrayBuffer = await new Response(result.stream).arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async delete(key: string): Promise<void> {
    await del(key);
  }
}
