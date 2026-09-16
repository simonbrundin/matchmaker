/* eslint-disable @typescript-eslint/no-unnecessary-condition, @safelytyped/sql */
import { postgresPool } from "./postgres";

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export async function getSetting(key: string): Promise<string | null> {
  const result = await postgresPool.query(
    "SELECT value FROM app_settings WHERE key = $1",
    [key],
  );
  return result.rows[0]?.value ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export async function setSetting(
  key: string,
  value: string,
): Promise<AppSetting | null> {
  const result = await postgresPool.query(
    `INSERT INTO app_settings (key, value)
     VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
     RETURNING *`,
    [key, value],
  );
  return result.rows[0] ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export async function getSettings(
  keys: string[],
): Promise<Record<string, string>> {
  if (keys.length === 0) return {};
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
  const result = await postgresPool.query(
    `SELECT key, value FROM app_settings WHERE key IN (${placeholders})`,
    keys,
  );
  return Object.fromEntries(result.rows.map((s) => [s.key, s.value]));
}
