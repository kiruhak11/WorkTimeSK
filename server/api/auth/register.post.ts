import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { telegramId, firstName, lastName, department, position, secretCode } = body
    
    // Проверка секретного кода (хардкод в коде)
    const SECRET_REGISTRATION_CODE = '1517'
    if (secretCode !== SECRET_REGISTRATION_CODE) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Неверный секретный код'
      })
    }
    
    // Проверка обязательных полей
    if (!telegramId || !firstName || !lastName || !position) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Все поля обязательны для заполнения'
      })
    }
    
    // Проверка существования пользователя
    const existingUser = await prisma.user.findUnique({
      where: { telegramId: String(telegramId) }
    })
    
    if (existingUser) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Пользователь с таким Telegram ID уже зарегистрирован'
      })
    }
    
    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        telegramId: String(telegramId),
        firstName,
        lastName,
        department: department || 'штат',
        position,
        isAdmin: false
      }
    })
    
    return {
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        position: user.position
      }
    }
  } catch (error: any) {
    console.error('Registration error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Ошибка при регистрации'
    })
  }
})


