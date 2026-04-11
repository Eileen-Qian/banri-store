"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import logo from "@/app/BanriLogo 1.svg";
import LanguageSwitcher from "./LanguageSwitcher";
import DarkModeToggle from "./DarkModeToggle";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = useTranslations();
  const pathname = usePathname();

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setIsOpen(false);
      window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`navbar navbar-expand-lg bg-body-tertiary fixed-top${scrolled ? " shadow-sm" : ""}`}
    >
      <div className="container-fluid">
        <Link className="navbar-brand" href="/" onClick={closeMenu}>
          <Image src={logo} alt="Banri" height={60} priority />
        </Link>

        <div className="d-lg-none ms-auto me-2 d-flex align-items-center gap-1">
          <DarkModeToggle />
          <LanguageSwitcher />
        </div>

        <button
          className="navbar-toggler"
          type="button"
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" href="/products" onClick={closeMenu}>
                {t("nav.products")}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href="/cart" onClick={closeMenu}>
                {t("nav.cart")}
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href="/shipping" onClick={closeMenu}>
                {t("nav.shipping")}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link"
                href="/order-status"
                onClick={closeMenu}
              >
                {t("nav.orderStatus")}
              </Link>
            </li>
          </ul>
          <div className="d-none d-lg-flex align-items-center gap-1">
            <DarkModeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}
