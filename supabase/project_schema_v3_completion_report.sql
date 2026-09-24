-- ────────────────────────────────────────────────────────
-- 「完工金請求書」と「入金確認・着手金」の間に「完了報告書」を追加
-- Supabase Dashboard > SQL Editor でこのファイルの内容を実行してください。
-- project_schema.sql（および project_schema_v2_status.sql）を実行済みの環境に対する追加の変更です。
-- ────────────────────────────────────────────────────────

-- 1. 工程マスタ：入金確認・着手金（27）以降の順番を1つずつ後ろにずらす
update pm_process_templates set sort_order = sort_order + 1 where sort_order >= 27;

-- 2. 工程マスタ：空いた27番目に「完了報告書」を追加
insert into pm_process_templates (name, category, sort_order, is_required, is_active)
values ('完了報告書', '完工・アフター', 27, true, true)
on conflict (name) do nothing;

-- 3. 進行中の案件の工程：同様に27番目以降を1つずつ後ろにずらす
update pm_project_processes set sort_order = sort_order + 1 where sort_order >= 27;

-- 4. 進行中の案件（最終工程「完了」がまだ完了していない案件）に「完了報告書」を追加
--    すでに完了フォルダ入りしている案件には追加しない
insert into pm_project_processes (project_id, template_id, name, category, sort_order, status)
select p.id, t.id, t.name, t.category, t.sort_order, '未完了'
from pm_projects p
cross join (
  select id, name, category, sort_order from pm_process_templates where name = '完了報告書'
) t
where not exists (
  select 1 from pm_project_processes pp
  where pp.project_id = p.id and pp.name = '完了報告書'
)
and not exists (
  select 1 from pm_project_processes pp2
  where pp2.project_id = p.id and pp2.name = '完了' and pp2.status = '完了'
);
