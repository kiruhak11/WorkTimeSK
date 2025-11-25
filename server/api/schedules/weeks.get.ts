import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Получаем все уникальные недели из расписаний
    const allSchedules = await prisma.schedule.findMany({
      select: {
        weekStart: true,
        weekEnd: true
      }
    })
    
    // Убираем дубликаты по датам
    const uniqueWeeks = new Map<string, { weekStart: Date; weekEnd: Date }>()
    
    allSchedules.forEach(schedule => {
      const startKey = schedule.weekStart.toISOString().split('T')[0]
      if (!uniqueWeeks.has(startKey)) {
        uniqueWeeks.set(startKey, {
          weekStart: schedule.weekStart,
          weekEnd: schedule.weekEnd
        })
      }
    })
    
    // Форматируем недели и сортируем по дате
    const weeks = Array.from(uniqueWeeks.values())
      .map(({ weekStart, weekEnd }) => ({
        weekStart,
        weekEnd,
        label: formatWeekLabel(weekStart, weekEnd)
      }))
      .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime())
    
    // Добавляем текущую неделю если её нет
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayOfWeek = today.getDay()
    const currentMonday = new Date(today)
    currentMonday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    currentMonday.setHours(0, 0, 0, 0)
    
    const currentSunday = new Date(currentMonday)
    currentSunday.setDate(currentMonday.getDate() + 6)
    currentSunday.setHours(23, 59, 59, 999)
    
    // Проверяем, есть ли текущая неделя в списке
    const hasCurrentWeek = weeks.some(w => {
      const wStart = new Date(w.weekStart)
      wStart.setHours(0, 0, 0, 0)
      return wStart.getTime() === currentMonday.getTime()
    })
    
    if (!hasCurrentWeek) {
      weeks.push({
        weekStart: currentMonday,
        weekEnd: currentSunday,
        label: formatWeekLabel(currentMonday, currentSunday) + ' (Текущая)'
      })
    } else {
      // Обновляем метку текущей недели
      const currentWeekIndex = weeks.findIndex(w => {
        const wStart = new Date(w.weekStart)
        wStart.setHours(0, 0, 0, 0)
        return wStart.getTime() === currentMonday.getTime()
      })
      if (currentWeekIndex >= 0 && !weeks[currentWeekIndex].label.includes('(Текущая)')) {
        weeks[currentWeekIndex].label = formatWeekLabel(weeks[currentWeekIndex].weekStart, weeks[currentWeekIndex].weekEnd) + ' (Текущая)'
      }
    }
    
    // Добавляем следующую неделю
    const nextMonday = new Date(currentMonday)
    nextMonday.setDate(currentMonday.getDate() + 7)
    nextMonday.setHours(0, 0, 0, 0)
    const nextSunday = new Date(nextMonday)
    nextSunday.setDate(nextMonday.getDate() + 6)
    nextSunday.setHours(23, 59, 59, 999)
    
    const hasNextWeek = weeks.some(w => {
      const wStart = new Date(w.weekStart)
      wStart.setHours(0, 0, 0, 0)
      return wStart.getTime() === nextMonday.getTime()
    })
    
    if (!hasNextWeek) {
      weeks.unshift({
        weekStart: nextMonday,
        weekEnd: nextSunday,
        label: formatWeekLabel(nextMonday, nextSunday) + ' (Следующая)'
      })
    }
    
    // Сортируем: следующая, текущая, затем по убыванию
    weeks.sort((a, b) => {
      const aStart = new Date(a.weekStart).getTime()
      const bStart = new Date(b.weekStart).getTime()
      if (a.label.includes('(Следующая)')) return -1
      if (b.label.includes('(Следующая)')) return 1
      if (a.label.includes('(Текущая)')) return -1
      if (b.label.includes('(Текущая)')) return 1
      return bStart - aStart
    })
    
    return {
      success: true,
      weeks
    }
  } catch (error: any) {
    console.error('Get weeks error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении списка недель'
    })
  }
})

function formatWeekLabel(start: Date, end: Date): string {
  const startDay = start.getDate()
  const startMonth = start.getMonth() + 1
  const startYear = start.getFullYear()
  
  const endDay = end.getDate()
  const endMonth = end.getMonth() + 1
  const endYear = end.getFullYear()
  
  return `${startDay}.${startMonth}.${startYear}-${endDay}.${endMonth}.${endYear}`
}

