-- ────────────────────────────────────────────────────────
-- 評価制度 追加カラム v4（v1〜v3 の後に実行してください）
-- 冪等（何度実行しても安全）
-- ────────────────────────────────────────────────────────

-- 下書き保存フラグ（trueの間は昇給・昇格判定や成長グラフの集計から除外される）
alter table evaluations add column if not exists is_draft boolean not null default false;

notify pgrst, 'reload schema';
