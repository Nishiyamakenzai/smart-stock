import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "COATEX - 西山建材工業",
  description: "COATEX | 経営を、塗り替えろ。SMART COATING & BUSINESS SOLUTIONS",
  robots: "noindex, nofollow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
