import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    console.log('Starting database clear operation...')
    
    // Удаляем все расписания (каскадное удаление не требуется, но удалим явно)
    const deletedSchedules = await prisma.schedule.deleteMany({})
    console.log(`Deleted ${deletedSchedules.count} schedules`)
    
    // Удаляем всех пользователей
    const deletedUsers = await prisma.user.deleteMany({})
    console.log(`Deleted ${deletedUsers.count} users`)
    
    console.log('Database cleared successfully')
    
    return {
      success: true,
      message: 'База данных успешно очищена',
      deletedUsers: deletedUsers.count,
      deletedSchedules: deletedSchedules.count
    }
  } catch (error: any) {
    console.error('Clear database error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Ошибка при очистке базы данных'
    })
  }
})



