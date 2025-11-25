import os
import logging
import requests
from typing import Dict
from telegram import Update, ReplyKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ConversationHandler,
    ContextTypes,
    filters,
)
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Константы
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
API_BASE_URL = os.getenv('API_BASE_URL', 'http://web:3000')
SECRET_CODE = '1517'  # Секретный код регистрации

# Состояния для ConversationHandler
FIRST_NAME, LAST_NAME, POSITION, SECRET = range(4)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Начало регистрации"""
    user = update.effective_user
    telegram_id = str(user.id)
    
    # Проверяем, зарегистрирован ли пользователь
    try:
        response = requests.get(f'{API_BASE_URL}/api/users')
        if response.status_code == 200:
            users = response.json().get('users', [])
            existing_user = next((u for u in users if u['telegramId'] == telegram_id), None)
            
            if existing_user:
                await update.message.reply_text(
                    f"Вы уже зарегистрированы!\n\n"
                    f"Имя: {existing_user['firstName']} {existing_user['lastName']}\n"
                    f"Должность: {existing_user['position']}\n\n"
                    f"Администратор может добавить ваше расписание на сайте.",
                    reply_markup=ReplyKeyboardRemove()
                )
                return ConversationHandler.END
    except Exception as e:
        logger.error(f"Error checking user: {e}")
    
    await update.message.reply_text(
        "Привет! Я помогу вам зарегистрироваться в системе управления расписанием.\n\n"
        "Для регистрации мне нужна следующая информация:\n"
        "1. Имя\n"
        "2. Фамилия\n"
        "3. Должность\n"
        "4. Секретный код\n\n"
        "Давайте начнем! Напишите ваше имя:",
        reply_markup=ReplyKeyboardRemove()
    )
    return FIRST_NAME


async def first_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Получаем имя"""
    context.user_data['first_name'] = update.message.text
    await update.message.reply_text("Отлично! Теперь напишите вашу фамилию:")
    return LAST_NAME


async def last_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Получаем фамилию"""
    context.user_data['last_name'] = update.message.text
    
    # Предлагаем варианты должностей
    keyboard = [
        ['Курьер'],
        ['Менеджер'],
        ['Другое']
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True, resize_keyboard=True)
    
    await update.message.reply_text(
        "Хорошо! Теперь выберите вашу должность:",
        reply_markup=reply_markup
    )
    return POSITION


async def position(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Получаем должность"""
    position_text = update.message.text
    
    if position_text == 'Другое':
        await update.message.reply_text(
            "Пожалуйста, напишите вашу должность:",
            reply_markup=ReplyKeyboardRemove()
        )
        return POSITION
    
    context.user_data['position'] = position_text
    await update.message.reply_text(
        "Отлично! Теперь введите секретный код для завершения регистрации:",
        reply_markup=ReplyKeyboardRemove()
    )
    return SECRET


async def secret(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Проверяем секретный код и завершаем регистрацию"""
    secret_code = update.message.text
    
    if secret_code != SECRET_CODE:
        await update.message.reply_text(
            "❌ Неверный секретный код!\n\n"
            "Пожалуйста, попробуйте еще раз или свяжитесь с администратором.",
            reply_markup=ReplyKeyboardRemove()
        )
        return ConversationHandler.END
    
    # Регистрируем пользователя
    user = update.effective_user
    try:
        response = requests.post(
            f'{API_BASE_URL}/api/auth/register',
            json={
                'telegramId': str(user.id),
                'firstName': context.user_data['first_name'],
                'lastName': context.user_data['last_name'],
                'position': context.user_data['position'],
                'secretCode': secret_code
            }
        )
        
        if response.status_code == 200:
            await update.message.reply_text(
                "✅ Регистрация успешно завершена!\n\n"
                f"Имя: {context.user_data['first_name']} {context.user_data['last_name']}\n"
                f"Должность: {context.user_data['position']}\n\n"
                "Теперь администратор может добавить ваше расписание на сайте. "
                "Вы будете получать уведомления о вашем расписании каждую неделю.",
                reply_markup=ReplyKeyboardRemove()
            )
        else:
            error_message = response.json().get('statusMessage', 'Неизвестная ошибка')
            await update.message.reply_text(
                f"❌ Ошибка при регистрации: {error_message}\n\n"
                "Пожалуйста, попробуйте еще раз командой /start",
                reply_markup=ReplyKeyboardRemove()
            )
    except Exception as e:
        logger.error(f"Registration error: {e}")
        await update.message.reply_text(
            "❌ Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.",
            reply_markup=ReplyKeyboardRemove()
        )
    
    return ConversationHandler.END


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Отмена регистрации"""
    await update.message.reply_text(
        "Регистрация отменена. Используйте /start для начала регистрации.",
        reply_markup=ReplyKeyboardRemove()
    )
    return ConversationHandler.END


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Помощь"""
    await update.message.reply_text(
        "🤖 Доступные команды:\n\n"
        "/start - Начать регистрацию\n"
        "/cancel - Отменить текущую операцию\n"
        "/help - Показать это сообщение\n\n"
        "Для регистрации используйте команду /start"
    )


def send_schedule_notification(telegram_id: str, schedule_data: Dict) -> bool:
    """Отправка уведомления о расписании пользователю"""
    try:
        # Формируем сообщение с расписанием
        message = (
            f"📅 Ваше расписание на неделю:\n\n"
            f"Понедельник: {schedule_data.get('monday', 'выходной')}\n"
            f"Вторник: {schedule_data.get('tuesday', 'выходной')}\n"
            f"Среда: {schedule_data.get('wednesday', 'выходной')}\n"
            f"Четверг: {schedule_data.get('thursday', 'выходной')}\n"
            f"Пятница: {schedule_data.get('friday', 'выходной')}\n"
            f"Суббота: {schedule_data.get('saturday', 'выходной')}\n"
            f"Воскресенье: {schedule_data.get('sunday', 'выходной')}\n\n"
            f"Всего часов: {schedule_data.get('totalHours', 0)}"
        )
        
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        data = {
            "chat_id": telegram_id,
            "text": message
        }
        response = requests.post(url, json=data)
        return response.status_code == 200
    except Exception as e:
        logger.error(f"Error sending notification: {e}")
        return False


def main() -> None:
    """Запуск бота"""
    if not TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not found!")
        return
    
    # Создаем приложение
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    # Создаем ConversationHandler для регистрации
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler('start', start)],
        states={
            FIRST_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, first_name)],
            LAST_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, last_name)],
            POSITION: [MessageHandler(filters.TEXT & ~filters.COMMAND, position)],
            SECRET: [MessageHandler(filters.TEXT & ~filters.COMMAND, secret)],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
    )
    
    # Добавляем обработчики
    application.add_handler(conv_handler)
    application.add_handler(CommandHandler('help', help_command))
    
    # Запускаем бота
    logger.info("Bot started!")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
    main()


