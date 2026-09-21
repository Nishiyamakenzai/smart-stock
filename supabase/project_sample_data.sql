-- ────────────────────────────────────────────────────────
-- サンプル案件「渡辺様邸」投入スクリプト
-- 先に project_schema.sql を実行してから、このファイルを実行してください。
--
-- 担当者名（内田・飛翔・裕優）は既存の members テーブルの name と一致するものを
-- 自動的に紐づけます。該当する名前が members に無い場合は担当者は空欄のまま
-- 登録されます（エラーにはなりません）。
-- ────────────────────────────────────────────────────────

do $$
declare
  v_project_id uuid;
  v_source_id uuid;
  v_uchida uuid;
  v_hisho uuid;
  v_hiroyu uuid;
begin
  select id into v_source_id from pm_sources where name = 'Google' limit 1;
  select id into v_uchida from members where name = '内田' limit 1;
  select id into v_hisho from members where name = '飛翔' limit 1;
  select id into v_hiroyu from members where name = '裕優' limit 1;

  insert into pm_projects (
    name, customer_name, occurred_at, source_id, address, building_age,
    customer_age_range, work_content, construction_period, status
  ) values (
    '渡辺様邸', '渡辺隆', '2026-09-17', v_source_id, '富士吉田市〇〇', '築18年',
    '55歳くらい', '外壁・屋根塗装・雨漏り', '契約後入力', '進行中'
  )
  returning id into v_project_id;

  -- 標準工程マスタから32工程を複製
  insert into pm_project_processes (project_id, template_id, name, category, sort_order)
  select v_project_id, id, name, category, sort_order
  from pm_process_templates
  where is_active = true
  order by sort_order;

  -- ── 完了済み工程（LINE運用での実績を反映） ──
  update pm_project_processes set status = '完了', actual_assignee_id = v_uchida,
    completed_at = '2026-09-17 09:15:00+09', note = '来店'
    where project_id = v_project_id and name = '初回対応';

  update pm_project_processes set status = '完了', actual_assignee_id = v_uchida,
    completed_at = '2026-09-17 10:32:00+09'
    where project_id = v_project_id and name = '案件登録';

  update pm_project_processes set status = '完了', actual_assignee_id = v_hisho,
    completed_at = '2026-09-18 09:12:00+09'
    where project_id = v_project_id and name = '現地調査';

  update pm_project_processes set status = '完了', actual_assignee_id = v_hiroyu,
    completed_at = '2026-09-18 15:45:00+09'
    where project_id = v_project_id and name = 'CAD';

  update pm_project_processes set status = '完了', actual_assignee_id = v_uchida,
    completed_at = '2026-09-19 11:20:00+09'
    where project_id = v_project_id and name = '診断報告書';

  update pm_project_processes set status = '完了', actual_assignee_id = v_hiroyu,
    completed_at = '2026-09-19 16:00:00+09'
    where project_id = v_project_id and name = '見積書';

  update pm_project_processes set status = '完了', actual_assignee_id = v_hisho,
    completed_at = '2026-09-20 10:00:00+09'
    where project_id = v_project_id and name = '見積・診断書確認';

  update pm_project_processes set status = '完了', actual_assignee_id = v_uchida,
    completed_at = '2026-09-20 10:30:00+09'
    where project_id = v_project_id and name = '保存・印刷';

  update pm_project_processes set status = '完了', actual_assignee_id = v_hisho,
    completed_at = '2026-09-20 14:00:00+09'
    where project_id = v_project_id and name = '商談日程調整';

  update pm_project_processes set status = '完了', actual_assignee_id = v_hisho,
    completed_at = '2026-09-21 13:00:00+09'
    where project_id = v_project_id and name = '商談';

  -- ── 不要工程 ──
  update pm_project_processes set status = '不要', actual_assignee_id = v_hisho,
    skip_reason = '即決のため不要', completed_at = '2026-09-21 13:05:00+09'
    where project_id = v_project_id and name = '返待ち連絡';

  -- ── 履歴ログ（タイムライン表示用） ──
  insert into pm_process_logs (project_id, process_id, action, process_name, from_status, to_status, detail, changed_by, created_at)
  select v_project_id, pp.id, 'status_changed', pp.name, '未完了', pp.status,
    case when pp.status = '不要' then pp.skip_reason else pp.note end,
    pp.actual_assignee_id, pp.completed_at
  from pm_project_processes pp
  where pp.project_id = v_project_id and pp.completed_at is not null
  order by pp.completed_at;

  insert into pm_process_logs (project_id, action, detail, changed_by, created_at)
  values (v_project_id, 'project_created', '案件登録', v_uchida, '2026-09-17 10:32:00+09');
end $$;
