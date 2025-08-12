#!/bin/bash

# Скрипт быстрого старта SmokyApp
# Автоматически настраивает и запускает приложение одной командой
# Автор: SmokyApp Team
# Версия: 1.0.0

set -euo pipefail

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# ASCII арт заголовок
show_banner() {
    echo -e "${PURPLE}"
    cat << 'EOF'
   _____ __  __  ____  _  ____     __ ___    ____  ____ 
  / ___//  |/  |/ __ \| |/ /\ \   / /|__ \  / __ \/ __ \
  \__ \| | | | / / | |   /  \ \_/ /  __/ / / / / / / / /
 ___/ /| | | |/ /_/ /|   |   \   /  / __/_/ /_/ / /_/ / 
/____/ |_| |_|\____/ |_|_|    \_/  /____(_)____/\____/  
                                                        
    🚀 Telegram Web App для отказа от курения 🚀
EOF
    echo -e "${NC}"
    echo -e "${CYAN}======================================================${NC}"
    echo -e "${WHITE}         Быстрый старт и автоматическая настройка${NC}"
    echo -e "${CYAN}======================================================${NC}"
    echo ""
}

# Функция для отображения статуса
show_step() {
    local step="$1"
    local total="$2"
    local description="$3"
    echo -e "${BLUE}[${step}/${total}]${NC} ${description}..."
}

# Функция для отображения успеха
show_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Функция для отображения предупреждения
show_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Функция для отображения ошибки
show_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Функция для отображения информации
show_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Проверка операционной системы
check_os() {
    show_step 1 8 "Проверка операционной системы"
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        show_success "Обнаружена Linux система"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        show_success "Обнаружена macOS система"
    else
        show_error "Неподдерживаемая операционная система: $OSTYPE"
        exit 1
    fi
}

# Проверка и установка зависимостей
install_dependencies() {
    show_step 2 8 "Проверка и установка зависимостей"
    
    local deps_missing=()
    
    # Проверяем Docker
    if ! command -v docker &> /dev/null; then
        deps_missing+=("docker")
    fi
    
    # Проверяем Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        deps_missing+=("docker-compose")
    fi
    
    # Проверяем Git
    if ! command -v git &> /dev/null; then
        deps_missing+=("git")
    fi
    
    # Проверяем curl
    if ! command -v curl &> /dev/null; then
        deps_missing+=("curl")
    fi
    
    if [[ ${#deps_missing[@]} -eq 0 ]]; then
        show_success "Все зависимости установлены"
        return 0
    fi
    
    show_warning "Отсутствующие зависимости: ${deps_missing[*]}"
    
    # Автоматическая установка зависимостей
    if [[ "$OS" == "linux" ]]; then
        install_deps_linux "${deps_missing[@]}"
    elif [[ "$OS" == "macos" ]]; then
        install_deps_macos "${deps_missing[@]}"
    fi
}

# Установка зависимостей для Linux
install_deps_linux() {
    local deps=("$@")
    
    show_info "Установка зависимостей для Linux..."
    
    # Определяем дистрибутив
    if command -v apt &> /dev/null; then
        # Ubuntu/Debian
        sudo apt update
        for dep in "${deps[@]}"; do
            case "$dep" in
                "docker")
                    curl -fsSL https://get.docker.com | sh
                    sudo usermod -aG docker "$USER"
                    ;;
                "docker-compose")
                    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
                    sudo chmod +x /usr/local/bin/docker-compose
                    ;;
                "git"|"curl")
                    sudo apt install -y "$dep"
                    ;;
            esac
        done
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        for dep in "${deps[@]}"; do
            case "$dep" in
                "docker")
                    curl -fsSL https://get.docker.com | sh
                    sudo usermod -aG docker "$USER"
                    sudo systemctl enable --now docker
                    ;;
                "docker-compose")
                    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
                    sudo chmod +x /usr/local/bin/docker-compose
                    ;;
                "git"|"curl")
                    sudo yum install -y "$dep"
                    ;;
            esac
        done
    fi
    
    show_success "Зависимости установлены"
}

# Установка зависимостей для macOS
install_deps_macos() {
    local deps=("$@")
    
    show_info "Установка зависимостей для macOS..."
    
    # Проверяем Homebrew
    if ! command -v brew &> /dev/null; then
        show_info "Установка Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    for dep in "${deps[@]}"; do
        case "$dep" in
            "docker")
                show_info "Установка Docker Desktop для macOS..."
                brew install --cask docker
                ;;
            "docker-compose")
                brew install docker-compose
                ;;
            "git"|"curl")
                brew install "$dep"
                ;;
        esac
    done
    
    show_success "Зависимости установлены"
}

# Создание рабочей директории
setup_directory() {
    show_step 3 8 "Настройка рабочей директории"
    
    # Если мы уже в директории проекта, используем её
    if [[ -f "package.json" && -f "index.html" ]]; then
        show_success "Используется текущая директория проекта"
        return 0
    fi
    
    # Иначе создаем новую директорию
    local project_dir="$HOME/smokyapp"
    
    if [[ -d "$project_dir" ]]; then
        show_warning "Директория $project_dir уже существует"
        read -p "Удалить существующую директорию? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$project_dir"
            show_success "Старая директория удалена"
        else
            show_error "Установка прервана пользователем"
            exit 1
        fi
    fi
    
    mkdir -p "$project_dir"
    cd "$project_dir"
    show_success "Создана рабочая директория: $project_dir"
}

# Клонирование репозитория
clone_repository() {
    show_step 4 8 "Загрузка исходного кода"
    
    local repo_url="${REPO_URL:-https://github.com/smokyapp/webapp.git}"
    local branch="${BRANCH:-main}"
    
    # Если мы уже в директории с проектом, пропускаем клонирование
    if [[ -f "package.json" && -f "index.html" ]]; then
        show_success "Исходный код уже доступен"
        return 0
    fi
    
    git clone --branch "$branch" "$repo_url" .
    show_success "Исходный код загружен"
}

# Настройка переменных окружения
setup_environment() {
    show_step 5 8 "Настройка переменных окружения"
    
    if [[ ! -f ".env" ]]; then
        cp .env.example .env
        show_success "Создан файл .env"
        
        # Интерактивная настройка основных параметров
        echo ""
        show_info "Настройка основных параметров:"
        
        # Telegram настройки
        read -p "🤖 Telegram Bot Token (необязательно): " telegram_token
        if [[ -n "$telegram_token" ]]; then
            sed -i.bak "s/# TELEGRAM_BOT_TOKEN=.*/TELEGRAM_BOT_TOKEN=$telegram_token/" .env
        fi
        
        read -p "💬 Telegram Chat ID (необязательно): " telegram_chat
        if [[ -n "$telegram_chat" ]]; then
            sed -i.bak "s/# TELEGRAM_CHAT_ID=.*/TELEGRAM_CHAT_ID=$telegram_chat/" .env
        fi
        
        # Секретный ключ
        local secret_key=$(openssl rand -hex 32 2>/dev/null || date +%s | sha256sum | head -c 64)
        sed -i.bak "s/WEBHOOK_SECRET=.*/WEBHOOK_SECRET=$secret_key/" .env
        
        rm -f .env.bak
        show_success "Параметры настроены"
    else
        show_success "Файл .env уже существует"
    fi
}

# Создание необходимых директорий
create_directories() {
    show_step 6 8 "Создание необходимых директорий"
    
    mkdir -p logs backups
    chmod +x scripts/*.sh
    show_success "Директории созданы"
}

# Сборка и запуск Docker контейнеров
build_and_start() {
    show_step 7 8 "Сборка и запуск Docker контейнеров"
    
    # Проверяем, что Docker запущен
    if ! docker info &> /dev/null; then
        show_error "Docker не запущен. Запустите Docker и повторите попытку"
        exit 1
    fi
    
    # Собираем образы
    show_info "Сборка Docker образов..."
    docker-compose build --no-cache
    
    # Запускаем контейнеры
    show_info "Запуск контейнеров..."
    docker-compose up -d
    
    show_success "Контейнеры запущены"
}

# Проверка работоспособности
health_check() {
    show_step 8 8 "Проверка работоспособности"
    
    show_info "Ожидание запуска приложения..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s http://localhost/health > /dev/null 2>&1; then
            show_success "Приложение работает корректно!"
            return 0
        fi
        
        printf "."
        sleep 2
        ((attempt++))
    done
    
    echo ""
    show_error "Приложение не отвечает после запуска"
    show_info "Проверьте логи: docker-compose logs"
    return 1
}

# Отображение финальной информации
show_final_info() {
    echo ""
    echo -e "${GREEN}🎉 Установка завершена успешно!${NC}"
    echo ""
    echo -e "${WHITE}Полезная информация:${NC}"
    echo -e "${CYAN}📱 Приложение доступно:${NC} http://localhost"
    echo -e "${CYAN}🏥 Проверка здоровья:${NC} http://localhost/health"
    echo -e "${CYAN}📁 Директория проекта:${NC} $(pwd)"
    echo ""
    echo -e "${WHITE}Управление приложением:${NC}"
    echo -e "${YELLOW}  make start${NC}      - Запуск приложения"
    echo -e "${YELLOW}  make stop${NC}       - Остановка приложения"
    echo -e "${YELLOW}  make logs${NC}       - Просмотр логов"
    echo -e "${YELLOW}  make status${NC}     - Статус системы"
    echo -e "${YELLOW}  make update${NC}     - Обновление приложения"
    echo -e "${YELLOW}  make help${NC}       - Справка по всем командам"
    echo ""
    echo -e "${WHITE}Мониторинг обновлений:${NC}"
    echo -e "${YELLOW}  ./scripts/watch.sh start${NC}   - Запуск автоматических обновлений"
    echo -e "${YELLOW}  ./scripts/watch.sh status${NC}  - Статус мониторинга"
    echo ""
    echo -e "${WHITE}Логи и отладка:${NC}"
    echo -e "${YELLOW}  docker-compose logs -f${NC}     - Все логи в реальном времени"
    echo -e "${YELLOW}  docker-compose ps${NC}          - Статус контейнеров"
    echo ""
    
    if [[ -n "${TELEGRAM_BOT_TOKEN:-}" ]]; then
        echo -e "${GREEN}✅ Telegram уведомления настроены${NC}"
    else
        echo -e "${YELLOW}⚠️  Telegram уведомления не настроены${NC}"
        echo -e "${CYAN}   Для настройки отредактируйте .env файл${NC}"
    fi
    
    echo ""
    echo -e "${PURPLE}Спасибо за использование SmokyApp! 🚭💪${NC}"
}

# Обработка ошибок
handle_error() {
    echo ""
    show_error "Произошла ошибка во время установки"
    echo ""
    echo -e "${WHITE}Диагностика:${NC}"
    echo -e "${YELLOW}1. Проверьте, что Docker запущен: docker info${NC}"
    echo -e "${YELLOW}2. Проверьте доступ к интернету: curl -I google.com${NC}"
    echo -e "${YELLOW}3. Проверьте права доступа в текущей директории${NC}"
    echo ""
    echo -e "${WHITE}Получение помощи:${NC}"
    echo -e "${CYAN}📖 Документация: README-DOCKER.md${NC}"
    echo -e "${CYAN}🐛 Сообщить об ошибке: https://github.com/smokyapp/webapp/issues${NC}"
    
    exit 1
}

# Функция показа справки
show_help() {
    echo "Скрипт быстрого старта SmokyApp"
    echo ""
    echo "Использование: $0 [ОПЦИИ]"
    echo ""
    echo "Опции:"
    echo "  -h, --help     Показать справку"
    echo "  --no-docker    Пропустить установку Docker"
    echo "  --dev          Режим разработки"
    echo ""
    echo "Переменные окружения:"
    echo "  REPO_URL       URL репозитория (по умолчанию: https://github.com/smokyapp/webapp.git)"
    echo "  BRANCH         Ветка для клонирования (по умолчанию: main)"
}

# Основная функция
main() {
    # Обработка аргументов
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            --no-docker)
                SKIP_DOCKER=true
                shift
                ;;
            --dev)
                DEV_MODE=true
                shift
                ;;
            *)
                show_error "Неизвестная опция: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Установка обработчика ошибок
    trap handle_error ERR
    
    # Показываем баннер
    show_banner
    
    # Выполняем установку пошагово
    check_os
    
    if [[ "${SKIP_DOCKER:-false}" != "true" ]]; then
        install_dependencies
    fi
    
    setup_directory
    clone_repository
    setup_environment
    create_directories
    build_and_start
    
    if health_check; then
        show_final_info
    else
        handle_error
    fi
}

# Запуск основной функции
main "$@"
