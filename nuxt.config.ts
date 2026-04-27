export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  modules: ['@nuxtjs/supabase'],

  supabase: {
    redirect: false,
    redirectOptions: {
      exclude: ['/api/**'],
    },
  },

  nitro: {
    devWorker: {
      reuse: true,
    },
  },

  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
    smsGatewayUrl: process.env.SMS_GATEWAY_URL,
    smsGatewayApiKey: process.env.SMS_GATEWAY_API_KEY,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    openaiApiKey: process.env.OPENAI_API_KEY,
    adminTelegramChatId: process.env.ADMIN_TELEGRAM_CHAT_ID,
    
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY,
    },
  },
})