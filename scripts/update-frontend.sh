#!/bin/bash

set -e

echo "🚀 Проверяем обновления Smoky WebApp Frontend..."

# Переменные (автоматически определяем основную папку проекта)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Определяем какой docker-compose файл использовать
if [ -f "$APP_DIR/docker-compose-proxy.yml" ] && docker network ls | grep -q nginx-proxy; then
    DOCKER_COMPOSE_FILE="$APP_DIR/docker-compose-proxy.yml"
    PROXY_MODE=true
    echo "🔗 Обнаружен режим проксирования"
else
    DOCKER_COMPOSE_FILE="$APP_DIR/docker-compose.yml" 
    PROXY_MODE=false
fi

echo "📁 Основная папка проекта: $APP_DIR"
echo "📄 Скрипт запущен из: $SCRIPT_DIR"

cd $APP_DIR

# Проверяем необходимые файлы
if [ ! -f "_config/.env" ]; then
    echo "❌ Файл .env не найден. Создайте его из .env.example"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Файл docker-compose.yml не найден"
    exit 1
fi

# Создаем директории для логов если не существуют
mkdir -p ./logs/nginx
mkdir -p ./logs/smokyapp
mkdir -p ./backups

# Проверяем, есть ли обновления
echo "🔍 Проверяем Git репозиторий..."
git fetch origin main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ $LOCAL = $REMOTE ]; then
    echo "✅ Обновлений нет. Текущая версия актуальна."
    echo "🤔 Хотите все равно перезапустить приложение? (y/N): "
    read -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "👋 До свидания!"
        exit 0
    fi
else
    echo "🆕 Найдены новые коммиты:"
    echo "----------------------------------------"
    git log --oneline --graph $LOCAL..origin/main
    echo "----------------------------------------"
    
    echo "🤔 Загрузить и применить обновления? (y/N): "
    read -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Обновление отменено"
        exit 0
    fi
fi

# Спрашиваем о мониторинге обновлений
echo "👁️  Включить автоматический мониторинг обновлений? (y/N): "
read -n 1 -r
echo
ENABLE_MONITORING=$REPLY

# Создание резервной копии перед обновлением
if [ $LOCAL != $REMOTE ]; then
    echo "💾 Создаем резервную копию..."
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    tar -czf "./backups/$BACKUP_NAME.tar.gz" \
        --exclude='logs/*' \
        --exclude='backups/*' \
        --exclude='.git/*' \
        --exclude='node_modules/*' \
        . 2>/dev/null || echo "⚠️  Некоторые файлы пропущены при создании бэкапа"
    echo "✅ Резервная копия создана: ./backups/$BACKUP_NAME.tar.gz"
fi

# Остановка существующих контейнеров
echo "🛑 Остановка существующих контейнеров..."
docker-compose -f $DOCKER_COMPOSE_FILE down || true

# Обновление кода (если были изменения)
if [ $LOCAL != $REMOTE ]; then
    echo "📥 Загружаем обновления..."
    git pull origin main

# Self-correcting paths after git pull
echo "🔧 Самокоррекция путей в update-frontend.sh..."
sed -i 's|DOCKER_COMPOSE_FILE="$APP_DIR/_config/docker/docker-compose-proxy.yml"|DOCKER_COMPOSE_FILE="$APP_DIR/docker-compose-proxy.yml"|g' "$0"
sed -i 's|DOCKER_COMPOSE_FILE="$APP_DIR/_config/docker/docker-compose.yml"|DOCKER_COMPOSE_FILE="$APP_DIR/docker-compose.yml"|g' "$0"
sed -i 's|if \[ \! -f "_config/docker/docker-compose\.yml" \] ; then|if [ ! -f "docker-compose.yml" ]; then|g' "$0"
sed -i 's|if \[ \! -f "_config/\.env" \] ; then|if [ ! -f "_config/.env" ]; then|g' "$0"
echo "✅ Самокоррекция завершена."

    echo "✅ Код обновлен!"
fi

# Сборка и запуск
echo "🔨 Сборка контейнеров..."
docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache

echo "🚢 Запуск Telegram Web App..."
docker-compose -f $DOCKER_COMPOSE_FILE up -d

# Проверка статуса
echo "🔍 Ждем запуска приложения..."
sleep 15

echo "📊 Статус всех сервисов:"
docker-compose -f $DOCKER_COMPOSE_FILE ps

echo "🏥 Проверяем здоровье приложения..."

# Определяем URL для проверки здоровья
if [ "$PROXY_MODE" = true ]; then
    # В режиме прокси проверяем внутренний адрес контейнера
    HEALTH_URL="http://smokyapp-web/health"
    echo "🔗 Проверяем через внутренний адрес контейнера..."
else
    HEALTH_URL="http://localhost/health"
fi

if curl -f $HEALTH_URL >/dev/null 2>&1 || docker exec smokyapp-web curl -f http://localhost/health >/dev/null 2>&1; then
    echo "✅ Деплой завершен успешно!"
    
    if [ "$PROXY_MODE" = true ]; then
        echo "🌐 Приложение работает в режиме проксирования"
        echo "🔗 Доступ через ваш внешний nginx с SSL"
        echo "📱 Telegram Web App готов к работе"
    else
        echo "🌐 Приложение доступно по адресу: http://localhost"
        echo "📱 Telegram Web App готов к работе"
    fi
    echo ""
    echo "📋 Полезные команды:"
    echo "   Логи приложения: docker-compose -f $DOCKER_COMPOSE_FILE logs -f smokyapp"
    echo "   Логи nginx:      docker-compose -f $DOCKER_COMPOSE_FILE logs -f nginx"
    echo "   Логи обновлений: docker-compose -f $DOCKER_COMPOSE_FILE logs -f updater"
    echo "   Статус:          make status"
    echo "   Остановка:       docker-compose -f $DOCKER_COMPOSE_FILE down"
    echo "   Бэкапы:          ls -la ./backups/"
    
    # Настройка автоматического мониторинга
    if [[ $ENABLE_MONITORING =~ ^[Yy]$ ]]; then
        echo ""
        echo "👁️  Настраиваем автоматический мониторинг обновлений..."
        if [ -f "./scripts/watch.sh" ]; then
            ./scripts/watch.sh start
            echo "✅ Автоматический мониторинг запущен!"
            echo "   Статус мониторинга: ./scripts/watch.sh status"
            echo "   Остановка мониторинга: ./scripts/watch.sh stop"
        else
            echo "⚠️  Скрипт мониторинга не найден"
        fi
    fi
    
    echo ""
    echo "🎉 Готово! SmokyApp успешно обновлен и запущен!"
    
else
    echo "❌ Healthcheck не прошел. Проверьте логи:"
    echo "🔍 Приложение: docker-compose -f $DOCKER_COMPOSE_FILE logs smokyapp"
    echo "🔍 Nginx:      docker-compose -f $DOCKER_COMPOSE_FILE logs nginx"
    echo "🔍 Обновления: docker-compose -f $DOCKER_COMPOSE_FILE logs updater"
    
    # Предлагаем восстановление из бэкапа
    if [ -f "./backups/$BACKUP_NAME.tar.gz" ]; then
        echo ""
        echo "🤔 Восстановить из резервной копии? (y/N): "
        read -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🔄 Восстанавливаем из резервной копии..."
            docker-compose -f $DOCKER_COMPOSE_FILE down
            tar -xzf "./backups/$BACKUP_NAME.tar.gz" -C . --exclude='backups/*'
            docker-compose -f $DOCKER_COMPOSE_FILE up -d --build
            
            # Проверяем восстановление
            sleep 10
            if curl -f http://localhost/health >/dev/null 2>&1; then
                echo "✅ Успешно восстановлено из резервной копии!"
            else
                echo "❌ Восстановление не помогло. Требуется ручная диагностика."
            fi
        fi
    fi
    
    exit 1
fi
