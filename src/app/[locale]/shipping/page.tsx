import { useTranslations } from "next-intl";

export default function Page() {
  const t = useTranslations();
  return (
    <div className="container py-5 text-center">
      <h1>{t("nav.shipping")}</h1>
      <p className="text-muted">建置中</p>
    </div>
  );
}
