"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations();

  return (
    <footer className="bg-body-tertiary mt-auto py-4">
      <div className="container text-center">
        <p className="text-muted mb-1">
          © {new Date().getFullYear()} 伴日 Banri. All rights reserved.
        </p>
        <nav className="d-flex justify-content-center gap-3">
          <Link href="/products" className="text-decoration-none text-muted">
            {t("footer.shopLink")}
          </Link>
          <Link href="/cart" className="text-decoration-none text-muted">
            {t("footer.cartLink")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
