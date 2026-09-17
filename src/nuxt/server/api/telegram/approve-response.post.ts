import { postgresPool } from "~~/server/lib/postgres";
import { getSMSClient } from "~~/server/lib/sms-gateway";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { suggestionId, approved, customResponse } = body;

  if (!suggestionId) {
    throw createError({ statusCode: 400, message: "suggestionId required" });
  }

  const smsClient = await getSMSClient();

  // Fetch suggestion with player info
  const suggestionResult = await postgresPool.query(
    `SELECT s.*, p.phone as "player.phone", p.first_name as "player.first_name"
     FROM ai_response_suggestions s
     JOIN players p ON p.id = s.player_id
     WHERE s.id = $1`,
    [suggestionId],
  );

  const suggestion = suggestionResult.rows[0];

  if (!suggestion) {
    throw createError({ statusCode: 404, message: "Suggestion not found" });
  }

  // Update approval status
  await postgresPool.query(
    `UPDATE ai_response_suggestions SET approved = $1 WHERE id = $2`,
    [approved, suggestionId],
  );

  const responseToSend = customResponse || suggestion.ai_suggested_response;

  if (approved && responseToSend) {
    try {
      await smsClient.sendMessage(suggestion["player.phone"], responseToSend);

      await postgresPool.query(
        `INSERT INTO messages (player_id, direction, content)
         VALUES ($1, 'outgoing', $2)`,
        [suggestion.player_id, responseToSend],
      );
    } catch (error) {
      console.error(
        `[approve-response] Failed to send response to ${suggestion["player.first_name"]}:`,
        error,
      );
      throw createError({
        statusCode: 500,
        message: "Failed to send SMS response",
      });
    }
  }

  return { success: true, approved };
});
