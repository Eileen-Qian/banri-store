"use client";

import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { api, localizedName } from "@/utils/api";
import { currency } from "@/utils/currency";

interface OrderItem {
  id: string;
  productName: { zh?: string; en?: string };
  sizeName: { zh?: string; en?: string };
  price: number;
  qty: number;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  shippingFee: number;
  status: string;
  isPaid: boolean;
  createAt: string;
  items: OrderItem[];
}

export default function MyOrdersPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { customer, token, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !customer) {
      router.replace("/login");
    }
  }, [authLoading, customer, router]);

  const { data: orders, isLoading } = useSWR<Order[]>(
    token ? "account-orders" : null,
    () =>
      api
        .get("api/v1/account/orders", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .json<Order[]>(),
  );

  if (authLoading || isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="container py-5">
      <h1 className="mb-4">{t("account.myOrders")}</h1>

      {!orders || orders.length === 0 ? (
        <div className="text-center text-body-secondary py-5">
          <i className="bi bi-bag fs-1 d-block mb-3" />
          <p>{t("account.noOrders")}</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {orders.map((order) => (
            <div key={order.id} className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <strong className="me-2">#{order.orderNumber}</strong>
                    <small className="text-body-secondary">
                      {new Date(order.createAt).toLocaleDateString(
                        locale === "en" ? "en-US" : "zh-TW",
                      )}
                    </small>
                  </div>
                  <span
                    className={`badge ${
                      { pending: "bg-secondary", confirmed: "bg-info text-dark", payment_sent: "bg-warning text-dark", paid: "bg-success", shipped: "bg-primary", completed: "bg-success", cancelled: "bg-danger" }[order.status] ?? "bg-secondary"
                    }`}
                  >
                    {t(`orderStatus.status_${order.status ?? "pending"}`)}
                  </span>
                </div>

                <div className="mb-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="d-flex justify-content-between small"
                    >
                      <span>
                        {localizedName(item.productName, locale)}{" "}
                        <span className="text-body-secondary">
                          {localizedName(item.sizeName, locale)}
                        </span>{" "}
                        × {item.qty}
                      </span>
                      <span>{currency(Number(item.price) * item.qty)}</span>
                    </div>
                  ))}
                </div>

                <div className="d-flex justify-content-between border-top pt-2">
                  <span className="text-body-secondary small">
                    {t("account.shippingFee")}:{" "}
                    {currency(Number(order.shippingFee))}
                  </span>
                  <strong>
                    {currency(
                      Number(order.total) + Number(order.shippingFee),
                    )}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
