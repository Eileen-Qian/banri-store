"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/useTheme";

export default function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Render a placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        className="btn btn-link nav-link px-2 py-1 dark-mode-toggle"
        type="button"
        aria-hidden
      >
        <i className="bi bi-moon-fill" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      className="btn btn-link nav-link px-2 py-1 dark-mode-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Light mode" : "Dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      type="button"
    >
      <i className={isDark ? "bi bi-sun-fill" : "bi bi-moon-fill"} />
    </button>
  );
}
