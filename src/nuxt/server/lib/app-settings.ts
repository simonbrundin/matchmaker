import postgres from "postgres";

function getDb() {
  const databaseUrl = useRuntimeConfig().databaseUrl;
  return postgres(databaseUrl);
}

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function getSetting(key: string): Promise<string | null> {
  const sql = getDb();
  try {
    const [setting] = await sql<{ value: string }[]>`
      SELECT value FROM app_settings WHERE key = ${key}
    `;
    return setting?.value ?? null;
  } finally {
    await sql.end();
  }
}

export async function setSetting(
  key: string,
  value: string,
): Promise<AppSetting | null> {
  const sql = getDb();
  try {
    const [setting] = await sql<AppSetting[]>`
      INSERT INTO app_settings (key, value)
      VALUES (${key}, ${value})
      ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = NOW()
      RETURNING *
    `;
    return setting;
  } finally {
    await sql.end();
  }
}

export async function getSettings(
  keys: string[],
): Promise<Record<string, string>> {
  const sql = getDb();
  try {
    const settings = await sql<{ key: string; value: string }[]>`
      SELECT key, value FROM app_settings WHERE key IN ${sql(keys)}
    `;
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  } finally {
    await sql.end();
  }
}
