"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  api,
  localizedName,
  primaryImageUrl,
  ikTransform,
  priceRange,
} from "@/utils/api";
import { currency } from "@/utils/currency";
import Pagination from "@/components/Pagination";

/* eslint-disable @typescript-eslint/no-explicit-any */

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
  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [categories, setCategories] = useState<any[]>([]);
  const [currentCategory, setCurrentCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = useCallback(
    async (page = 1, categoryId = "") => {
      const params = new URLSearchParams({ page: String(page) });
      if (categoryId) params.set("categoryId", categoryId);

      const res: any = await api
        .get(`api/v1/products?${params}`)
        .json();
      setProducts(res.items);
      setPagination(res.pagination);
      if (res.categories) setCategories(res.categories);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetchProducts();
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchProducts]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    setCurrentCategory(categoryId);
    fetchProducts(1, categoryId);
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
                    /* eslint-disable-next-line @next/next/no-img-element */
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
          onChangePage={(page) => fetchProducts(page, currentCategory)}
        />
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
