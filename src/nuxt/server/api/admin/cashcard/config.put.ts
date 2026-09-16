import { getSupabaseAdmin } from "~~/server/lib/supabase";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { phone_number, check_command, shortcode } = body;

  if (!phone_number && !check_command && !shortcode) {
    throw createError({
      statusCode: 400,
      message: "Minst ett fält måste anges",
    });
  }

  const supabase = getSupabaseAdmin();

  // Get existing config id first
  const { data: existingConfig } = await supabase
    .from("cashcard_config")
    .select("id")
    .limit(1)
    .single();

  if (!existingConfig?.id) {
    throw createError({
      statusCode: 500,
      message: "Cashcard config not found",
    });
  }

  // Build update object
  const updates: Record<string, string> = {};
  if (phone_number) updates.phone_number = phone_number;
  if (check_command) updates.check_command = check_command;
  if (shortcode) updates.shortcode = shortcode;

  const { data, error } = await supabase
    .from("cashcard_config")
    .update(updates)
    .eq("id", existingConfig.id)
    .select()
    .single();

  if (error) {
    throw createError({ statusCode: 500, message: error.message });
  }

  return { success: true, config: data };
});
