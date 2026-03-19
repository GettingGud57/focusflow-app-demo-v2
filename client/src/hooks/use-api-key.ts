import { useCallback, useState } from "react";

const STORAGE_KEY = "myApp_apiKey";

const loadKey = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(() => loadKey());

  const saveKey = useCallback((value: string) => {
    const trimmed = value.trim();
    setApiKey(trimmed);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, trimmed);
    }
  }, []);

  const clearKey = useCallback(() => {
    setApiKey(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    apiKey: apiKey ?? undefined,
    hasUserKey: !!apiKey,
    isUsingEnv: !apiKey,
    saveKey,
    clearKey,
  };
}
