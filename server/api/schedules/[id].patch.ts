import prisma from '../../utils/prisma'

// Функция для расчета часов из строки времени
function calculateHours(timeString: string | null): number {
  if (!timeString || timeString.toLowerCase() === 'выходной' || timeString.toLowerCase() === 'в') {
    return 0
  }
  
  const match = timeString.match(/(\d{1,2})-(\d{1,2})/)
  if (!match) return 0
  
  let start = parseInt(match[1])
  let end = parseInt(match[2])
  
  // Если end = 24, это означает полночь (00:00 следующего дня)
  if (end === 24) {
    return 24 - start
  }
  
  // Если end < start, значит работа через полночь
  if (end < start) {
    end += 24
  }
  
  return end - start
}

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID расписания не указан'
      })
    }
    
    // Получаем текущее расписание
    const currentSchedule = await prisma.schedule.findUnique({
      where: { id },
      select: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true
      }
    })
    
    if (!currentSchedule) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Расписание не найдено'
      })
    }
    
    // Обновляем только переданные дни, остальные оставляем как есть
    const updatedSchedule = {
      monday: body.monday !== undefined ? body.monday : currentSchedule.monday,
      tuesday: body.tuesday !== undefined ? body.tuesday : currentSchedule.tuesday,
      wednesday: body.wednesday !== undefined ? body.wednesday : currentSchedule.wednesday,
      thursday: body.thursday !== undefined ? body.thursday : currentSchedule.thursday,
      friday: body.friday !== undefined ? body.friday : currentSchedule.friday,
      saturday: body.saturday !== undefined ? body.saturday : currentSchedule.saturday,
      sunday: body.sunday !== undefined ? body.sunday : currentSchedule.sunday
    }
    
    // Пересчитываем общее количество часов на основе ВСЕХ дней
    const totalHours = 
      calculateHours(updatedSchedule.monday) +
      calculateHours(updatedSchedule.tuesday) +
      calculateHours(updatedSchedule.wednesday) +
      calculateHours(updatedSchedule.thursday) +
      calculateHours(updatedSchedule.friday) +
      calculateHours(updatedSchedule.saturday) +
      calculateHours(updatedSchedule.sunday)
    
    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        ...updatedSchedule,
        totalHours
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true
          }
        }
      }
    })
    
    return {
      success: true,
      schedule
    }
  } catch (error: any) {
    console.error('Update schedule error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Ошибка при обновлении расписания'
    })
  }
})


