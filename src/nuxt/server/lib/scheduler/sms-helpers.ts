/**
 * SMS sending helpers for the scheduler.
 */

import type { SMSGatewayClient } from "../sms-gateway";
import { sendToAdmin } from "../telegram";
import { recordOutgoingMessage } from "./weekly-times";

const SLEEP_BETWEEN_SMS_MS = 1000;

/**
 * Send a host invitation SMS.
 */
export async function sendHostInvitation(
  smsClient: SMSGatewayClient,
  phone: string,
  message: string,
  bookingId: string,
  playerId: string,
): Promise<void> {
  await smsClient.sendMessage(phone, message);
  await recordOutgoingMessage(bookingId, playerId, message, 1);
  await sendToAdmin(`📨 Värdinbjudan skickad`);
}

/**
 * Send a host reminder SMS.
 */
export async function sendHostReminder(
  smsClient: SMSGatewayClient,
  phone: string,
  message: string,
  bookingId: string,
  playerId: string,
): Promise<void> {
  await smsClient.sendMessage(phone, message);
  await recordOutgoingMessage(bookingId, playerId, message, 2);
  await sendToAdmin(`📨 Påminnelse skickad`);
}

/**
 * Send player invite SMS with rate limiting.
 */
export async function sendPlayerInvite(
  smsClient: SMSGatewayClient,
  phone: string,
  message: string,
  bookingId: string,
  playerId: string,
  inviteNumber: number,
): Promise<void> {
  await smsClient.sendMessage(phone, message);
  await recordOutgoingMessage(bookingId, playerId, message, inviteNumber);
  // Rate limit between SMS sends
  await sleep(SLEEP_BETWEEN_SMS_MS);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
