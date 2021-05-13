import {useCallback, useState} from "react";

export type StorageState = Record<string, any>;

export function useLocalStorageState(key: string, defaultState?: string) {
  const [state, setState] = useState(() => {
    const storedState = localStorage.getItem(key);
    if (storedState) return JSON.parse(storedState);
    return defaultState;
  });

  const setLocalStorageState = useCallback(
    (newState: StorageState) => {
      const changed = state !== newState;
      if (!changed) return;
      
      setState(newState);
      
      if (newState === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newState));
      }
    },
    [state, key]
  );

  return [state, setLocalStorageState];
}