import type { Metadata } from "next";
import { Noto_Sans_TC } from "next/font/google";
import "./globals.scss";
import { ThemeProvider } from "@/context/ThemeContext";
import { MessageProvider } from "@/context/MessageContext";
import MessageToast from "@/components/MessageToast";

export const metadata: Metadata = {
  title: "伴日園 Banri",
  description: "伴日園 — 觀葉植物線上商店",
};

// Variable font (wght 100-900). CJK glyphs are split into unicode-range
// slices and fetched on demand; only the latin slice is preloaded.
const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-tc",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={notoSansTC.variable} suppressHydrationWarning>
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
