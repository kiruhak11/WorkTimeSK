FROM node:20-alpine

WORKDIR /app

# Копируем package файлы
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci

# Генерируем Prisma клиент
RUN npx prisma generate

# Копируем остальные файлы
COPY . .

# Билдим приложение
RUN npm run build

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["sh", "-c", "npx prisma migrate deploy && node .output/server/index.mjs"]


