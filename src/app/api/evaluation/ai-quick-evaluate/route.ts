import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { withColumnFallback } from "@/lib/db-fallback";
import { CRITERIA, computeTotal, getCriteriaForJobType } from "@/lib/evaluation-constants";
import { resolveGrade } from "@/lib/evaluation-data";
import { getAllQuickItemsForJobType } from "@/lib/quick-items";
import { DEFAULT_JOB_TYPE, JOB_TYPE_LABELS, isJobType } from "@/lib/job-types";
import type { EvaluationProfile, ScoredCriterionKey } from "@/lib/evaluation-types";
import type { Member } from "@/lib/task-types";

const SCORE_KEYS: ScoredCriterionKey[] = CRITERIA.map((c) => c.key);

function experienceLabel(joinDate: string | null | undefined): string {
  if (!joinDate) return "不明";
  const start = new Date(joinDate);
  if (Number.isNaN(start.getTime())) return "不明";
  const years = (Date.now() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (years < 1) return `${Math.max(0, Math.round(years * 12))}ヶ月`;
  return `${years.toFixed(1)}年`;
}

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(slice);
}

function clampInt(v: unknown, min: number, max: number, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { member_id, period_label, period_start, period_end, evaluator, answers, category_comments, free_text } = body;

  if (!member_id || !period_label || !period_start || !period_end) {
    return Response.json({ error: "member_id, period_label, period_start, period_end are required" }, { status: 400 });
  }
  if (!answers || typeof answers !== "object") {
    return Response.json({ error: "answers is required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "AI機能が設定されていません（Vercelに ANTHROPIC_API_KEY を設定してください）" },
      { status: 500 }
    );
  }

  const sb = getSupabase();
  const [memberRes, profileRes] = await Promise.all([
    sb.from("members").select("*").eq("id", member_id).single(),
    sb.from("evaluation_profiles").select("*").eq("member_id", member_id).maybeSingle(),
  ]);
  if (memberRes.error || !memberRes.data) {
    return Response.json({ error: memberRes.error?.message ?? "member not found" }, { status: 404 });
  }
  const member = memberRes.data as Member;
  const profile = (profileRes.data as EvaluationProfile | null) ?? null;
  const jobType = isJobType(profile?.job_type) ? profile!.job_type : DEFAULT_JOB_TYPE;
  const grade = resolveGrade(profile);
  const displayName = profile?.full_name || member.name;
  const jobContent = profile?.job_content_override || grade?.jobContent || "";

  const items = getAllQuickItemsForJobType(jobType);
  const criteria = getCriteriaForJobType(jobType);
  const labelOf = (cat: string) => (cat === "score_attitude" ? "姿勢のルール（できて当たり前・減点方式）" : criteria.find((c) => c.key === cat)?.label ?? cat);

  const byCategory = new Map<string, string[]>();
  for (const item of items) {
    const v = (answers as Record<string, unknown>)[item.id];
    if (v === null || v === undefined || v === "") continue; // わからない/該当なし はスキップ
    const list = byCategory.get(item.category) ?? [];
    list.push(`- ${item.label} → 回答値: ${v}`);
    byCategory.set(item.category, list);
  }
  const categoryCommentsObj = (category_comments && typeof category_comments === "object" ? category_comments : {}) as Record<string, unknown>;
  const allCategories = new Set<string>([...byCategory.keys(), ...Object.keys(categoryCommentsObj)]);

  const qaText = Array.from(allCategories)
    .map((cat) => {
      const lines = byCategory.get(cat) ?? [];
      const memo = categoryCommentsObj[cat];
      const memoLine = typeof memo === "string" && memo.trim() ? `【評価者のメモ】${memo.trim()}` : "";
      return [`【${labelOf(cat)}】`, ...lines, memoLine].filter(Boolean).join("\n");
    })
    .join("\n\n");

  const system =
    "あなたは日本の塗装・建設会社（COATEX）の人事評価を手伝うアシスタントです。識学式のマネジメントを採用しており、指示命令系統や規律を重視する社風です。" +
    "上司が答えた約50の簡単な質問への回答（能力・態度グループは0〜3の4段階＝0:できていない 1:あまりできていない 2:だいたいできている 3:いつもできている、姿勢のルールは0〜-2の3段階＝0:問題なし -1:たまに気になる -2:よく問題がある）をもとに、" +
    "以下の9項目のスコアと、各項目についての1〜2文の簡潔なコメント、そして全体の総評コメントを作成してください。\n" +
    "・score_quality, score_speed, score_knowledge, score_discipline, score_cooperation, score_responsibility, score_initiative, score_trust は -2〜2 の整数（2:極めて優秀 1:優秀 0:普通 -1:やや不十分 -2:かなり不十分）\n" +
    "・score_attitude は -2〜0 の整数（減点のみ、加点なし）\n" +
    "・各カテゴリの複数の質問への回答を総合的に判断してスコアを決めてください（単純平均ではなく、重大な問題があれば重く見るなど、人事評価者としての総合判断をしてください）。\n" +
    "・従業員の等級・経験年数・役職・業務内容に応じて期待水準を調整してください（新人に対してベテランと同じ完成度を求めすぎない一方、経験や等級が上がるほど求める水準も上げる、といった形で、立場に応じた公平な評価にしてください）。\n" +
    "・各カテゴリに評価者が書いた「評価者のメモ」がある場合は、選択式の回答と同じかそれ以上に重要な材料として扱い、そのカテゴリのスコアとコメントに反映してください。\n" +
    "・全体の総評コメント（note）は、9項目それぞれの内容の要約ではなく、すべてのカテゴリの評価者メモや補足メモを俯瞰したうえで、特に伝えるべき良い点・課題点をまとめた文章にしてください。\n" +
    "・コメントは客観的で業務上の事実に基づいたプロフェッショナルな文章にし、個人攻撃的・感情的な表現は避けてください。\n" +
    "・出力は次のJSON形式のみとし、説明文やマークダウンのコードブロックは付けないでください:\n" +
    '{"score_quality":0,"score_speed":0,"score_knowledge":0,"score_discipline":0,"score_cooperation":0,"score_responsibility":0,"score_initiative":0,"score_trust":0,"score_attitude":0,' +
    '"criteria_notes":{"score_quality":"","score_speed":"","score_knowledge":"","score_discipline":"","score_cooperation":"","score_responsibility":"","score_initiative":"","score_trust":"","score_attitude":""},' +
    '"note":""}';

  const userMessage =
    `【対象者】${displayName}（${member.role}）\n` +
    `【職種】${JOB_TYPE_LABELS[jobType]}\n` +
    `【等級】${grade ? `等級${grade.grade}・${grade.name}` : "未設定"}\n` +
    `【経験年数】${experienceLabel(profile?.join_date)}\n` +
    `【仕事内容】${jobContent || "（未設定）"}\n` +
    `【評価期間】${period_label}\n\n` +
    `${qaText || "（回答された質問がありません）"}\n\n` +
    (free_text && String(free_text).trim() ? `【評価者からの補足メモ】\n${String(free_text).trim()}\n` : "");

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const raw = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";
    if (!raw) {
      return Response.json({ error: "AIからの応答を取得できませんでした" }, { status: 500 });
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = extractJson(raw) as Record<string, unknown>;
    } catch {
      return Response.json({ error: "AIの応答を解析できませんでした。もう一度お試しください。" }, { status: 500 });
    }

    const scores: Record<ScoredCriterionKey, number> = {} as Record<ScoredCriterionKey, number>;
    for (const key of SCORE_KEYS) scores[key] = clampInt(parsed[key], -2, 2);
    const attitude = clampInt(parsed.score_attitude, -2, 0);
    const total_score = computeTotal(scores, attitude);

    const notesRaw = (parsed.criteria_notes && typeof parsed.criteria_notes === "object" ? parsed.criteria_notes : {}) as Record<string, unknown>;
    const criteria_notes: Record<string, string> = {};
    for (const key of [...SCORE_KEYS, "score_attitude"]) {
      const v = notesRaw[key];
      if (typeof v === "string" && v.trim()) criteria_notes[key] = v.trim();
    }
    const note = typeof parsed.note === "string" ? parsed.note.trim() : "";

    const fullPayload = {
      member_id,
      period_label,
      period_start,
      period_end,
      grade_at_evaluation: grade ? grade.grade : 0,
      ...scores,
      score_attitude: attitude,
      total_score,
      note: note || null,
      evaluator: evaluator || null,
      criteria_notes,
      is_draft: true,
    };

    const { data, error, droppedKeys } = await withColumnFallback(
      ["criteria_notes", "is_draft"],
      fullPayload,
      async (payload) => {
        const r = await sb.from("evaluations").insert(payload).select().single();
        return { data: r.data, error: r.error };
      }
    );

    if (error) return Response.json({ error: error.message }, { status: 500 });
    const result = data as { id: string } | null;
    if (!result) return Response.json({ error: "評価の作成に失敗しました" }, { status: 500 });

    return Response.json({
      id: result.id,
      warning: droppedKeys.length > 0
        ? `${droppedKeys.join(", ")} はデータベースに未追加のため保存されませんでした。supabase/evaluation_schema_v3.sql・v4.sql を実行してください。`
        : undefined,
    }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return Response.json({ error: `AI呼び出しに失敗しました: ${message}` }, { status: 500 });
  }
}
