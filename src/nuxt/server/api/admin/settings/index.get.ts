import { getSettings } from "~~/server/lib/app-settings";

export default defineEventHandler(async () => {
  try {
    const settings = await getSettings([
      "sms_gateway_url",
      "sms_gateway_username",
      "sms_gateway_password",
    ]);
    return {
      sms_gateway_url: settings["sms_gateway_url"] || "",
      // Only return username preview, never the actual password
      sms_gateway_username: settings["sms_gateway_username"]
        ? maskUsername(settings["sms_gateway_username"])
        : "",
      sms_gateway_username_set: !!settings["sms_gateway_username"],
      sms_gateway_password_set: !!settings["sms_gateway_password"],
    };
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      message: err.message || "Failed to load settings",
    });
  }
});

function maskUsername(username: string): string {
  if (username.length > 8) {
    return username.slice(0, 4) + "..." + username.slice(-4);
  }
  return username;
}
