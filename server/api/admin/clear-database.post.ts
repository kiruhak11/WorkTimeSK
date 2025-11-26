import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    console.log('[CLEAR DB API] Starting database clear operation...')
    
    // Удаляем все расписания (каскадное удаление не требуется, но удалим явно)
    let deletedSchedules
    try {
      deletedSchedules = await prisma.schedule.deleteMany({})
      console.log(`[CLEAR DB API] Deleted ${deletedSchedules.count} schedules`)
    } catch (prismaError: any) {
      console.error('[CLEAR DB API] Prisma deleteMany schedules error:', prismaError)
      throw createError({
        statusCode: 500,
        statusMessage: `Ошибка базы данных при удалении расписаний: ${prismaError.message || 'Неизвестная ошибка'}`
      })
    }
    
    // Удаляем всех пользователей
    let deletedUsers
    try {
      deletedUsers = await prisma.user.deleteMany({})
      console.log(`[CLEAR DB API] Deleted ${deletedUsers.count} users`)
    } catch (prismaError: any) {
      console.error('[CLEAR DB API] Prisma deleteMany users error:', prismaError)
      throw createError({
        statusCode: 500,
        statusMessage: `Ошибка базы данных при удалении пользователей: ${prismaError.message || 'Неизвестная ошибка'}`
      })
    }
    
    console.log('[CLEAR DB API] Database cleared successfully')
    
    setResponseStatus(event, 200)
    return {
      success: true,
      message: 'База данных успешно очищена',
      deletedUsers: deletedUsers.count,
      deletedSchedules: deletedSchedules.count
    }
  } catch (error: any) {
    console.error('[CLEAR DB API] Clear database error:', error)
    console.error('[CLEAR DB API] Error details:', {
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
      statusMessage: error.statusMessage || error.message || 'Ошибка при очистке базы данных'
    })
  }
})



