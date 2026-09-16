import { setSetting, getSetting } from "~~/server/lib/app-settings";

interface SettingResult {
  success: boolean;
  masked?: string;
  error?: string;
}

const ALLOWED_KEYS = [
  "sms_gateway_url",
  "sms_gateway_username",
  "sms_gateway_password",
];

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body || typeof body !== "object") {
    throw createError({
      statusCode: 400,
      message: "Request body must be an object",
    });
  }

  const results: Record<string, SettingResult> = {};

  for (const key of ALLOWED_KEYS) {
    if (key in body) {
      const value = String(body[key] || "");
      try {
        await setSetting(key, value);
        results[key] = {
          success: true,
          // Return masked value for display
          masked:
            key === "sms_gateway_username"
              ? maskUsername(value)
              : key === "sms_gateway_password"
                ? "••••••••"
                : value,
        };
      } catch (err: any) {
        results[key] = { success: false, error: err.message };
      }
    }
  }

  // Clear the cached SMS client so new settings take effect
  const { clearSMSClientCache } = await import("~~/server/lib/sms-gateway");
  clearSMSClientCache();

  return results;
});

function maskUsername(username: string): string {
  if (username.length > 8) {
    return username.slice(0, 4) + "..." + username.slice(-4);
  }
  return username;
}
