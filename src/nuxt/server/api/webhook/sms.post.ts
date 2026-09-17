import { postgresPool } from "~~/server/lib/postgres";
import { sendToAdmin } from "~~/server/lib/telegram";
import { analyzeIncomingMessage } from "~~/server/lib/ai";
import { playerFullName } from "~/utils";

// ─── Balance parsing ─────────────────────────────────────────────────────────

function parseLycaBalance(text: string): { balance: number; currency: string } | null {
  const sekMatch = text.match(
    /(?:Saldo|saldo|Balance|balance)\s*[:.]?\s*(\d+[.,]\d{1,2})\s*(SEK|kr)?/i,
  );
  if (sekMatch) {
    return {
      balance: parseFloat(sekMatch[1].replace(",", ".")),
      currency: "SEK",
    };
  }

  const genericMatch = text.match(/(\d+[.,]\d{1,2})\s*(SEK|kr|EUR|€|USD|\$)/i);
  if (genericMatch) {
    const currMap: Record<string, string> = {
      SEK: "SEK",
      kr: "SEK",
      EUR: "EUR",
      "€": "EUR",
      USD: "USD",
      "\$": "USD",
    };
    return {
      balance: parseFloat(genericMatch[1].replace(",", ".")),
      currency: currMap[genericMatch[2]] || "SEK",
    };
  }

  return null;
}

async function handleCashcardBalance(
  text: string,
  phoneNumber: string,
): Promise<boolean> {
  const configResult = await postgresPool.query(
    `SELECT * FROM cashcard_config LIMIT 1`,
  );
  const config = configResult.rows[0];

  if (!config || phoneNumber !== config.shortcode) {
    return false;
  }

  const parsed = parseLycaBalance(text);
  if (!parsed) return false;

  await postgresPool.query(
    `INSERT INTO cashcard_balances (balance, currency, raw_response)
     VALUES ($1, $2, $3)`,
    [parsed.balance, parsed.currency, text],
  );

  sendToAdmin(
    `💳 Cashcard-saldo uppdaterat: ${parsed.balance.toFixed(2)} ${parsed.currency}\n\`${text}\``,
  ).catch(() => {});

  return true;
}

async function processPlayerMessage(
  phoneNumber: string,
  text: string,
): Promise<void> {
  // Find player by phone
  const playerResult = await postgresPool.query(
    `SELECT * FROM players WHERE phone = $1`,
    [phoneNumber],
  );
  const player = playerResult.rows[0];

  if (!player) {
    return; // Don't notify for unknown numbers
  }

  // Record incoming message
  await postgresPool.query(
    `INSERT INTO messages (player_id, direction, content)
     VALUES ($1, 'incoming', $2)`,
    [player.id, text],
  );

  try {
    const aiResult = await analyzeIncomingMessage(text, playerFullName(player));

    await postgresPool.query(
      `INSERT INTO ai_response_suggestions (player_id, incoming_message, ai_suggested_response, ai_confidence)
       VALUES ($1, $2, $3, $4)`,
      [player.id, text, aiResult.response, aiResult.confidence],
    );

    const messageForAdmin = `
📱 Svar från ${playerFullName(player)} (${phoneNumber}):
"${text}"

🤖 AI-förslag: "${aiResult.response}"
Konfidens: ${(aiResult.confidence * 100).toFixed(0)}%
${aiResult.shouldCreateUnavailability ? "⚠️ Vill skapa ledighet!" : ""}
    `.trim();

    await sendToAdmin(messageForAdmin);

    if (aiResult.shouldCreateUnavailability && aiResult.unavailability) {
      const { startDate, endDate, reason } = aiResult.unavailability;

      await postgresPool.query(
        `INSERT INTO unavailabilities (player_id, start_date, end_date, reason, ai_parsed)
         VALUES ($1, $2, $3, $4, true)`,
        [player.id, startDate, endDate, reason || "AI-genererad"],
      );

      await sendToAdmin(
        `✅ Lade till ledighet för ${playerFullName(player)}: ${startDate} - ${endDate}`,
      );
    }
  } catch (error) {
    console.error(`[sms-webhook] AI analysis failed for ${phoneNumber}:`, error);
    await sendToAdmin(
      `❌ AI-analys misslyckades för ${playerFullName(player)}: ${text}`,
    );
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body?.messages || !Array.isArray(body.messages)) {
    throw createError({ statusCode: 400, message: "Invalid payload" });
  }

  for (const msg of body.messages) {
    const phoneNumber = msg.phoneNumber as string;
    const text = msg.text as string;

    // Check if this is a cashcard balance response
    const handled = await handleCashcardBalance(text, phoneNumber);
    if (handled) continue;

    // Process as player message
    await processPlayerMessage(phoneNumber, text);
  }

  return { success: true };
});
