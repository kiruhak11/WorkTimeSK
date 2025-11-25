import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { weekStart, weekEnd } = query
    
    let where: any = {}
    
    if (weekStart && weekEnd) {
      where = {
        weekStart: new Date(weekStart as string),
        weekEnd: new Date(weekEnd as string)
      }
    }
    
    const schedules = await prisma.schedule.findMany({
      where,
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
      },
      orderBy: [
        { user: { position: 'asc' } },
        { user: { lastName: 'asc' } }
      ]
    })
    
    return {
      success: true,
      schedules
    }
  } catch (error: any) {
    console.error('Get schedules error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении расписаний'
    })
  }
})


