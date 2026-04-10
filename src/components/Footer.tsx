"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import logo from "@/app/BanriLogo 1.svg";

export default function Footer() {
  const t = useTranslations();

  return (
    <footer className="site-footer mt-auto">
      <div className="container">
        <div className="site-footer__inner">
          <Image
            src={logo}
            alt="Banri"
            height={32}
            width={32}
            className="site-footer__logo"
          />
          <p className="site-footer__copy">
            © {new Date().getFullYear()} 伴日 Banri. All rights reserved.
          </p>
          <nav className="site-footer__nav" aria-label="footer navigation">
            <Link href="/products">{t("footer.shopLink")}</Link>
            <Link href="/cart">{t("footer.cartLink")}</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
