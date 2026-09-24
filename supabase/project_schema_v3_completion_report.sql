-- ────────────────────────────────────────────────────────
-- 「完工金請求書」と「入金確認・着手金」の間に「完了報告書」を追加
-- Supabase Dashboard > SQL Editor でこのファイルの内容を実行してください。
-- project_schema.sql（および project_schema_v2_status.sql）を実行済みの環境に対する追加の変更です。
--
-- 何度実行しても同じ正しい結果になるように、相対的な「+1」ではなく
-- 名前を指定した絶対的な並び順の設定にしている（誤って複数回実行しても壊れない）。
-- ────────────────────────────────────────────────────────

-- 1. 工程マスタ：完工金請求書（26）より後ろの並び順を正しい値に設定し直す
update pm_process_templates set sort_order = 28 where name = '入金確認・着手金';
update pm_process_templates set sort_order = 29 where name = '入金確認・完工金';
update pm_process_templates set sort_order = 30 where name = '領収書';
update pm_process_templates set sort_order = 31 where name = 'ファイル渡し';
update pm_process_templates set sort_order = 32 where name = '口コミ訴求';
update pm_process_templates set sort_order = 33 where name = '訪販ステッカー';
update pm_process_templates set sort_order = 34 where name = '完了';

-- 2. 工程マスタ：27番目に「完了報告書」を追加（既にあれば並び順だけ正しく直す）
insert into pm_process_templates (name, category, sort_order, is_required, is_active)
values ('完了報告書', '完工・アフター', 27, true, true)
on conflict (name) do update set sort_order = excluded.sort_order, category = excluded.category;

-- 3. 進行中の案件の工程：同様に正しい並び順に設定し直す（全案件が対象）
update pm_project_processes set sort_order = 28 where name = '入金確認・着手金';
update pm_project_processes set sort_order = 29 where name = '入金確認・完工金';
update pm_project_processes set sort_order = 30 where name = '領収書';
update pm_project_processes set sort_order = 31 where name = 'ファイル渡し';
update pm_project_processes set sort_order = 32 where name = '口コミ訴求';
update pm_project_processes set sort_order = 33 where name = '訪販ステッカー';
update pm_project_processes set sort_order = 34 where name = '完了';

-- 4. 進行中の案件（最終工程「完了」がまだ完了していない案件）に「完了報告書」を追加
--    すでに完了フォルダ入りしている案件には追加しない。すでに追加済みの案件はスキップされる。
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
