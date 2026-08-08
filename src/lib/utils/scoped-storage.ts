"use client";

// Identity-scoped local/session storage for Zustand `persist` stores.
//
// Guest data and each logged-in account's data must never bleed into each
// other (e.g. an order tracked as a guest shouldn't still show up after
// logging into a different account). Every scoped store's persisted key is
// namespaced by the current identity ("guest" or the account email), and on
// login/logout we flip the namespace and rehydrate — no data is deleted, so
// a guest's cache is exactly as they left it if they log out again.

type PersistApi = {
  persist: {
    setOptions: (options: { name: string }) => void;
    rehydrate: () => Promise<void> | void;
  };
};

const GUEST_SCOPE = "guest";
let currentScope = GUEST_SCOPE;
const registered: Array<{ baseName: string; api: PersistApi }> = [];

function scopedName(baseName: string, scope: string) {
  return scope === GUEST_SCOPE ? baseName : `${baseName}__${scope}`;
}

// Called once per store, right after `create(persist(...))`, to enroll it in
// identity switching. The store's own `persist` config should still use
// `baseName` as its initial `name` — this only affects future rescoping.
export function registerScopedStore(baseName: string, api: PersistApi): void {
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
    registered.map(({ baseName, api }) => {
      api.persist.setOptions({ name: scopedName(baseName, scope) });
      return api.persist.rehydrate();
    })
  );
}

export function getStorageIdentity(): string {
  return currentScope;
}
