import { getSupabaseAdmin } from "~~/server/lib/supabase";
import { getSMSClient } from "~~/server/lib/sms-gateway";

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}));
  const supabase = getSupabaseAdmin();

  const { data: config } = await supabase
    .from("cashcard_config")
    .select("*")
    .limit(1)
    .single();

  if (!config) {
    throw createError({
      statusCode: 500,
      message: "Cashcard config not found",
    });
  }

  const command = body?.command || config.check_command;
  const shortcode = body?.shortcode || config.shortcode;

  const smsClient = getSMSClient();

  try {
    await smsClient.sendMessage(shortcode, command, {
      skipPhoneValidation: true,
    });

    return {
      success: true,
      message: `"${command}" sent to ${shortcode}. Reply coming soon.`,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: "Could not send SMS: " + error.message,
    });
  }
});
