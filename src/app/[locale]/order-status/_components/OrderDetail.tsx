"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { api, localizedName } from "@/utils/api";
import { currency } from "@/utils/currency";
import { orderStatus, CANCELLABLE } from "./order-status-utils";

export default function OrderDetail({
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
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const canCancel = CANCELLABLE.includes(order.status ?? "pending");

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.post(`api/v1/orders/${order.id}/cancel`, {
        json: { email },
      });
      onUpdate({ ...order, status: "cancelled" });
      setShowCancelConfirm(false);
    } catch {
      // silent
    } finally {
      setCancelling(false);
    }
  };

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
        status: "payment_sent",
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
            <span className={`badge fs-6 ${orderStatus(order).badge}`}>
              {t(`orderStatus.${orderStatus(order).key}`)}
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

      {order.status === "cancelled" && (
        <div className="card border-0 shadow-sm mb-4" style={{ background: "var(--bs-danger-bg-subtle, #f8d7da)" }}>
          <div className="card-body p-4">
            <h6 className="fw-bold mb-0 text-danger">
              <i className="bi bi-x-circle me-2" />
              {t("orderStatus.cancelledNotice")}
            </h6>
          </div>
        </div>
      )}

      {!order.isPaid && order.status !== "cancelled" && (
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
                      placeholder={t("orderStatus.paymentLastFivePlaceholder")}
                      value={lastFive}
                      onChange={(e) =>
                        setLastFive(e.target.value.replace(/\D/g, "").slice(0, 5))
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
                      placeholder={t("orderStatus.paymentAmountPlaceholder")}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  className="btn btn-primary w-100 mt-2"
                  disabled={lastFive.length !== 5 || !amount || submitting}
                  onClick={handlePaymentNotify}
                >
                  {submitting ? "..." : t("orderStatus.paymentSubmit")}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {!order.isPaid && order.status !== "cancelled" && (
        <div
          className="card border-0 shadow-sm mb-4"
          style={{ background: "var(--bs-primary-bg-subtle, #e7f5ff)" }}
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

      {/* Cancel button */}
      {canCancel && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            {showCancelConfirm ? (
              <div>
                <p className="fw-semibold mb-3">{t("orderStatus.cancelConfirm")}</p>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-danger flex-grow-1"
                    disabled={cancelling}
                    onClick={handleCancel}
                  >
                    {cancelling ? "..." : t("orderStatus.cancelYes")}
                  </button>
                  <button
                    className="btn btn-outline-secondary flex-grow-1"
                    onClick={() => setShowCancelConfirm(false)}
                  >
                    {t("orderStatus.cancelNo")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-outline-danger w-100"
                onClick={() => setShowCancelConfirm(true)}
              >
                <i className="bi bi-x-circle me-2" />
                {t("orderStatus.cancelOrder")}
              </button>
            )}
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
