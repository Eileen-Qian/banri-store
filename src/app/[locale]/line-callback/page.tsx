"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";

/**
 * LINE Login redirects here with ?code=xxx&state=orderId.
 * We save the code to sessionStorage and navigate to the order success page.
 */
export default function LineCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = searchParams.get("code");
    const orderId = searchParams.get("state");

    if (code && orderId) {
      sessionStorage.setItem("lineCallbackCode", code);
      sessionStorage.setItem("lineCallbackOrderId", orderId);
      router.replace(`/order-success/${orderId}`);
    } else {
      router.replace("/");
    }
  }, [searchParams, router]);

  return (
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}
