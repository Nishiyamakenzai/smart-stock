import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MQ会計ダッシュボード - 西山建材工業",
  description: "MQ会計リアルタイム経営管理ダッシュボード（第46期）",
  robots: "noindex, nofollow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
