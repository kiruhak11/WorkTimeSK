import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID пользователя не указан'
      })
    }
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        schedules: {
          orderBy: { weekStart: 'desc' },
          take: 10
        }
      }
    })
    
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Пользователь не найден'
      })
    }
    
    return {
      success: true,
      user
    }
  } catch (error: any) {
    console.error('Get user error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Ошибка при получении пользователя'
    })
  }
})


