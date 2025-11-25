import prisma from '../../utils/prisma'
import * as XLSX from 'xlsx'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { weekStart, weekEnd } = query
    
    if (!weekStart || !weekEnd) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Не указаны даты недели'
      })
    }
    
    const schedules = await prisma.schedule.findMany({
      where: {
        weekStart: new Date(weekStart as string),
        weekEnd: new Date(weekEnd as string)
      },
      include: {
        user: {
          select: {
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
    
    // Формируем данные для таблицы
    const data = []
    
    // Заголовок
    const weekStartDate = new Date(weekStart as string)
    const weekEndDate = new Date(weekEnd as string)
    const weekTitle = `График курьеров на неделю ${weekStartDate.getDate()}.${weekStartDate.getMonth() + 1} - ${weekEndDate.getDate()}.${weekEndDate.getMonth() + 1}`
    
    data.push([weekTitle])
    data.push([])
    data.push(['ФИО', 'Должность', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс', 'Кол часов'])
    
    // Данные по сотрудникам
    schedules.forEach(schedule => {
      const fullName = `${schedule.user.lastName} ${schedule.user.firstName}`
      data.push([
        fullName,
        schedule.user.position,
        schedule.monday || 'в',
        schedule.tuesday || 'в',
        schedule.wednesday || 'в',
        schedule.thursday || 'в',
        schedule.friday || 'в',
        schedule.saturday || 'в',
        schedule.sunday || 'в',
        schedule.totalHours
      ])
    })
    
    // Создаем workbook
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(data)
    
    // Настройка ширины колонок
    ws['!cols'] = [
      { wch: 25 }, // ФИО
      { wch: 15 }, // Должность
      { wch: 12 }, // Пн
      { wch: 12 }, // Вт
      { wch: 12 }, // Ср
      { wch: 12 }, // Чт
      { wch: 12 }, // Пт
      { wch: 12 }, // Сб
      { wch: 12 }, // Вс
      { wch: 12 }  // Кол часов
    ]
    
    XLSX.utils.book_append_sheet(wb, ws, 'Расписание')
    
    // Генерируем буфер
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    
    // Устанавливаем заголовки для скачивания файла
    const filename = `schedule_${weekStartDate.getDate()}-${weekStartDate.getMonth() + 1}_${weekEndDate.getDate()}-${weekEndDate.getMonth() + 1}.xlsx`
    
    setResponseHeaders(event, {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString()
    })
    
    return buffer
  } catch (error: any) {
    console.error('Export schedule error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Ошибка при экспорте расписания'
    })
  }
})


