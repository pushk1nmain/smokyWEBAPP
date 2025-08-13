#!/bin/bash

# Быстрый запуск SmokyApp в Docker
# Автор: SmokyApp Team
# Версия: 1.0.0

set -euo pipefail

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Функции для цветного вывода
info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*"
}

error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

# Функция проверки зависимостей
check_dependencies() {
    info "Проверка зависимостей..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен. Установите Docker и повторите попытку."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose не установлен. Установите Docker Compose и повторите попытку."
        exit 1
    fi
    
    # Проверяем, запущен ли Docker
    if ! docker info &> /dev/null; then
        error "Docker не запущен. Запустите Docker и повторите попытку."
        exit 1
    fi
    
    success "Все зависимости найдены"
}

# Функция безопасной загрузки .env файла
load_env_safely() {
    if [[ -f ".env" ]]; then
        # Создаем временный файл только с валидными переменными
        local temp_env=$(mktemp)
        
        # Фильтруем только строки с переменными, исключаем комментарии
        grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env | grep -v '^[[:space:]]*#' > "$temp_env"
        
        # Загружаем переменные
        set -a
        source "$temp_env"
        set +a
        
        # Удаляем временный файл
        rm "$temp_env"
        
        info "Переменные окружения загружены из .env"
    fi
}

# Функция создания .env файла если его нет
create_env_if_missing() {
    if [[ ! -f ".env" ]]; then
        warning "Файл .env не найден. Создаем с базовыми настройками..."
        
        cat > .env << 'EOF'
# Основные настройки для Docker
NODE_ENV=production
CONTAINER_NAME=smokyapp-web
HOST_PORT=80
VERSION=latest

# Настройки ресурсов
MEMORY_LIMIT=256M
MEMORY_RESERVATION=128M
CPU_LIMIT=0.5
CPU_RESERVATION=0.25

# Часовой пояс
TZ=Europe/Moscow

# Директории
LOG_DIR=./logs
BACKUP_DIR=./backups
EOF
        success "Создан файл .env с базовыми настройками"
    fi
}

# Функция создания необходимых директорий
create_directories() {
    info "Создание необходимых директорий..."
    
    mkdir -p logs/nginx logs/app backups
    
    success "Директории созданы"
}

# Функция сборки и запуска
build_and_run() {
    info "Сборка и запуск приложения..."
    
    # Загружаем переменные окружения
    load_env_safely
    
    # Определяем файл docker-compose для использования
    local compose_file="docker-compose.yml"
    local compose_cmd="docker-compose"
    
    # Проверяем наличие docker-compose команды
    if ! command -v docker-compose &> /dev/null; then
        if command -v docker &> /dev/null && docker compose version &> /dev/null; then
            compose_cmd="docker compose"
        else
            error "Docker Compose не найден. Установите Docker Compose."
            return 1
        fi
    fi
    
    # Проверяем валидность основного compose файла
    if ! $compose_cmd -f "$compose_file" config &> /dev/null; then
        warning "Основной docker-compose.yml содержит ошибки. Используем упрощенную версию."
        if [[ -f "docker-compose-simple.yml" ]]; then
            compose_file="docker-compose-simple.yml"
        else
            error "Файл docker-compose-simple.yml не найден"
            return 1
        fi
    fi
    
    info "Используется файл: $compose_file"
    
    # Останавливаем существующие контейнеры если есть
    $compose_cmd -f "$compose_file" down 2>/dev/null || true
    
    # Собираем образ с BuildKit для лучшей производительности
    info "Сборка Docker образа..."
    export DOCKER_BUILDKIT=1
    $compose_cmd -f "$compose_file" build --pull
    
    # Запускаем контейнеры
    info "Запуск контейнеров..."
    $compose_cmd -f "$compose_file" up -d
    
    success "Контейнеры запущены"
}

# Функция проверки здоровья
wait_for_health() {
    info "Ожидание запуска приложения..."
    
    local max_attempts=20
    local attempt=1
    local port=${HOST_PORT:-80}
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "http://localhost:$port/health.html" > /dev/null 2>&1; then
            success "Приложение запущено и готово к работе!"
            info "Доступ: http://localhost:$port"
            return 0
        fi
        
        echo -n "."
        sleep 3
        ((attempt++))
    done
    
    echo ""
    warning "Приложение запускается дольше обычного. Проверьте логи:"
    warning "docker-compose logs -f"
    
    return 1
}

# Функция показа статуса
show_status() {
    info "Статус контейнеров:"
    
    # Определяем команду docker-compose
    local compose_cmd="docker-compose"
    if ! command -v docker-compose &> /dev/null; then
        if command -v docker &> /dev/null && docker compose version &> /dev/null; then
            compose_cmd="docker compose"
        fi
    fi
    
    # Показываем статус для основного файла, если не получается - для упрощенного
    $compose_cmd ps 2>/dev/null || $compose_cmd -f docker-compose-simple.yml ps 2>/dev/null || echo "Контейнеры не найдены"
    
    echo ""
    info "Использование ресурсов:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -n 2 2>/dev/null || echo "Статистика недоступна"
}

# Функция справки
show_help() {
    echo "Использование: $0 [КОМАНДА]"
    echo ""
    echo "Команды:"
    echo "  start       Запустить приложение (по умолчанию)"
    echo "  stop        Остановить приложение"
    echo "  restart     Перезапустить приложение"
    echo "  status      Показать статус"
    echo "  logs        Показать логи"
    echo "  clean       Очистить все данные"
    echo "  help        Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0              # Запустить приложение"
    echo "  $0 start        # Запустить приложение"
    echo "  $0 stop         # Остановить приложение"
    echo "  $0 logs         # Показать логи"
}

# Основная функция запуска
start_application() {
    info "🚀 Запуск SmokyApp в Docker..."
    
    check_dependencies
    create_env_if_missing
    create_directories
    build_and_run
    
    if wait_for_health; then
        echo ""
        success "✅ SmokyApp успешно запущен!"
        show_status
        echo ""
        info "Для просмотра логов: docker-compose logs -f"
        info "Для остановки: docker-compose down"
    else
        echo ""
        error "❌ Проблемы с запуском. Проверьте логи: docker-compose logs"
    fi
}

# Функция остановки
stop_application() {
    info "Остановка приложения..."
    
    # Определяем команду docker-compose
    local compose_cmd="docker-compose"
    if ! command -v docker-compose &> /dev/null; then
        if command -v docker &> /dev/null && docker compose version &> /dev/null; then
            compose_cmd="docker compose"
        fi
    fi
    
    # Останавливаем используя основной файл, если не получается - упрощенный
    $compose_cmd down 2>/dev/null || $compose_cmd -f docker-compose-simple.yml down 2>/dev/null || true
    
    success "Приложение остановлено"
}

# Функция перезапуска
restart_application() {
    info "Перезапуск приложения..."
    stop_application
    sleep 2
    start_application
}

# Функция просмотра логов
show_logs() {
    info "Логи приложения (Ctrl+C для выхода):"
    
    # Определяем команду docker-compose
    local compose_cmd="docker-compose"
    if ! command -v docker-compose &> /dev/null; then
        if command -v docker &> /dev/null && docker compose version &> /dev/null; then
            compose_cmd="docker compose"
        fi
    fi
    
    # Показываем логи
    $compose_cmd logs -f 2>/dev/null || $compose_cmd -f docker-compose-simple.yml logs -f 2>/dev/null || echo "Логи недоступны"
}

# Функция очистки
clean_application() {
    warning "Это удалит все контейнеры, образы и данные!"
    read -p "Продолжить? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Очистка..."
        
        # Определяем команду docker-compose
        local compose_cmd="docker-compose"
        if ! command -v docker-compose &> /dev/null; then
            if command -v docker &> /dev/null && docker compose version &> /dev/null; then
                compose_cmd="docker compose"
            fi
        fi
        
        # Очищаем контейнеры и образы
        $compose_cmd down -v --rmi all 2>/dev/null || true
        $compose_cmd -f docker-compose-simple.yml down -v --rmi all 2>/dev/null || true
        docker system prune -f
        
        success "Очистка завершена"
    else
        info "Очистка отменена"
    fi
}

# Обработка аргументов
case "${1:-start}" in
    start)
        start_application
        ;;
    stop)
        stop_application
        ;;
    restart)
        restart_application
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    clean)
        clean_application
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        error "Неизвестная команда: $1"
        show_help
        exit 1
        ;;
esac
