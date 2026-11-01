"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import useSWR from "swr";
import { api, localizedName } from "@/utils/api";
import { currency } from "@/utils/currency";
import { orderStatus, CANCELLABLE } from "./order-status-utils";

// ── Main logged-in orders view ──────────────────────────────────────────────

export default function LoggedInOrders({
  t,
  token,
}: {
  t: ReturnType<typeof useTranslations>;
  token: string;
  locale: string;
}) {
  const locale = useLocale();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: orders, isLoading, mutate } = useSWR<Record<string, unknown>[]>(
    "my-orders-status",
    () =>
      api
        .get("api/v1/account/orders", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .json<Record<string, unknown>[]>(),
  );

  const handleCancel = (orderId: string) => {
    if (orders) {
      mutate(
        orders.map((o) =>
          o.id === orderId ? { ...o, status: "cancelled" } : o,
        ),
        { revalidate: true },
      );
    }
  };

  const filtered = useMemo(() => {
    if (!orders) return [];
    return orders.filter((order) => {
      if (keyword.trim()) {
        const q = keyword.trim().toLowerCase();
        const orderNum = String(order.orderNumber ?? "").toLowerCase();
        const items = (order.items as any[]) ?? [];
        const matchProduct = items.some((item) => {
          const name = localizedName(item.productName, locale)?.toLowerCase() ?? "";
          return name.includes(q);
        });
        if (!orderNum.includes(q) && !matchProduct) return false;
      }
      const orderDate = new Date(order.createAt as string);
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (orderDate < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (orderDate > to) return false;
      }
      return true;
    });
  }, [orders, keyword, dateFrom, dateTo, locale]);

  const hasFilters = keyword || dateFrom || dateTo;

  const clearFilters = () => {
    setKeyword("");
    setDateFrom("");
    setDateTo("");
  };

  if (isLoading) {
    return (
      <div className="container mt-5 mb-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  return (
    <div className="container mt-5 mb-5">
      <h2 className="mb-4">{t("orderStatus.title")}</h2>

      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          {/* Search & filter */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-3">
              <div className="mb-3">
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0">
                    <i className="bi bi-search" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder={t("orderStatus.searchPlaceholder")}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small mb-1">
                    {t("orderStatus.dateFrom")}
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small mb-1">
                    {t("orderStatus.dateTo")}
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
              {hasFilters && (
                <button
                  className="btn btn-sm btn-link text-decoration-none mt-2 p-0"
                  onClick={clearFilters}
                >
                  <i className="bi bi-x-circle me-1" />
                  {t("orderStatus.clearFilters")}
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          {!orders || orders.length === 0 ? (
            <div className="text-center text-body-secondary py-5">
              <i className="bi bi-bag fs-1 d-block mb-3" />
              <p>{t("account.noOrders")}</p>
              <Link className="btn btn-outline-primary" href="/products">
                {t("common.goShopping")}
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-body-secondary py-4">
              <i className="bi bi-search fs-3 d-block mb-2" />
              <p>{t("orderStatus.noResults")}</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {filtered.map((order: any) => (
                <ExpandableOrder
                  key={order.id}
                  t={t}
                  order={order}
                  locale={locale}
                  expanded={expanded === order.id}
                  onToggle={() =>
                    setExpanded((prev) =>
                      prev === order.id ? null : order.id,
                    )
                  }
                  token={token}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Expandable order card ─────────────────────────────────────────────────

function ExpandableOrder({
  t,
  order,
  locale,
  expanded,
  onToggle,
  token,
  onCancel,
}: {
  t: ReturnType<typeof useTranslations>;
  order: any;
  locale: string;
  expanded: boolean;
  onToggle: () => void;
  token: string;
  onCancel: (orderId: string) => void;
}) {
  const items = order.items ?? [];
  const total = Number(order.total);
  const shippingFee = Number(order.shippingFee);
  const status = orderStatus(order);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const canCancel = CANCELLABLE.includes(order.status ?? "pending");

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.post(`api/v1/orders/${order.id}/cancel`, {
        headers: { Authorization: `Bearer ${token}` },
        json: {},
      });
      onCancel(order.id);
      setShowCancelConfirm(false);
    } catch {
      // silent
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(
      locale === "en" ? "en-US" : "zh-TW",
      { year: "numeric", month: "2-digit", day: "2-digit" },
    );

  return (
    <div className="card border-0 shadow-sm">
      {/* Header — always visible */}
      <button
        className="card-body d-flex justify-content-between align-items-center border-0 bg-transparent w-100 text-start p-3"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div>
          <strong className="me-2">#{order.orderNumber}</strong>
          <small className="text-body-secondary">
            {formatDate(order.createAt)}
          </small>
          <div className="mt-1">
            <span className={`badge ${status.badge} me-2`}>
              {t(`orderStatus.${status.key}`)}
            </span>
            <span className="fw-semibold">
              {currency(total + shippingFee)}
            </span>
            <small className="text-body-secondary ms-2">
              {items.length} {t("orderStatus.itemUnit")}
            </small>
          </div>
        </div>
        <i className={`bi bi-chevron-${expanded ? "up" : "down"} fs-5`} />
      </button>

      {/* Detail — expandable */}
      {expanded && (
        <div className="card-body pt-0 px-3 pb-3 border-top">
          {/* Items */}
          <div className="mb-3">
            {items.map((item: any) => (
              <div
                key={item.id}
                className="d-flex justify-content-between align-items-center py-1"
              >
                <div>
                  <span>{localizedName(item.productName, locale)}</span>
                  <small className="text-body-secondary ms-1">
                    {localizedName(item.sizeName, locale)}
                  </small>
                  <small className="text-body-secondary ms-1">
                    ×{item.qty}
                  </small>
                </div>
                <span>{currency(Number(item.price) * item.qty)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-top pt-2">
            <div className="d-flex justify-content-between small">
              <span className="text-body-secondary">{t("cart.subtotal")}</span>
              <span>{currency(total)}</span>
            </div>
            <div className="d-flex justify-content-between small">
              <span className="text-body-secondary">{t("account.shippingFee")}</span>
              <span>{currency(shippingFee)}</span>
            </div>
            <div className="d-flex justify-content-between fw-bold mt-1">
              <span>{t("cart.grandTotal")}</span>
              <span>{currency(total + shippingFee)}</span>
            </div>
          </div>

          {/* Delivery info */}
          <div className="border-top pt-2 mt-2 small text-body-secondary">
            {order.city && (
              <div>
                {t("orderStatus.address")}：{order.city}
                {order.district} {order.address}
              </div>
            )}
            {order.storeName && (
              <div>
                {t("orderStatus.pickupStore")}：{order.storeName}
              </div>
            )}
          </div>

          {/* Cancel */}
          {canCancel && (
            <div className="border-top pt-2 mt-2">
              {showCancelConfirm ? (
                <div>
                  <p className="small fw-semibold mb-2">{t("orderStatus.cancelConfirm")}</p>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-danger flex-grow-1" disabled={cancelling} onClick={handleCancel}>
                      {cancelling ? "..." : t("orderStatus.cancelYes")}
                    </button>
                    <button className="btn btn-sm btn-outline-secondary flex-grow-1" onClick={() => setShowCancelConfirm(false)}>
                      {t("orderStatus.cancelNo")}
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn btn-sm btn-outline-danger w-100" onClick={() => setShowCancelConfirm(true)}>
                  <i className="bi bi-x-circle me-1" />
                  {t("orderStatus.cancelOrder")}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
