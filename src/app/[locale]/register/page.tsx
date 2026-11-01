"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import { emailValidation } from "@/utils/validation";
import type { Customer } from "@/context/AuthContext";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

export default function RegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    mode: "onChange",
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", phone: "" },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError("");
    try {
      const res = await api
        .post("api/v1/auth/register", {
          json: {
            name: data.name,
            email: data.email,
            password: data.password,
            phone: data.phone || undefined,
          },
        })
        .json<{ token: string; customer: Customer }>();
      await login(res.token, res.customer);
      router.push("/account");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setError(t("auth.emailTaken"));
      } else {
        setError(t("auth.registerError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <h1 className="mb-4">{t("auth.registerTitle")}</h1>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="mb-3">
              <label className="form-label">
                {t("auth.nameLabel")} <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control${errors.name ? " is-invalid" : ""}`}
                placeholder={t("auth.namePlaceholder")}
                {...register("name", {
                  required: t("auth.nameRequired"),
                })}
              />
              {errors.name && (
                <div className="invalid-feedback">{errors.name.message}</div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">
                {t("auth.emailLabel")} <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                className={`form-control${errors.email ? " is-invalid" : ""}`}
                placeholder={t("auth.emailPlaceholder")}
                {...register("email", emailValidation(t))}
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email.message}</div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">
                {t("auth.passwordLabel")} <span className="text-danger">*</span>
              </label>
              <input
                type="password"
                className={`form-control${errors.password ? " is-invalid" : ""}`}
                placeholder={t("auth.passwordPlaceholder")}
                {...register("password", {
                  required: t("auth.passwordRequired"),
                  minLength: {
                    value: 8,
                    message: t("auth.passwordMinLength"),
                  },
                })}
              />
              {errors.password && (
                <div className="invalid-feedback">
                  {errors.password.message}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">
                {t("auth.confirmPasswordLabel")} <span className="text-danger">*</span>
              </label>
              <input
                type="password"
                className={`form-control${errors.confirmPassword ? " is-invalid" : ""}`}
                placeholder={t("auth.confirmPasswordPlaceholder")}
                {...register("confirmPassword", {
                  required: t("auth.confirmPasswordRequired"),
                  validate: (val) =>
                    val === watch("password") || t("auth.passwordMismatch"),
                })}
              />
              {errors.confirmPassword && (
                <div className="invalid-feedback">
                  {errors.confirmPassword.message}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">{t("auth.phoneLabel")}</label>
              <input
                type="tel"
                className={`form-control${errors.phone ? " is-invalid" : ""}`}
                placeholder={t("auth.phonePlaceholder")}
                {...register("phone")}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 mb-3"
              disabled={loading}
            >
              {loading ? t("auth.registering") : t("auth.registerButton")}
            </button>

            <p className="text-center text-body-secondary">
              {t("auth.hasAccount")}{" "}
              <Link href="/login">{t("auth.loginLink")}</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
