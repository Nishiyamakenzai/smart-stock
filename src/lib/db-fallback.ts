/**
 * DBマイグレーション未適用（カラム未追加）の環境でも、それ以外の項目だけは
 * 保存できるようにするための汎用フォールバック。
 * PostgREST は存在しないカラムを含む書き込みに対して
 * `Could not find the 'xxx' column of 'yyy' in the schema cache` を返すため、
 * そのカラム名を検出して除外し、再試行する。
 */
export async function withColumnFallback<T>(
  optionalKeys: string[],
  payload: Record<string, unknown>,
  run: (payload: Record<string, unknown>) => Promise<{ data: T | null; error: { message: string } | null }>
): Promise<{ data: T | null; error: { message: string } | null; droppedKeys: string[] }> {
  const current = { ...payload };
  const dropped: string[] = [];

  for (let attempt = 0; attempt <= optionalKeys.length; attempt++) {
    const { data, error } = await run(current);
    if (!error) return { data, error: null, droppedKeys: dropped };

    const missingKey = optionalKeys.find(
      (k) => k in current && new RegExp(`'${k}'`).test(error.message)
    );
    if (!missingKey) return { data: null, error, droppedKeys: dropped };

    delete current[missingKey];
    dropped.push(missingKey);
  }
  return { data: null, error: { message: "column fallback retries exhausted" }, droppedKeys: dropped };
}
