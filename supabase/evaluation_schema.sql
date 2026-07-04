-- ────────────────────────────────────────────────────────
-- 職人評価制度システム 用テーブル
-- Supabase Dashboard > SQL Editor でこのファイルの内容を実行してください。
-- 既存の members テーブルは変更しません（タスク管理側で未認証公開されているため、
-- 給与など機微な情報は別テーブルに分離しています）。
-- ────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

-- 職人ごとの給与・等級プロフィール（members 1:1）
create table if not exists evaluation_profiles (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade unique,
  wage_type text not null default 'monthly' check (wage_type in ('monthly', 'daily')),
  monthly_salary integer, -- 月給制の場合の月給（円）
  daily_wage integer,     -- 日給月給制の場合の日給（円）※月換算は日給×25で計算
  join_date date,
  grade_override integer check (grade_override between 1 and 10), -- 手動で等級を上書きしたい場合
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3ヶ月ごとの人事評価
create table if not exists evaluations (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  period_label text not null,       -- 例: "2026年 6〜8月期"
  period_start date not null,
  period_end date not null,
  grade_at_evaluation integer not null check (grade_at_evaluation between 1 and 10),
  -- 能力評価（S:2 / A:1 / B:0 / C:-1 / D:-2）
  score_quality integer not null check (score_quality between -2 and 2),        -- 1. 品質
  score_speed integer not null check (score_speed between -2 and 2),            -- 2. スピード
  score_knowledge integer not null check (score_knowledge between -2 and 2),    -- 3. 知識
  -- 態度評価
  score_discipline integer not null check (score_discipline between -2 and 2),      -- 4. 規律性
  score_cooperation integer not null check (score_cooperation between -2 and 2),    -- 5. 協調性
  score_responsibility integer not null check (score_responsibility between -2 and 2), -- 6. 責任感
  score_initiative integer not null check (score_initiative between -2 and 2),      -- 7. 積極性
  score_trust integer not null check (score_trust between -2 and 2),                -- 8. 信頼性
  -- 姿勢のルール（できて当たり前 = 加点なし、減点のみ）
  score_attitude integer not null default 0 check (score_attitude between -2 and 0), -- 9. 姿勢のルール
  total_score integer not null,
  note text,
  evaluator text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, period_start)
);

create index if not exists idx_evaluations_member on evaluations(member_id, period_start desc);

-- updated_at 自動更新
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_evaluation_profiles_updated_at on evaluation_profiles;
create trigger trg_evaluation_profiles_updated_at
  before update on evaluation_profiles
  for each row execute function set_updated_at();

drop trigger if exists trg_evaluations_updated_at on evaluations;
create trigger trg_evaluations_updated_at
  before update on evaluations
  for each row execute function set_updated_at();
