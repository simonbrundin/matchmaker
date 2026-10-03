/**
 * Main cron scheduler entry point.
 * Wires up all scheduled jobs using the extracted modules.
 */

import cron from "node-cron";
import { getSMSClient, type SMSGatewayClient } from "../sms-gateway";
import { HOST_DAYS_AHEAD, PLAYER_DAYS_AHEAD } from "../config";
import { sendHostConfirmations, sendHostReminders } from "./host-confirmations";
import { sendPlayerInvites } from "./player-invites";

let smsClientPromise: Promise<SMSGatewayClient> | null = null;
let isRunning = false;

async function getSMSClientWithCache(): Promise<SMSGatewayClient> {
  if (!smsClientPromise) {
    smsClientPromise = getSMSClient();
  }
  return smsClientPromise;
}

function getRound(): number {
  const hour = new Date().getHours();
  if (hour < 10) return 3;
  if (hour < 13) return 4;
  if (hour < 18) return 5;
  return 6;
}

export function startCronJobs(): void {
  console.log("📅 Starting cron jobs...");

  // 08:00 - Host confirmations and player invites
  cron.schedule("0 8 * * *", async () => {
    if (isRunning) { console.log("⏭ Already running, skipping 08:00"); return; }
    isRunning = true;
    console.log("📅 Running 08:00...");
    await runHostAndPlayerJobs().finally(() => { isRunning = false; });
  });

  // 12:30 - Player invites (Mon-Thu)
  cron.schedule("30 12 * * *", async () => {
    if (isRunning) { console.log("⏭ Already running, skipping 12:30"); return; }
    const day = new Date().getDay();
    if (day >= 1 && day <= 4) {
      isRunning = true;
      console.log("📨 Running 12:30...");
      await runPlayerInviteJobs().finally(() => { isRunning = false; });
    }
  });

  // 17:00 - Player invites (Mon-Thu)
  cron.schedule("0 17 * * *", async () => {
    if (isRunning) { console.log("⏭ Already running, skipping 17:00"); return; }
    const day = new Date().getDay();
    if (day >= 1 && day <= 4) {
      isRunning = true;
      console.log("📨 Running 17:00...");
      await runPlayerInviteJobs().finally(() => { isRunning = false; });
    }
  });

  // 13:00 - Host reminders
  cron.schedule("0 13 * * *", async () => {
    if (isRunning) { console.log("⏭ Already running, skipping 13:00"); return; }
    isRunning = true;
    console.log("📨 Running 13:00 host reminders...");
    await runHostReminderJobs().finally(() => { isRunning = false; });
  });

  console.log(
    "✅ Cron: 08:00 (hosts+players), 12:30 & 17:00 (mon-thu), 13:00 (host reminders)",
  );
}

async function runHostAndPlayerJobs(): Promise<void> {
  const smsClient = await getSMSClientWithCache();

  // Host confirmations
  const hostDate = new Date();
  hostDate.setDate(hostDate.getDate() + HOST_DAYS_AHEAD);
  const hostDateStr = hostDate.toISOString().split("T")[0];
  const hostDayNum = hostDate.getDay();

  await sendHostConfirmations(smsClient, hostDateStr, hostDayNum);

  // Player invites
  await runPlayerInviteJobs();
}

async function runPlayerInviteJobs(): Promise<void> {
  const smsClient = await getSMSClientWithCache();
  const round = getRound();

  for (let days = PLAYER_DAYS_AHEAD; days >= 1; days--) {
    const target = new Date();
    target.setDate(target.getDate() + days);
    const dateStr = target.toISOString().split("T")[0];
    const dayNum = target.getDay();

    await sendPlayerInvites(smsClient, dateStr, dayNum, round);
  }
}

async function runHostReminderJobs(): Promise<void> {
  const smsClient = await getSMSClientWithCache();
  const targetDates: Date[] = [];
  const dayNums: number[] = [];

  for (let days = 5; days >= 1; days--) {
    const target = new Date();
    target.setDate(target.getDate() + days);
    targetDates.push(target);
    dayNums.push(target.getDay());
  }

  await sendHostReminders(smsClient, targetDates, dayNums);
}
