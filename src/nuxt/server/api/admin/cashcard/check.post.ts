import { postgresPool } from "~~/server/lib/postgres";
import { getSMSClient } from "~~/server/lib/sms-gateway";

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}));
  const client = await postgresPool.connect();

  let config: { check_command: string; shortcode: string } | null = null;

  try {
    const configResult = await client.query(
      `SELECT * FROM cashcard_config LIMIT 1`,
    );
    config = configResult.rows[0] ?? null;
  } finally {
    client.release();
  }

  if (!config) {
    throw createError({
      statusCode: 500,
      message: "Cashcard config not found",
    });
  }

  const command = body?.command || config.check_command;
  const shortcode = body?.shortcode || config.shortcode;

  const smsClient = await getSMSClient();

  try {
    await smsClient.sendMessage(shortcode, command, {
      skipPhoneValidation: true,
    });

    return {
      success: true,
      message: `"${command}" sent to ${shortcode}. Reply coming soon.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw createError({
      statusCode: 500,
      message: `Could not send SMS: ${message}`,
    });
  }
});
