"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import useSWR from "swr";
import { api, localizedName, primaryImageUrl, cartHeaders } from "@/utils/api";
import { currency } from "@/utils/currency";
import { useMessage } from "@/hooks/useMessage";

const IG_DM_URL = "https://ig.me/m/always.plants.banri";

/** Copy text with textarea fallback for HTTP / mobile Safari. */
async function copyText(text: string): Promise<boolean> {
  // Modern API (works on HTTPS + user gesture)
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch { /* fall through */ }
  }
  // Fallback: hidden textarea + execCommand
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch { /* ignore */ }
  document.body.removeChild(ta);
  return ok;
}

const cartFetcher = () => api.get("api/v1/cart", { headers: cartHeaders() }).json();

export default function CartPage() {
  const t = useTranslations();
  const { showSuccess, showError } = useMessage();
  const { data: cartData, mutate } = useSWR("cart", cartFetcher);
  const items: any[] | null = (cartData as any)?.items ?? null;
  const total = (cartData as any)?.total ?? "0";
  const locale = useLocale();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [copied, setCopied] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const updateQty = async (itemId: string, qty: number) => {
    setLoadingId(itemId);
    try {
      const res: any = await api
        .put(`api/v1/cart/items/${itemId}`, {
          json: { qty },
          headers: cartHeaders(),
        })
        .json();
      mutate(res, { revalidate: false });
      showSuccess(t("api.updateCartSuccess"));
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setLoadingId(itemId);
    try {
      const res: any = await api
        .delete(`api/v1/cart/items/${itemId}`, { headers: cartHeaders() })
        .json();
      mutate(res, { revalidate: false });
      showSuccess(t("api.removeCartSuccess"));
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const clearCart = async () => {
    setIsClearing(true);
    try {
      const res: any = await api
        .delete("api/v1/cart", { headers: cartHeaders() })
        .json();
      mutate(res, { revalidate: false });
      showSuccess(t("api.clearCartSuccess"));
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsClearing(false);
    }
  };

  const buildItemsText = useCallback(() => {
    if (!items || items.length === 0) return "";
    const header = locale === "en"
      ? "🌿 Banri — Order Inquiry"
      : "🌿 伴日 Banri — 訂購詢問";
    const lines = items.map((item: any) => {
      const v = item.variant;
      const name = localizedName(v.product?.name);
      const size = localizedName(v.size?.name);
      const price = Number(v.price);
      return `• ${name}（${size}）× ${item.qty}　NT$ ${currency(price * item.qty)}`;
    });
    const sub = Number(total);
    const totalLabel = locale === "en" ? "Subtotal" : "小計";
    return [header, "", ...lines, "", `${totalLabel}：NT$ ${currency(sub)}`].join("\n");
  }, [items, locale, total]);

  /** Step 1: show panel with copyable text */
  const handleOrder = () => {
    setCopied(false);
    setShowPanel(true);
    // Auto-select text after render
    requestAnimationFrame(() => textRef.current?.select());
  };

  /** Step 2: copy text to clipboard */
  const handleCopy = async () => {
    const text = buildItemsText();
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      showSuccess(t("cart.copied"));
    } else {
      // If copy still fails, select the text so user can Cmd+C / long-press
      textRef.current?.select();
      showError(t("cart.copyFallback"));
    }
  };

  if (items === null) {
    return <p className="text-center fs-2 mt-5">{t("common.loading")}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="container mt-5 text-center">
        <p className="fs-4">{t("common.cartEmpty")}</p>
        <Link className="btn btn-primary" href="/products">
          {t("common.goShopping")}
        </Link>
      </div>
    );
  }

  const subtotal = Number(total);

  return (
    <div className="container mt-5">
      <h2 className="mb-4">{t("cart.title")}</h2>

      {/* IG DM notice */}
      <div className="alert alert-info d-flex align-items-start gap-2 mb-3" role="alert">
        <i className="bi bi-info-circle-fill mt-1" />
        <div>
          <strong>{t("cart.igNotice")}</strong>
          <br />
          <small>{t("cart.igNoticeDesc")}</small>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <button
          className="btn btn-outline-danger"
          onClick={clearCart}
          disabled={isClearing}
        >
          <i className="bi bi-trash me-1" />
          {t("cart.clearCart")}
        </button>
        <button className="btn btn-primary" onClick={handleOrder}>
          <i className="bi bi-instagram me-1" />
          {t("cart.dmOnIG")}
        </button>
      </div>

      {/* Desktop table */}
      <div className="d-none d-md-block">
        <table className="table align-middle">
          <thead>
            <tr>
              <th style={{ width: "100px" }}>{t("common.image")}</th>
              <th>{t("common.productName")}</th>
              <th style={{ width: "120px" }}>{t("common.unitPrice")}</th>
              <th style={{ width: "200px" }}>{t("common.quantity")}</th>
              <th style={{ width: "120px" }}>{t("common.subtotal")}</th>
              <th style={{ width: "80px" }}>{t("cart.action")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => {
              const v = item.variant;
              const imgUrl = primaryImageUrl(v.product?.images || []);
              const itemTotal = Number(v.price) * item.qty;
              return (
                <tr key={item.id}>
                  <td>
                    {imgUrl && (
                      <img
                        src={imgUrl}
                        alt={localizedName(v.product?.name)}
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                        }}
                      />
                    )}
                  </td>
                  <td>
                    <div>{localizedName(v.product?.name)}</div>
                    <small className="text-muted">
                      {localizedName(v.size?.name)}
                    </small>
                  </td>
                  <td>NT$ {currency(Number(v.price))}</td>
                  <td>
                    <div className="input-group" style={{ width: 150 }}>
                      <button
                        className="btn btn-outline-primary btn-sm"
                        type="button"
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        disabled={item.qty <= 1 || loadingId === item.id}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        className="form-control text-center"
                        value={item.qty}
                        readOnly
                      />
                      <button
                        className="btn btn-outline-primary btn-sm"
                        type="button"
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        disabled={item.qty >= 10 || loadingId === item.id}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>NT$ {currency(itemTotal)}</td>
                  <td>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removeItem(item.id)}
                      disabled={loadingId === item.id}
                    >
                      {t("cart.delete")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="d-md-none mt-3">
        {items.map((item: any) => {
          const v = item.variant;
          const imgUrl = primaryImageUrl(v.product?.images || []);
          const itemTotal = Number(v.price) * item.qty;
          return (
            <div key={item.id} className="d-flex gap-3 py-3 border-bottom">
              {imgUrl && (
                <img
                  src={imgUrl}
                  alt={localizedName(v.product?.name)}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              )}
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-start">
                  <h6 className="mb-1 text-start">
                    {localizedName(v.product?.name)}
                  </h6>
                  <button
                    className="btn btn-outline-danger btn-sm ms-2"
                    style={{ flexShrink: 0 }}
                    onClick={() => removeItem(item.id)}
                    disabled={loadingId === item.id}
                  >
                    <i className="bi bi-trash" />
                  </button>
                </div>
                <div className="text-muted small mb-2 text-start">
                  {localizedName(v.size?.name)} · NT$ {currency(Number(v.price))}
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="input-group" style={{ width: 120 }}>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      type="button"
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      disabled={item.qty <= 1 || loadingId === item.id}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      className="form-control form-control-sm text-center"
                      value={item.qty}
                      readOnly
                    />
                    <button
                      className="btn btn-outline-primary btn-sm"
                      type="button"
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      disabled={item.qty >= 10 || loadingId === item.id}
                    >
                      +
                    </button>
                  </div>
                  <span className="fw-bold">NT$ {currency(itemTotal)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="row mt-4 justify-content-end">
        <div className="col-md-5 col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between fw-bold fs-5 mb-3">
                <span>{t("cart.subtotal")}</span>
                <span>NT$ {currency(subtotal)}</span>
              </div>
              <small className="text-muted d-block mb-3">
                {t("cart.shippingCalcHint")}
              </small>
              <button className="btn btn-primary w-100" onClick={handleOrder}>
                <i className="bi bi-instagram me-1" />
                {t("cart.dmOnIG")}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* ── Order panel: copy & go to IG ── */}
      {showPanel && (
        <div className="card border-primary mt-4 shadow">
          <div className="card-body">
            <h5 className="card-title mb-3">
              <i className="bi bi-clipboard-check me-2" />
              {t("cart.panelTitle")}
            </h5>
            <p className="text-muted small mb-2">{t("cart.panelDesc")}</p>
            <textarea
              ref={textRef}
              className="form-control mb-3"
              rows={Math.min(items.length + 4, 10)}
              value={buildItemsText()}
              readOnly
              style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
              onFocus={(e) => e.target.select()}
            />
            <div className="d-flex flex-column flex-sm-row gap-2">
              <button
                className={`btn ${copied ? "btn-success" : "btn-primary"} flex-fill`}
                onClick={handleCopy}
              >
                <i className={`bi ${copied ? "bi-check-lg" : "bi-clipboard"} me-1`} />
                {copied ? t("cart.copied") : t("cart.copyBtn")}
              </button>
              <a
                href={IG_DM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-primary flex-fill"
              >
                <i className="bi bi-instagram me-1" />
                {t("cart.openIG")}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
