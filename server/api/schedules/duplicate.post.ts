import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { fromWeekStart, fromWeekEnd, toWeekStart, toWeekEnd } = body
    
    if (!fromWeekStart || !fromWeekEnd || !toWeekStart || !toWeekEnd) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Не указаны даты недель'
      })
    }
    
    // Получаем расписания с прошлой недели
    const fromSchedules = await prisma.schedule.findMany({
      where: {
        weekStart: new Date(fromWeekStart),
        weekEnd: new Date(fromWeekEnd)
      },
      include: {
        user: true
      }
    })
    
    if (fromSchedules.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Не найдено расписаний на прошлую неделю'
      })
    }
    
    // Создаем новые расписания для текущей недели
    const newSchedules = await Promise.all(
      fromSchedules.map(async (schedule) => {
        // Проверяем, есть ли уже расписание для этого пользователя на текущую неделю
        const existing = await prisma.schedule.findFirst({
          where: {
            userId: schedule.userId,
            weekStart: new Date(toWeekStart),
            weekEnd: new Date(toWeekEnd)
          }
        })
        
        if (existing) {
          // Обновляем существующее расписание
          return prisma.schedule.update({
            where: { id: existing.id },
            data: {
              monday: schedule.monday,
              tuesday: schedule.tuesday,
              wednesday: schedule.wednesday,
              thursday: schedule.thursday,
              friday: schedule.friday,
              saturday: schedule.saturday,
              sunday: schedule.sunday,
              totalHours: schedule.totalHours,
              isConfirmed: false // Новое расписание не подтверждено
            }
          })
        } else {
          // Создаем новое расписание
          return prisma.schedule.create({
            data: {
              userId: schedule.userId,
              weekStart: new Date(toWeekStart),
              weekEnd: new Date(toWeekEnd),
              monday: schedule.monday,
              tuesday: schedule.tuesday,
              wednesday: schedule.wednesday,
              thursday: schedule.thursday,
              friday: schedule.friday,
              saturday: schedule.saturday,
              sunday: schedule.sunday,
              totalHours: schedule.totalHours,
              isConfirmed: false
            }
          })
        }
      })
    )
    
    return {
      success: true,
      message: 'Расписание успешно скопировано',
      schedules: newSchedules.length
    }
  } catch (error: any) {
    console.error('Duplicate schedule error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Ошибка при копировании расписания'
    })
  }
})

