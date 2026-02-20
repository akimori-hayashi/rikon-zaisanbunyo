"use client";

/**
 * 財産分与計算フォームコンポーネント
 *
 * 入力項目：
 * - 婚姻期間（年月）
 * - 共有財産（預貯金・不動産・有価証券・その他）
 * - 各配偶者の収入・家事貢献度
 * - 負債・特有財産
 */

import { useState, useEffect } from "react";
import type { CalculatorInput, ShareParams } from "@/lib/types";

interface CalculatorFormProps {
  onCalculate: (input: CalculatorInput) => void;
  initialParams?: ShareParams;
}

/** フォームのデフォルト値 */
const DEFAULT_INPUT: CalculatorInput = {
  marriageYears: 0,
  marriageMonths: 0,
  assets: {
    savings: 0,
    realEstate: 0,
    securities: 0,
    otherAssets: 0,
  },
  husbandIncome: 0,
  wifeIncome: 0,
  husbandHouseworkContribution: 50,
  wifeHouseworkContribution: 50,
  totalDebt: 0,
  hasUniqueAssets: false,
  husbandUniqueAssets: 0,
  wifeUniqueAssets: 0,
};

/** 万円単位の入力を円に変換 */
function manToYen(man: number): number {
  return Math.round(man * 10000);
}

/** 円を万円単位に変換 */
function yenToMan(yen: number): number {
  return yen / 10000;
}

export default function CalculatorForm({
  onCalculate,
  initialParams,
}: CalculatorFormProps) {
  const [input, setInput] = useState<CalculatorInput>(DEFAULT_INPUT);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // URLパラメータから初期値を復元
  useEffect(() => {
    if (!initialParams) return;

    setInput((prev) => ({
      ...prev,
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
    }));
  }, [initialParams]);

  /** 入力値のバリデーション */
  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (input.marriageYears < 0 || input.marriageMonths < 0) {
      newErrors.period = "婚姻期間は0以上の数値を入力してください。";
    }
    if (input.marriageMonths > 11) {
      newErrors.period = "月は0〜11の範囲で入力してください。";
    }

    const totalAssets =
      input.assets.savings +
      input.assets.realEstate +
      input.assets.securities +
      input.assets.otherAssets;

    if (totalAssets === 0) {
      newErrors.assets = "共有財産を少なくとも1つ入力してください。";
    }

    if (input.totalDebt < 0) {
      newErrors.debt = "負債は0以上の数値を入力してください。";
    }

    if (input.husbandIncome < 0 || input.wifeIncome < 0) {
      newErrors.income = "収入は0以上の数値を入力してください。";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  /** フォーム送信ハンドラ */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      onCalculate(input);
    }
  }

  /** 夫の家事貢献度スライダー変更時に妻の値を連動 */
  function handleHusbandHousework(value: number) {
    setInput((prev) => ({
      ...prev,
      husbandHouseworkContribution: value,
      wifeHouseworkContribution: 100 - value,
    }));
  }

  /** 万円単位の入力フィールドコンポーネント（内部ヘルパー） */
  function ManYenInput({
    label,
    value,
    onChange,
    placeholder = "0",
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    placeholder?: string;
  }) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <div className="relative">
          <input
            type="number"
            min="0"
            value={value === 0 ? "" : value}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            placeholder={placeholder}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            円
          </span>
        </div>
      </div>
    );
  }

  const totalAssets =
    input.assets.savings +
    input.assets.realEstate +
    input.assets.securities +
    input.assets.otherAssets;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 婚姻期間 */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
            1
          </span>
          婚姻期間
        </h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              年数
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={input.marriageYears === 0 ? "" : input.marriageYears}
                onChange={(e) =>
                  setInput((p) => ({
                    ...p,
                    marriageYears: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                年
              </span>
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              月数
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="11"
                value={input.marriageMonths === 0 ? "" : input.marriageMonths}
                onChange={(e) =>
                  setInput((p) => ({
                    ...p,
                    marriageMonths: Math.min(
                      11,
                      parseInt(e.target.value) || 0
                    ),
                  }))
                }
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                ヶ月
              </span>
            </div>
          </div>
        </div>
        {errors.period && (
          <p className="text-red-500 text-sm mt-2">{errors.period}</p>
        )}
      </section>

      {/* 共有財産 */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
            2
          </span>
          共有財産の内訳
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ManYenInput
            label="預貯金"
            value={input.assets.savings}
            onChange={(v) =>
              setInput((p) => ({ ...p, assets: { ...p.assets, savings: v } }))
            }
          />
          <ManYenInput
            label="不動産評価額"
            value={input.assets.realEstate}
            onChange={(v) =>
              setInput((p) => ({
                ...p,
                assets: { ...p.assets, realEstate: v },
              }))
            }
          />
          <ManYenInput
            label="有価証券"
            value={input.assets.securities}
            onChange={(v) =>
              setInput((p) => ({
                ...p,
                assets: { ...p.assets, securities: v },
              }))
            }
          />
          <ManYenInput
            label="その他資産"
            value={input.assets.otherAssets}
            onChange={(v) =>
              setInput((p) => ({
                ...p,
                assets: { ...p.assets, otherAssets: v },
              }))
            }
          />
        </div>
        {/* 合計表示 */}
        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
          <span className="text-sm text-gray-600">共有財産合計</span>
          <span className="font-semibold text-blue-700">
            {totalAssets.toLocaleString("ja-JP")} 円
          </span>
        </div>
        {errors.assets && (
          <p className="text-red-500 text-sm mt-2">{errors.assets}</p>
        )}
      </section>

      {/* 収入情報 */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
            3
          </span>
          各配偶者の寄与度
        </h2>
        <div className="space-y-4">
          {/* 収入 */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              年収（収入がない場合は0を入力）
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">夫の年収</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={
                      input.husbandIncome === 0 ? "" : yenToMan(input.husbandIncome)
                    }
                    onChange={(e) =>
                      setInput((p) => ({
                        ...p,
                        husbandIncome: manToYen(parseInt(e.target.value) || 0),
                      }))
                    }
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    万円/年
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">妻の年収</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={
                      input.wifeIncome === 0 ? "" : yenToMan(input.wifeIncome)
                    }
                    onChange={(e) =>
                      setInput((p) => ({
                        ...p,
                        wifeIncome: manToYen(parseInt(e.target.value) || 0),
                      }))
                    }
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    万円/年
                  </span>
                </div>
              </div>
            </div>
          </div>
          {errors.income && (
            <p className="text-red-500 text-sm">{errors.income}</p>
          )}

          {/* 家事・育児貢献度スライダー */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              家事・育児の貢献度（夫）
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>妻が多い</span>
                <span className="font-medium text-blue-700">
                  夫 {input.husbandHouseworkContribution}% ／ 妻{" "}
                  {input.wifeHouseworkContribution}%
                </span>
                <span>夫が多い</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={input.husbandHouseworkContribution}
                onChange={(e) =>
                  handleHusbandHousework(parseInt(e.target.value))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 負債 */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
            4
          </span>
          負債総額
        </h2>
        <ManYenInput
          label="住宅ローン・借入金などの合計"
          value={input.totalDebt}
          onChange={(v) => setInput((p) => ({ ...p, totalDebt: v }))}
        />
        {errors.debt && (
          <p className="text-red-500 text-sm mt-2">{errors.debt}</p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          ※ 共有財産から控除されます
        </p>
      </section>

      {/* 特有財産 */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
            5
          </span>
          特有財産
        </h2>
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="hasUniqueAssets"
            checked={input.hasUniqueAssets}
            onChange={(e) =>
              setInput((p) => ({ ...p, hasUniqueAssets: e.target.checked }))
            }
            className="w-4 h-4 text-blue-600 rounded"
          />
          <label
            htmlFor="hasUniqueAssets"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            特有財産がある（婚前資産・相続財産など）
          </label>
        </div>

        {input.hasUniqueAssets && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ManYenInput
              label="夫の特有財産"
              value={input.husbandUniqueAssets}
              onChange={(v) => setInput((p) => ({ ...p, husbandUniqueAssets: v }))}
            />
            <ManYenInput
              label="妻の特有財産"
              value={input.wifeUniqueAssets}
              onChange={(v) => setInput((p) => ({ ...p, wifeUniqueAssets: v }))}
            />
          </div>
        )}
        <p className="text-xs text-gray-500 mt-2">
          ※ 特有財産は分与対象外となり、各自に返還されます
        </p>
      </section>

      {/* 計算ボタン */}
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 shadow-sm"
      >
        財産分与を計算する
      </button>
    </form>
  );
}
