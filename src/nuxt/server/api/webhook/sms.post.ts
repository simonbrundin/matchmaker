import { getSupabaseAdmin } from "~~/server/lib/supabase";
import { sendToAdmin } from "~~/server/lib/telegram";
import { analyzeIncomingMessage } from "~~/server/lib/ai";
import { playerFullName } from "~/utils";

// Parse balance from Lyca response
// Expected formats: "Saldo: 150.50 SEK" or "Balance: 150.50 SEK"
function parseLycaBalance(
  text: string,
): { balance: number; currency: string } | null {
  // Try Swedish format: "Saldo: 150.50 SEK"
  const sekMatch = text.match(
    /(?:Saldo|saldo|Balance|balance)\s*[:.]?\s*(\d+[.,]\d{1,2})\s*(SEK|kr)?/i,
  );
  if (sekMatch) {
    const balance = parseFloat(sekMatch[1].replace(",", "."));
    return { balance, currency: "SEK" };
  }

  // Try generic number with currency
  const genericMatch = text.match(/(\d+[.,]\d{1,2})\s*(SEK|kr|EUR|€|USD|\$)/i);
  if (genericMatch) {
    const balance = parseFloat(genericMatch[1].replace(",", "."));
    const currMap: Record<string, string> = {
      SEK: "SEK",
      kr: "SEK",
      EUR: "EUR",
      "€": "EUR",
      USD: "USD",
      "\$": "USD",
    };
    return { balance, currency: currMap[genericMatch[2]] || "SEK" };
  }

  return null;
}

// Check if this is a cashcard balance response (from shortcode)
async function handleCashcardBalance(
  supabase: any,
  text: string,
): Promise<boolean> {
  // Get config
  const { data: config } = await supabase
    .from("cashcard_config")
    .select("*")
    .limit(1)
    .single();

  if (!config) return false;

  // Parse balance
  const parsed = parseLycaBalance(text);
  if (!parsed) return false;

  // Save to database
  await supabase.from("cashcard_balances").insert({
    balance: parsed.balance,
    currency: parsed.currency,
    raw_response: text,
  });

  // Notify admin via Telegram (non-blocking, don't fail webhook if unconfigured)
  sendToAdmin(
    `💳 Cashcard-saldo uppdaterat: ${parsed.balance.toFixed(2)} ${parsed.currency}\n\`${text}\``,
  ).catch(() => {});

  return true;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body?.messages || !Array.isArray(body.messages)) {
    throw createError({ statusCode: 400, message: "Invalid payload" });
  }

  const supabase = getSupabaseAdmin();

  for (const msg of body.messages) {
    const phoneNumber = msg.phoneNumber;
    const text = msg.text;

    // Get cashcard config to check shortcode
    const { data: config } = await supabase
      .from("cashcard_config")
      .select("*")
      .limit(1)
      .single();

    // Check if this is from the cashcard shortcode
    if (config && phoneNumber === config.shortcode) {
      const handled = await handleCashcardBalance(supabase, text);
      if (handled) continue;
    }

    const { data: player } = await supabase
      .from("players")
      .select("*")
      .eq("phone", phoneNumber)
      .single();

    if (!player) {
      // Don't notify for unknown numbers - might be cashcard responses
      continue;
    }

    await supabase.from("messages").insert({
      player_id: player.id,
      direction: "incoming",
      content: text,
    });

    try {
      const aiResult = await analyzeIncomingMessage(
        text,
        playerFullName(player),
      );

      await supabase.from("ai_response_suggestions").insert({
        player_id: player.id,
        incoming_message: text,
        ai_suggested_response: aiResult.response,
        ai_confidence: aiResult.confidence,
      });

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

        await supabase.from("unavailabilities").insert({
          player_id: player.id,
          start_date: startDate,
          end_date: endDate,
          reason: reason || "AI-genererad",
          ai_parsed: true,
        });

        await sendToAdmin(
          `✅ Lade till ledighet för ${playerFullName(player)}: ${startDate} - ${endDate}`,
        );
      }
    } catch (error) {
      console.error("AI analysis failed:", error);
      await sendToAdmin(
        `❌ AI-analys misslyckades för ${playerFullName(player)}: ${text}`,
      );
    }
  }

  return { success: true };
});
