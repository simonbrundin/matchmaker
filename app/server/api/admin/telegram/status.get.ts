import { useRuntimeConfig } from '#imports'

export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  return {
    hasBotToken: !!config.telegramBotToken,
    hasAdminChatId: !!config.adminTelegramChatId,
    adminChatId: config.adminTelegramChatId || null
  }
})