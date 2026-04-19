"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import useSWR from "swr";
import {
  fetcher,
  localizedName,
  primaryImageUrl,
  ikTransform,
  priceRange,
} from "@/utils/api";
import { currency } from "@/utils/currency";
import Pagination from "@/components/Pagination";


function ProductSkeleton() {
  return (
    <div className="product-card" aria-hidden="true">
      <div className="product-card__img-wrap placeholder-glow">
        <span className="placeholder w-100 h-100" />
      </div>
      <div className="product-card__body">
        <p className="product-card__name placeholder-glow mb-1">
          <span className="placeholder col-7" />
        </p>
        <p className="product-card__latin placeholder-glow mb-1">
          <span className="placeholder col-5" />
        </p>
        <p className="product-card__price placeholder-glow mb-2">
          <span className="placeholder col-4" />
        </p>
        <div className="product-card__actions">
          <span className="btn btn-outline-primary disabled placeholder" />
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const router = useRouter();
  const t = useTranslations();
  const [page, setPage] = useState(1);
  const [currentCategory, setCurrentCategory] = useState("");

  const params = new URLSearchParams({ page: String(page) });
  if (currentCategory) params.set("categoryId", currentCategory);
  const swrKey = `api/v1/products?${params}`;

  const { data, isLoading } = useSWR(swrKey, fetcher, { keepPreviousData: true });
  const products: any[] = (data as any)?.items ?? [];
  const pagination = (data as any)?.pagination ?? { page: 1, totalPages: 1 };
  const categories: any[] = (data as any)?.categories ?? [];

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentCategory(e.target.value);
    setPage(1);
  };

  return (
    <div className="container py-4">
      <div className="mb-4">
        <select
          className="form-select"
          style={{ width: "220px" }}
          value={currentCategory}
          onChange={handleCategoryChange}
        >
          <option value="">{t("products.allCategories")}</option>
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>
              {localizedName(cat.name)}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product: any) => {
            const imgUrl = primaryImageUrl(product.images);
            const range = priceRange(product.variants);
            const catName = localizedName(product.category?.name);
            const name = localizedName(product.name);

            return (
              <div
                className="product-card"
                key={product.id}
                onClick={() => router.push(`/product/${product.id}`)}
              >
                <div className="product-card__img-wrap">
                  {imgUrl ? (
                    <img
                      src={ikTransform(imgUrl, "w-600,h-450,cm-extract")}
                      className="product-card__img"
                      alt={name}
                    />
                  ) : (
                    <div className="product-card__no-img">
                      <i className="bi bi-image" />
                    </div>
                  )}
                  {catName && (
                    <span className="product-card__category">
                      <i className="bi bi-tag-fill" />
                      {catName}
                    </span>
                  )}
                </div>

                <div className="product-card__body">
                  <p className="product-card__name">{name}</p>
                  {product.scientificName && (
                    <p className="product-card__latin">
                      {product.scientificName}
                    </p>
                  )}
                  <p className="product-card__price">
                    {range.min === range.max
                      ? `NT$ ${currency(range.min)}`
                      : `NT$ ${currency(range.min)} ~ ${currency(range.max)}`}
                  </p>
                  <div className="product-card__actions">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => router.push(`/product/${product.id}`)}
                    >
                      {t("products.viewDetail")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4">
        <Pagination
          pagination={pagination}
          onChangePage={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
