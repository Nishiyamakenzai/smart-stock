-- ────────────────────────────────────────────────────────
-- 評価制度 追加カラム（v1: evaluation_schema.sql の後に実行してください）
-- 冪等（何度実行しても安全）
-- ────────────────────────────────────────────────────────

-- 評価対象から除外するフラグ（役員など、評価制度の対象外にしたいメンバー用）
alter table evaluation_profiles add column if not exists excluded boolean not null default false;

-- 印刷・帳票にそのまま出すフルネーム（未設定の場合は members.name を使用）
alter table evaluation_profiles add column if not exists full_name text;
