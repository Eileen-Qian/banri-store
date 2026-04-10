"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  api,
  localizedName,
  primaryImageUrl,
  cartHeaders,
  clearCartToken,
  saveDeliveryMethod,
  getSavedDeliveryMethod,
  saveDeliveryAddress,
  getSavedCity,
  getSavedDistrict,
} from "@/utils/api";
import { currency } from "@/utils/currency";
import { useMessage } from "@/hooks/useMessage";
import {
  emailValidation,
  taiwanPhoneValidation,
  nameValidation,
  cityValidation,
  districtValidation,
  addressValidation,
} from "@/utils/validation";

/* eslint-disable @typescript-eslint/no-explicit-any */

const NEEDS_ADDRESS = ["delivery-private_delivery"];
const NEEDS_DISTRICT = ["delivery-private_delivery"];

function OrderSummary({
  t,
  subtotal,
  selectedMethod,
}: {
  t: (k: string) => string;
  subtotal: number;
  selectedMethod: string;
}) {
  const isSelfPickup = selectedMethod === "delivery-self_pickup";
  const showShippingNote = selectedMethod && !isSelfPickup;
  return (
    <div
      className="card border-0 shadow-sm mb-4"
      style={{ background: "var(--bs-tertiary-bg, #f8f9fa)" }}
    >
      <div className="card-body px-4 py-3">
        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
          <i className="bi bi-receipt" />
          {t("cart.orderSummary")}
        </h6>
        <div className="d-flex justify-content-between mb-2">
          <span className="text-body-secondary">{t("cart.subtotal")}</span>
          <span>NT$ {currency(subtotal)}</span>
        </div>
        {showShippingNote && (
          <div className="d-flex justify-content-between mb-2">
            <span className="text-body-secondary">
              {t("cart.shippingFee")}
            </span>
            <span className="text-muted">{t("shipping.afterConfirm")}</span>
          </div>
        )}
        <hr className="my-2" />
        <div className="d-flex justify-content-between fw-bold fs-5">
          <span>{t("cart.grandTotal")}</span>
          <span>NT$ {currency(subtotal)}</span>
        </div>
        {showShippingNote && (
          <small className="text-muted d-block mt-3 lh-base">
            <i className="bi bi-info-circle me-1" />
            {t("shipping.checkoutNote")}
            <br />
            <Link
              href="/shipping"
              className="text-primary text-decoration-none"
            >
              {t("shipping.shippingLink")}{" "}
              <i className="bi bi-box-arrow-up-right small" />
            </Link>
          </small>
        )}
      </div>
    </div>
  );
}

export default function CheckOutPage() {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const [items, setItems] = useState<any[] | null>(null);
  const [total, setTotal] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showError } = useMessage();

  const [methods, setMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethodRaw] = useState(
    getSavedDeliveryMethod,
  );
  const setSelectedMethod = (id: string) => {
    setSelectedMethodRaw(id);
    saveDeliveryMethod(id);
  };
  const [regions, setRegions] = useState<any>({ privateDelivery: [] });
  const [districts, setDistricts] = useState<any[]>([]);
  const [minAmountPrivate, setMinAmountPrivate] = useState("0");
  const [storeChains, setStoreChains] = useState<any[]>([]);

  useEffect(() => {
    api
      .get("api/v1/cart", { headers: cartHeaders() })
      .json<any>()
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err: any) => showError(err.message));
  }, [showError]);

  useEffect(() => {
    api
      .get("api/v1/shipping/methods", { headers: cartHeaders() })
      .json<any>()
      .then((res) => {
        setMethods(res.methods);
        setMinAmountPrivate(res.minAmountPrivate);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (methods.length === 0) return;
    const current = methods.find((m: any) => m.id === selectedMethod);
    if (current && !current.available) {
      const fallback = methods.find((m: any) => m.available);
      setSelectedMethod(fallback ? fallback.id : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [methods]);

  useEffect(() => {
    api
      .get("api/v1/shipping/store-chains")
      .json<any>()
      .then((res) => setStoreChains(res.chains))
      .catch(console.error);
  }, []);

  useEffect(() => {
    api
      .get("api/v1/shipping/regions")
      .json<any>()
      .then((res) => setRegions(res))
      .catch(console.error);
  }, []);

  // Restore form data from sessionStorage (survives language switch)
  const FORM_KEY = "banri-checkout-form";
  const defaultForm = {
    email: "",
    name: "",
    tel: "",
    city: "",
    district: "",
    address: "",
    storeBrand: "",
    storeName: "",
    storeNumber: "",
    message: "",
  };
  const savedForm: typeof defaultForm | null = typeof window !== "undefined"
    ? JSON.parse(sessionStorage.getItem(FORM_KEY) || "null")
    : null;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: savedForm ?? defaultForm,
  });

  // Persist form data on every change
  const formValues = watch();
  useEffect(() => {
    sessionStorage.setItem(FORM_KEY, JSON.stringify(formValues));
  }, [formValues]);

  const selectedCity = watch("city");
  const needsAddress = NEEDS_ADDRESS.includes(selectedMethod);
  const needsDistrict = NEEDS_DISTRICT.includes(selectedMethod);
  const isConvenienceStore = selectedMethod === "delivery-convenience_store";

  const selectedChain = storeChains.find(
    (c: any) => c.id === watch("storeBrand"),
  );
  const finderUrl = selectedChain?.finderUrl;
  const selectedMethodObj = methods.find((m: any) => m.id === selectedMethod);

  useEffect(() => {
    saveDeliveryAddress(selectedCity, watch("district"));
  }, [selectedCity, watch]);

  const cityList =
    selectedMethod === "delivery-private_delivery"
      ? regions.privateDelivery
      : [];

  const cityDisplayName = (cityObj: any) => {
    if (!cityObj) return "";
    if (typeof cityObj === "string") return cityObj;
    return locale?.startsWith("zh") ? cityObj.zh : cityObj.en;
  };
  const cityValue = (cityObj: any) => {
    if (!cityObj) return "";
    return typeof cityObj === "string" ? cityObj : cityObj.zh;
  };

  // Restore saved city
  const savedCityRef = useRef(getSavedCity());
  const savedDistrictRef = useRef(getSavedDistrict());
  const prevCityRef = useRef("");

  useEffect(() => {
    const city = savedCityRef.current;
    if (!city || regions.privateDelivery.length === 0) return;
    if (selectedMethod !== "delivery-private_delivery") {
      savedCityRef.current = "";
      return;
    }
    const match = regions.privateDelivery.find(
      (r: any) => r.city?.zh === city,
    );
    if (match) {
      prevCityRef.current = city;
      setValue("city", city);
    }
    savedCityRef.current = "";
  }, [regions, selectedMethod, setValue]);

  useEffect(() => {
    const district = savedDistrictRef.current;
    if (!district || districts.length === 0) return;
    const match = districts.find(
      (d: any) => (typeof d === "string" ? d : d.zh) === district,
    );
    if (match) setValue("district", district);
    savedDistrictRef.current = "";
  }, [districts, setValue]);

  useEffect(() => {
    if (selectedMethod === "delivery-private_delivery") {
      const cityData = regions.privateDelivery.find(
        (r: any) => r.city?.zh === selectedCity,
      );
      setDistricts(cityData ? cityData.districts : []);
    } else {
      setDistricts([]);
    }
  }, [selectedCity, selectedMethod, regions]);

  useEffect(() => {
    if (prevCityRef.current === selectedCity) return;
    prevCityRef.current = selectedCity;
    setValue("district", "");
    saveDeliveryAddress(selectedCity, "");
  }, [selectedCity, setValue]);

  const methodInitRef = useRef(true);
  useEffect(() => {
    if (methodInitRef.current) {
      methodInitRef.current = false;
      return;
    }
    setValue("city", "");
    setValue("district", "");
    saveDeliveryAddress("", "");
    setValue("address", "");
    setValue("storeBrand", "");
    setValue("storeName", "");
    setValue("storeNumber", "");
  }, [selectedMethod, setValue]);

  const onSubmit = async (formData: any) => {
    if (!selectedMethod) {
      showError(t("cart.selectMethod"));
      return;
    }
    setIsSubmitting(true);
    try {
      const res: any = await api
        .post("api/v1/orders", {
          json: {
            email: formData.email,
            name: formData.name,
            phone: formData.tel,
            deliveryMethodId: selectedMethod,
            city: formData.city || undefined,
            district: formData.district || undefined,
            address: formData.address || undefined,
            storeBrand: formData.storeBrand || undefined,
            storeName: formData.storeName || undefined,
            storeNumber: formData.storeNumber || undefined,
            message: formData.message || undefined,
            locale,
          },
          headers: cartHeaders(),
        })
        .json();
      clearCartToken();
      sessionStorage.removeItem(FORM_KEY);

      // Store order data in sessionStorage for the success page
      const orderData = {
        id: res.orderId,
        orderNumber: res.orderNumber,
        email: formData.email,
        name: formData.name,
        deliveryMethodId: selectedMethod,
        deliveryMethodName: selectedMethodObj?.name ?? null,
        city: formData.city || "",
        district: formData.district || "",
        address: formData.address || "",
        storeBrand: formData.storeBrand || "",
        storeBrandName: selectedChain?.name ?? null,
        storeName: formData.storeName || "",
        storeNumber: formData.storeNumber || "",
        shippingFee: res.shippingFee,
        total: res.total,
        grandTotal: res.grandTotal,
        isPaid: false,
        items: items!.map((item: any) => ({
          id: item.id,
          productName: item.variant?.product?.name,
          sizeName: item.variant?.size?.name,
          price: item.variant?.price,
          qty: item.qty,
        })),
      };
      sessionStorage.setItem(
        `banri-order-${res.orderId}`,
        JSON.stringify(orderData),
      );
      router.push(`/order-success/${res.orderId}`);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsSubmitting(false);
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
      <h2 className="mb-4">{t("checkout.title")}</h2>
      <div className="text-end">
        <Link href="/cart">
          <button className="btn btn-primary">
            {t("checkout.backToCart")}
          </button>
        </Link>
      </div>

      <div style={{ maxHeight: "250px", overflowY: "auto" }}>
        <table className="table align-middle mb-0">
          <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
            <tr>
              <th style={{ width: "100px" }}>{t("common.image")}</th>
              <th>{t("common.productName")}</th>
              <th style={{ width: "120px" }}>{t("common.unitPrice")}</th>
              <th style={{ width: "100px" }}>{t("common.quantity")}</th>
              <th style={{ width: "120px" }}>{t("common.subtotal")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => {
              const v = item.variant;
              const imgUrl = primaryImageUrl(v.product?.images || []);
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
                  <td className="text-center fs-5 text-primary">{item.qty}</td>
                  <td>NT$ {currency(Number(v.price) * item.qty)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="my-5 row justify-content-center">
        <form className="col-md-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              {t("checkout.email")}
            </label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder={t("checkout.emailPlaceholder")}
              {...register("email", emailValidation(t))}
            />
            {errors.email && (
              <p className="text-danger">{errors.email.message}</p>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              {t("checkout.name")}
            </label>
            <input
              id="name"
              type="text"
              className="form-control"
              placeholder={t("checkout.namePlaceholder")}
              {...register("name", nameValidation(t))}
            />
            {errors.name && (
              <p className="text-danger">{errors.name.message}</p>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="tel" className="form-label">
              {t("checkout.phone")}
            </label>
            <input
              id="tel"
              type="tel"
              className="form-control"
              placeholder={t("checkout.phonePlaceholder")}
              {...register("tel", taiwanPhoneValidation(t))}
            />
            {errors.tel && (
              <p className="text-danger">{errors.tel.message}</p>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">
              {t("cart.deliveryMethod")}
            </label>
            <div className="row g-2">
              {methods.map((m: any) => {
                const isPrivate = m.id === "delivery-private_delivery";
                const disabled = !m.available;
                return (
                  <div className="col-4" key={m.id}>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="deliveryMethod"
                        id={`method-${m.id}`}
                        value={m.id}
                        disabled={disabled}
                        checked={selectedMethod === m.id}
                        onChange={() => setSelectedMethod(m.id)}
                      />
                      <label
                        className={`form-check-label ${disabled ? "text-muted" : ""}`}
                        htmlFor={`method-${m.id}`}
                      >
                        {localizedName(m.name)}
                        {disabled && (
                          <span className="badge bg-secondary ms-2">
                            {t("cart.methodUnavailable")}
                          </span>
                        )}
                        {isPrivate &&
                          Number(minAmountPrivate) > 0 &&
                          disabled && (
                            <>
                              <br />
                              <small className="text-muted">
                                {t("cart.minAmountHint", {
                                  amount: currency(Number(minAmountPrivate)),
                                })}
                              </small>
                            </>
                          )}
                        {m.id === "delivery-self_pickup" && (
                          <small className="text-muted ms-1">
                            — {t("cart.free")}
                          </small>
                        )}
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedMethod === "delivery-self_pickup" && (
            <div className="alert alert-primary text-primary">
              {t("cart.selfPickupNote")}
            </div>
          )}

          {needsAddress && (
            <>
              <div className="row mb-3">
                <div className={needsDistrict ? "col-6" : "col-12"}>
                  <label htmlFor="city" className="form-label">
                    {t("checkout.city")}
                  </label>
                  <select
                    id="city"
                    className="form-select"
                    {...register("city", cityValidation(t))}
                  >
                    <option value="">{t("checkout.cityPlaceholder")}</option>
                    {cityList.map((r: any) => (
                      <option
                        key={cityValue(r.city)}
                        value={cityValue(r.city)}
                      >
                        {cityDisplayName(r.city)}
                      </option>
                    ))}
                  </select>
                  {errors.city && (
                    <p className="text-danger">{errors.city.message}</p>
                  )}
                </div>
                {needsDistrict && (
                  <div className="col-6">
                    <label htmlFor="district" className="form-label">
                      {t("checkout.district")}
                    </label>
                    <select
                      id="district"
                      className="form-select"
                      disabled={!selectedCity}
                      {...register("district", districtValidation(t))}
                    >
                      <option value="">
                        {t("checkout.districtPlaceholder")}
                      </option>
                      {districts.map((d: any) => {
                        const val =
                          typeof d === "string" ? d : d.zh;
                        return (
                          <option key={val} value={val}>
                            {typeof d === "string" ? d : localizedName(d)}
                          </option>
                        );
                      })}
                    </select>
                    {errors.district && (
                      <p className="text-danger">{errors.district.message}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="address" className="form-label">
                  {t("checkout.address")}
                </label>
                <input
                  id="address"
                  type="text"
                  className="form-control"
                  placeholder={t("checkout.addressPlaceholder")}
                  {...register("address", addressValidation(t))}
                />
                {errors.address && (
                  <p className="text-danger">{errors.address.message}</p>
                )}
              </div>
            </>
          )}

          {isConvenienceStore && (
            <>
              <div className="mb-3">
                <label htmlFor="storeBrand" className="form-label">
                  {t("checkout.storeBrand")}
                </label>
                <div className="d-flex gap-2">
                  <select
                    id="storeBrand"
                    className="form-select"
                    {...register("storeBrand", {
                      required: isConvenienceStore
                        ? t("validation.storeBrandRequired")
                        : false,
                    })}
                  >
                    <option value="">
                      {t("checkout.storeBrandPlaceholder")}
                    </option>
                    {storeChains.map((chain: any) => (
                      <option key={chain.id} value={chain.id}>
                        {localizedName(chain.name)}
                      </option>
                    ))}
                  </select>
                  {finderUrl && (
                    <a
                      href={finderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary text-nowrap"
                    >
                      <i className="bi bi-geo-alt me-1" />
                      {t("checkout.lookupStore")}
                      <i className="bi bi-box-arrow-up-right ms-1 small" />
                    </a>
                  )}
                </div>
                {errors.storeBrand && (
                  <p className="text-danger">{errors.storeBrand.message}</p>
                )}
              </div>

              <div className="row mb-3">
                <div className="col-7">
                  <label htmlFor="storeName" className="form-label">
                    {t("checkout.storeName")}
                  </label>
                  <input
                    id="storeName"
                    type="text"
                    className="form-control"
                    placeholder={t("checkout.storeNamePlaceholder")}
                    {...register("storeName", {
                      required: isConvenienceStore
                        ? t("validation.storeNameRequired")
                        : false,
                    })}
                  />
                  {errors.storeName && (
                    <p className="text-danger">{errors.storeName.message}</p>
                  )}
                </div>
                <div className="col-5">
                  <label htmlFor="storeNumber" className="form-label">
                    {t("checkout.storeNumber")}
                  </label>
                  <input
                    id="storeNumber"
                    type="text"
                    className="form-control"
                    placeholder={t("checkout.storeNumberPlaceholder")}
                    {...register("storeNumber", {
                      required: isConvenienceStore
                        ? t("validation.storeNumberRequired")
                        : false,
                    })}
                  />
                  {errors.storeNumber && (
                    <p className="text-danger">
                      {errors.storeNumber.message}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="mb-3">
            <label htmlFor="message" className="form-label">
              {t("checkout.message")}
            </label>
            <textarea
              id="message"
              className="form-control"
              rows={4}
              {...register("message")}
            />
          </div>

          <OrderSummary
            t={t}
            subtotal={subtotal}
            selectedMethod={selectedMethod}
          />

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={isSubmitting || !selectedMethod}
          >
            {isSubmitting ? t("common.loading") : t("checkout.submitOrder")}
          </button>
        </form>
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
