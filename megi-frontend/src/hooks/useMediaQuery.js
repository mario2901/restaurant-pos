import { useCallback, useSyncExternalStore } from "react";

/**
 * true dok ekran odgovara media upitu; prati promjenu veličine i okretanje uređaja.
 * useSyncExternalStore -> bez treptanja i bez dodatnog rendera nakon mounta.
 */
export default function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Granica mobitela — ista vrijednost kao @media (max-width: 700px) u CSS-u. */
export const PHONE_QUERY = "(max-width: 700px)";

export const useIsPhone = () => useMediaQuery(PHONE_QUERY);
