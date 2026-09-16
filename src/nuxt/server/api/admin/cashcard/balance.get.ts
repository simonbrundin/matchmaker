import { getSupabaseAdmin } from "~~/server/lib/supabase";

export default defineEventHandler(async () => {
  const supabase = getSupabaseAdmin();

  // Get the latest balance
  const { data: latestBalance } = await supabase
    .from("cashcard_balances")
    .select("*")
    .order("checked_at", { ascending: false })
    .limit(1)
    .single();

  // Get config
  const { data: config } = await supabase
    .from("cashcard_config")
    .select("*")
    .limit(1)
    .single();

  return {
    balance: latestBalance,
    config,
    lastChecked: latestBalance?.checked_at || null,
  };
});
