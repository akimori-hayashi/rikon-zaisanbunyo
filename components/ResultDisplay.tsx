"use client";

/**
 * 計算結果表示コンポーネント
 *
 * 表示内容：
 * - 円グラフによる分与割合の視覚化
 * - 各配偶者の取得額
 * - 計算内訳の詳細
 * - AI解析ボタン（通常解説・詳細解説）
 * - ローディング表示
 */

import { useState } from "react";
import type { CalculatorInput, CalculationResult, AnalyzeResponse } from "@/lib/types";
import { formatCurrency, formatMarriagePeriod } from "@/lib/calculator";

interface ResultDisplayProps {
  result: CalculationResult;
  input: CalculatorInput;
}

/**
 * SVG円グラフコンポーネント
 * 夫と妻の取得割合を視覚的に表示
 */
function PieChart({
  husbandRatio,
  wifeRatio,
}: {
  husbandRatio: number;
  wifeRatio: number;
}) {
  // SVGの円グラフ計算
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const husbandDash = (husbandRatio / 100) * circumference;
  const wifeDash = (wifeRatio / 100) * circumference;

  // 開始角度（-90度 = 12時の位置から開始）
  const husbandOffset = 0;
  const wifeOffset = -husbandDash;

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-md">
        {/* 背景円 */}
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="36" />

        {/* 妻の部分（先に描画） */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#f97316"
          strokeWidth="36"
          strokeDasharray={`${wifeDash} ${circumference - wifeDash}`}
          strokeDashoffset={wifeOffset}
          transform="rotate(-90 100 100)"
        />

        {/* 夫の部分（後に描画） */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="36"
          strokeDasharray={`${husbandDash} ${circumference - husbandDash}`}
          strokeDashoffset={husbandOffset}
          transform="rotate(-90 100 100)"
        />

        {/* 中央テキスト */}
        <text
          x="100"
          y="95"
          textAnchor="middle"
          className="text-xs"
          fill="#6b7280"
          fontSize="11"
        >
          分与割合
        </text>
        <text
          x="100"
          y="115"
          textAnchor="middle"
          fill="#1f2937"
          fontSize="14"
          fontWeight="bold"
        >
          {husbandRatio}:{wifeRatio}
        </text>
      </svg>

      {/* 凡例 */}
      <div className="flex gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500" />
          <span className="text-sm text-gray-600">夫 {husbandRatio}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-400" />
          <span className="text-sm text-gray-600">妻 {wifeRatio}%</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 金額バー表示コンポーネント
 */
function AmountBar({
  label,
  amount,
  total,
  color,
}: {
  label: string;
  amount: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (amount / total) * 100 : 50;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="font-bold text-gray-900">{formatCurrency(amount)}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
}

export default function ResultDisplay({ result, input }: ResultDisplayProps) {
  const [quickExplanation, setQuickExplanation] = useState<string>("");
  const [detailedExplanation, setDetailedExplanation] = useState<string>("");
  const [isLoadingQuick, setIsLoadingQuick] = useState(false);
  const [isLoadingDetailed, setIsLoadingDetailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const totalDisplay = result.husbandAmount + result.wifeAmount;
  const marriagePeriod = formatMarriagePeriod(
    input.marriageYears,
    input.marriageMonths
  );

  /**
   * Claude AIに解析を依頼する
   * @param type - 'quick'=通常解説(Haiku), 'detailed'=詳細解説(Sonnet)
   */
  async function handleAnalyze(type: "quick" | "detailed") {
    const setLoading = type === "quick" ? setIsLoadingQuick : setIsLoadingDetailed;
    const setExplanation =
      type === "quick" ? setQuickExplanation : setDetailedExplanation;

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          result,
          analysisType: type,
        }),
      });

      const data: AnalyzeResponse = await response.json();

      if (!response.ok || data.error) {
        setErrorMessage(data.error || "解析中にエラーが発生しました。");
        return;
      }

      setExplanation(data.explanation);
    } catch {
      setErrorMessage("通信エラーが発生しました。しばらく後にお試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white">
        <h2 className="text-xl font-bold mb-1">計算結果</h2>
        <p className="text-blue-200 text-sm">婚姻期間：{marriagePeriod}</p>
      </div>

      {/* 円グラフ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4 text-center">
          財産分与の割合
        </h3>
        <PieChart
          husbandRatio={result.husbandRatio}
          wifeRatio={result.wifeRatio}
        />
      </div>

      {/* 各配偶者の取得額 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          各配偶者の取得額
        </h3>
        <div className="space-y-4">
          <AmountBar
            label="夫の取得額"
            amount={result.husbandAmount}
            total={totalDisplay}
            color="bg-blue-500"
          />
          <AmountBar
            label="妻の取得額"
            amount={result.wifeAmount}
            total={totalDisplay}
            color="bg-orange-400"
          />
        </div>

        {/* 金額の大きな表示 */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-xs text-blue-600 mb-1">夫の取得額</p>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(result.husbandAmount)}
            </p>
            <p className="text-sm text-blue-500 mt-1">{result.husbandRatio}%</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <p className="text-xs text-orange-600 mb-1">妻の取得額</p>
            <p className="text-2xl font-bold text-orange-700">
              {formatCurrency(result.wifeAmount)}
            </p>
            <p className="text-sm text-orange-500 mt-1">{result.wifeRatio}%</p>
          </div>
        </div>
      </div>

      {/* 計算内訳 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4">計算内訳</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-600">共有財産の総額</span>
            <span className="font-medium">
              {formatCurrency(result.breakdown.grossAssets)}
            </span>
          </div>
          {result.breakdown.deductedDebt > 0 && (
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-600">負債の控除</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(result.breakdown.deductedDebt)}
              </span>
            </div>
          )}
          {result.breakdown.deductedHusbandUnique > 0 && (
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-600">夫の特有財産（控除）</span>
              <span className="font-medium text-gray-500">
                -{formatCurrency(result.breakdown.deductedHusbandUnique)}
              </span>
            </div>
          )}
          {result.breakdown.deductedWifeUnique > 0 && (
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-600">妻の特有財産（控除）</span>
              <span className="font-medium text-gray-500">
                -{formatCurrency(result.breakdown.deductedWifeUnique)}
              </span>
            </div>
          )}
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-600 font-medium">分与対象額（正味）</span>
            <span className="font-bold text-blue-700">
              {formatCurrency(result.netAssets)}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-600">収入による寄与度（夫）</span>
            <span className="font-medium">
              {result.breakdown.incomeContributionRatio}%
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-600">家事・育児による寄与度（夫）</span>
            <span className="font-medium">
              {result.breakdown.houseworkContributionRatio}%
            </span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-gray-600 font-medium">最終寄与度（夫/妻）</span>
            <span className="font-bold">
              {result.husbandRatio}% / {result.wifeRatio}%
            </span>
          </div>
        </div>
      </div>

      {/* AI解析ボタン */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-3">
          AI による解説
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          ※ あくまで参考情報です。実際の法的手続きは弁護士にご相談ください。
        </p>

        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{errorMessage}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {/* 通常解説ボタン（Haiku使用） */}
          <button
            onClick={() => handleAnalyze("quick")}
            disabled={isLoadingQuick || isLoadingDetailed}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 text-sm"
          >
            {isLoadingQuick ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                解析中...
              </span>
            ) : (
              "AI解説を見る"
            )}
          </button>

          {/* 詳細解説ボタン（Sonnet使用） */}
          <button
            onClick={() => handleAnalyze("detailed")}
            disabled={isLoadingQuick || isLoadingDetailed}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 text-sm"
          >
            {isLoadingDetailed ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                解析中...
              </span>
            ) : (
              "詳細AI解説を見る"
            )}
          </button>
        </div>

        {/* 通常解説の結果 */}
        {quickExplanation && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-xs font-medium text-green-700 mb-2">AI解説</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {quickExplanation}
            </p>
          </div>
        )}

        {/* 詳細解説の結果 */}
        {detailedExplanation && (
          <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-xs font-medium text-purple-700 mb-2">詳細AI解説</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {detailedExplanation}
            </p>
          </div>
        )}
      </div>

      {/* 免責事項 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-xs text-yellow-800 leading-relaxed">
          <strong>免責事項：</strong>
          この計算ツールは参考情報の提供を目的としています。実際の財産分与は個別の事情により大きく異なります。
          法的な手続きや具体的な取り決めについては、弁護士や調停委員にご相談ください。
        </p>
      </div>
    </div>
  );
}
