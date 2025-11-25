import prisma from '../../utils/prisma'

// Функция отправки уведомления в Telegram
async function sendTelegramNotification(telegramId: string, scheduleData: any) {
  try {
    const config = useRuntimeConfig()
    const token = config.telegramBotToken
    
    if (!token) {
      console.error('TELEGRAM_BOT_TOKEN not configured')
      return false
    }
    
    const message = `📅 Ваше расписание на неделю:

Понедельник: ${scheduleData.monday || 'выходной'}
Вторник: ${scheduleData.tuesday || 'выходной'}
Среда: ${scheduleData.wednesday || 'выходной'}
Четверг: ${scheduleData.thursday || 'выходной'}
Пятница: ${scheduleData.friday || 'выходной'}
Суббота: ${scheduleData.saturday || 'выходной'}
Воскресенье: ${scheduleData.sunday || 'выходной'}

Всего часов: ${scheduleData.totalHours}`
    
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
    const body = await readBody(event)
    const { weekStart, weekEnd } = body
    
    if (!weekStart || !weekEnd) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Не указаны даты недели'
      })
    }
    
    // Подтверждаем все расписания на эту неделю
    await prisma.schedule.updateMany({
      where: {
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd)
      },
      data: {
        isConfirmed: true
      }
    })
    
    // Получаем обновленные расписания
    const schedules = await prisma.schedule.findMany({
      where: {
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd)
      },
      include: {
        user: {
          select: {
            id: true,
            telegramId: true,
            firstName: true,
            lastName: true,
            position: true
          }
        }
      }
    })
    
    // Отправляем уведомления каждому сотруднику
    const notificationResults = await Promise.allSettled(
      schedules.map(schedule => 
        sendTelegramNotification(schedule.user.telegramId, schedule)
      )
    )
    
    const successCount = notificationResults.filter(r => r.status === 'fulfilled' && r.value).length
    console.log(`Sent ${successCount}/${schedules.length} notifications`)
    
    return {
      success: true,
      message: 'Расписания подтверждены',
      schedules,
      notificationsSent: successCount
    }
  } catch (error: any) {
    console.error('Confirm schedules error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Ошибка при подтверждении расписаний'
    })
  }
})

