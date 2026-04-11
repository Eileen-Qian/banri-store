"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { api, localizedName } from "@/utils/api";
import { currency } from "@/utils/currency";


export default function ShippingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [rates, setRates] = useState<any[]>([]);
  const [filterCity, setFilterCity] = useState("");
  const [shippingInfo, setShippingInfo] = useState<any>(null);

  useEffect(() => {
    api
      .get("api/v1/shipping/rates")
      .json<any>()
      .then((res) => setRates(res.rates))
      .catch(console.error);
    api
      .get("api/v1/shipping/info")
      .json<any>()
      .then((res) => setShippingInfo(res))
      .catch(console.error);
  }, []);

  const cities = useMemo(() => {
    const seen = new Map<string, any>();
    for (const r of rates) {
      if (r.city && !seen.has(r.city.zh))
        seen.set(r.city.zh, r.city);
    }
    return [...seen.values()].sort((a, b) =>
      a.zh.localeCompare(b.zh, "zh-TW"),
    );
  }, [rates]);

  const filteredRates = useMemo(
    () =>
      filterCity
        ? rates.filter((r: any) => r.city?.zh === filterCity)
        : rates,
    [rates, filterCity],
  );

  const convenienceImg = locale?.startsWith("zh")
    ? "/images/convenience-shipping-zh.png"
    : "/images/convenience-shipping-en.png";

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center">{t("shipping.title")}</h2>

      <div className="bg-light card border-0 shadow-sm mb-5">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3">
            <i className="bi bi-info-circle me-2" />
            {t("shipping.rulesTitle")}
          </h5>
          <ul className="mb-0 ps-0" style={{ listStylePosition: "inside" }}>
            <li className="mb-2">{t("shipping.rule1")}</li>
            <li className="mb-2">
              {t("shipping.rule2", {
                fee: shippingInfo
                  ? currency(Number(shippingInfo.convenienceStoreFee))
                  : "—",
              })}
            </li>
            <li>{t("shipping.rule3")}</li>
          </ul>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={convenienceImg}
            alt={t("shipping.convenienceBoxAlt")}
            className="img-fluid rounded mt-4 d-block mx-auto w-100"
            style={{ maxWidth: 600 }}
          />
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <h5 className="fw-bold mb-0">
              <i className="bi bi-truck me-2" />
              {t("shipping.feeTableTitle")}
            </h5>
            <select
              className="form-select form-select-sm"
              style={{ width: "auto" }}
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
            >
              <option value="">{t("shipping.allCities")}</option>
              {cities.map((c: any) => (
                <option key={c.zh} value={c.zh}>
                  {localizedName(c)}
                </option>
              ))}
            </select>
          </div>

          <div className="table-responsive" style={{ maxHeight: "500px" }}>
            <table className="table table-hover align-middle mb-0">
              <thead
                className="table-light"
                style={{ position: "sticky", top: 0 }}
              >
                <tr>
                  <th>{t("shipping.city")}</th>
                  <th>{t("shipping.district")}</th>
                  <th>{t("shipping.zone")}</th>
                  <th className="text-end">{t("shipping.fee")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRates.map((r: any, i: number) => (
                  <tr key={i}>
                    <td>
                      {r.city ? localizedName(r.city) : "—"}
                    </td>
                    <td>
                      {r.district ? localizedName(r.district) : "—"}
                    </td>
                    <td>
                      {r.zone ? localizedName(r.zone) : "—"}
                    </td>
                    <td className="text-end">
                      NT$ {currency(Number(r.fee))}
                    </td>
                  </tr>
                ))}
                {filteredRates.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center text-muted py-4"
                    >
                      —
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
