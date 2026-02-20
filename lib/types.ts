/**
 * 離婚財産分与計算ツール - 型定義
 */

/** 資産の内訳 */
export interface AssetBreakdown {
  /** 預貯金（円） */
  savings: number;
  /** 不動産評価額（円） */
  realEstate: number;
  /** 有価証券（円） */
  securities: number;
  /** その他資産（円） */
  otherAssets: number;
}

/** 計算機への入力フォームデータ */
export interface CalculatorInput {
  /** 婚姻期間（年） */
  marriageYears: number;
  /** 婚姻期間（月） */
  marriageMonths: number;
  /** 資産の内訳 */
  assets: AssetBreakdown;
  /** 夫の収入（万円/年） */
  husbandIncome: number;
  /** 妻の収入（万円/年） */
  wifeIncome: number;
  /** 夫の家事・育児貢献度（0〜100） */
  husbandHouseworkContribution: number;
  /** 妻の家事・育児貢献度（0〜100） */
  wifeHouseworkContribution: number;
  /** 負債総額（円）：住宅ローン、借入金など */
  totalDebt: number;
  /** 特有財産の有無 */
  hasUniqueAssets: boolean;
  /** 夫の特有財産（円）：婚前資産、相続財産など */
  husbandUniqueAssets: number;
  /** 妻の特有財産（円） */
  wifeUniqueAssets: number;
}

/** 計算結果 */
export interface CalculationResult {
  /** 共有財産の総額（円） */
  totalSharedAssets: number;
  /** 控除後の正味財産（円） */
  netAssets: number;
  /** 夫の取得割合（%） */
  husbandRatio: number;
  /** 妻の取得割合（%） */
  wifeRatio: number;
  /** 夫の取得額（円） */
  husbandAmount: number;
  /** 妻の取得額（円） */
  wifeAmount: number;
  /** 計算の内訳詳細 */
  breakdown: {
    /** 資産の合計 */
    grossAssets: number;
    /** 控除した負債 */
    deductedDebt: number;
    /** 控除した夫の特有財産 */
    deductedHusbandUnique: number;
    /** 控除した妻の特有財産 */
    deductedWifeUnique: number;
    /** 収入による寄与度調整値 */
    incomeContributionRatio: number;
    /** 家事・育児による寄与度調整値 */
    houseworkContributionRatio: number;
    /** 最終的な寄与度 */
    finalContributionRatio: number;
  };
}

/** AI解析APIへのリクエスト */
export interface AnalyzeRequest {
  /** 計算への入力データ */
  input: CalculatorInput;
  /** 計算結果 */
  result: CalculationResult;
  /** 解析の種類：'quick'=Haiku, 'detailed'=Sonnet */
  analysisType: "quick" | "detailed";
}

/** AI解析APIからのレスポンス */
export interface AnalyzeResponse {
  /** AI生成の解説テキスト */
  explanation: string;
  /** エラーメッセージ（エラー時のみ） */
  error?: string;
}

/** URLパラメータから復元するデータ */
export interface ShareParams {
  savings?: string;
  realEstate?: string;
  securities?: string;
  otherAssets?: string;
  marriageYears?: string;
  marriageMonths?: string;
  husbandIncome?: string;
  wifeIncome?: string;
  husbandHousework?: string;
  wifeHousework?: string;
  debt?: string;
  hasUnique?: string;
  husbandUnique?: string;
  wifeUnique?: string;
}
