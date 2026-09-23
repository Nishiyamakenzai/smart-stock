-- ────────────────────────────────────────────────────────
-- 案件状態の拡張（施工中・工事完了・最終確認・完了 を追加）
-- Supabase Dashboard > SQL Editor でこのファイルの内容を実行してください。
-- project_schema.sql を実行済みの環境に対する追加の変更です。
-- ────────────────────────────────────────────────────────

alter table pm_projects drop constraint if exists pm_projects_status_check;

alter table pm_projects add constraint pm_projects_status_check
  check (status in ('進行中', '成約', '施工中', '工事完了・最終確認', '完了', '保留', '失注', '取消'));
