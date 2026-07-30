"use client";

import { useEffect, useRef, useState } from "react";

export const LOCAL_STORAGE_SYNC_EVENT = "careerpilot-local-storage-sync";

interface LocalStorageSyncDetail {
  key: string;
  newValue: string | null;
  sourceId: string;
}

function nextStorageSourceId() {
  return `storage-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseStorageValue<T>(raw: string | null, initialValue: T): T {
  if (raw === null) return initialValue;
  return JSON.parse(raw) as T;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const sourceIdRef = useRef("");
  const lastRawRef = useRef<string | null>(null);
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      lastRawRef.current = raw;
      return parseStorageValue(raw, initialValue);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (!sourceIdRef.current) sourceIdRef.current = nextStorageSourceId();
      const serialized = JSON.stringify(value);
      if (typeof serialized !== "string") return;
      if (window.localStorage.getItem(key) === serialized) {
        lastRawRef.current = serialized;
        return;
      }
      window.localStorage.setItem(key, serialized);
      lastRawRef.current = serialized;
      window.dispatchEvent(new CustomEvent<LocalStorageSyncDetail>(LOCAL_STORAGE_SYNC_EVENT, {
        detail: { key, newValue: serialized, sourceId: sourceIdRef.current },
      }));
    } catch {
      // Ignore storage failures in private browsing or locked-down environments.
    }
  }, [key, value]);

  useEffect(() => {
    if (!sourceIdRef.current) sourceIdRef.current = nextStorageSourceId();

    function setFromRaw(raw: string | null) {
      try {
        lastRawRef.current = raw;
        setValue(parseStorageValue(raw, initialValue));
      } catch {
        lastRawRef.current = null;
        setValue(initialValue);
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== key || event.newValue === lastRawRef.current) return;
      setFromRaw(event.newValue);
    }

    function handleLocalStorageSync(event: Event) {
      const detail = (event as CustomEvent<LocalStorageSyncDetail>).detail;
      if (!detail || detail.key !== key || detail.sourceId === sourceIdRef.current) return;
      if (detail.newValue === lastRawRef.current) return;
      setFromRaw(detail.newValue);
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(LOCAL_STORAGE_SYNC_EVENT, handleLocalStorageSync);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(LOCAL_STORAGE_SYNC_EVENT, handleLocalStorageSync);
    };
  }, [initialValue, key]);

  return [value, setValue] as const;
}
