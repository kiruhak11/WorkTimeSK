# Обновление зависимостей бота

## Проблема
Python 3.14 требует python-telegram-bot версии 22.5 или выше для совместимости.

## Решение 1: Обновить python-telegram-bot (рекомендуется)

Выполните в терминале:

```bash
cd /Users/kirillkovalenko/Documents/WorkTimeSK/bot

# Активируйте виртуальное окружение
source lab_venv/bin/activate  # или если другое окружение

# Обновите зависимости
pip install --upgrade pip
pip install --upgrade python-telegram-bot requests python-dotenv

# Или переустановите все зависимости
pip install -r requirements.txt --upgrade
```

## Решение 2: Использовать Python 3.11-3.12 (альтернатива)

Если обновление не помогло, создайте новое виртуальное окружение с Python 3.11 или 3.12:

```bash
cd /Users/kirillkovalenko/Documents/WorkTimeSK/bot

# Удалите старое окружение (опционально)
rm -rf lab_venv

# Создайте новое с Python 3.11
python3.11 -m venv venv

# Или с Python 3.12
python3.12 -m venv venv

# Активируйте
source venv/bin/activate

# Установите зависимости
pip install -r requirements.txt
```

## Запуск бота после обновления

```bash
cd /Users/kirillkovalenko/Documents/WorkTimeSK/bot

# Убедитесь, что виртуальное окружение активировано
source lab_venv/bin/activate  # или source venv/bin/activate

# Создайте .env файл если еще не создан
cp env.example .env
# Отредактируйте .env и укажите ваш TELEGRAM_BOT_TOKEN

# Запустите бота
python bot.py
```

## Проверка версий

```bash
python --version  # Может быть Python 3.11.x, 3.12.x, или 3.14.x (с python-telegram-bot>=22.5)
pip list | grep telegram  # Должно показать python-telegram-bot 22.5 или выше
```

