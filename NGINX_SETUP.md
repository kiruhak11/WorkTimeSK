# Настройка Nginx для WorkTimeSK

## Проблема: Nginx показывает дефолтную страницу

Это означает, что конфигурация Nginx не активна или контейнер не запущен.

## Шаги для настройки:

### 1. Проверьте статус Docker контейнеров

```bash
docker ps -a | grep worktimesk
```

Убедитесь, что контейнер `worktimesk-web` запущен и работает:

```bash
docker-compose ps
```

Если контейнер не запущен:

```bash
cd /var/www/html/worktimesk
docker-compose up -d
```

### 2. Проверьте, что приложение доступно на порту 3025

```bash
curl http://127.0.0.1:3025
```

Если получаете ответ от приложения (не ошибку подключения), значит контейнер работает.

### 3. Активируйте конфигурацию Nginx

Создайте симлинк в `/etc/nginx/sites-enabled/`:

```bash
sudo ln -s /etc/nginx/sites-available/skpersonal /etc/nginx/sites-enabled/skpersonal
```

### 4. Убедитесь, что дефолтная конфигурация не конфликтует

Удалите или переименуйте дефолтную конфигурацию:

```bash
sudo rm /etc/nginx/sites-enabled/default
# или
sudo mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak
```

### 5. Проверьте конфигурацию Nginx

```bash
sudo nginx -t
```

Если есть ошибки, исправьте их.

### 6. Перезагрузите Nginx

```bash
sudo systemctl reload nginx
# или
sudo service nginx reload
```

### 7. Проверьте логи Nginx (если не работает)

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Пример правильной конфигурации Nginx

Файл: `/etc/nginx/sites-available/skpersonal`

```nginx
server {
    listen 80;
    server_name sk-personal.site;

    location / {
        proxy_pass http://127.0.0.1:3025/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # Для работы с WebSocket (если нужно)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

## Если используете HTTPS (SSL)

Добавьте блок для порта 443:

```nginx
server {
    listen 443 ssl http2;
    server_name sk-personal.site;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://127.0.0.1:3025/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }
}

# Редирект с HTTP на HTTPS
server {
    listen 80;
    server_name sk-personal.site;
    return 301 https://$server_name$request_uri;
}
```

## Диагностика проблем

### Контейнер не запускается

```bash
docker logs worktimesk-web
```

### Порт 3025 не отвечает

```bash
netstat -tlnp | grep 3025
# или
ss -tlnp | grep 3025
```

### Nginx не может подключиться к приложению

Проверьте, что приложение слушает на `0.0.0.0:3000` внутри контейнера (уже настроено в docker-compose.yml).

