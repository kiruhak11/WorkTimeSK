# Решение проблемы с TELEGRAM_BOT_TOKEN

## Проблема
При подтверждении расписания появляется ошибка:
```
TELEGRAM_BOT_TOKEN not configured
Sent 0/X notifications
```

## Причина
Переменная окружения `TELEGRAM_BOT_TOKEN` не передается или не доступна в серверных API роутах Nuxt 3.

## Решение

### 1. Проверьте файл .env

Убедитесь, что в корне проекта (рядом с docker-compose.yml) есть файл `.env` с правильным токеном:

```bash
cd /var/www/html/worktimesk
cat .env
```

Файл должен содержать:
```env
TELEGRAM_BOT_TOKEN=ваш_реальный_токен_здесь
DATABASE_URL="postgresql://postgres:postgres@db:5432/worktimesk?schema=public"
SECRET_REGISTRATION_CODE="1234"
API_BASE_URL="http://web:3000"
```

### 2. Проверьте, что переменная передается в контейнер

```bash
# Проверьте переменные окружения в контейнере web
docker exec worktimesk-web env | grep TELEGRAM
```

Должно вывести токен (или пустую строку, если не настроен).

### 3. Создайте файл .env если его нет

```bash
cd /var/www/html/worktimesk

# Создайте файл из примера
cp env.example .env

# Отредактируйте файл и добавьте ваш токен
nano .env
# или
vim .env
```

### 4. Пересоздайте контейнер web

После создания/изменения `.env` файла:

```bash
# Остановите контейнер
docker-compose stop web

# Пересоздайте контейнер (переменные окружения загружаются при запуске)
docker-compose up -d --force-recreate web

# Проверьте логи
docker-compose logs -f web
```

### 5. Проверка работы

После перезапуска попробуйте подтвердить расписание снова. В логах должно быть:
```
Sent X/X notifications
```

Вместо:
```
TELEGRAM_BOT_TOKEN not configured
Sent 0/X notifications
```

## Альтернативное решение

Если проблема сохраняется, можно передать токен напрямую в docker-compose.yml (не рекомендуется для продакшена):

```yaml
web:
  environment:
    TELEGRAM_BOT_TOKEN: "ваш_токен_напрямую"
```

Но лучше использовать `.env` файл для безопасности.

## Проверка токена

Убедитесь, что токен валидный:

```bash
# Проверьте токен через Telegram API
curl "https://api.telegram.org/botВАШ_ТОКЕН/getMe"
```

Должен вернуть информацию о боте, например:
```json
{"ok":true,"result":{"id":123456789,"is_bot":true,"first_name":"YourBot"}}
```

## Важно

- Файл `.env` не должен коммититься в git (должен быть в .gitignore)
- Храните токен в секрете
- После изменения `.env` нужно перезапустить контейнер `web`

