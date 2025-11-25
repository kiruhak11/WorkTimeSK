# Решение проблемы конфликта бота

## Ошибка: Conflict: terminated by other getUpdates request

Эта ошибка возникает, когда запущено несколько экземпляров бота одновременно. Telegram API не позволяет нескольким экземплярам одного бота получать обновления одновременно.

## Решение

### Шаг 1: Остановите все экземпляры бота

#### В Docker:
```bash
# Остановите и удалите контейнер бота
docker-compose stop bot
docker-compose rm -f bot

# Или остановите все контейнеры
docker-compose down

# Проверьте, нет ли других запущенных контейнеров
docker ps -a | grep worktimesk-bot
```

#### Вне Docker (если бот запущен локально):
```bash
# Найдите процессы Python, запущенные ботом
ps aux | grep bot.py

# Остановите процесс (замените PID на реальный)
kill <PID>

# Или остановите все процессы Python с bot.py
pkill -f bot.py
```

### Шаг 2: Перезапустите бот (только один экземпляр)

#### Через Docker (рекомендуется):
```bash
# Пересоберите контейнер (если нужно)
docker-compose build bot

# Запустите только бот
docker-compose up -d bot

# Проверьте логи
docker-compose logs -f bot
```

#### Или локально:
```bash
cd /path/to/worktimesk/bot
source venv/bin/activate  # или другое виртуальное окружение
python bot.py
```

### Шаг 3: Проверка

Убедитесь, что запущен только один экземпляр:

```bash
# Проверьте Docker контейнеры
docker ps | grep worktimesk-bot

# Должен быть только один контейнер со статусом "Up"

# Проверьте логи
docker-compose logs bot | tail -20

# Не должно быть ошибок Conflict
```

## Профилактика

1. **Не запускайте бот одновременно в Docker и локально**
2. **Убедитесь, что в docker-compose.yml указан только один сервис bot**
3. **Не создавайте несколько контейнеров с одним и тем же именем**
4. **Используйте `restart: unless-stopped` в docker-compose для автоматического перезапуска**

## Дополнительные проверки

Если проблема сохраняется:

1. Проверьте, не запущен ли webhook:
```bash
# Через API Telegram можно проверить webhook
curl https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo
```

2. Если webhook установлен, удалите его:
```bash
curl -X POST https://api.telegram.org/bot<YOUR_TOKEN>/deleteWebhook?drop_pending_updates=true
```

3. Перезапустите бота после удаления webhook

## Важно

- В коде бота теперь добавлен автоматический удалитель webhook при запуске
- Добавлен обработчик ошибок для более понятных сообщений
- Бот автоматически игнорирует старые обновления при запуске (`drop_pending_updates=True`)

