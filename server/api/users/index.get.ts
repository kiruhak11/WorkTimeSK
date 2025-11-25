import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: [
        { position: 'asc' },
        { lastName: 'asc' }
      ],
      select: {
        id: true,
        telegramId: true,
        firstName: true,
        lastName: true,
        position: true,
        isAdmin: true,
        createdAt: true
      }
    })
    
    return {
      success: true,
      users
    }
  } catch (error: any) {
    console.error('Get users error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении списка пользователей'
    })
  }
})


