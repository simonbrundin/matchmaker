import { getSMSClient } from "~~/server/lib/sms-gateway";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body?.phoneNumber || !body?.message) {
    throw createError({
      statusCode: 400,
      message: "phoneNumber and message are required",
    });
  }

  try {
    const client = await getSMSClient();
    const result = await client.sendMessage(body.phoneNumber, body.message);
    return { success: true, messageId: result.id };
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      message: err.message || "Failed to send SMS",
    });
  }
});
