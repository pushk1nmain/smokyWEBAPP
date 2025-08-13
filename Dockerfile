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

# Выполняем сборку приложения (минификация CSS/JS)
RUN npm run build 2>/dev/null || echo "No build step required"

# Создаем health check endpoint
RUN echo '<!DOCTYPE html><html><head><title>Health Check</title></head><body><h1>OK</h1><p>Service is healthy</p></body></html>' > health.html

# Этап 2: Продакшн образ с nginx
FROM nginx:alpine AS production

# Метаданные образа
LABEL maintainer="SmokyApp Team"
LABEL description="Telegram Web App для помощи в отказе от курения"
LABEL version="1.0.1"
LABEL org.opencontainers.image.source="https://github.com/smokyapp/webapp"

# Устанавливаем необходимые пакеты для продакшн среды
RUN apk add --no-cache \
    git \
    bash \
    curl \
    tzdata \
    jq \
    ca-certificates && \
    rm -rf /var/cache/apk/*

# Настраиваем часовой пояс
ENV TZ=Europe/Moscow
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Создаем необходимые директории
RUN mkdir -p /var/log/smokyapp \
             /app/scripts \
             /app/backups \
             /var/cache/nginx \
             /var/run/nginx

# Копируем файлы приложения из builder этапа
COPY --from=builder /app /tmp/app

# Копируем статические файлы в nginx директорию, исключая ненужные файлы
RUN cp -r /tmp/app/*.html /tmp/app/css /tmp/app/js /tmp/app/screens /tmp/app/elements /usr/share/nginx/html/ && \
    cp /tmp/app/robots.txt /tmp/app/humans.txt /usr/share/nginx/html/ 2>/dev/null || true && \
    cp /tmp/app/health.html /usr/share/nginx/html/ && \
    rm -rf /tmp/app

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Копируем скрипты
COPY scripts/ /app/scripts/
RUN chmod +x /app/scripts/*.sh

# Создаем пользователя nginx с правильными правами
RUN addgroup -g 101 -S nginx || true && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx || true

# Устанавливаем правильные права доступа
RUN chown -R nginx:nginx /usr/share/nginx/html \
                        /var/cache/nginx \
                        /var/log/nginx \
                        /var/log/smokyapp \
                        /var/run/nginx \
                        /app && \
    chmod -R 755 /usr/share/nginx/html && \
    chmod -R 755 /app/scripts

# Открываем порт для веб-сервера
EXPOSE 80

# Переменные окружения для продакшн
ENV NODE_ENV=production \
    NGINX_HOST=localhost \
    NGINX_PORT=80 \
    NGINX_WORKER_PROCESSES=auto \
    NGINX_WORKER_CONNECTIONS=1024

# Проверка здоровья контейнера с правильным endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost/health.html || exit 1

# Используем официальный entrypoint nginx для корректной работы
STOPSIGNAL SIGQUIT

# Точка входа - запуск nginx в foreground режиме
CMD ["nginx", "-g", "daemon off;"]
