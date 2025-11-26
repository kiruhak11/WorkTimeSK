import prisma from '../../utils/prisma'

// Функция отправки уведомления в Telegram
async function sendTelegramNotification(telegramId: string, message: string, event?: any) {
  try {
    // Получаем токен из разных источников
    const config = useRuntimeConfig(event)
    let token = config.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN
    
    // Проверяем валидность токена
    if (!token || token === 'YOUR_BOT_TOKEN_HERE' || token.trim() === '') {
      console.error('TELEGRAM_BOT_TOKEN not configured or invalid')
      return false
    }
    
    const url = `https://api.telegram.org/bot${token}/sendMessage`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: telegramId,
        text: message
      })
    })
    
    return response.ok
  } catch (error) {
    console.error('Error sending telegram notification:', error)
    return false
  }
}

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      console.error('[DELETE USER API] User ID is missing')
      throw createError({
        statusCode: 400,
        statusMessage: 'ID пользователя не указан'
      })
    }
    
    console.log(`[DELETE USER API] Attempting to delete user with ID: ${id}`)
    
    // Получаем пользователя перед удалением
    let user
    try {
      user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          telegramId: true
        }
      })
    } catch (prismaError: any) {
      console.error('[DELETE USER API] Prisma findUnique error:', prismaError)
      throw createError({
        statusCode: 500,
        statusMessage: `Ошибка базы данных при поиске пользователя: ${prismaError.message || 'Неизвестная ошибка'}`
      })
    }
    
    if (!user) {
      console.log(`[DELETE USER API] User with ID ${id} not found`)
      throw createError({
        statusCode: 404,
        statusMessage: 'Пользователь не найден'
      })
    }
    
    console.log(`[DELETE USER API] Found user: ${user.firstName} ${user.lastName}, deleting...`)
    
    // Удаляем пользователя (каскадное удаление расписаний)
    try {
      await prisma.user.delete({
        where: { id }
      })
      console.log(`[DELETE USER API] User ${id} deleted successfully`)
    } catch (prismaError: any) {
      console.error('[DELETE USER API] Prisma delete error:', prismaError)
      throw createError({
        statusCode: 500,
        statusMessage: `Ошибка базы данных при удалении пользователя: ${prismaError.message || 'Неизвестная ошибка'}`
      })
    }
    
    // Отправляем сообщение в Telegram (не блокируем удаление, если не удалось отправить)
    const telegramMessage = `👋 Добрый день, ${user.firstName} ${user.lastName}!\n\n` +
      `К сожалению, ваш аккаунт был удален из системы управления расписанием.\n\n` +
      `Спасибо за работу! Желаем вам успехов в дальнейшем!`
    
    try {
      const telegramSent = await sendTelegramNotification(user.telegramId, telegramMessage, event)
      if (telegramSent) {
        console.log(`[DELETE USER API] Telegram notification sent to user ${id}`)
      } else {
        console.warn(`[DELETE USER API] Failed to send Telegram notification to user ${id}, but user was deleted`)
      }
    } catch (telegramError: any) {
      console.error('[DELETE USER API] Failed to send Telegram notification, but user was deleted:', telegramError)
      // Не прерываем выполнение, если не удалось отправить сообщение
    }
    
    setResponseStatus(event, 200)
    return {
      success: true,
      message: 'Пользователь успешно удален'
    }
  } catch (error: any) {
    console.error('[DELETE USER API] Delete user error:', error)
    console.error('[DELETE USER API] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      statusCode: error.statusCode,
      name: error.name,
      stack: error.stack
    })
    
    // Если это уже createError, пробрасываем его дальше
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Ошибка при удалении пользователя'
    })
  }
})





