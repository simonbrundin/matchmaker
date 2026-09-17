/**
 * Host confirmation logic for the scheduler.
 */

import { sendToAdmin } from "../telegram";
import { isHallAvailable } from "../booking-systems";
import { getBookingService } from "../booking";
import type { SMSGatewayClient } from "../sms-gateway";
import {
  fetchWeeklyTimesForDay,
  findExistingBooking,
  getLastMessageTime,
} from "./weekly-times";
import { sendHostInvitation, sendHostReminder } from "./sms-helpers";
import type { ValidatedWeeklyTimeRow } from "./types";

const HOURS_BETWEEN_REMINDERS = 5;

export async function sendHostConfirmations(
  smsClient: SMSGatewayClient,
  dateStr: string,
  dayNum: number,
): Promise<void> {
  const bookingService = getBookingService();

  await sendToAdmin(`📅 Värdinbjudningar för ${dateStr}...`);

  const weeklyTimes = await fetchWeeklyTimesForDay(dayNum);
  if (weeklyTimes.length === 0) return;

  for (const wt of weeklyTimes) {
    await processWeeklyTimeForConfirmation(
      smsClient,
      bookingService,
      wt,
      dateStr,
    );
  }
}

async function processWeeklyTimeForConfirmation(
  smsClient: SMSGatewayClient,
  bookingService: ReturnType<typeof getBookingService>,
  wt: ValidatedWeeklyTimeRow,
  dateStr: string,
): Promise<void> {
  const existingBooking = await findExistingBooking(dateStr, wt.time);

  // Skip if host already confirmed
  if (existingBooking?.host_confirmed) return;

  // Create booking if it doesn't exist
  let bookingId: string;
  if (existingBooking) {
    bookingId = existingBooking.id;
  } else {
    const booking = await bookingService.createBooking(wt.player_id, dateStr, wt.time);
    bookingId = booking.id;
  }

  // Check hall availability
  const gate = await isHallAvailable(wt.hall_id, dateStr, wt.time);
  if (!gate.ok) {
    const hallName = wt.first_name || "spelare";
    await sendToAdmin(
      `⏸ Skippade värdinbjudan till ${hallName} — ${gate.reason ?? "bokningssystem otillgängligt"} (${dateStr} ${wt.time})`,
    );
    return;
  }

  const firstName = wt.first_name || "spelare";
  const message = buildHostInvitationMessage(firstName, dateStr, wt.time);

  try {
    await sendHostInvitation(smsClient, wt.phone, message, bookingId, wt.player_id);
  } catch (error) {
    console.error(`[host-confirmations] Failed to send to ${firstName}:`, error);
  }
}

export async function sendHostReminders(
  smsClient: SMSGatewayClient,
  targetDates: Date[],
  dayNums: number[],
): Promise<void> {
  await sendToAdmin(`📨 Värdpåminnelser...`);

  for (let i = 0; i < targetDates.length; i++) {
    const dateStr = targetDates[i].toISOString().split("T")[0];
    const dayNum = dayNums[i];

    const weeklyTimes = await fetchWeeklyTimesForDay(dayNum);
    if (weeklyTimes.length === 0) continue;

    for (const wt of weeklyTimes) {
      await processWeeklyTimeForReminder(smsClient, wt, dateStr);
    }
  }
}

async function processWeeklyTimeForReminder(
  smsClient: SMSGatewayClient,
  wt: ValidatedWeeklyTimeRow,
  dateStr: string,
): Promise<void> {
  const existingBooking = await findExistingBooking(dateStr, wt.time);
  if (!existingBooking || existingBooking.host_confirmed) return;

  const lastMsgTime = await getLastMessageTime(existingBooking.id, wt.player_id);
  if (lastMsgTime) {
    const hoursSinceLastMessage =
      (Date.now() - lastMsgTime.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastMessage < HOURS_BETWEEN_REMINDERS) return;
  }

  const gate = await isHallAvailable(wt.hall_id, dateStr, wt.time);
  if (!gate.ok) {
    const firstName = wt.first_name || "spelare";
    await sendToAdmin(
      `⏸ Skippade påminnelse till ${firstName} — ${gate.reason ?? "bokningssystem otillgängligt"} (${dateStr} ${wt.time})`,
    );
    return;
  }

  const firstName = wt.first_name || "spelare";
  const message = buildHostReminderMessage(dateStr, wt.time);

  try {
    await sendHostReminder(smsClient, wt.phone, message, existingBooking.id, wt.player_id);
  } catch (error) {
    console.error(`[host-reminders] Failed to send reminder to ${firstName}:`, error);
  }
}

function buildHostInvitationMessage(firstName: string, dateStr: string, time: string): string {
  const date = new Date(dateStr);
  const swedishDate = `${date.getDate()}/${date.getMonth() + 1}`;
  return `Hej ${firstName}! Padel ${swedishDate} kl ${time} - kan du spela denna vecka? Svara ja/nej.`;
}

function buildHostReminderMessage(dateStr: string, time: string): string {
  const date = new Date(dateStr);
  const swedishDate = `${date.getDate()}/${date.getMonth() + 1}`;
  return `Hej! Påminnelse - kan du spela padel ${swedishDate} kl ${time}? Svara ja/nej.`;
}
