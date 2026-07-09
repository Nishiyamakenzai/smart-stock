import { dbGet, dbSet, dbDelete } from "@/lib/supabase";
import type { NextRequest } from "next/server";

export interface QuickDraft {
  period_label: string;
  period_start: string;
  period_end: string;
  evaluator: string;
  answers: Record<string, number | null>;
  item_comments: Record<string, string>;
  free_text: string;
  updated_at: string;
}

const keyFor = (memberId: string) => `quick_draft_${memberId}`;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const draft = await dbGet<QuickDraft>(keyFor(memberId));
  return Response.json(draft);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const body = await request.json();
  const draft: QuickDraft = {
    period_label: typeof body.period_label === "string" ? body.period_label : "",
    period_start: typeof body.period_start === "string" ? body.period_start : "",
    period_end: typeof body.period_end === "string" ? body.period_end : "",
    evaluator: typeof body.evaluator === "string" ? body.evaluator : "",
    answers: body.answers && typeof body.answers === "object" ? body.answers : {},
    item_comments: body.item_comments && typeof body.item_comments === "object" ? body.item_comments : {},
    free_text: typeof body.free_text === "string" ? body.free_text : "",
    updated_at: new Date().toISOString(),
  };
  await dbSet(keyFor(memberId), draft);
  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  await dbDelete(keyFor(memberId));
  return Response.json({ ok: true });
}
