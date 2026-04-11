"use client";

import { useEffect } from "react";

/**
 * Restores scroll position after language switch.
 * LanguageSwitcher saves scrollY to sessionStorage before navigating.
 */
export default function ScrollRestore() {
  useEffect(() => {
    const saved = sessionStorage.getItem("banri-scroll-y");
    if (!saved) return;
    const y = Number(saved);
    sessionStorage.removeItem("banri-scroll-y");

    (window as any).__banriRestoreScroll = y;

    // Keep retrying until scroll actually sticks (layout may not be ready)
    let attempts = 0;
    const interval = setInterval(() => {
      window.scrollTo({ top: y, behavior: "instant" });
      attempts++;
      if (Math.abs(window.scrollY - y) < 5 || attempts > 10) {
        clearInterval(interval);
        delete (window as any).__banriRestoreScroll;
      }
    }, 50);
    // No cleanup — let it finish even if component remounts (Strict Mode)
  }, []);

  return null;
}
