export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: ["@nuxt/ui", "@nuxt/content", "@nuxtjs/color-mode"],
  css: ["~/assets/css/main.css"],

  components: [
    {
      path: "~/components",
      pathPrefix: false,
    },
  ],

  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: "github-light",
            dark: "github-dark",
          },
          langs: ["typescript", "javascript", "sql", "bash"],
        },
      },
    },
  },

  ui: {
    experimental: {
      componentDetection: true,
    },
  },

  colorMode: {
    preference: "dark",
    fallback: "light",
  },

  runtimeConfig: {
    smsGatewayUrl: process.env.SMS_GATEWAY_URL,
    smsGatewayUsername: process.env.SMS_GATEWAY_USERNAME,
    smsGatewayPassword: process.env.SMS_GATEWAY_PASSWORD,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    openaiApiKey: process.env.OPENAI_API_KEY,
    adminTelegramChatId: process.env.ADMIN_TELEGRAM_CHAT_ID,
  },
});
