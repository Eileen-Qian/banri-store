import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollRestore from "@/components/ScrollRestore";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (
    await import(`@/i18n/locales/${locale === "zh" ? "zh-TW" : "en"}.json`)
  ).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ScrollRestore />
      <Navbar />
      <main style={{ paddingTop: 100 }} className="flex-grow-1">
        {children}
      </main>
      <Footer />
    </NextIntlClientProvider>
  );
}
