import { createClient, SupabaseClient } from "@supabase/supabase-js";

// レイジー初期化（ビルド時ではなく実行時にクライアントを生成）
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    }
    _client = createClient(url, key, { auth: { persistSession: false } });
  }
  return _client;
}

/** サーバーサイドのSupabaseクライアントを返すgetter */
export function getSupabase(): SupabaseClient {
  return getClient();
}

/** 指定キーの値を取得 */
export async function dbGet<T>(key: string): Promise<T | null> {
  const { data, error } = await getClient()
    .from("app_data")
    .select("value")
    .eq("key", key)
    .single();
  if (error || !data) return null;
  return data.value as T;
}

/** 指定キーの値をupsert（作成または更新） */
export async function dbSet(key: string, value: unknown): Promise<void> {
  const { error } = await getClient()
    .from("app_data")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) throw new Error(`dbSet failed for key "${key}": ${error.message}`);
}

/** 指定キーのレコードを削除 */
export async function dbDelete(key: string): Promise<void> {
  const { error } = await getClient()
    .from("app_data")
    .delete()
    .eq("key", key);
  if (error) throw new Error(`dbDelete failed for key "${key}": ${error.message}`);
}
