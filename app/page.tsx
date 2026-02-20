"use client";

/**
 * メインページコンポーネント
 *
 * URLパラメータからの入力値の復元、
 * 計算フォームと結果表示の制御、
 * シェア機能を統合するページ。
 */

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CalculatorForm from "@/components/CalculatorForm";
import ResultDisplay from "@/components/ResultDisplay";
import ShareButton from "@/components/ShareButton";
import { calculateDivision } from "@/lib/calculator";
import type { CalculatorInput, CalculationResult, ShareParams } from "@/lib/types";

/**
 * URLパラメータを読み取ってフォームに渡す内部コンポーネント
 * useSearchParams()はSuspenseで囲む必要がある
 */
function HomeContent() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [lastInput, setLastInput] = useState<CalculatorInput | null>(null);

  // URLパラメータをShareParams型に変換
  const initialParams: ShareParams = {
    savings: searchParams.get("savings") || undefined,
    realEstate: searchParams.get("realEstate") || undefined,
    securities: searchParams.get("securities") || undefined,
    otherAssets: searchParams.get("otherAssets") || undefined,
    marriageYears: searchParams.get("marriageYears") || undefined,
    marriageMonths: searchParams.get("marriageMonths") || undefined,
    husbandIncome: searchParams.get("husbandIncome") || undefined,
    wifeIncome: searchParams.get("wifeIncome") || undefined,
    husbandHousework: searchParams.get("husbandHousework") || undefined,
    wifeHousework: searchParams.get("wifeHousework") || undefined,
    debt: searchParams.get("debt") || undefined,
    hasUnique: searchParams.get("hasUnique") || undefined,
    husbandUnique: searchParams.get("husbandUnique") || undefined,
    wifeUnique: searchParams.get("wifeUnique") || undefined,
  };

  // URLパラメータがある場合、ページ読み込み時に自動計算
  const hasParams = Object.values(initialParams).some((v) => v !== undefined);

  useEffect(() => {
    if (!hasParams) return;

    // URLパラメータから入力値を復元して自動計算
    const restoredInput: CalculatorInput = {
      marriageYears: parseInt(initialParams.marriageYears || "0") || 0,
      marriageMonths: parseInt(initialParams.marriageMonths || "0") || 0,
      assets: {
        savings: parseInt(initialParams.savings || "0") || 0,
        realEstate: parseInt(initialParams.realEstate || "0") || 0,
        securities: parseInt(initialParams.securities || "0") || 0,
        otherAssets: parseInt(initialParams.otherAssets || "0") || 0,
      },
      husbandIncome: parseInt(initialParams.husbandIncome || "0") || 0,
      wifeIncome: parseInt(initialParams.wifeIncome || "0") || 0,
      husbandHouseworkContribution:
        parseInt(initialParams.husbandHousework || "50") || 50,
      wifeHouseworkContribution:
        parseInt(initialParams.wifeHousework || "50") || 50,
      totalDebt: parseInt(initialParams.debt || "0") || 0,
      hasUniqueAssets: initialParams.hasUnique === "1",
      husbandUniqueAssets: parseInt(initialParams.husbandUnique || "0") || 0,
      wifeUniqueAssets: parseInt(initialParams.wifeUnique || "0") || 0,
    };

    const totalAssets =
      restoredInput.assets.savings +
      restoredInput.assets.realEstate +
      restoredInput.assets.securities +
      restoredInput.assets.otherAssets;

    if (totalAssets > 0) {
      const calculated = calculateDivision(restoredInput);
      setResult(calculated);
      setLastInput(restoredInput);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** フォーム送信時に計算を実行 */
  function handleCalculate(input: CalculatorInput) {
    const calculated = calculateDivision(input);
    setResult(calculated);
    setLastInput(input);

    // 計算結果にスムーズスクロール
    setTimeout(() => {
      document.getElementById("result-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  return (
    <div className="space-y-6">
      {/* 使い方の説明 */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-blue-800 mb-2">
          使い方
        </h2>
        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
          <li>婚姻期間・共有財産・収入などを入力する</li>
          <li>「財産分与を計算する」ボタンをクリック</li>
          <li>計算結果と分与割合を確認する</li>
          <li>AI解説ボタンで詳しい解説を見る（任意）</li>
          <li>シェアURLで他の人と共有する（任意）</li>
        </ol>
      </div>

      {/* 入力フォーム */}
      <CalculatorForm
        onCalculate={handleCalculate}
        initialParams={hasParams ? initialParams : undefined}
      />

      {/* 計算結果 */}
      {result && lastInput && (
        <div id="result-section" className="space-y-5">
          <ResultDisplay result={result} input={lastInput} />
          <ShareButton input={lastInput} />
        </div>
      )}
    </div>
  );
}

/**
 * メインのページコンポーネント
 * useSearchParams()を使うためSuspenseで囲む
 */
export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500 text-sm">読み込み中...</p>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
