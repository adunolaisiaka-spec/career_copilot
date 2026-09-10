export interface StorageService {
  save(key: string, data: Buffer): Promise<void>;
  read(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}
