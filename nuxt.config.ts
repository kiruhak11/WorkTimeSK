// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  telemetry: false,
  
  srcDir: 'app/',
  
  css: ['~/assets/styles/main.scss'],
  
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/styles/variables.scss" as *;'
        }
      }
    }
  },
  
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    secretRegistrationCode: process.env.SECRET_REGISTRATION_CODE,
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3000'
    }
  },
  
  nitro: {
    experimental: {
      openAPI: true
    },
    // Настройки для работы с Nginx reverse proxy
    // Приложение будет слушать на 0.0.0.0:3000 внутри контейнера
    // Nginx будет проксировать с порта 3025 на порт 3000 контейнера
    // Переменные окружения доступны напрямую в серверных роутах
    runtimeConfig: {
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN
    }
  }
})
