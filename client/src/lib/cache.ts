const DEFAULT_CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes
type CacheEntry<R> = { expiry: number; value: R };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FunctionType<R> = (key: string, ...args: any[]) => Promise<R>;
type ArgumentsType<R, T extends FunctionType<R>> = T extends (
  key: string,
  ...args: infer A
) => Promise<R>
  ? A
  : never;

export class SolariumCache<R, F extends FunctionType<R>> {
  private store: Record<string, CacheEntry<R>>;
  constructor(
    private wrappedFunction: F,
    private ttl: number = DEFAULT_CACHE_TTL_MS
  ) {
    this.store = {};
  }

  getCached(key: string): R | null {
    return this.store[key]?.value;
  }

  set(key: string, value: R): void {
    this.store[key] = { expiry: Date.now() + this.ttl, value };
  }

  evictCache(key: string): void {
    delete this.store[key];
  }

  async load(
    key: string,
    skipCache: boolean,
    ...args: ArgumentsType<R, F>
  ): Promise<R> {
    const entry = this.store[key];

    if (!skipCache && entry && entry.expiry > Date.now()) return entry.value;

    const loadedValue = await this.wrappedFunction(key, ...args);

    if (loadedValue) this.set(key, loadedValue);

    return loadedValue;
  }
}
