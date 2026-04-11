"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { api, localizedName } from "@/utils/api";
import { currency } from "@/utils/currency";
import { emailValidation } from "@/utils/validation";

/* eslint-disable @typescript-eslint/no-explicit-any */

function paymentStatus(order: any) {
  if (order.isPaid) return { key: "statusPaid", badge: "bg-success" };
  if (order.paymentNotifiedAt)
    return { key: "statusVerifying", badge: "bg-warning text-dark" };
  return { key: "statusPending", badge: "bg-secondary" };
}

const STATUS_KEY = "banri-order-status";

export default function OrderStatusPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();

  // Restore state from sessionStorage (survives language switch)
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
                      className={`badge ${paymentStatus(order).badge}`}
                    >
                      {t(`orderStatus.${paymentStatus(order).key}`)}
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

function OrderDetail({
  t,
  order,
  email,
  onUpdate,
}: {
  t: (k: string, v?: any) => string;
  order: any;
  email: string;
  onUpdate: (o: any) => void;
}) {
  const [lastFive, setLastFive] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!order.paymentNotifiedAt);

  const handlePaymentNotify = async () => {
    if (!/^\d{5}$/.test(lastFive) || !amount) return;
    setSubmitting(true);
    try {
      await api.put(`api/v1/orders/${order.id}/payment-notify`, {
        json: { email, lastFive, amount: Number(amount) },
      });
      setSubmitted(true);
      onUpdate({
        ...order,
        paymentLastFive: lastFive,
        paymentAmount: amount,
        paymentNotifiedAt: new Date().toISOString(),
      });
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = Number(order.total);
  const methodName = order.deliveryMethodName
    ? localizedName(order.deliveryMethodName)
    : order.deliveryMethodId?.replace("delivery-", "").replace(/_/g, " ");

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <small className="text-muted">
                {t("orderStatus.orderId")}
              </small>
              <div className="fw-bold">
                {order.orderNumber || order.id}
              </div>
            </div>
            <span className={`badge fs-6 ${paymentStatus(order).badge}`}>
              {t(`orderStatus.${paymentStatus(order).key}`)}
            </span>
          </div>

          <div className="row g-3">
            <div className="col-6">
              <small className="text-muted">
                {t("orderStatus.recipient")}
              </small>
              <div>{order.name}</div>
            </div>
            <div className="col-6">
              <small className="text-muted">
                {t("orderStatus.deliveryMethod")}
              </small>
              <div>{methodName}</div>
            </div>
            <div className="col-6">
              <small className="text-muted">
                {t("orderStatus.orderDate")}
              </small>
              <div>{formatDate(order.createAt)}</div>
            </div>
            {order.city && (
              <div className="col-6">
                <small className="text-muted">
                  {t("orderStatus.address")}
                </small>
                <div>
                  {order.city}
                  {order.district}
                </div>
              </div>
            )}
            {order.storeName && (
              <div className="col-6">
                <small className="text-muted">
                  {t("orderStatus.pickupStore")}
                </small>
                <div>
                  {order.storeBrand} — {order.storeName}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h6 className="fw-bold mb-3">{t("orderStatus.items")}</h6>
          {order.items.map((item: any) => (
            <div
              key={item.id}
              className="d-flex justify-content-between align-items-center mb-2"
            >
              <div>
                <span>{localizedName(item.productName)}</span>
                <small className="text-muted ms-2">
                  {localizedName(item.sizeName)}
                </small>
                <small className="text-muted ms-1">×{item.qty}</small>
              </div>
              <span>NT$ {currency(Number(item.price) * item.qty)}</span>
            </div>
          ))}
          <hr />
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">{t("cart.subtotal")}</span>
            <span>NT$ {currency(subtotal)}</span>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">{t("cart.shippingFee")}</span>
            <span className="text-muted">{t("shipping.afterConfirm")}</span>
          </div>
          <div className="d-flex justify-content-between fw-bold fs-5 mt-2">
            <span>{t("cart.grandTotal")}</span>
            <span>NT$ {currency(subtotal)}</span>
          </div>
        </div>
      </div>

      {!order.isPaid && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-cash-stack me-2" />
              {t("orderStatus.paymentNotify")}
            </h6>
            {submitted ? (
              <div className="text-success">
                <i className="bi bi-check-circle me-1" />
                {t("orderStatus.paymentAlready")}
                {order.paymentLastFive && (
                  <span className="text-muted ms-2">
                    ({t("orderStatus.paymentLastFive")}:{" "}
                    {order.paymentLastFive})
                  </span>
                )}
              </div>
            ) : (
              <>
                <p className="text-muted small mb-3">
                  {t("orderStatus.paymentNotifyHint")}
                </p>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small mb-1">
                      {t("orderStatus.paymentLastFive")}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      maxLength={5}
                      placeholder={t(
                        "orderStatus.paymentLastFivePlaceholder",
                      )}
                      value={lastFive}
                      onChange={(e) =>
                        setLastFive(
                          e.target.value.replace(/\D/g, "").slice(0, 5),
                        )
                      }
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small mb-1">
                      {t("orderStatus.paymentAmount")}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder={t(
                        "orderStatus.paymentAmountPlaceholder",
                      )}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  className="btn btn-primary w-100 mt-2"
                  disabled={
                    lastFive.length !== 5 || !amount || submitting
                  }
                  onClick={handlePaymentNotify}
                >
                  {submitting ? "..." : t("orderStatus.paymentSubmit")}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {!order.isPaid && (
        <div
          className="card border-0 shadow-sm mb-4"
          style={{
            background: "var(--bs-primary-bg-subtle, #e7f5ff)",
          }}
        >
          <div className="card-body p-4">
            <h6 className="fw-bold mb-2">
              <i className="bi bi-info-circle me-2" />
              {t("orderStatus.pendingTitle")}
            </h6>
            <p className="mb-0">{t("orderStatus.pendingHint")}</p>
          </div>
        </div>
      )}

      <div className="text-center">
        <Link className="btn btn-primary" href="/products">
          {t("orderSuccess.continueShopping")}
        </Link>
      </div>
    </>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
