# Dockerfile для SmokyApp - Telegram Web App
# Многоэтапная сборка для оптимизации размера образа

# Этап 1: Базовый образ для разработки и сборки
FROM node:18-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы проекта для анализа зависимостей
COPY package*.json ./

# Устанавливаем зависимости (если есть)
RUN npm ci --only=production 2>/dev/null || echo "No dependencies to install"

# Копируем исходный код
COPY . .

# Выполняем сборку приложения
RUN npm run build 2>/dev/null || echo "No build step required"

# Этап 2: Продакшн образ с nginx
FROM nginx:alpine AS production

# Метаданные образа
LABEL maintainer="SmokyApp Team"
LABEL description="Telegram Web App для помощи в отказе от курения"
LABEL version="1.0.0"

# Устанавливаем git для обновлений и другие необходимые пакеты
RUN apk add --no-cache \
    git \
    bash \
    curl \
    tzdata && \
    rm -rf /var/cache/apk/*

# Устанавливаем рабочую директорию для приложения
WORKDIR /app

# Создаем директории для логов и скриптов
RUN mkdir -p /var/log/smokyapp /app/scripts

# Копируем файлы приложения из builder этапа
COPY --from=builder /app /app

# Копируем статические файлы в nginx директорию
RUN cp -r /app/* /usr/share/nginx/html/ && \
    rm -rf /usr/share/nginx/html/Dockerfile* \
           /usr/share/nginx/html/docker-compose* \
           /usr/share/nginx/html/scripts \
           /usr/share/nginx/html/.git* \
           /usr/share/nginx/html/node_modules 2>/dev/null || true

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Создаем пользователя для приложения
RUN addgroup -g 1001 -S smokyapp && \
    adduser -S smokyapp -u 1001 -G smokyapp

# Устанавливаем правильные права доступа
RUN chown -R smokyapp:smokyapp /app /var/log/smokyapp && \
    chmod +x /app/scripts/* 2>/dev/null || true

# Настраиваем часовой пояс
ENV TZ=Europe/Moscow
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Открываем порт для веб-сервера
EXPOSE 80

# Переменные окружения
ENV NODE_ENV=production
ENV NGINX_HOST=localhost
ENV NGINX_PORT=80

# Проверка здоровья контейнера
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Переключаемся на непривилегированного пользователя
USER smokyapp

# Точка входа - запуск nginx
CMD ["nginx", "-g", "daemon off;"]
