import { atom } from "jotai";
import SuperJSON from "superjson";

export const atomWithLocalStorage = <T extends object | null>(
  key: string,
  initialValue: T
) => {
  const getInitialValue = (): T => {
    const item = global.localStorage?.getItem(key);
    if (typeof item === "string") {
      return SuperJSON.parse<T>(item);
    }
    return initialValue;
  };
  const baseAtom = atom<T>(getInitialValue());
  const derivedAtom = atom(
    (get) => get(baseAtom),
    (get, set, update: T | ((prev: T) => T)) => {
      const nextValue =
        typeof update === "function" ? update(get(baseAtom)) : update;
      set(baseAtom, nextValue);
      localStorage.setItem(key, SuperJSON.stringify(nextValue));
    }
  );
  return derivedAtom;
};
