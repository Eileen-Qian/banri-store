"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function AccountPage() {
  const t = useTranslations();
  const router = useRouter();
  const { customer, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !customer) {
      router.replace("/login");
    }
  }, [loading, customer, router]);

  if (loading || !customer) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h1 className="mb-4">{t("account.title")}</h1>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h5 className="card-title mb-3">{t("account.profile")}</h5>
              <div className="mb-2">
                <strong>{t("auth.nameLabel")}：</strong>
                {customer.name}
              </div>
              <div className="mb-2">
                <strong>{t("auth.emailLabel")}：</strong>
                {customer.email}
              </div>
              {customer.phone && (
                <div className="mb-2">
                  <strong>{t("auth.phoneLabel")}：</strong>
                  {customer.phone}
                </div>
              )}
            </div>
          </div>

          <div className="d-grid gap-2">
            <Link href="/order-status" className="btn btn-outline-primary">
              <i className="bi bi-bag me-2" />
              {t("account.myOrders")}
            </Link>

            <button
              className="btn btn-outline-danger"
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              <i className="bi bi-box-arrow-right me-2" />
              {t("account.logout")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
