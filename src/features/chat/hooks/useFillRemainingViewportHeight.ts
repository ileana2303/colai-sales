"use client";

import { useLayoutEffect, type RefObject } from "react";

type UseFillRemainingViewportHeightOptions = {
  /** Extra space to leave below the element (px). */
  bottomGap?: number;
  enabled?: boolean;
};

/**
 * Sets --report-chat-panel-height to the remaining viewport space below the
 * element's visible top (respecting sticky `top`), so the panel cannot push
 * the page into overflow-y.
 */
export function useFillRemainingViewportHeight(
  ref: RefObject<HTMLElement | null>,
  {
    bottomGap = 12,
    enabled = true,
  }: UseFillRemainingViewportHeightOptions = {},
) {
  useLayoutEffect(() => {
    if (!enabled) return;

    const element = ref.current;
    if (!element) return;

    const sync = () => {
      const rectTop = element.getBoundingClientRect().top;
      const stickyTop = Number.parseFloat(getComputedStyle(element).top) || 0;
      const top = Math.max(rectTop, stickyTop);
      const available = Math.max(
        240,
        Math.floor(window.innerHeight - top - bottomGap),
      );
      element.style.setProperty("--report-chat-panel-height", `${available}px`);
    };

    sync();

    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, { passive: true });

    const observer = new ResizeObserver(sync);
    observer.observe(document.documentElement);
    if (element.parentElement) {
      observer.observe(element.parentElement);
    }

    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
      observer.disconnect();
      element.style.removeProperty("--report-chat-panel-height");
    };
  }, [ref, bottomGap, enabled]);
}
