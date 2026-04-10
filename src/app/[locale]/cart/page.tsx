"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api, localizedName, primaryImageUrl, cartHeaders } from "@/utils/api";
import { currency } from "@/utils/currency";
import { useMessage } from "@/hooks/useMessage";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function CartPage() {
  const t = useTranslations();
  const { showSuccess, showError } = useMessage();
  const [items, setItems] = useState<any[] | null>(null);
  const [total, setTotal] = useState("0");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const fetchCart = async () => {
    try {
      const res: any = await api
        .get("api/v1/cart", { headers: cartHeaders() })
        .json();
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const applyCartResponse = (data: any) => {
    setItems(data.items);
    setTotal(data.total);
  };

  const updateQty = async (itemId: string, qty: number) => {
    setLoadingId(itemId);
    try {
      const res: any = await api
        .put(`api/v1/cart/items/${itemId}`, {
          json: { qty },
          headers: cartHeaders(),
        })
        .json();
      applyCartResponse(res);
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
      applyCartResponse(res);
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
      applyCartResponse(res);
      showSuccess(t("api.clearCartSuccess"));
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsClearing(false);
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

      <div className="d-flex justify-content-between align-items-center mb-3">
        <button
          className="btn btn-outline-danger"
          onClick={clearCart}
          disabled={isClearing}
        >
          <i className="bi bi-trash me-1" />
          {t("cart.clearCart")}
        </button>
        <Link className="btn btn-primary" href="/checkout">
          {t("cart.goCheckout")}
        </Link>
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
                      /* eslint-disable-next-line @next/next/no-img-element */
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
                /* eslint-disable-next-line @next/next/no-img-element */
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
                <br />
                <Link
                  href="/shipping"
                  className="text-primary text-decoration-none"
                >
                  {t("shipping.shippingLink")}{" "}
                  <i className="bi bi-box-arrow-up-right" />
                </Link>
              </small>
              <Link className="btn btn-primary w-100" href="/checkout">
                {t("cart.goCheckout")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
