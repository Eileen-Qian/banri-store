"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = locale === "zh" ? "en" : "zh";
  const label = locale === "zh" ? "EN" : "中文";

  return (
    <button
      className="btn btn-sm btn-outline-secondary"
      onClick={() => router.replace(pathname, { locale: switchTo })}
    >
      <i className="bi bi-globe me-1" />
      {label}
    </button>
  );
}
