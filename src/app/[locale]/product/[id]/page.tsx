"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import {
  api,
  fetcher,
  localizedName,
  primaryImageUrl,
  priceRange,
  cartHeaders,
} from "@/utils/api";
import { currency } from "@/utils/currency";
import { useMessage } from "@/hooks/useMessage";


export default function SingleProductPage() {
  const params = useParams<{ id: string }>();
  const t = useTranslations();
  const { showSuccess, showError } = useMessage();

  const { data: product } = useSWR(`api/v1/products/${params.id}`, fetcher);
  const p = product as any;

  const defaultImage = useMemo(() => p ? primaryImageUrl(p.images) : "", [p]);
  const defaultVariant = useMemo(() => p?.variants?.[0] ?? null, [p]);

  const [mainImage, setMainImage] = useState("");
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [qty, setQty] = useState(1);

  const activeImage = mainImage || defaultImage;
  const activeVariant = selectedVariant || defaultVariant;

  const addCart = async () => {
    if (!activeVariant) return;
    try {
      await api.post("api/v1/cart/items", {
        json: { variantId: activeVariant.id, qty },
        headers: cartHeaders(),
      });
      showSuccess(t("api.addCartSuccess"));
    } catch (err: any) {
      showError(err.message);
    }
  };

  if (!product) {
    return (
      <div className="container mt-5 mb-3" aria-hidden="true">
        <div className="row">
          <div className="col-md-6">
            <div
              className="placeholder-glow bg-secondary bg-opacity-25 rounded mb-3"
              style={{ width: "100%", height: "400px" }}
            />
            <div className="d-flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="placeholder-glow bg-secondary bg-opacity-25"
                  style={{ width: "80px", height: "80px" }}
                />
              ))}
            </div>
          </div>
          <div className="col-md-6 text-start placeholder-glow">
            <span
              className="badge placeholder col-2 mb-2"
              style={{ height: "22px" }}
            />
            <h2>
              <span className="placeholder col-5" />
            </h2>
            <p>
              <span className="placeholder col-7" />
            </p>
            <p>
              <span className="placeholder col-12" />
              <span className="placeholder col-10" />
              <span className="placeholder col-8" />
            </p>
            <div className="mb-3">
              <span className="placeholder col-3 fs-4" />
            </div>
            <span className="btn btn-primary disabled placeholder col-12" />
          </div>
        </div>
      </div>
    );
  }

  const allImages = p.images || [];
  const range = priceRange(p.variants);

  return (
    <div className="container mt-5 mb-3">
      <div className="row">
        <div className="col-md-6">
          {activeImage && (
            <img
              src={activeImage}
              alt={localizedName(p.name)}
              className="img-fluid mb-3"
              style={{ width: "100%", height: "400px", objectFit: "cover" }}
            />
          )}
          {allImages.length > 1 && (
            <div className="d-flex gap-2 flex-wrap">
              {allImages.map((img: any) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt={localizedName(p.name)}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    cursor: "pointer",
                    border:
                      activeImage === img.url
                        ? "2px solid var(--bs-primary)"
                        : "2px solid transparent",
                  }}
                  onClick={() => setMainImage(img.url)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="col-md-6 text-start">
          {p.category && (
            <span className="badge bg-primary mb-2">
              {localizedName(p.category.name)}
            </span>
          )}
          <h2>{localizedName(p.name)}</h2>
          {p.scientificName && (
            <p className="text-muted fst-italic">{p.scientificName}</p>
          )}
          {p.description && (
            <p style={{ whiteSpace: "pre-line" }}>
              {localizedName(p.description)}
            </p>
          )}

          {p.variants?.length > 0 && (
            <div className="mb-3">
              <label className="form-label fw-bold">{t("common.size")}</label>
              <div className="d-flex gap-2 flex-wrap">
                {p.variants.map((v: any) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`btn btn-sm ${
                      activeVariant?.id === v.id
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    {localizedName(v.size?.name)}
                    {v.heightMin && v.heightMax
                      ? ` (${v.heightMin}-${v.heightMax}cm)`
                      : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-3">
            <span className="fs-4 fw-bold text-danger">
              NT${" "}
              {currency(
                activeVariant ? Number(activeVariant.price) : range.min,
              )}
            </span>
          </div>

          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="input-group" style={{ width: "150px" }}>
              <button
                className="btn btn-outline-primary"
                type="button"
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                disabled={qty <= 1}
              >
                -
              </button>
              <input
                type="number"
                className="form-control text-center"
                value={qty}
                min={1}
                max={10}
                readOnly
              />
              <button
                className="btn btn-outline-primary"
                type="button"
                onClick={() => setQty((prev) => Math.min(10, prev + 1))}
                disabled={qty >= 10}
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary w-100"
            onClick={addCart}
          >
            {t("common.addToCart")}
          </button>
        </div>
      </div>
    </div>
  );
}
