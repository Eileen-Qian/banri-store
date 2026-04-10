"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api, localizedName } from "@/utils/api";
import { currency } from "@/utils/currency";
import { getLineLoginUrl, exchangeLineCode } from "@/utils/lineLogin";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function OrderSuccessPage() {
  const params = useParams<{ id: string }>();
  const t = useTranslations();

  // Try sessionStorage first (from checkout), then API
  const [order, setOrder] = useState<any>(() => {
    if (typeof window === "undefined") return null;
    const stored = sessionStorage.getItem(`banri-order-${params.id}`);
    if (stored) {
      sessionStorage.removeItem(`banri-order-${params.id}`);
      return JSON.parse(stored);
    }
    return null;
  });
  const [loading, setLoading] = useState(!order);
  const [error, setError] = useState("");
  const [lineLinked, setLineLinked] = useState(false);
  const [linkingLine, setLinkingLine] = useState(false);

  useEffect(() => {
    if (order) return;
    api
      .get(`api/v1/orders/${params.id}`)
      .json<any>()
      .then((res) => setOrder(res))
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.id, order]);

  // LINE Login callback — run once on mount
  useEffect(() => {
    const code = sessionStorage.getItem("lineCallbackCode");
    const orderId = sessionStorage.getItem("lineCallbackOrderId");
    if (!code || !orderId || orderId !== params.id) return;
    sessionStorage.removeItem("lineCallbackCode");
    sessionStorage.removeItem("lineCallbackOrderId");

    // Start linking — defer setState to satisfy react-hooks/set-state-in-effect
    queueMicrotask(() => setLinkingLine(true));
    exchangeLineCode(code)
      .then(async (data) => {
        await api.put(`api/v1/orders/${orderId}/link-customer`, {
          json: { customerId: data.customerId },
        });
        setLineLinked(true);
      })
      .catch(() => {
        // silent — LINE linking is optional
      })
      .finally(() => setLinkingLine(false));
  }, [params.id]);

  if (loading) {
    return <p className="text-center fs-2 mt-5">{t("common.loading")}</p>;
  }

  if (error || !order) {
    return (
      <div className="container mt-5 text-center">
        <h2 className="mb-3">{t("orderSuccess.notFound")}</h2>
        <p className="text-muted">{error}</p>
        <Link className="btn btn-primary" href="/products">
          {t("common.goShopping")}
        </Link>
      </div>
    );
  }

  const subtotal = Number(order.total);
  const methodName = order.deliveryMethodName
    ? localizedName(order.deliveryMethodName)
    : order.deliveryMethodId?.replace("delivery-", "").replace(/_/g, " ");

  return (
    <div className="container mt-5 mb-5">
      <div className="text-center mb-5">
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 mb-3"
          style={{ width: 80, height: 80 }}
        >
          <i
            className="bi bi-check-circle-fill text-success"
            style={{ fontSize: "2.5rem" }}
          />
        </div>
        <h2 className="fw-bold">{t("orderSuccess.title")}</h2>
        <p className="text-muted fs-5">{t("orderSuccess.subtitle")}</p>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <small className="text-muted">
                    {t("orderSuccess.orderId")}
                  </small>
                  <div className="fw-bold">
                    {order.orderNumber || order.id}
                  </div>
                </div>
                <span
                  className={`badge ${order.isPaid ? "bg-success" : "bg-secondary"}`}
                >
                  {order.isPaid
                    ? t("orderSuccess.paid")
                    : t("orderSuccess.awaitingPayment")}
                </span>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <small className="text-muted">
                    {t("orderSuccess.recipient")}
                  </small>
                  <div>{order.name}</div>
                </div>
                <div className="col-6">
                  <small className="text-muted">
                    {t("orderSuccess.deliveryMethod")}
                  </small>
                  <div>{methodName}</div>
                </div>
              </div>

              {order.city && (
                <div className="mb-3">
                  <small className="text-muted">
                    {t("orderSuccess.deliveryAddress")}
                  </small>
                  <div>
                    {order.city}
                    {order.district} {order.address}
                  </div>
                </div>
              )}
              {order.storeName && (
                <div className="mb-3">
                  <small className="text-muted">
                    {t("orderSuccess.pickupStore")}
                  </small>
                  <div>
                    {order.storeBrandName
                      ? localizedName(order.storeBrandName)
                      : order.storeBrand}{" "}
                    — {order.storeName} ({order.storeNumber})
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">{t("orderSuccess.items")}</h6>
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
                  <span>
                    NT$ {currency(Number(item.price) * item.qty)}
                  </span>
                </div>
              ))}
              <hr />
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">{t("cart.subtotal")}</span>
                <span>NT$ {currency(subtotal)}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">{t("cart.shippingFee")}</span>
                <span className="text-muted">
                  {t("shipping.afterConfirm")}
                </span>
              </div>
              <div className="d-flex justify-content-between fw-bold fs-5 mt-2">
                <span>{t("cart.grandTotal")}</span>
                <span>NT$ {currency(subtotal)}</span>
              </div>
            </div>
          </div>

          <div
            className="card border-0 shadow-sm mb-4"
            style={{
              background: "var(--bs-primary-bg-subtle, #e7f5ff)",
            }}
          >
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-info-circle me-2" />
                {t("orderSuccess.nextStepsTitle")}
              </h6>
              <ol className="mb-0 ps-3">
                <li className="mb-2">{t("orderSuccess.step1")}</li>
                <li className="mb-2">{t("orderSuccess.step2")}</li>
                <li>{t("orderSuccess.step3")}</li>
              </ol>
            </div>
          </div>

          {!order.customerId && (
            <div
              className="card border-0 shadow-sm mb-4"
              style={{ background: "#eafbea" }}
            >
              <div className="card-body p-4 text-center">
                {lineLinked ? (
                  <div className="text-success">
                    <i className="bi bi-check-circle-fill me-2" />
                    {t("orderSuccess.lineLinked")}
                  </div>
                ) : linkingLine ? (
                  <p className="mb-0 text-muted">{t("common.loading")}</p>
                ) : (
                  <>
                    <p className="small text-muted mb-2">
                      {t("orderSuccess.lineHint")}
                    </p>
                    <a
                      href={getLineLoginUrl(order.id)}
                      className="btn btn-success"
                    >
                      <i className="bi bi-chat-dots-fill me-2" />
                      {t("orderSuccess.lineLogin")}
                    </a>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="text-center d-flex justify-content-center gap-3">
            <Link className="btn btn-outline-primary" href="/order-status">
              {t("orderSuccess.checkStatus")}
            </Link>
            <Link className="btn btn-primary" href="/products">
              {t("orderSuccess.continueShopping")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
