import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations();

  return (
    <div className="container py-5 text-center">
      <h1>🌿 伴日園</h1>
      <p className="text-muted">{t("nav.products")}</p>
    </div>
  );
}
