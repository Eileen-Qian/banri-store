"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import { emailValidation } from "@/utils/validation";
import type { Customer } from "@/context/AuthContext";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError("");
    try {
      const res = await api
        .post("api/v1/auth/login", { json: data })
        .json<{ token: string; customer: Customer }>();
      await login(res.token, res.customer);
      router.push("/account");
    } catch {
      setError(t("auth.loginError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <h1 className="mb-4">{t("auth.loginTitle")}</h1>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
                })}
              />
              {errors.password && (
                <div className="invalid-feedback">
                  {errors.password.message}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 mb-3"
              disabled={loading}
            >
              {loading ? t("auth.loggingIn") : t("auth.loginButton")}
            </button>

            <p className="text-center text-body-secondary">
              {t("auth.noAccount")}{" "}
              <Link href="/register">{t("auth.registerLink")}</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
