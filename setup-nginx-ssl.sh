#!/bin/bash

# Автоматическая настройка Nginx и SSL для webapp.smokybot.com
# Автор: SmokyApp Team
# Версия: 1.0.0

set -euo pipefail

# Конфигурация
DOMAIN="webapp.smokybot.com"
WWW_DOMAIN="www.webapp.smokybot.com"
APP_PORT="8080"
EMAIL="admin@smokybot.com"  # Измените на ваш email
NGINX_SITES_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"

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

# Проверка прав администратора
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "Этот скрипт должен запускаться с правами администратора"
        info "Запустите: sudo $0"
        exit 1
    fi
}

# Определение ОС
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$ID
        info "Обнаружена ОС: $PRETTY_NAME"
    else
        error "Не удалось определить операционную систему"
        exit 1
    fi
}

# Обновление системы
update_system() {
    info "Обновление системы..."
    
    case $OS in
        ubuntu|debian)
            apt update && apt upgrade -y
            ;;
        centos|rhel|fedora)
            yum update -y
            ;;
        *)
            warning "Пропускаем обновление для неизвестной ОС"
            ;;
    esac
    
    success "Система обновлена"
}

# Установка Nginx
install_nginx() {
    info "Установка Nginx..."
    
    # Проверяем, установлен ли уже nginx
    if command -v nginx &> /dev/null; then
        warning "Nginx уже установлен"
        return 0
    fi
    
    case $OS in
        ubuntu|debian)
            apt install -y nginx
            ;;
        centos|rhel|fedora)
            yum install -y nginx
            ;;
        *)
            error "Неподдерживаемая ОС для автоматической установки"
            exit 1
            ;;
    esac
    
    # Запускаем и добавляем в автозагрузку
    systemctl start nginx
    systemctl enable nginx
    
    success "Nginx установлен и запущен"
}

# Настройка файрвола
setup_firewall() {
    info "Настройка файрвола..."
    
    # Ubuntu/Debian (ufw)
    if command -v ufw &> /dev/null; then
        ufw allow 'Nginx Full'
        ufw allow OpenSSH
        ufw --force enable
        success "Файрвол настроен (ufw)"
    # CentOS/RHEL (firewalld)
    elif command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --reload
        success "Файрвол настроен (firewalld)"
    else
        warning "Файрвол не найден. Настройте его вручную"
    fi
}

# Создание конфигурации Nginx
create_nginx_config() {
    info "Создание конфигурации Nginx для $DOMAIN..."
    
    # Создаем конфигурацию сайта
    cat > "${NGINX_SITES_DIR}/${DOMAIN}" << EOF
# Конфигурация для ${DOMAIN}
# Создано автоматически $(date)

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${WWW_DOMAIN};
    
    # Директория для ACME challenge (Let's Encrypt)
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }
    
    # Проксирование к Docker контейнеру
    location / {
        proxy_pass http://localhost:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        
        # Настройки для больших файлов
        client_max_body_size 50M;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        
        # CORS для Telegram WebApp
        add_header Access-Control-Allow-Origin "https://web.telegram.org" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
        
        # Обработка preflight запросов
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://web.telegram.org" always;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain charset=UTF-8";
            add_header Content-Length 0;
            return 204;
        }
        
        # Безопасность для Telegram WebApp
        add_header X-Frame-Options "ALLOWALL" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # Кэширование статических ресурсов
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Vary "Accept-Encoding";
        }
    }
    
    # Логи
    access_log /var/log/nginx/${DOMAIN}.access.log;
    error_log /var/log/nginx/${DOMAIN}.error.log;
}
EOF
    
    success "Конфигурация Nginx создана"
}

# Активация конфигурации
activate_nginx_config() {
    info "Активация конфигурации Nginx..."
    
    # Удаляем дефолтную конфигурацию если она есть
    if [[ -f "${NGINX_ENABLED_DIR}/default" ]]; then
        rm "${NGINX_ENABLED_DIR}/default"
        info "Удалена дефолтная конфигурация"
    fi
    
    # Создаем символическую ссылку
    ln -sf "${NGINX_SITES_DIR}/${DOMAIN}" "${NGINX_ENABLED_DIR}/"
    
    # Проверяем конфигурацию
    if nginx -t; then
        systemctl reload nginx
        success "Конфигурация Nginx активирована"
    else
        error "Ошибка в конфигурации Nginx"
        exit 1
    fi
}

# Установка Certbot
install_certbot() {
    info "Установка Certbot для SSL сертификатов..."
    
    # Проверяем, установлен ли уже certbot
    if command -v certbot &> /dev/null; then
        warning "Certbot уже установлен"
        return 0
    fi
    
    case $OS in
        ubuntu|debian)
            apt install -y certbot python3-certbot-nginx
            ;;
        centos|rhel)
            yum install -y certbot python3-certbot-nginx
            ;;
        fedora)
            dnf install -y certbot python3-certbot-nginx
            ;;
        *)
            error "Неподдерживаемая ОС для установки Certbot"
            exit 1
            ;;
    esac
    
    success "Certbot установлен"
}

# Получение SSL сертификата
obtain_ssl_certificate() {
    info "Получение SSL сертификата для $DOMAIN..."
    
    # Проверяем, доступен ли домен
    if ! curl -s -o /dev/null -w "%{http_code}" "http://${DOMAIN}" | grep -q "200\|301\|302"; then
        warning "Домен $DOMAIN не отвечает. Убедитесь, что DNS настроен правильно"
        info "Пропускаем получение SSL сертификата"
        info "Вы можете получить его позже командой:"
        info "sudo certbot --nginx -d $DOMAIN -d $WWW_DOMAIN"
        return 0
    fi
    
    # Получаем сертификат
    certbot --nginx \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        --domains "$DOMAIN,$WWW_DOMAIN" \
        --redirect
    
    if [[ $? -eq 0 ]]; then
        success "SSL сертификат получен успешно"
        
        # Настраиваем автообновление
        if ! crontab -l 2>/dev/null | grep -q certbot; then
            (crontab -l 2>/dev/null; echo "0 2 * * * /usr/bin/certbot renew --quiet") | crontab -
            info "Настроено автообновление SSL сертификатов"
        fi
    else
        error "Ошибка при получении SSL сертификата"
        info "Возможные причины:"
        info "1. DNS домена $DOMAIN не настроен на этот сервер"
        info "2. Домен недоступен из интернета"
        info "3. Файрвол блокирует порты 80/443"
        info ""
        info "Вы можете получить сертификат позже командой:"
        info "sudo certbot --nginx -d $DOMAIN -d $WWW_DOMAIN"
    fi
}

# Проверка настройки
verify_setup() {
    info "Проверка настройки..."
    
    # Проверяем статус nginx
    if systemctl is-active --quiet nginx; then
        success "Nginx работает"
    else
        error "Nginx не запущен"
        return 1
    fi
    
    # Проверяем конфигурацию
    if nginx -t &>/dev/null; then
        success "Конфигурация Nginx корректна"
    else
        error "Ошибка в конфигурации Nginx"
        return 1
    fi
    
    # Проверяем доступность домена
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://${DOMAIN}" || echo "000")
    if [[ "$http_code" =~ ^(200|301|302)$ ]]; then
        success "Домен $DOMAIN отвечает (HTTP $http_code)"
    else
        warning "Домен $DOMAIN не отвечает или возвращает ошибку (HTTP $http_code)"
    fi
    
    # Проверяем SSL если сертификат установлен
    if [[ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
        local https_code=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}" || echo "000")
        if [[ "$https_code" =~ ^(200|301|302)$ ]]; then
            success "HTTPS работает (HTTP $https_code)"
        else
            warning "HTTPS не работает (HTTP $https_code)"
        fi
    fi
}

# Вывод информации о следующих шагах
show_next_steps() {
    echo ""
    success "🎉 Настройка Nginx и SSL завершена!"
    echo ""
    info "Следующие шаги:"
    echo ""
    echo "1. Запустите Docker контейнер SmokyApp на порту $APP_PORT:"
    echo "   cd /path/to/smokyapp/frontend"
    echo "   ./docker-start.sh"
    echo ""
    echo "2. Проверьте работу сайта:"
    echo "   https://$DOMAIN"
    echo ""
    echo "3. Просмотрите логи:"
    echo "   sudo tail -f /var/log/nginx/${DOMAIN}.access.log"
    echo "   sudo tail -f /var/log/nginx/${DOMAIN}.error.log"
    echo ""
    info "Полезные команды:"
    echo "• Перезагрузка Nginx: sudo systemctl reload nginx"
    echo "• Проверка сертификата: sudo certbot certificates"
    echo "• Обновление сертификата: sudo certbot renew"
    echo "• Проверка статуса: sudo systemctl status nginx"
    echo ""
}

# Основная функция
main() {
    echo "🚀 Автоматическая настройка Nginx и SSL для $DOMAIN"
    echo ""
    
    check_root
    detect_os
    update_system
    install_nginx
    setup_firewall
    create_nginx_config
    activate_nginx_config
    install_certbot
    obtain_ssl_certificate
    verify_setup
    show_next_steps
}

# Функция справки
show_help() {
    echo "Использование: $0 [опции]"
    echo ""
    echo "Опции:"
    echo "  -d, --domain DOMAIN    Домен для настройки (по умолчанию: webapp.smokybot.com)"
    echo "  -p, --port PORT        Порт Docker контейнера (по умолчанию: 8080)"
    echo "  -e, --email EMAIL      Email для SSL сертификата"
    echo "  -h, --help             Показать справку"
    echo ""
    echo "Примеры:"
    echo "  $0                                    # Настройка с параметрами по умолчанию"
    echo "  $0 -d myapp.example.com -p 3000      # Кастомный домен и порт"
    echo "  $0 -e admin@example.com               # Кастомный email для SSL"
}

# Обработка аргументов командной строки
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--domain)
            DOMAIN="$2"
            WWW_DOMAIN="www.$2"
            shift 2
            ;;
        -p|--port)
            APP_PORT="$2"
            shift 2
            ;;
        -e|--email)
            EMAIL="$2"
            shift 2
            ;;
        -h|--help)
            show_help
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
main
