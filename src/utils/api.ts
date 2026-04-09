import ky from "ky";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

/** ky instance pre-configured with base URL */
export const api = ky.create({
  prefixUrl: API_BASE,
});

// ── Cart token management ───────────────────────────────────────────────────

const CART_TOKEN_KEY = "banri-cart-token";

/** Get (or create) a stable cart session token. */
export function getCartToken() {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem(CART_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(CART_TOKEN_KEY, token);
  }
  return token;
}

/** Headers object to include on every cart / order request. */
export function cartHeaders() {
  return { "X-Cart-Token": getCartToken() };
}

/** Discard the cart token (e.g. after placing an order). */
export function clearCartToken() {
  if (typeof window !== "undefined") localStorage.removeItem(CART_TOKEN_KEY);
}

// ── Delivery method sync ────────────────────────────────────────────────────

const DELIVERY_METHOD_KEY = "banri-delivery-method";

export function saveDeliveryMethod(methodId: string) {
  if (methodId) localStorage.setItem(DELIVERY_METHOD_KEY, methodId);
  else localStorage.removeItem(DELIVERY_METHOD_KEY);
}

export function getSavedDeliveryMethod() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(DELIVERY_METHOD_KEY) || "";
}

// ── Delivery address sync ───────────────────────────────────────────────────

const DELIVERY_CITY_KEY = "banri-delivery-city";
const DELIVERY_DISTRICT_KEY = "banri-delivery-district";

export function saveDeliveryAddress(city: string, district: string) {
  if (city) localStorage.setItem(DELIVERY_CITY_KEY, city);
  else localStorage.removeItem(DELIVERY_CITY_KEY);
  if (district) localStorage.setItem(DELIVERY_DISTRICT_KEY, district);
  else localStorage.removeItem(DELIVERY_DISTRICT_KEY);
}

export function getSavedCity() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(DELIVERY_CITY_KEY) || "";
}

export function getSavedDistrict() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(DELIVERY_DISTRICT_KEY) || "";
}

// ── i18n helpers ────────────────────────────────────────────────────────────

interface LocalizedField {
  zh?: string;
  en?: string;
}

/**
 * Extract the localized string from a JSON field like { zh, en }.
 */
export function localizedName(field: LocalizedField | null | undefined, lang = "zh-TW") {
  if (!field) return "";
  if (lang === "zh-TW" || lang === "zh" || lang.startsWith("zh")) {
    return field.zh || field.en || "";
  }
  return field.en || field.zh || "";
}

/**
 * Get the primary image URL from a product's images array.
 */
export function primaryImageUrl(images: { isPrimary?: boolean; url: string }[]) {
  if (!Array.isArray(images) || images.length === 0) return "";
  const primary = images.find((img) => img.isPrimary);
  return (primary || images[0]).url;
}

/**
 * Get price range from variants array.
 */
export function priceRange(variants: { price: string | number }[]) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return { min: 0, max: 0 };
  }
  const prices = variants.map((v) => Number(v.price));
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
