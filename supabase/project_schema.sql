-- ────────────────────────────────────────────────────────
-- 案件進捗管理システム 用テーブル
-- Supabase Dashboard > SQL Editor でこのファイルの内容を実行してください。
--
-- COATEX（経営ダッシュボード）・TASUKI（タスク管理）とはテーブル・ログイン・画面すべてを
-- 分離した完全に独立したシステムです。共通で使うのは、社員名簿である
-- 既存の members テーブルのみです（他システムと同じ「人」を指すため）。
-- ────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ────────────────────────────────────────────────────────
-- マスタ：発生源（後から管理画面で追加・編集可能）
-- ────────────────────────────────────────────────────────
create table if not exists pm_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order integer not null default 99,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────
-- マスタ：失注理由（後から管理画面で追加・編集可能）
-- ────────────────────────────────────────────────────────
create table if not exists pm_lost_reasons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order integer not null default 99,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────
-- マスタ：標準工程（コードを書き換えずに管理画面で追加・編集・並べ替え・削除可能）
-- ────────────────────────────────────────────────────────
create table if not exists pm_process_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,          -- 例: 営業・契約 / 着工準備 / 完工・アフター
  sort_order integer not null default 99,
  is_required boolean not null default true, -- 将来の任意工程拡張用（現状は新規案件へ既定で追加するかどうか）
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_pm_process_templates_updated_at on pm_process_templates;
create trigger trg_pm_process_templates_updated_at
  before update on pm_process_templates
  for each row execute function set_updated_at();

-- ────────────────────────────────────────────────────────
-- 案件
-- ────────────────────────────────────────────────────────
create table if not exists pm_projects (
  id uuid primary key default gen_random_uuid(),
  project_no bigserial unique,
  name text not null,                       -- 案件名（例: 渡辺様邸）
  customer_name text,
  occurred_at date,                         -- 発生日
  source_id uuid references pm_sources(id) on delete set null,
  address text,
  building_age text,                        -- 築年数
  customer_age_range text,                  -- お客様年齢・年代
  work_content text,                        -- 工事内容
  construction_period text,                 -- 工期
  status text not null default '進行中'
    check (status in ('進行中', '成約', '施工中', '工事完了・最終確認', '完了', '保留', '失注', '取消')),
  won_at date,
  contract_amount bigint,
  lost_at date,
  lost_reason_id uuid references pm_lost_reasons(id) on delete set null,
  lost_reason_detail text,
  created_by uuid references members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pm_projects_status on pm_projects(status);
create index if not exists idx_pm_projects_created_at on pm_projects(created_at desc);

drop trigger if exists trg_pm_projects_updated_at on pm_projects;
create trigger trg_pm_projects_updated_at
  before update on pm_projects
  for each row execute function set_updated_at();

-- ────────────────────────────────────────────────────────
-- 案件ごとの工程（案件作成時に標準工程マスタから複製して生成）
-- ────────────────────────────────────────────────────────
create table if not exists pm_project_processes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  template_id uuid references pm_process_templates(id) on delete set null,
  name text not null,
  category text not null,
  sort_order integer not null default 99,
  status text not null default '未完了'
    check (status in ('未完了', '進行中', '完了', '不要', '保留', '問題あり')),
  planned_assignee_id uuid references members(id),  -- 予定担当者
  actual_assignee_id uuid references members(id),   -- 実施担当者（完了操作をした本人が自動記録）
  due_date date,
  completed_at timestamptz,
  note text,           -- 補足
  skip_reason text,    -- 不要理由
  problem_note text,   -- 問題ありの内容
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pm_processes_project on pm_project_processes(project_id, sort_order);
create index if not exists idx_pm_processes_status on pm_project_processes(status);
create index if not exists idx_pm_processes_assignee on pm_project_processes(actual_assignee_id);

drop trigger if exists trg_pm_project_processes_updated_at on pm_project_processes;
create trigger trg_pm_project_processes_updated_at
  before update on pm_project_processes
  for each row execute function set_updated_at();

-- ────────────────────────────────────────────────────────
-- 履歴（誰がいつ何をしたか。工程が消えても記録は残す）
-- ────────────────────────────────────────────────────────
create table if not exists pm_process_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  process_id uuid references pm_project_processes(id) on delete set null,
  action text not null,       -- project_created / status_changed / edited / commented
  process_name text,          -- 工程名のスナップショット
  from_status text,
  to_status text,
  detail text,
  changed_by uuid references members(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_pm_logs_project on pm_process_logs(project_id, created_at desc);

-- ────────────────────────────────────────────────────────
-- マスタ初期データ（発生源）
-- ────────────────────────────────────────────────────────
insert into pm_sources (name, display_order) values
  ('HP', 1), ('Google', 2), ('紹介', 3), ('OB', 4),
  ('チラシ', 5), ('看板', 6), ('通りがかり', 7), ('その他', 8),
  ('ポータル', 9), ('セミナー', 10), ('イベント', 11)
on conflict (name) do nothing;

-- ────────────────────────────────────────────────────────
-- マスタ初期データ（失注理由）
-- ────────────────────────────────────────────────────────
insert into pm_lost_reasons (name, display_order) values
  ('予算が合わない', 1), ('他社に決定', 2), ('タイミングが合わない', 3),
  ('検討中止', 4), ('音信不通', 5), ('その他', 6)
on conflict (name) do nothing;

-- ────────────────────────────────────────────────────────
-- マスタ初期データ（標準工程 32工程）
-- ────────────────────────────────────────────────────────
insert into pm_process_templates (name, category, sort_order) values
  ('初回対応', '営業・契約', 1),
  ('案件登録', '営業・契約', 2),
  ('現地調査', '営業・契約', 3),
  ('CAD', '営業・契約', 4),
  ('診断報告書', '営業・契約', 5),
  ('見積書', '営業・契約', 6),
  ('見積・診断書確認', '営業・契約', 7),
  ('保存・印刷', '営業・契約', 8),
  ('商談日程調整', '営業・契約', 9),
  ('商談', '営業・契約', 10),
  ('返待ち連絡', '営業・契約', 11),
  ('契約', '営業・契約', 12),
  ('契約処理', '着工準備', 13),
  ('着手金請求書', '着工準備', 14),
  ('いえサプリ', '着工準備', 15),
  ('足場手配', '着工準備', 16),
  ('協力業者手配', '着工準備', 17),
  ('色決め・打合せ', '着工準備', 18),
  ('材料発注', '着工準備', 19),
  ('挨拶資料準備', '着工準備', 20),
  ('近隣挨拶', '着工準備', 21),
  ('完了検査', '完工・アフター', 22),
  ('完工・近隣挨拶', '完工・アフター', 23),
  ('完工処理', '完工・アフター', 24),
  ('HOME SHIELD申請', '完工・アフター', 25),
  ('完工金請求書', '完工・アフター', 26),
  ('完了報告書', '完工・アフター', 27),
  ('入金確認・着手金', '完工・アフター', 28),
  ('入金確認・完工金', '完工・アフター', 29),
  ('領収書', '完工・アフター', 30),
  ('ファイル渡し', '完工・アフター', 31),
  ('口コミ訴求', '完工・アフター', 32),
  ('訪販ステッカー', '完工・アフター', 33),
  ('完了', '完工・アフター', 34)
on conflict (name) do nothing;
