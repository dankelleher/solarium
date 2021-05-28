import {useCallback, useEffect, useState} from "react";
import {Keypair} from "@solana/web3.js";

export function useLocalStorageState<T>(key: string, defaultState?: string):[T, (newT:T)=>void] {
  const [state, setState] = useState<T>(() => {
    const storedState = localStorage.getItem(key);
    if (storedState) return JSON.parse(storedState);
    return defaultState;
  });

  const setLocalStorageState = useCallback(
    (newState: T) => {
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

export function useLocalStorageKey(name: string, defaultState: Keypair):[Keypair, (k: Keypair) => void] {
  const serialise = (k: Keypair) => JSON.stringify([...(k.secretKey)])
  const deserialise = (keyString: string):Keypair => 
    Keypair.fromSecretKey(Buffer.from(JSON.parse(keyString)))

  const [keyString, setKeystring] = useLocalStorageState<string>(name);
  const [key] = useState<Keypair>(keyString ? deserialise(keyString) : defaultState);
  
  const setLocalStorageKey = useCallback((newKey: Keypair)  => {
    setKeystring(serialise(newKey))
  },[setKeystring])
  
  useEffect(() => {
    if (!keyString && defaultState) {
      setLocalStorageKey(defaultState)
    }
  }, [keyString, defaultState, setLocalStorageKey])
  
  return [
    key,
    setLocalStorageKey
  ]
}