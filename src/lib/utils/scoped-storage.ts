"use client";

// Identity-scoped local/session storage for Zustand `persist` stores.
//
// Guest data and each logged-in account's data must never bleed into each
// other (e.g. an order tracked as a guest shouldn't still show up after
// logging into a different account). Every scoped store's persisted key is
// namespaced by the current identity ("guest" or the account email), and on
// login/logout we flip the namespace and rehydrate — no data is deleted, so
// a guest's cache is exactly as they left it if they log out again.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PersistApi<T = any> = {
  getState: () => T;
  getInitialState: () => T;
  setState: (state: T, replace: true) => void;
  persist: {
    setOptions: (options: { name: string }) => void;
    getOptions: () => { storage?: { getItem: (name: string) => unknown } };
    rehydrate: () => Promise<void> | void;
  };
};

const GUEST_SCOPE = "guest";
let currentScope = GUEST_SCOPE;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registered: Array<{ baseName: string; api: PersistApi<any> }> = [];

function scopedName(baseName: string, scope: string) {
  return scope === GUEST_SCOPE ? baseName : `${baseName}__${scope}`;
}

// Called once per store, right after `create(persist(...))`, to enroll it in
// identity switching. The store's own `persist` config should still use
// `baseName` as its initial `name` — this only affects future rescoping.
export function registerScopedStore<T>(baseName: string, api: PersistApi<T>): void {
  registered.push({ baseName, api });
}

function emailToScope(email: string): string {
  // Storage keys must stay filesystem/URL-safe-ish; email is fine as-is for
  // localStorage keys but strip anything that could collide with our "__" separator.
  return email.trim().toLowerCase();
}

export async function setStorageIdentity(email: string | null): Promise<void> {
  const scope = email ? emailToScope(email) : GUEST_SCOPE;
  if (scope === currentScope) return;
  currentScope = scope;
  await Promise.all(
    registered.map(async ({ baseName, api }) => {
      const targetName = scopedName(baseName, scope);
      // Check the NEW scope's key for real persisted data before touching
      // anything. This must happen before setOptions()/rehydrate() below,
      // neither of which can be trusted alone: rehydrate()'s merge is a
      // no-op when the target key is empty (so a stale in-memory value from
      // the outgoing scope would keep showing through), while resetting to
      // initial state unconditionally writes to the target key immediately
      // — which, for a scope that already has real saved data, overwrote it
      // with empty state a moment before rehydrate() read it back, silently
      // destroying it on every switch into that scope.
      const storage = api.persist.getOptions().storage;
      const existing = storage ? await storage.getItem(targetName) : null;

      api.persist.setOptions({ name: targetName });
      if (existing) {
        await api.persist.rehydrate();
      } else {
        api.setState(api.getInitialState(), true);
      }
    })
  );
}

export function getStorageIdentity(): string {
  return currentScope;
}
