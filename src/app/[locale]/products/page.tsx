import { useTranslations } from "next-intl";

export default function ProductsPage() {
  const t = useTranslations();

  return (
    <div className="container py-5 text-center">
      <h1>{t("nav.products")}</h1>
      <p className="text-muted">建置中</p>
    </div>
  );
}
