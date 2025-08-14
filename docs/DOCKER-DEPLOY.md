# Docker Deployment Guide для SmokyApp

## 🐳 Полное руководство по деплою в Docker

### Быстрый старт

Для быстрого запуска используйте скрипт:

```bash
# Клонируйте репозиторий
git clone https://github.com/smokyapp/webapp.git
cd webapp/frontend

# Запустите приложение
./docker-start.sh
```

### Требования

- **Docker** >= 20.10.0
- **Docker Compose** >= 2.0.0
- **curl** (для health checks)
- **git** (для клонирования и обновлений)

### Установка зависимостей

#### Ubuntu/Debian
```bash
# Обновляем пакеты
sudo apt update

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавляем пользователя в группу docker
sudo usermod -aG docker $USER

# Перелогиниваемся для применения изменений
newgrp docker

# Устанавливаем Docker Compose
sudo apt install docker-compose-plugin
```

#### CentOS/RHEL
```bash
# Устанавливаем Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Запускаем Docker
sudo systemctl start docker
sudo systemctl enable docker

# Добавляем пользователя в группу docker
sudo usermod -aG docker $USER
```

## 📁 Структура проекта для Docker

```
frontend/
├── Dockerfile                 # Docker образ
├── docker-compose.yml        # Оркестрация контейнеров
├── nginx.conf                # Конфигурация nginx
├── .env                      # Переменные окружения
├── docker-start.sh           # Скрипт быстрого запуска
├── health.html               # Health check endpoint
├── logs/                     # Логи (создается автоматически)
│   ├── nginx/
│   └── app/
├── backups/                  # Резервные копии
└── scripts/                  # Скрипты обслуживания
    ├── deploy.sh
    └── update.sh
```

## 🚀 Способы деплоя

### 1. Простой запуск с помощью скрипта

```bash
# Запуск
./docker-start.sh start

# Статус
./docker-start.sh status

# Логи
./docker-start.sh logs

# Остановка
./docker-start.sh stop

# Перезапуск
./docker-start.sh restart

# Полная очистка
./docker-start.sh clean
```

### 2. Ручной запуск через Docker Compose

```bash
# Создание .env файла
cp .env.example .env

# Редактирование конфигурации
nano .env

# Создание директорий
mkdir -p logs/nginx logs/app backups

# Сборка и запуск
docker-compose up -d --build

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

### 3. Продакшн деплой с автоматизацией

```bash
# Полный деплой с нуля (требует sudo)
sudo ./scripts/deploy.sh

# Обновление приложения
./scripts/update.sh

# Принудительное обновление
./scripts/update.sh --force

# Проверка обновлений без установки
./scripts/update.sh --dry-run
```

## ⚙️ Конфигурация

### Основные переменные в .env

```bash
# Основные настройки
NODE_ENV=production
CONTAINER_NAME=smokyapp-web
HOST_PORT=80
VERSION=latest
DOMAIN=yourdomain.com

# Ресурсы контейнера
MEMORY_LIMIT=256M
CPU_LIMIT=0.5

# Логирование
LOG_DIR=./logs
LOG_MAX_SIZE=10m
LOG_MAX_FILE=3

# Автообновления
REPO_URL=https://github.com/smokyapp/webapp.git
BRANCH=main
UPDATE_INTERVAL=300
```

### Настройка портов

```bash
# Для локальной разработки
HOST_PORT=8080

# Для продакшн (стандартный HTTP)
HOST_PORT=80

# Для HTTPS (с reverse proxy)
HOST_PORT=8080  # внутренний порт, внешний 443 через proxy
```

## 🔒 Настройки безопасности

### 1. Firewall

```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. Reverse Proxy (Nginx/Traefik)

Конфигурация для внешнего nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. SSL/TLS

```bash
# Автоматическое получение SSL с certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 📊 Мониторинг

### Health Checks

```bash
# Проверка здоровья приложения
curl http://localhost/health.html

# Проверка статуса контейнера
docker ps --filter "name=smokyapp-web"

# Docker health check
docker inspect smokyapp-web | grep Health -A 10
```

### Логи

```bash
# Логи приложения
docker-compose logs smokyapp

# Логи nginx
docker exec smokyapp-web tail -f /var/log/nginx/access.log

# Системные логи
journalctl -u docker -f
```

### Мониторинг ресурсов

```bash
# Использование ресурсов
docker stats smokyapp-web

# Информация о контейнере
docker inspect smokyapp-web

# Использование дискового пространства
docker system df
```

## 🔄 Автоматические обновления

### Настройка cron

```bash
# Редактируем crontab
sudo crontab -e

# Добавляем задачу для проверки обновлений каждые 5 минут
*/5 * * * * /path/to/your/app/scripts/update.sh > /dev/null 2>&1

# Еженедельная очистка логов
0 3 * * 0 find /path/to/your/app/logs -name "*.log" -mtime +7 -delete
```

### Webhook обновления

```bash
# Настройка webhook для GitHub
# В настройках репозитория добавьте webhook:
# URL: https://yourdomain.com/webhook
# Secret: значение из WEBHOOK_SECRET в .env
```

## 🐛 Диагностика проблем

### Типичные проблемы

1. **Порт уже занят**
   ```bash
   # Проверяем что использует порт
   sudo lsof -i :80
   
   # Меняем порт в .env
   HOST_PORT=8080
   ```

2. **Недостаточно памяти**
   ```bash
   # Увеличиваем лимиты в .env
   MEMORY_LIMIT=512M
   MEMORY_RESERVATION=256M
   ```

3. **Проблемы с Docker**
   ```bash
   # Перезапуск Docker
   sudo systemctl restart docker
   
   # Очистка системы
   docker system prune -f
   ```

### Отладка

```bash
# Подключение к контейнеру
docker exec -it smokyapp-web sh

# Проверка конфигурации nginx
docker exec smokyapp-web nginx -t

# Просмотр процессов в контейнере
docker exec smokyapp-web ps aux

# Проверка портов
docker exec smokyapp-web netstat -tlnp
```

## 📈 Оптимизация

### Производительность

1. **Используйте BuildKit**
   ```bash
   export DOCKER_BUILDKIT=1
   ```

2. **Настройте кэширование**
   ```bash
   # В docker-compose.yml уже настроено
   ```

3. **Оптимизируйте nginx**
   ```bash
   # Настройки в nginx.conf уже оптимизированы
   ```

### Масштабирование

```bash
# Запуск нескольких экземпляров
docker-compose up -d --scale smokyapp=3

# Использование Docker Swarm
docker swarm init
docker stack deploy -c docker-compose.yml smokyapp
```

## 🔧 Обслуживание

### Регулярные задачи

```bash
# Еженедельная очистка логов
find logs/ -name "*.log" -mtime +7 -delete

# Очистка старых образов
docker image prune -f

# Очистка неиспользуемых томов
docker volume prune -f

# Резервное копирование
tar -czf backup-$(date +%Y%m%d).tar.gz .env logs/ backups/
```

### Обновление Docker

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade docker-ce docker-ce-cli containerd.io

# CentOS/RHEL
sudo yum update docker-ce docker-ce-cli containerd.io
```

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи: `docker-compose logs`
2. Проверьте статус: `docker-compose ps`
3. Проверьте health check: `curl http://localhost/health.html`
4. Создайте issue в репозитории с подробным описанием

## 📚 Дополнительные ресурсы

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Telegram WebApp API](https://core.telegram.org/bots/webapps)
