import { Bot, Context } from 'grammy'

export interface TelegramMessage {
  message_id: number
  chat: { id: number; type: string }
  from?: {
    id: number
    is_bot: boolean
    first_name?: string
    username?: string
  }
  text?: string
  date: number
}

let telegramBot: Bot | null = null
let adminChatId: string | null = null

export function initTelegramBot(): Bot {
  if (!telegramBot) {
    const config = useRuntimeConfig()
    if (!config.telegramBotToken) {
      throw new Error('Telegram bot token missing')
    }
    telegramBot = new Bot(config.telegramBotToken as string)
    adminChatId = config.adminTelegramChatId as string | null
  }
  return telegramBot
}

export async function sendToAdmin(
  text: string,
  extra?: { reply_markup?: any }
): Promise<void> {
  const bot = initTelegramBot()
  if (adminChatId) {
    await bot.api.sendMessage(adminChatId, text, extra)
  }
}

export async function sendToChat(
  chatId: number | string,
  text: string,
  extra?: { reply_markup?: any }
): Promise<void> {
  const bot = initTelegramBot()
  await bot.api.sendMessage(chatId, text, extra)
}

export type MessageHandler = (ctx: Context) => void | Promise<void>

export function onTextMessage(handler: MessageHandler): void {
  const bot = initTelegramBot()
  bot.on('message:text', handler)
}

export function startTelegramPolling(): void {
  const bot = initTelegramBot()
  bot.start()
}

export function stopTelegramPolling(): void {
  if (telegramBot) {
    telegramBot.stop()
  }
}