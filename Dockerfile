# Dockerfile для SmokyApp - Telegram Web App
# Простая сборка на основе nginx для статических файлов

# Используем официальный nginx образ
FROM nginx:alpine AS production

# Метаданные образа
LABEL maintainer="SmokyApp Team"
LABEL description="Telegram Web App для помощи в отказе от курения"
LABEL version="1.0.1"
LABEL org.opencontainers.image.source="https://github.com/smokyapp/webapp"

# Устанавливаем gettext (для envsubst) и другие утилиты
RUN apk add --no-cache \
    gettext \
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

# Копируем основные файлы приложения
COPY index.html health.html style.css script.js /usr/share/nginx/html/

# Копируем директории
COPY elements/ /usr/share/nginx/html/elements/
COPY screens/ /usr/share/nginx/html/screens/ 

# Копируем дополнительные файлы
COPY robots.txt humans.txt /usr/share/nginx/html/

# Копируем ШАБЛОН конфигурации nginx
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Копируем скрипты (опционально)
COPY scripts/ /app/scripts/
RUN chmod +x /app/scripts/*.sh 2>/dev/null || true

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

# Финальная точка входа: безопасно подставляем ТОЛЬКО $API_KEY и запускаем nginx
CMD /bin/sh -c "envsubst '$API_KEY' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"
