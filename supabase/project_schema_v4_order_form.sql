-- ────────────────────────────────────────────────────────
-- 「材料発注」の下に「発注書作成」を追加
-- Supabase Dashboard > SQL Editor でこのファイルの内容を実行してください。
-- project_schema.sql（および v2_status, v3_completion_report）を実行済みの環境に対する追加の変更です。
--
-- project_schema_v3_completion_report.sql と同じく、相対的な「+1」ではなく
-- 名前を指定した絶対的な並び順の設定にしている（誤って複数回実行しても壊れない）。
-- あわせて、以前のマイグレーションが未実行だった場合に起きていた
-- 「完了報告書」と「入金確認・着手金」の並び順重複（27番が欠番）も、
-- このSQLを実行すれば自動的に正しい状態に揃う。
-- ────────────────────────────────────────────────────────

-- 1. 工程マスタ：材料発注（19）より後ろの並び順を正しい値に設定し直す
update pm_process_templates set sort_order = 21 where name = '挨拶資料準備';
update pm_process_templates set sort_order = 22 where name = '近隣挨拶';
update pm_process_templates set sort_order = 23 where name = '完了検査';
update pm_process_templates set sort_order = 24 where name = '完工・近隣挨拶';
update pm_process_templates set sort_order = 25 where name = '完工処理';
update pm_process_templates set sort_order = 26 where name = 'HOME SHIELD申請';
update pm_process_templates set sort_order = 27 where name = '完工金請求書';
update pm_process_templates set sort_order = 28 where name = '完了報告書';
update pm_process_templates set sort_order = 29 where name = '入金確認・着手金';
update pm_process_templates set sort_order = 30 where name = '入金確認・完工金';
update pm_process_templates set sort_order = 31 where name = '領収書';
update pm_process_templates set sort_order = 32 where name = 'ファイル渡し';
update pm_process_templates set sort_order = 33 where name = '口コミ訴求';
update pm_process_templates set sort_order = 34 where name = '訪販ステッカー';
update pm_process_templates set sort_order = 35 where name = '完了';

-- 2. 工程マスタ：20番目に「発注書作成」を追加（既にあれば並び順だけ正しく直す）
insert into pm_process_templates (name, category, sort_order, is_required, is_active)
values ('発注書作成', '着工準備', 20, true, true)
on conflict (name) do update set sort_order = excluded.sort_order, category = excluded.category;

-- 3. 進行中の案件の工程：同様に正しい並び順に設定し直す（全案件が対象）
update pm_project_processes set sort_order = 21 where name = '挨拶資料準備';
update pm_project_processes set sort_order = 22 where name = '近隣挨拶';
update pm_project_processes set sort_order = 23 where name = '完了検査';
update pm_project_processes set sort_order = 24 where name = '完工・近隣挨拶';
update pm_project_processes set sort_order = 25 where name = '完工処理';
update pm_project_processes set sort_order = 26 where name = 'HOME SHIELD申請';
update pm_project_processes set sort_order = 27 where name = '完工金請求書';
update pm_project_processes set sort_order = 28 where name = '完了報告書';
update pm_project_processes set sort_order = 29 where name = '入金確認・着手金';
update pm_project_processes set sort_order = 30 where name = '入金確認・完工金';
update pm_project_processes set sort_order = 31 where name = '領収書';
update pm_project_processes set sort_order = 32 where name = 'ファイル渡し';
update pm_project_processes set sort_order = 33 where name = '口コミ訴求';
update pm_project_processes set sort_order = 34 where name = '訪販ステッカー';
update pm_project_processes set sort_order = 35 where name = '完了';

-- 4. 進行中の案件（最終工程「完了」がまだ完了していない案件）に「発注書作成」を追加
--    すでに完了フォルダ入りしている案件には追加しない。すでに追加済みの案件はスキップされる。
insert into pm_project_processes (project_id, template_id, name, category, sort_order, status)
select p.id, t.id, t.name, t.category, t.sort_order, '未完了'
from pm_projects p
cross join (
  select id, name, category, sort_order from pm_process_templates where name = '発注書作成'
) t
where not exists (
  select 1 from pm_project_processes pp
  where pp.project_id = p.id and pp.name = '発注書作成'
)
and not exists (
  select 1 from pm_project_processes pp2
  where pp2.project_id = p.id and pp2.name = '完了' and pp2.status = '完了'
);
