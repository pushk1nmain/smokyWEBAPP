#!/bin/bash

# Скрипт для получения SSL сертификатов Let's Encrypt для SmokyApp
# Автор: SmokyApp Team

set -euo pipefail

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Функции для вывода
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

# Проверка прав администратора
check_sudo() {
    if [[ $EUID -ne 0 ]]; then
        error "Этот скрипт должен быть запущен с правами администратора"
        echo "Используйте: sudo $0"
        exit 1
    fi
}

# Проверка установки certbot
check_certbot() {
    if ! command -v certbot &> /dev/null; then
        info "Установка certbot..."
        
        # Определяем ОС и устанавливаем certbot
        if command -v apt &> /dev/null; then
            # Ubuntu/Debian
            apt update
            apt install -y certbot python3-certbot-nginx
        elif command -v yum &> /dev/null; then
            # CentOS/RHEL
            yum install -y epel-release
            yum install -y certbot python3-certbot-nginx
        else
            error "Неподдерживаемая операционная система"
            exit 1
        fi
        
        success "Certbot установлен"
    else
        success "Certbot уже установлен"
    fi
}

# Получение доменов от пользователя
get_domains() {
    echo ""
    info "Настройка SSL сертификатов для SmokyApp"
    echo ""
    
    # Основной домен
    read -p "🌐 Введите основной домен (например: smokyapp.com): " MAIN_DOMAIN
    if [[ -z "$MAIN_DOMAIN" ]]; then
        error "Домен не может быть пустым"
        exit 1
    fi
    
    # WWW домен
    read -p "🌐 Добавить www.$MAIN_DOMAIN? (Y/n): " ADD_WWW
    if [[ $ADD_WWW =~ ^[Nn]$ ]]; then
        DOMAINS="$MAIN_DOMAIN"
    else
        DOMAINS="$MAIN_DOMAIN,www.$MAIN_DOMAIN"
    fi
    
    # API домен
    read -p "🌐 Добавить поддомен API (api.$MAIN_DOMAIN)? (Y/n): " ADD_API
    if [[ ! $ADD_API =~ ^[Nn]$ ]]; then
        DOMAINS="$DOMAINS,api.$MAIN_DOMAIN"
    fi
    
    # Email для уведомлений
    read -p "📧 Email для уведомлений Let's Encrypt: " EMAIL
    if [[ -z "$EMAIL" ]]; then
        warning "Email не указан, будет использован --register-unsafely-without-email"
        EMAIL_ARG="--register-unsafely-without-email"
    else
        EMAIL_ARG="--email $EMAIL"
    fi
    
    info "Будут получены сертификаты для: $DOMAINS"
}

# Подготовка nginx конфигурации
prepare_nginx_config() {
    info "Подготовка конфигурации nginx..."
    
    # Создаем директорию для certbot
    mkdir -p /var/www/certbot
    
    # Создаем временную конфигурацию для получения сертификатов
    cat > /etc/nginx/sites-available/smokyapp-temp << EOF
server {
    listen 80;
    server_name $MAIN_DOMAIN www.$MAIN_DOMAIN api.$MAIN_DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 'SmokyApp SSL setup in progress...';
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Активируем временную конфигурацию
    ln -sf /etc/nginx/sites-available/smokyapp-temp /etc/nginx/sites-enabled/smokyapp-temp
    
    # Проверяем конфигурацию nginx
    nginx -t
    systemctl reload nginx
    
    success "Временная конфигурация nginx готова"
}

# Получение сертификатов
obtain_certificates() {
    info "Получение SSL сертификатов..."
    
    # Получаем сертификаты
    certbot certonly \
        --webroot \
        --webroot-path /var/www/certbot \
        $EMAIL_ARG \
        --agree-tos \
        --no-eff-email \
        --domains $DOMAINS \
        --non-interactive
    
    success "SSL сертификаты получены!"
}

# Установка финальной конфигурации nginx
setup_final_nginx_config() {
    info "Установка финальной конфигурации nginx..."
    
    # Копируем нашу конфигурацию
    cp nginx-proxy.conf /etc/nginx/sites-available/smokyapp
    
    # Заменяем домены в конфигурации
    sed -i "s/your-domain.com/$MAIN_DOMAIN/g" /etc/nginx/sites-available/smokyapp
    
    # Удаляем временную конфигурацию
    rm -f /etc/nginx/sites-enabled/smokyapp-temp
    rm -f /etc/nginx/sites-available/smokyapp-temp
    
    # Активируем финальную конфигурацию
    ln -sf /etc/nginx/sites-available/smokyapp /etc/nginx/sites-enabled/smokyapp
    
    # Проверяем конфигурацию
    nginx -t
    systemctl reload nginx
    
    success "Финальная конфигурация nginx установлена"
}

# Создание сети Docker для проксирования
setup_docker_network() {
    info "Настройка Docker сети для проксирования..."
    
    # Создаем сеть если её нет
    if ! docker network ls | grep -q nginx-proxy; then
        docker network create nginx-proxy
        success "Создана Docker сеть nginx-proxy"
    else
        success "Docker сеть nginx-proxy уже существует"
    fi
}

# Настройка автоматического обновления сертификатов
setup_cert_renewal() {
    info "Настройка автоматического обновления сертификатов..."
    
    # Создаем скрипт обновления
    cat > /usr/local/bin/renew-smokyapp-certs.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
systemctl reload nginx
EOF
    
    chmod +x /usr/local/bin/renew-smokyapp-certs.sh
    
    # Добавляем в crontab
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/local/bin/renew-smokyapp-certs.sh") | crontab -
    
    success "Автоматическое обновление сертификатов настроено"
}

# Тестирование конфигурации
test_ssl_setup() {
    info "Тестирование SSL конфигурации..."
    
    # Ждем немного для применения изменений
    sleep 5
    
    # Тестируем основной домен
    if curl -f -s https://$MAIN_DOMAIN/health > /dev/null; then
        success "HTTPS работает для $MAIN_DOMAIN"
    else
        warning "HTTPS для $MAIN_DOMAIN может быть недоступен (приложение не запущено?)"
    fi
    
    # Проверяем SSL сертификат
    echo | openssl s_client -servername $MAIN_DOMAIN -connect $MAIN_DOMAIN:443 2>/dev/null | openssl x509 -noout -dates
}

# Инструкции после установки
show_final_instructions() {
    echo ""
    success "🎉 SSL сертификаты настроены успешно!"
    echo ""
    info "Что делать дальше:"
    echo ""
    echo "1. 🐳 Запустите SmokyApp с новой конфигурацией:"
    echo "   cd $(pwd)"
    echo "   docker-compose -f docker-compose-proxy.yml up -d --build"
    echo ""
    echo "2. 🔗 Ваши домены:"
    echo "   Основной сайт: https://$MAIN_DOMAIN"
    if [[ $DOMAINS == *"www"* ]]; then
        echo "   С WWW:         https://www.$MAIN_DOMAIN"
    fi
    if [[ $DOMAINS == *"api"* ]]; then
        echo "   API:           https://api.$MAIN_DOMAIN"
    fi
    echo ""
    echo "3. 🔍 Проверка:"
    echo "   curl -f https://$MAIN_DOMAIN/health"
    echo ""
    echo "4. 📊 Мониторинг:"
    echo "   nginx логи:    tail -f /var/log/nginx/smokyapp_*.log"
    echo "   SSL статус:    certbot certificates"
    echo ""
    echo "5. 🔄 Обновление сертификатов:"
    echo "   Автоматически: настроено в crontab"
    echo "   Ручное:        sudo certbot renew"
}

# Основная функция
main() {
    info "🔒 Настройка SSL для SmokyApp"
    echo ""
    
    # Проверки
    check_sudo
    check_certbot
    
    # Получение информации от пользователя
    get_domains
    
    # Настройка
    prepare_nginx_config
    setup_docker_network
    obtain_certificates
    setup_final_nginx_config
    setup_cert_renewal
    
    # Тестирование
    test_ssl_setup
    
    # Финальные инструкции
    show_final_instructions
}

# Функция справки
show_help() {
    echo "Использование: $0 [ОПЦИИ]"
    echo ""
    echo "Скрипт автоматической настройки SSL сертификатов для SmokyApp"
    echo ""
    echo "Опции:"
    echo "  -h, --help     Показать справку"
    echo "  --dry-run      Тестовый режим (staging сертификаты)"
    echo ""
    echo "Примеры:"
    echo "  sudo $0                    # Обычная установка"
    echo "  sudo $0 --dry-run          # Тестовая установка"
}

# Обработка аргументов
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --dry-run)
            DRY_RUN=true
            warning "Режим тестирования: будут получены staging сертификаты"
            shift
            ;;
        *)
            error "Неизвестная опция: $1"
            show_help
            exit 1
            ;;
    esac
done

# Если dry-run, добавляем флаг к certbot
if [[ "$DRY_RUN" == "true" ]]; then
    CERTBOT_EXTRA_ARGS="--staging"
else
    CERTBOT_EXTRA_ARGS=""
fi

# Запуск основной функции
main
