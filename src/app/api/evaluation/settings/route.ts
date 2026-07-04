import { dbGet, dbSet } from "@/lib/supabase";
import type { NextRequest } from "next/server";
import type { EvaluationSettings } from "@/lib/evaluation-types";
import { DEFAULT_EVALUATION_SETTINGS } from "@/lib/evaluation-constants";

const KEY = "evaluation_settings";

export async function GET() {
  const settings = await dbGet<EvaluationSettings>(KEY);
  return Response.json(settings ?? DEFAULT_EVALUATION_SETTINGS);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const perPeriodMin = Number(body.perPeriodMin);
  const halfYearMin = Number(body.halfYearMin);
  if (!Number.isFinite(perPeriodMin) || !Number.isFinite(halfYearMin)) {
    return Response.json({ error: "perPeriodMin, halfYearMin must be numbers" }, { status: 400 });
  }
  const settings: EvaluationSettings = { perPeriodMin, halfYearMin };
  await dbSet(KEY, settings);
  return Response.json(settings);
}
