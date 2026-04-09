import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "伴日園 Banri",
  description: "伴日園 — 觀葉植物線上商店",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="d-flex flex-column min-vh-100">
        {children}
      </body>
    </html>
  );
}
