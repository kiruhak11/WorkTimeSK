import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Удаляем все расписания (каскадное удаление не требуется, но удалим явно)
    await prisma.schedule.deleteMany({})
    
    // Удаляем всех пользователей
    await prisma.user.deleteMany({})
    
    return {
      success: true,
      message: 'База данных успешно очищена'
    }
  } catch (error: any) {
    console.error('Clear database error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при очистке базы данных'
    })
  }
})

