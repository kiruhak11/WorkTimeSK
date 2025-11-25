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
    const body = await readBody(event)
    const { userId, weekStart, weekEnd, monday, tuesday, wednesday, thursday, friday, saturday, sunday } = body
    
    if (!userId || !weekStart || !weekEnd) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Не указаны обязательные поля'
      })
    }
    
    // Расчет общего количества часов
    const totalHours = 
      calculateHours(monday) +
      calculateHours(tuesday) +
      calculateHours(wednesday) +
      calculateHours(thursday) +
      calculateHours(friday) +
      calculateHours(saturday) +
      calculateHours(sunday)
    
    // Проверка существующего расписания на эту неделю
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        userId,
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd)
      }
    })
    
    if (existingSchedule) {
      // Обновление существующего расписания
      const schedule = await prisma.schedule.update({
        where: { id: existingSchedule.id },
        data: {
          monday,
          tuesday,
          wednesday,
          thursday,
          friday,
          saturday,
          sunday,
          totalHours,
          isConfirmed: false
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
    } else {
      // Создание нового расписания
      const schedule = await prisma.schedule.create({
        data: {
          userId,
          weekStart: new Date(weekStart),
          weekEnd: new Date(weekEnd),
          monday,
          tuesday,
          wednesday,
          thursday,
          friday,
          saturday,
          sunday,
          totalHours,
          isConfirmed: false
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
    }
  } catch (error: any) {
    console.error('Create/Update schedule error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Ошибка при создании/обновлении расписания'
    })
  }
})


