/**
 * 離婚財産分与計算ロジック
 *
 * 日本の家事審判実務に基づく計算方法：
 * - 基本原則：婚姻期間中に形成した共有財産を原則50:50で分与
 * - 寄与度による調整：通常40:60〜60:40の範囲内
 * - 特有財産（婚前取得・相続財産）は分与対象外
 * - 負債は共有財産から控除
 */

import type { CalculatorInput, CalculationResult } from "./types";

/**
 * 寄与度を計算する
 *
 * 収入比率と家事・育児貢献度を重み付きで組み合わせて算出。
 * 収入差が大きくても通常40:60〜60:40の範囲に収まるよう調整する。
 *
 * @param husbandIncome - 夫の年収（万円）
 * @param wifeIncome - 妻の年収（万円）
 * @param husbandHousework - 夫の家事・育児貢献度（0〜100）
 * @param wifeHousework - 妻の家事・育児貢献度（0〜100）
 * @returns 夫の最終寄与度割合（0〜100）
 */
function calculateContributionRatio(
  husbandIncome: number,
  wifeIncome: number,
  husbandHousework: number,
  wifeHousework: number
): {
  incomeRatio: number;
  houseworkRatio: number;
  finalRatio: number;
} {
  const totalIncome = husbandIncome + wifeIncome;
  const totalHousework = husbandHousework + wifeHousework;

  // 収入比率の計算（収入がない場合は50:50とする）
  const incomeRatio =
    totalIncome > 0 ? (husbandIncome / totalIncome) * 100 : 50;

  // 家事・育児比率の計算（貢献度が設定されていない場合は50:50とする）
  const houseworkRatio =
    totalHousework > 0 ? (husbandHousework / totalHousework) * 100 : 50;

  // 収入比率と家事・育児比率を重み付きで合算（収入60%、家事40%の重み）
  const weightedRatio = incomeRatio * 0.6 + houseworkRatio * 0.4;

  // 日本の家事審判実務では通常40:60〜60:40の範囲に制限
  const MIN_RATIO = 40;
  const MAX_RATIO = 60;

  // 50からの偏差を縮小（例：偏差10→有効偏差5程度）
  // これにより収入差が大きくても穏やかな調整になる
  const deviation = weightedRatio - 50;
  const adjustedDeviation = deviation * 0.5;
  const finalRatio = Math.max(
    MIN_RATIO,
    Math.min(MAX_RATIO, 50 + adjustedDeviation)
  );

  return {
    incomeRatio: Math.round(incomeRatio * 10) / 10,
    houseworkRatio: Math.round(houseworkRatio * 10) / 10,
    finalRatio: Math.round(finalRatio * 10) / 10,
  };
}

/**
 * 財産分与額を計算するメイン関数
 *
 * @param input - 計算フォームの入力データ
 * @returns 計算結果（各配偶者の取得額と内訳）
 */
export function calculateDivision(input: CalculatorInput): CalculationResult {
  const {
    assets,
    husbandIncome,
    wifeIncome,
    husbandHouseworkContribution,
    wifeHouseworkContribution,
    totalDebt,
    hasUniqueAssets,
    husbandUniqueAssets,
    wifeUniqueAssets,
  } = input;

  // 資産の合計を計算
  const grossAssets =
    assets.savings +
    assets.realEstate +
    assets.securities +
    assets.otherAssets;

  // 特有財産の控除額（特有財産フラグがONの場合のみ）
  const deductedHusbandUnique = hasUniqueAssets ? husbandUniqueAssets : 0;
  const deductedWifeUnique = hasUniqueAssets ? wifeUniqueAssets : 0;
  const totalUniqueAssets = deductedHusbandUnique + deductedWifeUnique;

  // 負債の控除（総資産を超える場合は0とする）
  const deductedDebt = Math.min(totalDebt, grossAssets);

  // 分与対象となる共有財産の正味額
  // 総資産 - 特有財産 - 負債 = 分与対象額
  const netAssets = Math.max(
    0,
    grossAssets - totalUniqueAssets - deductedDebt
  );

  // 共有財産の総額（特有財産を除いた分与対象額）
  const totalSharedAssets = Math.max(0, grossAssets - totalUniqueAssets);

  // 寄与度の計算
  const { incomeRatio, houseworkRatio, finalRatio } = calculateContributionRatio(
    husbandIncome,
    wifeIncome,
    husbandHouseworkContribution,
    wifeHouseworkContribution
  );

  // 夫と妻の取得割合
  const husbandRatio = finalRatio;
  const wifeRatio = Math.round((100 - finalRatio) * 10) / 10;

  // 各配偶者の取得額を計算
  // 特有財産は各自に返還されるため、共有財産の分与分のみ計算
  const husbandSharedAmount = Math.round((netAssets * husbandRatio) / 100);
  const wifeSharedAmount = Math.round((netAssets * wifeRatio) / 100);

  // 最終的な取得額（共有財産分与 + 各自の特有財産）
  const husbandAmount = husbandSharedAmount + deductedHusbandUnique;
  const wifeAmount = wifeSharedAmount + deductedWifeUnique;

  return {
    totalSharedAssets,
    netAssets,
    husbandRatio,
    wifeRatio,
    husbandAmount,
    wifeAmount,
    breakdown: {
      grossAssets,
      deductedDebt,
      deductedHusbandUnique,
      deductedWifeUnique,
      incomeContributionRatio: incomeRatio,
      houseworkContributionRatio: houseworkRatio,
      finalContributionRatio: finalRatio,
    },
  };
}

/**
 * 数値を日本円表示にフォーマット
 * @param amount - 金額（円）
 * @returns フォーマットされた文字列（例：1,234,567円）
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * 婚姻期間を文字列にフォーマット
 * @param years - 年数
 * @param months - 月数
 * @returns フォーマットされた文字列（例：10年6ヶ月）
 */
export function formatMarriagePeriod(years: number, months: number): string {
  if (years === 0 && months === 0) return "0ヶ月";
  const yearStr = years > 0 ? `${years}年` : "";
  const monthStr = months > 0 ? `${months}ヶ月` : "";
  return yearStr + monthStr;
}
