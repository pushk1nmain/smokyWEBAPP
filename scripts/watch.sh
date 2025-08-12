#!/bin/bash

# Скрипт мониторинга и автоматического обновления SmokyApp
# Отслеживает изменения в GitHub репозитории и автоматически обновляет приложение
# Автор: SmokyApp Team
# Версия: 1.0.0

set -euo pipefail

# Конфигурация
REPO_URL="${REPO_URL:-https://github.com/smokyapp/webapp.git}"
BRANCH="${BRANCH:-main}"
CHECK_INTERVAL="${CHECK_INTERVAL:-300}"  # Проверка каждые 5 минут
LOG_FILE="${LOG_FILE:-/var/log/smokyapp/watch.log}"
PID_FILE="${PID_FILE:-/var/run/smokyapp-watch.pid}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Функция логирования
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
}

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

# Функция проверки запущенного процесса
is_running() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Функция запуска в фоновом режиме
start_daemon() {
    if is_running; then
        warning "Служба мониторинга уже запущена (PID: $(cat "$PID_FILE"))"
        return 1
    fi
    
    info "Запуск службы мониторинга..."
    
    # Создаем директорию для логов
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$(dirname "$PID_FILE")"
    
    # Запускаем в фоновом режиме
    nohup "$0" --daemon > "$LOG_FILE" 2>&1 &
    local pid=$!
    
    echo "$pid" > "$PID_FILE"
    success "Служба мониторинга запущена (PID: $pid)"
    
    # Ждем немного и проверяем, что процесс действительно запустился
    sleep 2
    if is_running; then
        success "Служба успешно инициализирована"
        info "Логи: $LOG_FILE"
        info "PID файл: $PID_FILE"
    else
        error "Ошибка запуска службы"
        return 1
    fi
}

# Функция остановки
stop_daemon() {
    if ! is_running; then
        warning "Служба мониторинга не запущена"
        return 1
    fi
    
    local pid=$(cat "$PID_FILE")
    info "Остановка службы мониторинга (PID: $pid)..."
    
    # Отправляем сигнал завершения
    kill "$pid" 2>/dev/null || true
    
    # Ждем завершения процесса
    local attempts=0
    while [[ $attempts -lt 10 ]] && ps -p "$pid" > /dev/null 2>&1; do
        sleep 1
        ((attempts++))
    done
    
    # Принудительно завершаем, если процесс не завершился
    if ps -p "$pid" > /dev/null 2>&1; then
        warning "Принудительное завершение процесса..."
        kill -9 "$pid" 2>/dev/null || true
        sleep 1
    fi
    
    rm -f "$PID_FILE"
    success "Служба мониторинга остановлена"
}

# Функция перезапуска
restart_daemon() {
    info "Перезапуск службы мониторинга..."
    stop_daemon || true
    sleep 2
    start_daemon
}

# Функция получения статуса
get_status() {
    echo "=== Статус службы мониторинга SmokyApp ==="
    echo ""
    
    if is_running; then
        local pid=$(cat "$PID_FILE")
        echo "Статус: ЗАПУЩЕНА"
        echo "PID: $pid"
        echo "Время запуска: $(ps -o lstart= -p "$pid" 2>/dev/null || echo "Неизвестно")"
    else
        echo "Статус: ОСТАНОВЛЕНА"
    fi
    
    echo "Репозиторий: $REPO_URL"
    echo "Ветка: $BRANCH"
    echo "Интервал проверки: $CHECK_INTERVAL секунд"
    echo "Лог файл: $LOG_FILE"
    echo ""
    
    # Показываем последние записи лога
    if [[ -f "$LOG_FILE" ]]; then
        echo "=== Последние записи лога ==="
        tail -n 10 "$LOG_FILE" 2>/dev/null || echo "Лог файл пуст или недоступен"
    fi
}

# Функция проверки удаленного репозитория
check_remote_updates() {
    local current_commit="$1"
    
    # Получаем последний коммит с GitHub без клонирования
    local latest_commit
    latest_commit=$(git ls-remote "$REPO_URL" "$BRANCH" 2>/dev/null | cut -f1)
    
    if [[ -z "$latest_commit" ]]; then
        error "Не удалось получить информацию о последнем коммите"
        return 2
    fi
    
    if [[ "$current_commit" != "$latest_commit" ]]; then
        info "Найдены обновления!"
        info "Текущий коммит: $current_commit"
        info "Новый коммит: $latest_commit"
        return 0  # Есть обновления
    fi
    
    return 1  # Нет обновлений
}

# Функция отправки уведомления
send_notification() {
    local type="$1"
    local message="$2"
    
    log "NOTIFICATION" "$type: $message"
    
    # Telegram уведомления
    if [[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]]; then
        local emoji
        case "$type" in
            "UPDATE_AVAILABLE") emoji="🔄" ;;
            "UPDATE_SUCCESS") emoji="✅" ;;
            "UPDATE_FAILED") emoji="❌" ;;
            "SERVICE_STARTED") emoji="🚀" ;;
            "SERVICE_STOPPED") emoji="⏹️" ;;
            *) emoji="ℹ️" ;;
        esac
        
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d chat_id="${TELEGRAM_CHAT_ID}" \
            -d text="${emoji} SmokyApp Monitor: ${message}" \
            -d parse_mode="HTML" > /dev/null 2>&1 || true
    fi
    
    # Webhook уведомления
    if [[ -n "${WEBHOOK_URL:-}" ]]; then
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"type\":\"$type\",\"message\":\"$message\",\"timestamp\":\"$(date -Iseconds)\"}" > /dev/null 2>&1 || true
    fi
}

# Основной цикл мониторинга
monitoring_loop() {
    info "Запуск цикла мониторинга (интервал: ${CHECK_INTERVAL}s)"
    send_notification "SERVICE_STARTED" "Служба мониторинга запущена"
    
    local last_commit=""
    local error_count=0
    local max_errors=5
    
    while true; do
        # Проверяем наличие обновлений
        case $(check_remote_updates "$last_commit") in
            0)  # Есть обновления
                info "Обнаружены обновления, запуск процесса обновления..."
                send_notification "UPDATE_AVAILABLE" "Обнаружены обновления, начинаем обновление"
                
                if "$SCRIPT_DIR/update.sh"; then
                    success "Обновление завершено успешно"
                    send_notification "UPDATE_SUCCESS" "Приложение успешно обновлено"
                    error_count=0
                    
                    # Обновляем last_commit после успешного обновления
                    last_commit=$(git ls-remote "$REPO_URL" "$BRANCH" 2>/dev/null | cut -f1)
                else
                    error "Ошибка при обновлении"
                    send_notification "UPDATE_FAILED" "Ошибка при обновлении приложения"
                    ((error_count++))
                    
                    if [[ $error_count -ge $max_errors ]]; then
                        error "Превышено максимальное количество ошибок обновления ($max_errors)"
                        send_notification "UPDATE_FAILED" "Превышено максимальное количество ошибок обновления, остановка мониторинга"
                        break
                    fi
                fi
                ;;
            1)  # Нет обновлений
                info "Обновления не найдены"
                error_count=0
                ;;
            2)  # Ошибка проверки
                warning "Ошибка при проверке обновлений"
                ((error_count++))
                
                if [[ $error_count -ge $max_errors ]]; then
                    error "Превышено максимальное количество ошибок проверки ($max_errors)"
                    send_notification "UPDATE_FAILED" "Превышено максимальное количество ошибок проверки, остановка мониторинга"
                    break
                fi
                ;;
        esac
        
        # Ждем до следующей проверки
        info "Следующая проверка через $CHECK_INTERVAL секунд..."
        sleep "$CHECK_INTERVAL"
    done
    
    send_notification "SERVICE_STOPPED" "Служба мониторинга остановлена"
    rm -f "$PID_FILE"
}

# Обработка сигналов
cleanup() {
    info "Получен сигнал завершения, остановка мониторинга..."
    send_notification "SERVICE_STOPPED" "Служба мониторинга остановлена по сигналу"
    rm -f "$PID_FILE"
    exit 0
}

# Функция справки
show_help() {
    echo "Использование: $0 [КОМАНДА]"
    echo ""
    echo "Служба мониторинга и автоматического обновления SmokyApp"
    echo ""
    echo "Команды:"
    echo "  start          Запустить службу мониторинга в фоновом режиме"
    echo "  stop           Остановить службу мониторинга"
    echo "  restart        Перезапустить службу мониторинга"
    echo "  status         Показать статус службы"
    echo "  check          Одноразовая проверка обновлений"
    echo "  logs           Показать логи службы"
    echo "  --daemon       Внутренняя команда для фонового режима"
    echo "  -h, --help     Показать справку"
    echo ""
    echo "Переменные окружения:"
    echo "  REPO_URL           URL репозитория Git"
    echo "  BRANCH             Ветка для отслеживания"
    echo "  CHECK_INTERVAL     Интервал проверки в секундах"
    echo "  TELEGRAM_BOT_TOKEN Токен Telegram бота для уведомлений"
    echo "  TELEGRAM_CHAT_ID   ID чата для уведомлений"
    echo "  WEBHOOK_URL        URL webhook для уведомлений"
}

# Основная функция
main() {
    case "${1:-start}" in
        start)
            start_daemon
            ;;
        stop)
            stop_daemon
            ;;
        restart)
            restart_daemon
            ;;
        status)
            get_status
            ;;
        check)
            info "Одноразовая проверка обновлений..."
            if check_remote_updates ""; then
                success "Найдены обновления"
            else
                info "Обновления не найдены"
            fi
            ;;
        logs)
            if [[ -f "$LOG_FILE" ]]; then
                tail -f "$LOG_FILE"
            else
                error "Лог файл не найден: $LOG_FILE"
                exit 1
            fi
            ;;
        --daemon)
            # Внутренний режим для фонового выполнения
            trap cleanup TERM INT
            monitoring_loop
            ;;
        -h|--help)
            show_help
            ;;
        *)
            error "Неизвестная команда: $1"
            show_help
            exit 1
            ;;
    esac
}

# Запуск основной функции
main "$@"
