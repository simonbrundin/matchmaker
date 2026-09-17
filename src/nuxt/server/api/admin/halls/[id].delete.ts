import { postgresPool } from "~~/server/lib/postgres";

/**
 * Delete a hall.
 *
 * Hard delete is blocked if any weekly_times still reference the hall,
 * because those rows would otherwise cascade-delete via the FK we
 * declared with ON DELETE RESTRICT. The caller should first reassign
 * or deactivate those weekly_times.
 *
 * For inactive halls (already is_active = false) we still refuse if a
 * weekly_time points at them — the admin must clean up dependencies
 * explicitly. This makes accidental data loss impossible.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "id required" });
  }

  const client = await postgresPool.connect();
  try {
    const refCheck = await client.query(
      `SELECT COUNT(*)::int AS refs FROM weekly_times WHERE hall_id = $1`,
      [id],
    );
    if ((refCheck.rows[0]?.refs ?? 0) > 0) {
      throw createError({
        statusCode: 409,
        message:
          "Kan inte ta bort hallen — den används av weekly_times. Avlänka dem först eller inaktivera hallen.",
      });
    }

    const result = await client.query(
      `DELETE FROM halls WHERE id = $1 RETURNING id, name`,
      [id],
    );
    if (result.rowCount === 0) {
      throw createError({ statusCode: 404, message: "hall not found" });
    }
    return { success: true, deleted: result.rows[0] };
  } finally {
    client.release();
  }
});
