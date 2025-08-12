#!/bin/bash

# Скрипт автоматического обновления SmokyApp с GitHub
# Автор: SmokyApp Team
# Версия: 1.0.0

set -euo pipefail  # Строгий режим выполнения

# Конфигурация
REPO_URL="${REPO_URL:-https://github.com/smokyapp/webapp.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/app}"
BACKUP_DIR="${BACKUP_DIR:-/app/backups}"
LOG_FILE="${LOG_FILE:-/var/log/smokyapp/update.log}"
CONTAINER_NAME="${CONTAINER_NAME:-smokyapp-web}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция логирования
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
}

# Функции для цветного вывода
info() {
    echo -e "${BLUE}[INFO]${NC} $*"
    log "INFO" "$*"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
    log "SUCCESS" "$*"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*"
    log "WARNING" "$*"
}

error() {
    echo -e "${RED}[ERROR]${NC} $*"
    log "ERROR" "$*"
}

# Функция проверки зависимостей
check_dependencies() {
    info "Проверка зависимостей..."
    
    local deps=("git" "docker" "docker-compose" "curl")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        error "Отсутствуют зависимости: ${missing_deps[*]}"
        error "Установите недостающие компоненты и повторите попытку"
        exit 1
    fi
    
    success "Все зависимости найдены"
}

# Функция создания резервной копии
create_backup() {
    info "Создание резервной копии..."
    
    local backup_timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_path="${BACKUP_DIR}/backup_${backup_timestamp}"
    
    # Создаем директорию для бэкапов
    mkdir -p "${BACKUP_DIR}"
    
    # Копируем текущее состояние
    if [[ -d "${APP_DIR}" ]]; then
        cp -r "${APP_DIR}" "${backup_path}"
        success "Резервная копия создана: ${backup_path}"
        
        # Оставляем только последние 5 бэкапов
        find "${BACKUP_DIR}" -maxdepth 1 -type d -name "backup_*" | sort | head -n -5 | xargs rm -rf
    else
        warning "Директория приложения ${APP_DIR} не найдена, пропускаем создание бэкапа"
    fi
}

# Функция проверки обновлений
check_updates() {
    info "Проверка обновлений на GitHub..."
    
    # Получаем текущий коммит
    local current_commit=""
    if [[ -d "${APP_DIR}/.git" ]]; then
        cd "${APP_DIR}"
        current_commit=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    fi
    
    # Получаем последний коммит с GitHub
    local latest_commit
    latest_commit=$(git ls-remote "${REPO_URL}" "${BRANCH}" | cut -f1 2>/dev/null || echo "")
    
    if [[ -z "$latest_commit" ]]; then
        error "Не удалось получить информацию о последнем коммите"
        return 1
    fi
    
    info "Текущий коммит: ${current_commit}"
    info "Последний коммит: ${latest_commit}"
    
    if [[ "$current_commit" == "$latest_commit" ]]; then
        success "Приложение уже использует последнюю версию"
        return 1  # Нет обновлений
    fi
    
    success "Найдены обновления!"
    return 0  # Есть обновления
}

# Функция клонирования/обновления репозитория
update_repository() {
    info "Обновление репозитория..."
    
    if [[ -d "${APP_DIR}/.git" ]]; then
        # Обновляем существующий репозиторий
        cd "${APP_DIR}"
        
        info "Сохранение локальных изменений..."
        git stash push -m "Auto-stash before update $(date)" || true
        
        info "Получение обновлений..."
        git fetch origin "${BRANCH}"
        
        info "Переключение на последнюю версию..."
        git reset --hard "origin/${BRANCH}"
        
        success "Репозиторий обновлен"
    else
        # Клонируем репозиторий
        info "Клонирование репозитория..."
        
        # Удаляем старую директорию если она существует
        if [[ -d "${APP_DIR}" ]]; then
            rm -rf "${APP_DIR}"
        fi
        
        git clone --branch "${BRANCH}" --single-branch "${REPO_URL}" "${APP_DIR}"
        
        success "Репозиторий склонирован"
    fi
}

# Функция пересборки Docker образа
rebuild_docker() {
    info "Пересборка Docker образа..."
    
    cd "$(dirname "${APP_DIR}")"
    
    # Останавливаем контейнеры
    info "Остановка контейнеров..."
    docker-compose -f "${COMPOSE_FILE}" down || true
    
    # Удаляем старый образ
    info "Удаление старого образа..."
    docker rmi smokyapp-web:latest 2>/dev/null || true
    
    # Собираем новый образ
    info "Сборка нового образа..."
    docker-compose -f "${COMPOSE_FILE}" build --no-cache
    
    # Запускаем контейнеры
    info "Запуск контейнеров..."
    docker-compose -f "${COMPOSE_FILE}" up -d
    
    success "Docker образ пересобран и запущен"
}

# Функция проверки здоровья приложения
health_check() {
    info "Проверка здоровья приложения..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s http://localhost/health > /dev/null 2>&1; then
            success "Приложение работает корректно"
            return 0
        fi
        
        info "Попытка ${attempt}/${max_attempts}: ожидание запуска приложения..."
        sleep 10
        ((attempt++))
    done
    
    error "Приложение не отвечает после обновления"
    return 1
}

# Функция восстановления из бэкапа
restore_backup() {
    error "Восстановление из последней резервной копии..."
    
    local latest_backup
    latest_backup=$(find "${BACKUP_DIR}" -maxdepth 1 -type d -name "backup_*" | sort | tail -n 1)
    
    if [[ -n "$latest_backup" ]]; then
        info "Восстановление из: ${latest_backup}"
        rm -rf "${APP_DIR}"
        cp -r "${latest_backup}" "${APP_DIR}"
        rebuild_docker
        
        if health_check; then
            success "Восстановление завершено успешно"
        else
            error "Не удалось восстановить приложение"
            exit 1
        fi
    else
        error "Резервные копии не найдены"
        exit 1
    fi
}

# Функция отправки уведомления
send_notification() {
    local status="$1"
    local message="$2"
    
    # Здесь можно добавить отправку уведомлений
    # Например, в Telegram, Slack, email и т.д.
    
    info "Уведомление: ${status} - ${message}"
    
    # Пример отправки в Telegram (раскомментируйте и настройте)
    # if [[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]]; then
    #     curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    #         -d chat_id="${TELEGRAM_CHAT_ID}" \
    #         -d text="🔄 SmokyApp Update: ${status} - ${message}"
    # fi
}

# Основная функция
main() {
    info "Запуск скрипта обновления SmokyApp..."
    info "Репозиторий: ${REPO_URL}"
    info "Ветка: ${BRANCH}"
    
    # Создаем директорию для логов
    mkdir -p "$(dirname "${LOG_FILE}")"
    
    # Проверяем зависимости
    check_dependencies
    
    # Проверяем наличие обновлений
    if ! check_updates; then
        info "Обновления не требуются"
        exit 0
    fi
    
    # Создаем резервную копию
    create_backup
    
    # Обновляем репозиторий
    if ! update_repository; then
        error "Ошибка при обновлении репозитория"
        send_notification "ERROR" "Ошибка при обновлении репозитория"
        exit 1
    fi
    
    # Пересобираем Docker образ
    if ! rebuild_docker; then
        error "Ошибка при пересборке Docker образа"
        send_notification "ERROR" "Ошибка при пересборке Docker образа"
        restore_backup
        exit 1
    fi
    
    # Проверяем здоровье приложения
    if ! health_check; then
        error "Приложение не работает после обновления"
        send_notification "ERROR" "Приложение не работает после обновления"
        restore_backup
        exit 1
    fi
    
    success "Обновление завершено успешно!"
    send_notification "SUCCESS" "Приложение успешно обновлено"
}

# Функция для показа справки
show_help() {
    echo "Использование: $0 [ОПЦИИ]"
    echo ""
    echo "Опции:"
    echo "  -h, --help     Показать эту справку"
    echo "  -f, --force    Принудительное обновление (пропустить проверку)"
    echo "  -d, --dry-run  Режим проверки (без фактического обновления)"
    echo ""
    echo "Переменные окружения:"
    echo "  REPO_URL       URL репозитория Git (по умолчанию: ${REPO_URL})"
    echo "  BRANCH         Ветка для обновления (по умолчанию: ${BRANCH})"
    echo "  APP_DIR        Директория приложения (по умолчанию: ${APP_DIR})"
    echo "  BACKUP_DIR     Директория для бэкапов (по умолчанию: ${BACKUP_DIR})"
    echo "  LOG_FILE       Файл логов (по умолчанию: ${LOG_FILE})"
}

# Обработка аргументов командной строки
FORCE_UPDATE=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--force)
            FORCE_UPDATE=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            error "Неизвестная опция: $1"
            show_help
            exit 1
            ;;
    esac
done

# Обработка сигналов
trap 'error "Скрипт прерван пользователем"; exit 130' INT TERM

# Запуск основной функции
if [[ "$DRY_RUN" == "true" ]]; then
    info "Режим проверки: проверка обновлений без фактического обновления"
    check_dependencies
    check_updates
    info "Проверка завершена"
else
    main
fi
