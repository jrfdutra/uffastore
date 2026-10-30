type StorageKind = "local" | "session";

function getStorage(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readStorage(kind: StorageKind, key: string): string | null {
  try {
    return getStorage(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStorage(kind: StorageKind, key: string, value: string): void {
  try {
    getStorage(kind)?.setItem(key, value);
  } catch {
    // O browser pode bloquear o storage (modo privado, quotas, políticas).
  }
}

export function removeStorage(kind: StorageKind, key: string): void {
  try {
    getStorage(kind)?.removeItem(key);
  } catch {
    // O browser pode bloquear o storage (modo privado, quotas, políticas).
  }
}
