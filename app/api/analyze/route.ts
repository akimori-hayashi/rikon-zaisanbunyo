/**
 * Claude API呼び出しのサーバーサイドルート
 *
 * セキュリティ：APIキーはサーバーサイドのみで使用し、
 * フロントエンドには一切露出させない。
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AnalyzeRequest, AnalyzeResponse } from "@/lib/types";

/**
 * POST /api/analyze
 * 財産分与計算結果のAI解析を行う
 */
export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    // リクエストボディを解析
    const body: AnalyzeRequest = await request.json();
    const { input, result, analysisType } = body;

    // 入力検証
    if (!input || !result || !analysisType) {
      return NextResponse.json(
        { explanation: "", error: "必要なデータが不足しています。" },
        { status: 400 }
      );
    }

    // APIキーの確認（サーバーサイドでのみ使用）
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "your_key_here") {
      return NextResponse.json(
        {
          explanation: "",
          error:
            "APIキーが設定されていません。.env.localにANTHROPIC_API_KEYを設定してください。",
        },
        { status: 500 }
      );
    }

    // Anthropicクライアントの初期化
    const client = new Anthropic({ apiKey });

    // 婚姻期間の文字列生成
    const marriagePeriod =
      input.marriageYears > 0 || input.marriageMonths > 0
        ? `${input.marriageYears}年${input.marriageMonths}ヶ月`
        : "不明";

    // 共有資産の合計
    const totalAssets =
      input.assets.savings +
      input.assets.realEstate +
      input.assets.securities +
      input.assets.otherAssets;

    // 夫と妻の寄与度比率
    const ratioText = `夫${result.husbandRatio}% 妻${result.wifeRatio}%`;

    // 解析タイプに応じてモデルとプロンプトを選択
    let model: string;
    let systemPrompt: string;
    let userPrompt: string;
    let maxTokens: number;

    if (analysisType === "quick") {
      // 通常解説：Claude Haiku（簡潔な説明）
      model = "claude-haiku-4-5";
      maxTokens = 700;
      systemPrompt =
        "あなたは日本の離婚財産分与に詳しい法律アドバイザーです。計算結果を分かりやすく簡潔に説明してください。";
      userPrompt = `以下の離婚財産分与の計算結果を日本語で説明してください。

婚姻期間: ${marriagePeriod}
共有財産合計: ${totalAssets.toLocaleString("ja-JP")}円
分与対象額（正味）: ${result.netAssets.toLocaleString("ja-JP")}円
寄与度: ${ratioText}
負債控除: ${input.totalDebt.toLocaleString("ja-JP")}円

計算結果:
- 夫の取得額: ${result.husbandAmount.toLocaleString("ja-JP")}円
- 妻の取得額: ${result.wifeAmount.toLocaleString("ja-JP")}円

200文字程度で簡潔に計算根拠と結果を説明してください。`;
    } else {
      // 詳細解説：Claude Sonnet（詳しい解説）
      model = "claude-sonnet-4-5";
      maxTokens = 700;
      systemPrompt =
        "あなたは日本の離婚財産分与に詳しい法律アドバイザーです。法的な観点から詳しく解説し、注意点や推奨事項を含めてください。";
      userPrompt = `以下の離婚財産分与の計算結果について、詳細な解説をしてください。

婚姻期間: ${marriagePeriod}
資産内訳:
  - 預貯金: ${input.assets.savings.toLocaleString("ja-JP")}円
  - 不動産評価額: ${input.assets.realEstate.toLocaleString("ja-JP")}円
  - 有価証券: ${input.assets.securities.toLocaleString("ja-JP")}円
  - その他: ${input.assets.otherAssets.toLocaleString("ja-JP")}円
  - 合計: ${totalAssets.toLocaleString("ja-JP")}円
負債: ${input.totalDebt.toLocaleString("ja-JP")}円
特有財産: 夫${result.breakdown.deductedHusbandUnique.toLocaleString("ja-JP")}円 妻${result.breakdown.deductedWifeUnique.toLocaleString("ja-JP")}円
分与対象額（正味）: ${result.netAssets.toLocaleString("ja-JP")}円
収入寄与度: 夫${result.breakdown.incomeContributionRatio}% 妻${100 - result.breakdown.incomeContributionRatio}%
家事貢献度: 夫${result.breakdown.houseworkContributionRatio}% 妻${100 - result.breakdown.houseworkContributionRatio}%
最終寄与度: ${ratioText}

計算結果:
- 夫の取得額: ${result.husbandAmount.toLocaleString("ja-JP")}円
- 妻の取得額: ${result.wifeAmount.toLocaleString("ja-JP")}円

以下の点を400文字以内で説明してください：
1. 計算根拠と各配偶者の取得額の妥当性
2. 法的な観点からの注意点
3. 実際の調停・審判での考慮事項`;
    }

    // Claude APIを呼び出す
    const message = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // レスポンスからテキストを抽出
    const explanation =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Claude API error:", error);

    // エラーの種類に応じたメッセージを返す
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { explanation: "", error: "APIキーが無効です。設定を確認してください。" },
          { status: 401 }
        );
      }
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          {
            explanation: "",
            error: "APIの利用制限に達しました。しばらく後にお試しください。",
          },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      {
        explanation: "",
        error: "AI解析中にエラーが発生しました。しばらく後にお試しください。",
      },
      { status: 500 }
    );
  }
}
