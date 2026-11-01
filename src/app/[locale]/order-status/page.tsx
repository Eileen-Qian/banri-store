"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { api, localizedName } from "@/utils/api";
import { currency } from "@/utils/currency";
import { emailValidation } from "@/utils/validation";
import { useAuth } from "@/hooks/useAuth";
import { orderStatus } from "./_components/order-status-utils";
import OrderDetail from "./_components/OrderDetail";
import LoggedInOrders from "./_components/LoggedInOrders";

const STATUS_KEY = "banri-order-status";

export default function OrderStatusPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { customer, token, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="container mt-5 mb-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  if (customer && token) {
    return <LoggedInOrders t={t} token={token} locale={locale} />;
  }

  return <GuestOrderLookup />;
}

// ── Guest order lookup (email + optional order number) ─────────────────────

function GuestOrderLookup() {
  const t = useTranslations();
  const searchParams = useSearchParams();

  const saved = typeof window !== "undefined"
    ? JSON.parse(sessionStorage.getItem(STATUS_KEY) || "null")
    : null;

  const [orders, setOrders] = useState<any[] | null>(saved?.orders ?? null);
  const [singleOrder, setSingleOrder] = useState<any>(saved?.singleOrder ?? null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const defaultForm: { email: string; orderId: string } = {
    email: saved?.email || "",
    orderId: searchParams.get("orderNumber") || saved?.orderId || "",
  };

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    mode: "onSubmit",
    defaultValues: defaultForm,
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setNotFound(false);
    setOrders(null);
    setSingleOrder(null);
    try {
      const body: any = { email: data.email.trim() };
      if (data.orderId.trim()) body.orderId = data.orderId.trim();
      const res: any = await api
        .post("api/v1/orders/lookup", { json: body })
        .json();

      if (res.type === "single") {
        setSingleOrder(res.order);
        sessionStorage.setItem(STATUS_KEY, JSON.stringify({
          email: data.email.trim(),
          orderId: data.orderId.trim(),
          singleOrder: res.order,
          orders: null,
        }));
      } else {
        setOrders(res.orders);
        sessionStorage.setItem(STATUS_KEY, JSON.stringify({
          email: data.email.trim(),
          orderId: data.orderId.trim(),
          singleOrder: null,
          orders: res.orders,
        }));
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (order: any) => {
    setSingleOrder(order);
    const prev = JSON.parse(sessionStorage.getItem(STATUS_KEY) || "null");
    if (prev) {
      sessionStorage.setItem(STATUS_KEY, JSON.stringify({ ...prev, singleOrder: order }));
    }
  };
  const handleBackToList = () => {
    setSingleOrder(null);
    const prev = JSON.parse(sessionStorage.getItem(STATUS_KEY) || "null");
    if (prev) {
      sessionStorage.setItem(STATUS_KEY, JSON.stringify({ ...prev, singleOrder: null }));
    }
  };

  return (
    <div className="container mt-5 mb-5">
      <h2 className="mb-2">{t("orderStatus.title")}</h2>
      <p className="text-muted mb-4">{t("orderStatus.subtitle")}</p>

      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    {t("orderStatus.emailLabel")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    placeholder={t("orderStatus.emailPlaceholder")}
                    {...register("email", emailValidation(t))}
                  />
                  {errors.email && (
                    <p className="text-danger mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="orderId" className="form-label">
                    {t("orderStatus.orderIdLabel")}
                    <small className="text-muted ms-2">
                      {t("orderStatus.optional")}
                    </small>
                  </label>
                  <input
                    id="orderId"
                    type="text"
                    className="form-control"
                    placeholder={t("orderStatus.orderIdPlaceholder")}
                    {...register("orderId")}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? t("common.loading") : t("orderStatus.search")}
                </button>
              </form>

              {notFound && (
                <div className="alert alert-warning mt-3 mb-0">
                  <i className="bi bi-exclamation-triangle me-2" />
                  {t("orderStatus.notFound")}
                </div>
              )}
            </div>
          </div>

          {singleOrder && (
            <>
              {orders && (
                <button
                  className="btn btn-outline-secondary btn-sm mb-3"
                  onClick={handleBackToList}
                >
                  <i className="bi bi-arrow-left me-1" />
                  {t("orderStatus.backToList")}
                </button>
              )}
              <OrderDetail
                t={t}
                order={singleOrder}
                email={getValues("email")}
                onUpdate={setSingleOrder}
              />
            </>
          )}

          {orders && !singleOrder && (
            <OrderList
              t={t}
              orders={orders}
              onSelect={handleSelectOrder}
            />
          )}

          {!orders && !singleOrder && (
            <div className="text-center">
              <Link className="btn btn-outline-primary" href="/products">
                {t("common.goShopping")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Order list (search results) ────────────────────────────────────────────

function OrderList({
  t,
  orders,
  onSelect,
}: {
  t: (k: string, v?: any) => string;
  orders: any[];
  onSelect: (o: any) => void;
}) {
  const formatDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body p-4">
        <h6 className="fw-bold mb-3">
          {t("orderStatus.resultCount", { count: orders.length })}
        </h6>
        <div className="list-group list-group-flush">
          {orders.map((order: any) => {
            const subtotal = Number(order.total);
            const methodName = order.deliveryMethodName
              ? localizedName(order.deliveryMethodName)
              : "";
            return (
              <button
                key={order.id}
                className="list-group-item list-group-item-action px-0 py-3"
                onClick={() => onSelect(order)}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-semibold">
                      {order.orderNumber || order.id}
                    </div>
                    <small className="text-muted">
                      {formatDate(order.createAt)}
                      {methodName && ` · ${methodName}`}
                      {` · ${order.items.length} `}
                      {t("orderStatus.itemUnit")}
                    </small>
                  </div>
                  <div className="text-end ms-3 flex-shrink-0">
                    <div className="fw-bold">NT$ {currency(subtotal)}</div>
                    <span
                      className={`badge ${orderStatus(order).badge}`}
                    >
                      {t(`orderStatus.${orderStatus(order).key}`)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
