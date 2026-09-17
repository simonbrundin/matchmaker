import { postgresPool } from "~~/server/lib/postgres";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { phone_number, check_command, shortcode } = body;

  if (!phone_number && !check_command && !shortcode) {
    throw createError({
      statusCode: 400,
      message: "Minst ett fält måste anges",
    });
  }

  const client = await postgresPool.connect();
  try {
    await client.query("BEGIN");

    // Get existing config id first
    const existingResult = await client.query(
      `SELECT id FROM cashcard_config LIMIT 1`,
    );

    if (!existingResult.rows[0]?.id) {
      await client.query("ROLLBACK");
      throw createError({
        statusCode: 500,
        message: "Cashcard config not found",
      });
    }

    // Build update object
    const updates: string[] = [];
    const values: string[] = [];
    let paramIndex = 1;

    if (phone_number) {
      updates.push(`phone_number = $${paramIndex++}`);
      values.push(phone_number);
    }
    if (check_command) {
      updates.push(`check_command = $${paramIndex++}`);
      values.push(check_command);
    }
    if (shortcode) {
      updates.push(`shortcode = $${paramIndex++}`);
      values.push(shortcode);
    }

    values.push(existingResult.rows[0].id);

    const result = await client.query(
      `UPDATE cashcard_config SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );

    await client.query("COMMIT");
    return { success: true, config: result.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
