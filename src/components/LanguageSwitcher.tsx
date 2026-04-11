"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useRouter } from "next/navigation";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = locale === "zh" ? "en" : "zh";
  const label = locale === "zh" ? "EN" : "中文";

  const handleSwitch = () => {
    // Save scroll position before locale change
    sessionStorage.setItem("banri-scroll-y", String(window.scrollY));
    router.replace(`/${switchTo}${pathname}`, { scroll: false });
  };

  return (
    <button
      className="btn btn-sm btn-outline-secondary"
      onClick={handleSwitch}
    >
      <i className="bi bi-globe me-1" />
      {label}
    </button>
  );
}
