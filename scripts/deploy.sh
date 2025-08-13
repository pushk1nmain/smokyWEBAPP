#!/bin/bash

# Скрипт развертывания SmokyApp с нуля
# Автор: SmokyApp Team
# Версия: 1.0.0

set -euo pipefail

# Конфигурация
REPO_URL="${REPO_URL:-https://github.com/smokyapp/webapp.git}"
BRANCH="${BRANCH:-main}"
PROJECT_NAME="${PROJECT_NAME:-smokyapp}"
INSTALL_DIR="${INSTALL_DIR:-/opt/smokyapp}"
LOG_FILE="${LOG_FILE:-/var/log/smokyapp/deploy.log}"

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

# Функция проверки прав администратора
check_sudo() {
    if [[ $EUID -ne 0 ]]; then
        info "Запрос прав администратора..."
        exec sudo "$0" "$@"
    fi
}

# Функция установки зависимостей для Ubuntu/Debian
install_deps_ubuntu() {
    info "Установка зависимостей для Ubuntu/Debian..."
    
    apt-get update
    apt-get install -y \
        curl \
        git \
        gnupg \
        lsb-release \
        ca-certificates \
        software-properties-common
    
    # Установка Docker
    if ! command -v docker &> /dev/null; then
        info "Установка Docker..."
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io
        systemctl enable docker
        systemctl start docker
    fi
    
    # Установка Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        info "Установка Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
}

# Функция установки зависимостей для CentOS/RHEL
install_deps_centos() {
    info "Установка зависимостей для CentOS/RHEL..."
    
    yum update -y
    yum install -y curl git
    
    # Установка Docker
    if ! command -v docker &> /dev/null; then
        info "Установка Docker..."
        yum install -y yum-utils
        yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        yum install -y docker-ce docker-ce-cli containerd.io
        systemctl enable docker
        systemctl start docker
    fi
    
    # Установка Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        info "Установка Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
}

# Автоматическое определение ОС и установка зависимостей
install_dependencies() {
    info "Определение операционной системы..."
    
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$ID
    else
        error "Не удалось определить операционную систему"
        exit 1
    fi
    
    case $OS in
        ubuntu|debian)
            install_deps_ubuntu
            ;;
        centos|rhel|fedora)
            install_deps_centos
            ;;
        *)
            error "Неподдерживаемая операционная система: $OS"
            error "Поддерживаются: Ubuntu, Debian, CentOS, RHEL, Fedora"
            exit 1
            ;;
    esac
    
    success "Зависимости установлены"
}

# Функция клонирования проекта
clone_project() {
    info "Клонирование проекта..."
    
    # Создаем директорию установки
    mkdir -p "$INSTALL_DIR"
    
    # Клонируем репозиторий
    if [[ -d "$INSTALL_DIR/.git" ]]; then
        cd "$INSTALL_DIR"
        git fetch origin
        git reset --hard "origin/$BRANCH"
    else
        git clone --branch "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
    fi
    
    cd "$INSTALL_DIR"
    success "Проект склонирован в $INSTALL_DIR"
}

# Функция настройки переменных окружения
setup_environment() {
    info "Настройка переменных окружения..."
    
    # Создаем .env файл если его нет
    if [[ ! -f "$INSTALL_DIR/.env" ]]; then
        cat > "$INSTALL_DIR/.env" << EOF
# Переменные окружения для SmokyApp
NODE_ENV=production
REPO_URL=$REPO_URL
BRANCH=$BRANCH
APP_DIR=$INSTALL_DIR
BACKUP_DIR=$INSTALL_DIR/backups
LOG_FILE=/var/log/smokyapp/app.log

# Настройки контейнера
CONTAINER_NAME=smokyapp-web
COMPOSE_FILE=docker-compose.yml

# Настройки обновлений
UPDATE_INTERVAL=300
WEBHOOK_SECRET=your-secret-key-here

# Настройки уведомлений (опционально)
# TELEGRAM_BOT_TOKEN=your-bot-token
# TELEGRAM_CHAT_ID=your-chat-id
EOF
        success "Создан файл .env"
    fi
    
    # Делаем скрипты исполняемыми
    chmod +x "$INSTALL_DIR/scripts/"*.sh
}

# Функция создания systemd сервиса
create_systemd_service() {
    info "Создание systemd сервиса..."
    
    cat > /etc/systemd/system/smokyapp.service << EOF
[Unit]
Description=SmokyApp - Telegram Web App
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=true
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
ExecReload=/usr/local/bin/docker-compose restart
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable smokyapp.service
    success "Systemd сервис создан"
}

# Функция настройки автоматических обновлений
setup_auto_updates() {
    info "Настройка автоматических обновлений..."
    
    # Создаем cron задачу для проверки обновлений каждые 5 минут
    cat > /etc/cron.d/smokyapp-updates << EOF
# Автоматическая проверка обновлений SmokyApp каждые 5 минут
*/5 * * * * root $INSTALL_DIR/scripts/update.sh > /dev/null 2>&1
EOF
    
    # Создаем задачу для еженедельной очистки логов
    cat > /etc/cron.d/smokyapp-cleanup << EOF
# Очистка старых логов каждую неделю в воскресенье в 3:00
0 3 * * 0 root find /var/log/smokyapp -name "*.log" -mtime +7 -delete > /dev/null 2>&1
EOF
    
    success "Автоматические обновления настроены"
}

# Функция настройки firewall
setup_firewall() {
    info "Настройка firewall..."
    
    # Проверяем, установлен ли ufw
    if command -v ufw &> /dev/null; then
        # Разрешаем HTTP и HTTPS трафик
        ufw allow 80/tcp
        ufw allow 443/tcp
        success "Firewall настроен (ufw)"
    elif command -v firewall-cmd &> /dev/null; then
        # Для системы с firewalld
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --reload
        success "Firewall настроен (firewalld)"
    else
        warning "Firewall не найден, настройте его вручную"
    fi
}

# Функция первоначального запуска для Docker
initial_deployment() {
    info "Первоначальное развертывание..."
    
    cd "$INSTALL_DIR"
    
    # Создаем необходимые директории для логов и бэкапов
    mkdir -p logs/nginx logs/app backups
    
    # Загружаем переменные окружения
    if [[ -f ".env" ]]; then
        info "Загрузка переменных окружения из .env"
        set -a
        source .env
        set +a
    fi
    
    # Собираем и запускаем контейнеры с оптимизацией
    info "Сборка Docker образа..."
    export DOCKER_BUILDKIT=1
    docker-compose build --pull --parallel
    
    info "Запуск контейнеров..."
    docker-compose up -d
    
    # Ждем запуска приложения
    info "Ожидание запуска приложения..."
    sleep 30
    
    # Проверяем здоровье с правильным endpoint
    local max_attempts=15
    local attempt=1
    local health_url="http://localhost:${HOST_PORT:-80}/health.html"
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$health_url" > /dev/null 2>&1; then
            # Дополнительно проверяем Docker health check
            if docker ps --filter "name=${CONTAINER_NAME:-smokyapp-web}" --filter "health=healthy" --format "{{.Names}}" | grep -q "${CONTAINER_NAME:-smokyapp-web}"; then
                success "Приложение успешно запущено!"
                
                # Показываем информацию о контейнере
                info "Информация о контейнере:"
                docker-compose ps
                
                return 0
            fi
        fi
        
        info "Попытка ${attempt}/${max_attempts}: ожидание..."
        
        # Показываем статус для диагностики
        local container_status=$(docker ps --filter "name=${CONTAINER_NAME:-smokyapp-web}" --format "table {{.Names}}\t{{.Status}}" | tail -n +2)
        if [[ -n "$container_status" ]]; then
            info "Статус контейнера: $container_status"
        fi
        
        sleep 15
        ((attempt++))
    done
    
    error "Приложение не отвечает"
    
    # Показываем логи для диагностики
    info "Логи контейнера для диагностики:"
    docker logs --tail 30 "${CONTAINER_NAME:-smokyapp-web}" 2>&1 || true
    
    return 1
}

# Функция показа статуса
show_status() {
    info "Статус системы:"
    echo "  - Docker: $(docker --version)"
    echo "  - Docker Compose: $(docker-compose --version)"
    echo "  - Проект: $INSTALL_DIR"
    echo "  - Сервис: $(systemctl is-active smokyapp.service)"
    echo "  - Контейнеры:"
    docker-compose -f "$INSTALL_DIR/docker-compose.yml" ps
}

# Основная функция
main() {
    info "🚀 Начало развертывания SmokyApp..."
    
    # Создаем директорию для логов
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Проверяем права администратора
    check_sudo "$@"
    
    # Устанавливаем зависимости
    install_dependencies
    
    # Клонируем проект
    clone_project
    
    # Настраиваем окружение
    setup_environment
    
    # Создаем systemd сервис
    create_systemd_service
    
    # Настраиваем автоматические обновления
    setup_auto_updates
    
    # Настраиваем firewall
    setup_firewall
    
    # Первоначальное развертывание
    if initial_deployment; then
        success "🎉 Развертывание завершено успешно!"
        info "Приложение доступно по адресу: http://$(hostname -I | awk '{print $1}')"
        info "Для проверки статуса: systemctl status smokyapp"
        info "Для просмотра логов: docker-compose -f $INSTALL_DIR/docker-compose.yml logs -f"
        show_status
    else
        error "Ошибка при развертывании"
        exit 1
    fi
}

# Функция справки
show_help() {
    echo "Использование: $0 [ОПЦИИ]"
    echo ""
    echo "Скрипт автоматического развертывания SmokyApp"
    echo ""
    echo "Опции:"
    echo "  -h, --help         Показать справку"
    echo "  -s, --status       Показать статус системы"
    echo "  --uninstall        Удалить приложение"
    echo ""
    echo "Переменные окружения:"
    echo "  REPO_URL          URL репозитория (по умолчанию: $REPO_URL)"
    echo "  BRANCH            Ветка (по умолчанию: $BRANCH)"
    echo "  INSTALL_DIR       Директория установки (по умолчанию: $INSTALL_DIR)"
}

# Функция удаления
uninstall() {
    info "Удаление SmokyApp..."
    
    # Останавливаем сервис
    systemctl stop smokyapp.service 2>/dev/null || true
    systemctl disable smokyapp.service 2>/dev/null || true
    
    # Удаляем контейнеры
    if [[ -f "$INSTALL_DIR/docker-compose.yml" ]]; then
        cd "$INSTALL_DIR"
        docker-compose down -v
    fi
    
    # Удаляем образы
    docker rmi smokyapp-web:latest 2>/dev/null || true
    
    # Удаляем файлы
    rm -rf "$INSTALL_DIR"
    rm -f /etc/systemd/system/smokyapp.service
    rm -f /etc/cron.d/smokyapp-updates
    rm -f /etc/cron.d/smokyapp-cleanup
    
    systemctl daemon-reload
    
    success "SmokyApp удален"
}

# Обработка аргументов
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -s|--status)
            show_status
            exit 0
            ;;
        --uninstall)
            uninstall
            exit 0
            ;;
        *)
            error "Неизвестная опция: $1"
            show_help
            exit 1
            ;;
    esac
done

# Запуск основной функции
main "$@"
