import type { Metadata } from "next";
import "./globals.scss";
import { ThemeProvider } from "@/context/ThemeContext";
import { MessageProvider } from "@/context/MessageContext";
import MessageToast from "@/components/MessageToast";

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
    <html lang="zh-TW" suppressHydrationWarning>
      <body className="d-flex flex-column min-vh-100">
        <ThemeProvider>
          <MessageProvider>
            {children}
            <MessageToast />
          </MessageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
