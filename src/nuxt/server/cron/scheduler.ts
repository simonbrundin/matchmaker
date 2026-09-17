import cron from "node-cron";
import { getBookingService } from "../lib/booking";
import { getSMSClient, type SMSGatewayClient } from "../lib/sms-gateway";
import { generateInviteMessage } from "../lib/ai";
import { postgresPool } from "../lib/postgres";
import { sendToAdmin } from "../lib/telegram";
import { HOST_DAYS_AHEAD, PLAYER_DAYS_AHEAD } from "../lib/config";
import { isHallAvailable } from "../lib/booking-systems";

/**
 * Shape of a row returned by `SELECT wt.*, p.* FROM weekly_times JOIN players`.
 * The `pool.query(...)` result is `any[]` so we cast to this typed shape once
 * per loop iteration to keep the inner code type-safe and avoid `any` leaks.
 */
/**
 * Validated row shape where the fields we actually use downstream are
 * guaranteed `string` (not `string | null`). This lets us skip per-use-site
 * narrowing after the row has passed the guard.
 */
interface ValidatedWeeklyTimeRow {
  player_id: string;
  time: string;
  phone: string;
  first_name: string | null;
  hall_id: string | null;
}

/**
 * Runtime-validate a raw SQL row into a fully-typed ValidatedWeeklyTimeRow.
 * Returns null if any of the required string fields is missing/wrong type.
 */
function validateWeeklyTimeRow(raw: unknown): ValidatedWeeklyTimeRow | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.player_id !== "string") return null;
  if (typeof r.time !== "string") return null;
  if (typeof r.phone !== "string") return null;
  return {
    player_id: r.player_id,
    time: r.time,
    phone: r.phone,
    first_name: typeof r.first_name === "string" ? r.first_name : null,
    hall_id: typeof r.hall_id === "string" ? r.hall_id : null,
  };
}

/**
 * Filter+validate helper: returns a strictly-typed array of validated rows
 * with `null` filtered out. Iterating this array gives `wt: ValidatedWeeklyTimeRow`
 * directly with no further narrowing needed.
 */
function validatedRows(rows: unknown[]): ValidatedWeeklyTimeRow[] {
  const out: ValidatedWeeklyTimeRow[] = [];
  for (const r of rows) {
    const v = validateWeeklyTimeRow(r);
    if (v) out.push(v);
  }
  return out;
}

let bookingService: ReturnType<typeof getBookingService> | null = null;
let smsClientPromise: Promise<SMSGatewayClient> | null = null;

async function getServices() {
  if (!bookingService) bookingService = getBookingService();
  if (!smsClientPromise) smsClientPromise = getSMSClient();
  const smsClient = await smsClientPromise;
  return { bookingService, smsClient };
}

function getSwedishDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

function getRound(): number {
  const hour = new Date().getHours();
  if (hour < 10) return 3;
  if (hour < 13) return 4;
  if (hour < 18) return 5;
  return 6;
}

export function startCronJobs() {
  console.log("📅 Starting cron jobs...");

  cron.schedule("0 8 * * *", async () => {
    console.log("📅 Running 08:00...");
    await sendHostConfirmations();
    await sendPlayerInvites();
  });

  cron.schedule("30 12 * * *", async () => {
    const day = new Date().getDay();
    if (day >= 1 && day <= 4) {
      console.log("📨 Running 12:30...");
      await sendPlayerInvites();
    }
  });

  cron.schedule("0 17 * * *", async () => {
    const day = new Date().getDay();
    if (day >= 1 && day <= 4) {
      console.log("📨 Running 17:00...");
      await sendPlayerInvites();
    }
  });

  cron.schedule("0 13 * * *", async () => {
    console.log("📨 Running 13:00 host reminders...");
    await sendHostReminders();
  });

  console.log(
    "✅ Cron: 08:00 (hosts+players), 12:30 & 17:00 (mon-thu), 13:00 (host reminders)",
  );
}

async function sendHostConfirmations() {
  const { bookingService, smsClient } = await getServices();
  const target = new Date();
  target.setDate(target.getDate() + HOST_DAYS_AHEAD);
  const dateStr = target.toISOString().split("T")[0];
  const dayNum = target.getDay();

  await sendToAdmin(`📅 Värdinbjudningar för ${dateStr}...`);

  const wtsResult = await postgresPool.query(
    `SELECT wt.*, p.phone, p.first_name, p.last_name
     FROM weekly_times wt
     JOIN players p ON p.id = wt.player_id
     WHERE wt.day_of_week = $1 AND wt.is_active = true AND wt.interval_days IS NULL`,
    [dayNum],
  );
  const wts = wtsResult.rows;
  if (!wts.length) return;

  const validated = validatedRows(wts);
  for (const wt of validated) {
    const time = wt.time as string;
    const playerId = wt.player_id as string;
    const phone = wt.phone as string;
    const hallId = wt.hall_id;
    const firstNameStr: string = wt.first_name || "spelare";

    const bookingResult = await postgresPool.query(
      `SELECT * FROM bookings WHERE scheduled_date = $1 AND scheduled_time = $2`,
      [dateStr, time],
    );
    const existingBooking = bookingResult.rows[0];

    if (existingBooking?.host_confirmed) continue;

    const newBooking = existingBooking
      ? existingBooking
      : await bookingService.createBooking(playerId, dateStr, time);

    const gate = await isHallAvailable(hallId, dateStr, time);
    if (!gate.ok) {
      await sendToAdmin(
        `⏸ Skippade värdinbjudan till ${firstNameStr} — ${gate.reason ?? "bokningssystem otillgängligt"} (${dateStr} ${time})`,
      );
      continue;
    }

    const msg = `Hej ${firstNameStr}! Padel ${getSwedishDate(dateStr)} kl ${time} - kan du spela denna vecka? Svara ja/nej.`;

    try {
      await smsClient.sendMessage(phone, msg);
      await postgresPool.query(
        `INSERT INTO messages (booking_id, player_id, direction, content, invite_round)
         VALUES ($1, $2, 'outgoing', $3, 1)`,
        [newBooking.id, playerId, msg],
      );
      await sendToAdmin(`📨 Värdinbjudan till ${firstNameStr}`);
    } catch (e) {
      console.error("Värd failed:", e);
    }
  }
}

async function sendHostReminders() {
  const { smsClient } = await getServices();
  for (let days = 5; days >= 1; days--) {
    const target = new Date();
    target.setDate(target.getDate() + days);
    const dateStr = target.toISOString().split("T")[0];
    const dayNum = target.getDay();

    const wtsResult = await postgresPool.query(
      `SELECT wt.*, p.phone, p.first_name, p.last_name
       FROM weekly_times wt
       JOIN players p ON p.id = wt.player_id
       WHERE wt.day_of_week = $1 AND wt.is_active = true AND wt.interval_days IS NULL`,
      [dayNum],
    );
    const wts = wtsResult.rows;
    if (!wts.length) continue;

    const validated = validatedRows(wts);
    for (const wt of validated) {
      const time = wt.time as string;
      const playerId = wt.player_id as string;
      const phone = wt.phone as string;
      const hallId = wt.hall_id;
      const firstNameStr: string = wt.first_name || "spelare";

      const bookingResult = await postgresPool.query(
        `SELECT * FROM bookings WHERE scheduled_date = $1 AND scheduled_time = $2`,
        [dateStr, time],
      );
      const booking = bookingResult.rows[0];
      if (!booking || booking.host_confirmed) continue;

      const lastMsgResult = await postgresPool.query(
        `SELECT sent_at FROM messages
         WHERE booking_id = $1 AND player_id = $2 AND direction = 'outgoing'
         ORDER BY sent_at DESC LIMIT 1`,
        [booking.id, playerId],
      );

      if (lastMsgResult.rows[0]) {
        const hours =
          (Date.now() - new Date(lastMsgResult.rows[0].sent_at).getTime()) /
          (1000 * 60 * 60);
        if (hours < 5) continue;
      }

      const gate = await isHallAvailable(hallId, dateStr, time);
      if (!gate.ok) {
        await sendToAdmin(
          `⏸ Skippade påminnelse till ${firstNameStr} — ${gate.reason ?? "bokningssystem otillgängligt"} (${dateStr} ${time})`,
        );
        continue;
      }

      const msg = `Hej! Påminnelse - kan du spela padel ${getSwedishDate(dateStr)} kl ${time}? Svara ja/nej.`;

      try {
        await smsClient.sendMessage(phone, msg);
        await postgresPool.query(
          `INSERT INTO messages (booking_id, player_id, direction, content, invite_round)
           VALUES ($1, $2, 'outgoing', $3, 2)`,
          [booking.id, playerId, msg],
        );
        await sendToAdmin(`📨 Påminnelse till ${firstNameStr}`);
      } catch (e) {
        console.error("Reminder failed", e);
      }
    }
  }
}

async function sendPlayerInvites() {
  const round = getRound();

  await sendToAdmin(`📨 Spelarinbjudningar (runda ${round})...`);

  for (let days = PLAYER_DAYS_AHEAD; days >= 1; days--) {
    const target = new Date();
    target.setDate(target.getDate() + days);
    const dateStr = target.toISOString().split("T")[0];
    const dayNum = target.getDay();

    const wtsResult = await postgresPool.query(
      `SELECT wt.*, p.phone, p.first_name, p.last_name
       FROM weekly_times wt
       JOIN players p ON p.id = wt.player_id
       WHERE wt.day_of_week = $1 AND wt.is_active = true AND wt.interval_days IS NULL`,
      [dayNum],
    );
    const wts = wtsResult.rows;
    if (!wts.length) continue;

    const validated = validatedRows(wts);
    for (const wt of validated) {
      const time = wt.time as string;
      const hallId = wt.hall_id;

      const bookingResult = await postgresPool.query(
        `SELECT b.*, array_agg(json_build_object('id', bp.id, 'player_id', bp.player_id, 'status', bp.status))
               FILTER (WHERE bp.id IS NOT NULL) as booked_players_arr
         FROM bookings b
         LEFT JOIN booked_players bp ON bp.booking_id = b.id
         WHERE b.scheduled_date = $1 AND b.scheduled_time = $2
         GROUP BY b.id`,
        [dateStr, time],
      );
      const booking = bookingResult.rows[0];

      if (!booking || !booking.host_confirmed) continue;
      if (booking.status === "confirmed") continue;

      const confirmed = (booking.booked_players_arr || []).filter(
        (p: any) => p.status === "confirmed",
      ).length;

      if (confirmed >= 4) {
        await postgresPool.query(
          `UPDATE bookings SET status = 'confirmed' WHERE id = $1`,
          [booking.id],
        );
        await sendToAdmin(`🎉 ${dateStr} ${time} fullbemannad!`);
        continue;
      }

      const gate = await isHallAvailable(hallId, dateStr, time);
      if (!gate.ok) {
        await sendToAdmin(
          `⏸ Skippade spelarinbjudningar ${dateStr} ${time} — ${gate.reason ?? "bokningssystem otillgängligt"}`,
        );
        continue;
      }

      await sendInvitesForBooking(booking, dateStr, time, confirmed, round);
    }
  }
}

async function sendInvitesForBooking(
  booking: any,
  dateStr: string,
  time: string,
  confirmed: number,
  round: number,
) {
  const { bookingService, smsClient } = await getServices();

  const bpResult = await postgresPool.query(
    `SELECT player_id, status FROM booked_players WHERE booking_id = $1`,
    [booking.id],
  );
  const contacted = new Set(
    bpResult.rows.map((p: { player_id: string }) => p.player_id),
  );
  const slots = 4 - confirmed;
  if (slots <= 0) return;

  const candidates = await bookingService.getEligibleCandidates(
    booking.id,
    1200,
    dateStr,
    time,
  );
  const newCands = candidates.filter((c) => !contacted.has(c.player.id));
  const top = newCands.slice(0, slots * 3);

  let sent = 0;

  for (let i = 0; i < top.length && sent < slots; i++) {
    const cand = top[i];
    if (!cand) continue;
    if (cand.probability < (slots - i) / 36) continue;

    try {
      await bookingService.invitePlayer(booking.id, cand.player.id, sent + 1);
      const firstName = cand.player.first_name || "spelare";
      const msg = await generateInviteMessage(
        firstName,
        dateStr,
        time,
        undefined,
        booking.id,
      );
      await smsClient.sendMessage(cand.player.phone, msg);
      await postgresPool.query(
        `INSERT INTO messages (booking_id, player_id, direction, content, invite_round)
         VALUES ($1, $2, 'outgoing', $3, $4)`,
        [booking.id, cand.player.id, msg, round],
      );
      sent++;
      await new Promise((r) => setTimeout(r, 1000));
    } catch (e) {
      console.error("Invite failed:", e);
    }
  }
}
