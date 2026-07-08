-- ────────────────────────────────────────────────────────
-- 評価制度 追加カラム v3（v1, v2 の後に実行してください）
-- 冪等（何度実行しても安全）
-- ────────────────────────────────────────────────────────

-- 職種（craftsman=職人 / site_management=施工管理 / office=事務）
alter table evaluation_profiles add column if not exists job_type text not null default 'craftsman';

-- 仕事内容・責任範囲の個別上書き（未設定なら等級マスタの説明を使用）
alter table evaluation_profiles add column if not exists job_content_override text;

-- 評価項目ごとのコメント（理由など）。キーは score_quality 等のカラム名と同じ
alter table evaluations add column if not exists criteria_notes jsonb not null default '{}'::jsonb;

notify pgrst, 'reload schema';
