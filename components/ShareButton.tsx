"use client";

/**
 * URLシェアボタンコンポーネント
 *
 * 入力値をURLパラメータにエンコードしてシェアURLを生成する。
 * 日本語を含む値はencodeURIComponent()でエンコード。
 * クリップボードへのコピー機能付き。
 */

import { useState } from "react";
import type { CalculatorInput } from "@/lib/types";

interface ShareButtonProps {
  input: CalculatorInput;
}

/**
 * 入力値からシェアURLのパラメータ文字列を生成
 */
function buildShareUrl(input: CalculatorInput): string {
  // URLパラメータとして扱う値（全て数値のため encodeURIComponent は不要だが一貫性のため使用）
  const params = new URLSearchParams({
    savings: String(input.assets.savings),
    realEstate: String(input.assets.realEstate),
    securities: String(input.assets.securities),
    otherAssets: String(input.assets.otherAssets),
    marriageYears: String(input.marriageYears),
    marriageMonths: String(input.marriageMonths),
    husbandIncome: String(input.husbandIncome),
    wifeIncome: String(input.wifeIncome),
    husbandHousework: String(input.husbandHouseworkContribution),
    wifeHousework: String(input.wifeHouseworkContribution),
    debt: String(input.totalDebt),
    hasUnique: input.hasUniqueAssets ? "1" : "0",
    husbandUnique: String(input.husbandUniqueAssets),
    wifeUnique: String(input.wifeUniqueAssets),
  });

  // 現在のオリジン（ホスト）を取得してシェアURLを構築
  // SSR時はwindowが未定義のため、クライアントサイドでのみ実行
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/?${params.toString()}`;
}

export default function ShareButton({ input }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [showUrl, setShowUrl] = useState(false);

  /** シェアURLを生成して表示する */
  function handleGenerate() {
    const url = buildShareUrl(input);
    setShareUrl(url);
    setShowUrl(true);
    setCopied(false);
  }

  /** クリップボードにURLをコピーする */
  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      // 3秒後にコピー完了表示をリセット
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // クリップボードAPIが使えない場合はフォールバック
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-800 mb-3">
        計算結果を共有する
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        入力内容をURLに保存して、他の人と共有できます。
      </p>

      {/* シェアURL生成ボタン */}
      <button
        onClick={handleGenerate}
        className="w-full bg-gray-700 hover:bg-gray-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 text-sm mb-3"
      >
        シェア用URLを生成する
      </button>

      {/* 生成されたURL表示エリア */}
      {showUrl && shareUrl && (
        <div className="space-y-2">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">シェアURL</p>
            <p className="text-xs text-gray-700 break-all font-mono leading-relaxed">
              {shareUrl}
            </p>
          </div>

          {/* コピーボタン */}
          <button
            onClick={handleCopy}
            className={`w-full font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 text-sm ${
              copied
                ? "bg-green-600 text-white"
                : "bg-blue-100 hover:bg-blue-200 text-blue-700"
            }`}
          >
            {copied ? "コピーしました！" : "URLをコピーする"}
          </button>
        </div>
      )}
    </div>
  );
}
