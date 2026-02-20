import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "離婚財産分与計算ツール",
  description:
    "婚姻期間・共有財産・寄与度・負債・特有財産を入力して、離婚時の財産分与額を計算します。AI解説機能付き。",
  keywords: ["離婚", "財産分与", "計算ツール", "離婚財産", "分与額"],
  openGraph: {
    title: "離婚財産分与計算ツール",
    description:
      "離婚時の財産分与額をかんたん計算。AI解説機能で計算根拠も分かりやすく説明。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-50">
        {/* ヘッダー */}
        <header className="bg-blue-700 text-white shadow-md">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold">離婚財産分与計算ツール</h1>
            <p className="text-blue-200 text-xs mt-0.5">
              財産分与額の目安をかんたん計算 ／ AI解説機能付き
            </p>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>

        {/* フッター */}
        <footer className="bg-gray-800 text-gray-400 mt-10">
          <div className="max-w-3xl mx-auto px-4 py-5 text-xs text-center space-y-1">
            <p>離婚財産分与計算ツール</p>
            <p>
              ※ このツールは参考情報の提供を目的としており、法的アドバイスではありません。
              実際の手続きは弁護士にご相談ください。
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
