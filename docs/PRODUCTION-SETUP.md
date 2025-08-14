# 🚀 Инструкция по продакшн настройке SmokyApp

## Полная настройка для домена webapp.smokybot.com

### 📋 Предварительные требования

1. **VPS/Сервер** с Ubuntu 20.04+ или CentOS 8+
2. **Доменное имя** webapp.smokybot.com настроено на IP сервера
3. **Root доступ** к серверу
4. **Открытые порты** 80, 443 в файрволе

---

## 🔧 1. Подготовка сервера

### Обновление системы

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### Установка необходимых пакетов

```bash
# Ubuntu/Debian
sudo apt install -y curl wget git unzip software-properties-common

# CentOS/RHEL
sudo yum install -y curl wget git unzip epel-release
```

---

## 🐳 2. Установка Docker

### Ubuntu/Debian

```bash
# Удаляем старые версии
sudo apt remove docker docker-engine docker.io containerd runc

# Добавляем официальный GPG ключ Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавляем репозиторий
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Устанавливаем Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Запускаем и добавляем в автозагрузку
sudo systemctl start docker
sudo systemctl enable docker

# Добавляем пользователя в группу docker
sudo usermod -aG docker $USER
```

### CentOS/RHEL

```bash
# Устанавливаем yum-utils
sudo yum install -y yum-utils

# Добавляем репозиторий Docker
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Устанавливаем Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Запускаем и добавляем в автозагрузку
sudo systemctl start docker
sudo systemctl enable docker

# Добавляем пользователя в группу docker
sudo usermod -aG docker $USER
```

### Проверка установки

```bash
# Перелогиниваемся для применения группы
newgrp docker

# Проверяем Docker
docker --version
docker-compose --version

# Тестируем Docker
docker run hello-world
```

---

## 🌐 3. Установка и настройка Nginx

### Установка Nginx

```bash
# Ubuntu/Debian
sudo apt install -y nginx

# CentOS/RHEL
sudo yum install -y nginx
```

### Базовая настройка

```bash
# Запускаем и добавляем в автозагрузку
sudo systemctl start nginx
sudo systemctl enable nginx

# Проверяем статус
sudo systemctl status nginx
```

### Настройка файрвола

```bash
# Ubuntu (ufw)
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

### Создание конфигурации для webapp.smokybot.com

```bash
# Создаем конфигурацию сайта
sudo nano /etc/nginx/sites-available/webapp.smokybot.com
```

Содержимое файла:

```nginx
# Конфигурация для webapp.smokybot.com
server {
    listen 80;
    listen [::]:80;
    server_name webapp.smokybot.com www.webapp.smokybot.com;
    
    # Перенаправление на HTTPS (будет добавлено после получения SSL)
    # return 301 https://$server_name$request_uri;
    
    # Временная конфигурация для получения SSL сертификата
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Проксирование к Docker контейнеру
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        
        # CORS для Telegram WebApp
        add_header Access-Control-Allow-Origin "https://web.telegram.org" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        
        # Безопасность для Telegram WebApp
        add_header X-Frame-Options "ALLOWALL" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
    
    # Логи
    access_log /var/log/nginx/webapp.smokybot.com.access.log;
    error_log /var/log/nginx/webapp.smokybot.com.error.log;
}
```

### Активация конфигурации

```bash
# Создаем символическую ссылку
sudo ln -s /etc/nginx/sites-available/webapp.smokybot.com /etc/nginx/sites-enabled/

# Удаляем дефолтную конфигурацию
sudo rm /etc/nginx/sites-enabled/default

# Проверяем конфигурацию
sudo nginx -t

# Перезагружаем nginx
sudo systemctl reload nginx
```

---

## 🔒 4. Получение SSL сертификатов

### Установка Certbot

```bash
# Ubuntu/Debian
sudo apt install -y certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install -y certbot python3-certbot-nginx
```

### Получение сертификата

```bash
# Получаем сертификат для домена
sudo certbot --nginx -d webapp.smokybot.com -d www.webapp.smokybot.com

# При первом запуске введите:
# Email для уведомлений
# Согласитесь с условиями (A)
# Выберите опцию редиректа на HTTPS (2)
```

### Проверка автообновления

```bash
# Тестируем автообновление
sudo certbot renew --dry-run

# Проверяем cron задачу
sudo systemctl status certbot.timer
```

### Финальная конфигурация nginx

После получения SSL сертификата, файл автоматически обновится. Проверим:

```bash
# Проверяем конфигурацию
sudo nano /etc/nginx/sites-available/webapp.smokybot.com
```

Должно получиться примерно так:

```nginx
server {
    server_name webapp.smokybot.com www.webapp.smokybot.com;
    
    # Проксирование к Docker контейнеру
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        
        # CORS для Telegram WebApp
        add_header Access-Control-Allow-Origin "https://web.telegram.org" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        
        # Безопасность для Telegram WebApp
        add_header X-Frame-Options "ALLOWALL" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
    
    # Логи
    access_log /var/log/nginx/webapp.smokybot.com.access.log;
    error_log /var/log/nginx/webapp.smokybot.com.error.log;

    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/webapp.smokybot.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/webapp.smokybot.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.webapp.smokybot.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = webapp.smokybot.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    listen [::]:80;
    server_name webapp.smokybot.com www.webapp.smokybot.com;
    return 404; # managed by Certbot
}
```

---

## 🚀 5. Деплой приложения

### Клонирование проекта

```bash

# Клонируем репозиторий
# Переходим в директорию фронтенда
cd frontend

sudo git clone https://github.com/pushk1nmain/smokyWEBAPP.git

```

### Настройка переменных окружения

```bash
# Копируем и редактируем .env файл
cp .env.example .env
nano .env
```

Важные настройки для продакшн:

```bash
# Основные настройки
NODE_ENV=production
CONTAINER_NAME=smokyapp-web
HOST_PORT=8080  # Внутренний порт для nginx proxy
VERSION=latest
DOMAIN=webapp.smokybot.com

# Ресурсы контейнера
MEMORY_LIMIT=512M
MEMORY_RESERVATION=256M
CPU_LIMIT=1.0
CPU_RESERVATION=0.5

# Автообновления
REPO_URL=https://github.com/smokyapp/webapp.git
BRANCH=main
UPDATE_INTERVAL=300

# Уведомления (опционально)
# TELEGRAM_BOT_TOKEN=your_bot_token
# TELEGRAM_CHAT_ID=your_chat_id

# Часовой пояс
TZ=Europe/Moscow
```

---

## 🐳 6. Запуск контейнеров

### Метод 1: Быстрый запуск

```bash
# Делаем скрипт исполняемым
chmod +x docker-start.sh

# Запускаем приложение
./docker-start.sh
```

### Метод 2: Ручной запуск

```bash
# Сборка образа
export DOCKER_BUILDKIT=1
docker-compose build --pull

# Запуск контейнеров
docker-compose up -d

# Проверяем статус
docker-compose ps
```

### Метод 3: Полный продакшн деплой

```bash
# Запускаем скрипт деплоя (требует sudo для системных настроек)
sudo ./scripts/deploy.sh
```

---

## ✅ 7. Проверка работы

### Проверка контейнеров

```bash
# Статус контейнеров
docker-compose ps

# Логи приложения
docker-compose logs -f

# Статус здоровья
docker ps --filter "name=smokyapp-web"
```

### Проверка nginx

```bash
# Статус nginx
sudo systemctl status nginx

# Логи nginx
sudo tail -f /var/log/nginx/webapp.smokybot.com.access.log
sudo tail -f /var/log/nginx/webapp.smokybot.com.error.log
```

### Проверка доступности

```bash
# Проверка HTTP редиректа
curl -I http://webapp.smokybot.com

# Проверка HTTPS
curl -I https://webapp.smokybot.com

# Проверка health endpoint
curl https://webapp.smokybot.com/health.html
```

### Проверка SSL сертификата

```bash
# Информация о сертификате
openssl s_client -connect webapp.smokybot.com:443 -servername webapp.smokybot.com

# Проверка через браузер
# Откройте https://webapp.smokybot.com и проверьте зеленый замок
```

---

## 🔧 8. Настройка автоматических обновлений

### Настройка cron

```bash
# Редактируем crontab
sudo crontab -e

# Добавляем задачи
# Проверка обновлений каждые 5 минут
*/5 * * * * cd /opt/smokyapp/frontend && ./scripts/update.sh > /dev/null 2>&1

# Очистка старых логов каждую неделю
0 3 * * 0 find /opt/smokyapp/frontend/logs -name "*.log" -mtime +7 -delete

# Проверка и обновление SSL сертификатов
0 2 * * * /usr/bin/certbot renew --quiet
```

### Мониторинг

```bash
# Создаем скрипт мониторинга
sudo nano /opt/smokyapp/monitor.sh
```

Содержимое скрипта:

```bash
#!/bin/bash

# Проверка работоспособности сайта
if ! curl -f -s https://webapp.smokybot.com/health.html > /dev/null; then
    echo "$(date): Site is down!" >> /var/log/webapp.smokybot.com.monitor.log
    # Здесь можно добавить отправку уведомлений
fi

# Проверка контейнера
if ! docker ps --filter "name=smokyapp-web" --filter "status=running" | grep -q smokyapp-web; then
    echo "$(date): Container is down!" >> /var/log/webapp.smokybot.com.monitor.log
    # Попытка перезапуска
    cd /opt/smokyapp/frontend && docker-compose restart
fi
```

```bash
# Делаем исполняемым
sudo chmod +x /opt/smokyapp/monitor.sh

# Добавляем в cron для проверки каждую минуту
echo "* * * * * /opt/smokyapp/monitor.sh" | sudo crontab -
```

---

## 🛠️ 9. Обслуживание

### Просмотр логов

```bash
# Логи приложения
docker-compose logs -f smokyapp

# Логи nginx
sudo tail -f /var/log/nginx/webapp.smokybot.com.access.log

# Системные логи
journalctl -u nginx -f
journalctl -u docker -f
```

### Обновление приложения

```bash
# Проверка обновлений
./scripts/update.sh --dry-run

# Принудительное обновление
./scripts/update.sh --force

# Откат к предыдущей версии (если есть проблемы)
docker-compose down
docker-compose up -d
```

### Резервное копирование

```bash
# Создание бэкапа
tar -czf /opt/backups/smokyapp-$(date +%Y%m%d).tar.gz \
  /opt/smokyapp/frontend/.env \
  /opt/smokyapp/frontend/logs/ \
  /opt/smokyapp/frontend/backups/ \
  /etc/nginx/sites-available/webapp.smokybot.com \
  /etc/letsencrypt/live/webapp.smokybot.com/
```

---

## 🚨 10. Решение проблем

### Типичные проблемы

1. **502 Bad Gateway**
   ```bash
   # Проверить статус контейнера
   docker-compose ps
   
   # Перезапустить контейнер
   docker-compose restart
   ```

2. **SSL сертификат не работает**
   ```bash
   # Проверить сертификат
   sudo certbot certificates
   
   # Принудительно обновить
   sudo certbot renew --force-renewal
   ```

3. **Высокое использование ресурсов**
   ```bash
   # Проверить использование
   docker stats smokyapp-web
   
   # Увеличить лимиты в .env
   MEMORY_LIMIT=1G
   CPU_LIMIT=2.0
   ```

### Контакты поддержки

При возникновении проблем создайте issue в репозитории с подробным описанием и логами.

---

## ✅ Финальная проверка

После выполнения всех шагов:

1. ✅ Сайт доступен по https://webapp.smokybot.com
2. ✅ SSL сертификат действителен
3. ✅ Контейнеры запущены и работают
4. ✅ Health check возвращает OK
5. ✅ Логи не содержат ошибок
6. ✅ Автообновления настроены

**Поздравляем! SmokyApp успешно развернут в продакшн! 🎉**
