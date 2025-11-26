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
      throw createError({
        statusCode: 400,
        statusMessage: 'ID пользователя не указан'
      })
    }
    
    // Получаем пользователя перед удалением
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        telegramId: true
      }
    })
    
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Пользователь не найден'
      })
    }
    
    // Удаляем пользователя (каскадное удаление расписаний)
    await prisma.user.delete({
      where: { id }
    })
    
    // Отправляем сообщение в Telegram
    const telegramMessage = `👋 Добрый день, ${user.firstName} ${user.lastName}!\n\n` +
      `К сожалению, ваш аккаунт был удален из системы управления расписанием.\n\n` +
      `Спасибо за работу! Желаем вам успехов в дальнейшем!`
    
    await sendTelegramNotification(user.telegramId, telegramMessage, event)
    
    return {
      success: true,
      message: 'Пользователь успешно удален'
    }
  } catch (error: any) {
    console.error('Delete user error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Ошибка при удалении пользователя'
    })
  }
})





