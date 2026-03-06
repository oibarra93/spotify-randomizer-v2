import { useEffect, useRef } from "react";

 type Options = {
  enabled: boolean;
  rootMargin?: string; // e.g. "600px"
  threshold?: number;
  onIntersect: () => void;
 import { useEffect, useRef } from "react";

 type Options = {
  enabled: boolean;
  rootMargin?: string; // e.g. "600px"
  threshold?: number;
  onIntersect: () => void;
 };

 /**
  * Calls onIntersect when sentinel enters viewport.
  * Useful for infinite scroll without scroll listeners.
  */
 export function useIntersectionSentinel({
  enabled,
  rootMargin = "600px",
  threshold = 0,
  onIntersect,
 }: Options) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) onIntersect();
      },
      { root: null, rootMargin, threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [enabled, rootMargin, threshold, onIntersect]);

  return ref;
 }
};

 /**
  * Calls onIntersect when sentinel enters viewport.
  * Useful for infinite scroll without scroll listeners.
  */
 export function useIntersectionSentinel({
  enabled,
  rootMargin = "600px",
  threshold = 0,
  onIntersect,
 }: Options) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) onIntersect();
      },
      { root: null, rootMargin, threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [enabled, rootMargin, threshold, onIntersect]);

  return ref;
 }
