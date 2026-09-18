/* eslint-disable @typescript-eslint/no-unnecessary-condition, @safelytyped/sql */
import { postgresPool } from "../../../../lib/postgres";

export default defineEventHandler(async (event) => {
  const playerId = getRouterParam(event, "id");

  if (!playerId) {
    throw createError({ statusCode: 400, message: "Player ID required" });
  }

  const query = getQuery(event);
  const limit = Math.min(parseInt(String(query.limit || "50"), 10), 100);
  const offset = parseInt(String(query.offset || "0"), 10);
  const direction = query.direction as string | undefined;

  let directionFilter = "";
  const params: (string | number)[] = [playerId];
  let paramIndex = 2;

  if (direction && ["incoming", "outgoing"].includes(direction)) {
    directionFilter = `AND m.direction = $${paramIndex}`;
    params.push(direction);
    paramIndex++;
  }

  // Get messages with booking info if available
  const result = await postgresPool.query(
    `
    SELECT 
      m.id,
      m.booking_id,
      m.player_id,
      m.direction,
      m.content,
      m.sent_at,
      m.response_received_at,
      m.response,
      b.scheduled_date,
      b.scheduled_time
    FROM messages m
    LEFT JOIN bookings b ON b.id = m.booking_id
    WHERE m.player_id = $1 ${directionFilter}
    ORDER BY m.sent_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
    [...params, limit, offset],
  );

  // Get total count for pagination
  let countResult;
  if (direction && ["incoming", "outgoing"].includes(direction)) {
    countResult = await postgresPool.query(
      `SELECT COUNT(*) as total FROM messages WHERE player_id = $1 AND direction = $2`,
      [playerId, direction],
    );
  } else {
    countResult = await postgresPool.query(
      `SELECT COUNT(*) as total FROM messages WHERE player_id = $1`,
      [playerId],
    );
  }

  const total = parseInt(countResult.rows[0]?.total || "0", 10);

  return {
    messages: result.rows,
    total,
    limit,
    offset,
    hasMore: offset + result.rows.length < total,
  };
});
