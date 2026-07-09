import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { text, criterionLabel } = body;

  if (!text || typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "AI機能が設定されていません（Vercelに ANTHROPIC_API_KEY を設定してください）" },
      { status: 500 }
    );
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 500,
      system:
        "あなたは日本の塗装・建設会社の人事評価を手伝うアシスタントです。上司が書いた箇条書き・走り書きのメモを、正式な人事評価コメントとして自然で簡潔な日本語の文章に整えてください。" +
        "事実関係は維持しつつ、個人攻撃的・感情的な表現は避け、客観的で業務上の事実に基づいたプロフェッショナルな評価コメントにしてください。" +
        "1〜3文程度、評価シートにそのまま貼り付けられる形にしてください。整えた文章のみを出力し、前置き・説明・カギ括弧は不要です。",
      messages: [
        {
          role: "user",
          content: criterionLabel
            ? `評価項目「${criterionLabel}」についてのメモ:\n${text}`
            : text,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const result = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";
    if (!result) {
      return Response.json({ error: "AIからの応答を取得できませんでした" }, { status: 500 });
    }
    return Response.json({ text: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: `AI呼び出しに失敗しました: ${message}` }, { status: 500 });
  }
}
