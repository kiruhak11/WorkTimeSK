import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { department } = body
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID пользователя не указан'
      })
    }
    
    if (!department || !['кухня', 'штат'].includes(department)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный тип отдела. Допустимые значения: кухня, штат'
      })
    }
    
    // Проверяем существование пользователя
    const user = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Пользователь не найден'
      })
    }
    
    // Обновляем тип отдела
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        department
      }
    })
    
    return {
      success: true,
      message: 'Тип пользователя успешно изменен',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        department: updatedUser.department,
        position: updatedUser.position
      }
    }
  } catch (error: any) {
    console.error('Change department error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Ошибка при изменении типа пользователя'
    })
  }
})


