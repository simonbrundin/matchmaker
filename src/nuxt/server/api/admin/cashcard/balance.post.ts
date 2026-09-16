import { getSupabaseAdmin } from "~~/server/lib/supabase";

// Manual balance entry (when Lyca SMS response can't be received via webhook)
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { balance, currency, raw_response } = body;

  if (balance === undefined || balance === null) {
    throw createError({ statusCode: 400, message: "balance is required" });
  }

  const supabase = getSupabaseAdmin();

  const result = await supabase.from("cashcard_balances").insert({
    balance: parseFloat(balance),
    currency: currency || "SEK",
    raw_response: raw_response || `Manuell inmatning: ${balance}`,
  });

  return { success: true, balance: result };
});
