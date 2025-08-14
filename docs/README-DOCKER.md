# Docker Deployment Guide для SmokyApp

Полное руководство по развертыванию Telegram Web App с использованием Docker и автоматическими обновлениями с GitHub.

## 🚀 Быстрый старт

### Вариант 1: Автоматическое развертывание

```bash
# Загрузите и запустите скрипт автоматической установки
curl -sSL https://raw.githubusercontent.com/smokyapp/webapp/main/scripts/deploy.sh | bash

# Или клонируйте репозиторий и запустите локально
git clone https://github.com/smokyapp/webapp.git
cd webapp
chmod +x scripts/deploy.sh
sudo ./scripts/deploy.sh
```

### Вариант 2: Ручное развертывание

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/smokyapp/webapp.git
cd webapp

# 2. Создайте .env файл с настройками
cp .env.example .env
nano .env

# 3. Соберите и запустите контейнеры
docker-compose up -d --build

# 4. Проверьте статус
docker-compose ps
curl http://localhost/health
```

## 📁 Структура Docker файлов

```
frontend/
├── Dockerfile              # Основной образ приложения
├── Dockerfile.updater      # Образ для автоматических обновлений
├── docker-compose.yml      # Конфигурация сервисов
├── nginx.conf              # Конфигурация веб-сервера
├── .dockerignore           # Исключения для Docker
└── scripts/                # Скрипты управления
    ├── deploy.sh           # Автоматическое развертывание
    ├── update.sh           # Ручное обновление
    └── watch.sh            # Мониторинг обновлений
```

## ⚙️ Конфигурация

### Основные переменные окружения (.env)

```env
# Основные настройки
NODE_ENV=production
REPO_URL=https://github.com/smokyapp/webapp.git
BRANCH=main

# Настройки контейнера
CONTAINER_NAME=smokyapp-web
NGINX_HOST=localhost
NGINX_PORT=80

# Настройки обновлений
UPDATE_INTERVAL=300
WEBHOOK_SECRET=your-secret-key

# Уведомления (опционально)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
WEBHOOK_URL=https://your-webhook-url.com/notify
```

### Конфигурация nginx

Веб-сервер настроен для:
- ✅ Поддержки Telegram Web App
- ✅ Правильных CORS заголовков
- ✅ Сжатия статических файлов
- ✅ Кэширования ресурсов
- ✅ Безопасных CSP заголовков

## 🔧 Управление приложением

### Docker Compose команды

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f smokyapp
docker-compose logs -f updater

# Остановка сервисов
docker-compose down

# Пересборка образов
docker-compose up -d --build --force-recreate

# Просмотр статуса
docker-compose ps
```

### Управление обновлениями

```bash
# Ручное обновление
./scripts/update.sh

# Принудительное обновление
./scripts/update.sh --force

# Проверка обновлений без установки
./scripts/update.sh --dry-run

# Запуск мониторинга обновлений
./scripts/watch.sh start

# Проверка статуса мониторинга
./scripts/watch.sh status

# Остановка мониторинга
./scripts/watch.sh stop
```

## 📊 Мониторинг и логи

### Места расположения логов

```bash
# Логи приложения
docker-compose logs smokyapp

# Логи nginx
docker exec smokyapp-web tail -f /var/log/nginx/access.log
docker exec smokyapp-web tail -f /var/log/nginx/error.log

# Логи обновлений
tail -f logs/update.log

# Логи мониторинга
tail -f logs/watch.log
```

### Проверка здоровья

```bash
# Проверка здоровья приложения
curl http://localhost/health

# Проверка статуса контейнеров
docker-compose ps

# Детальная информация о контейнере
docker inspect smokyapp-web
```

## 🔐 Безопасность

### Настройки безопасности

1. **Контейнеры запускаются от непривилегированного пользователя**
2. **Настроены правильные CSP заголовки для Telegram Web App**
3. **Включено сжатие и кэширование для производительности**
4. **Логирование всех операций**

### Рекомендации по безопасности

```bash
# Регулярно обновляйте базовые образы
docker-compose pull
docker-compose up -d

# Настройте firewall
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Используйте HTTPS в продакшене
# Раскомментируйте SSL настройки в docker-compose.yml
```

## 🚨 Автоматические обновления

### Настройка GitHub обновлений

Приложение автоматически проверяет обновления в GitHub репозитории каждые 5 минут (настраивается через `UPDATE_INTERVAL`).

#### Процесс обновления:

1. **Проверка** - Сравнение текущего и последнего коммита
2. **Резервная копия** - Создание бэкапа текущей версии
3. **Обновление** - Получение изменений с GitHub
4. **Пересборка** - Пересборка Docker образа
5. **Проверка** - Тестирование работоспособности
6. **Откат** - Автоматический откат при ошибках

#### Настройка уведомлений:

```bash
# Telegram уведомления
export TELEGRAM_BOT_TOKEN="your-bot-token"
export TELEGRAM_CHAT_ID="your-chat-id"

# Webhook уведомления
export WEBHOOK_URL="https://your-webhook-url.com/notify"
```

## 🛠️ Решение проблем

### Частые проблемы

#### Контейнер не запускается

```bash
# Проверьте логи
docker-compose logs smokyapp

# Проверьте конфигурацию
docker-compose config

# Пересоберите образ
docker-compose up -d --build --force-recreate
```

#### Приложение недоступно

```bash
# Проверьте порты
docker-compose ps
netstat -tulpn | grep :80

# Проверьте nginx конфигурацию
docker exec smokyapp-web nginx -t

# Перезапустите nginx
docker exec smokyapp-web nginx -s reload
```

#### Обновления не работают

```bash
# Проверьте доступ к GitHub
./scripts/update.sh --dry-run

# Проверьте логи обновлений
tail -f logs/update.log

# Ручное обновление
./scripts/update.sh --force
```

### Восстановление из резервной копии

```bash
# Просмотр доступных бэкапов
ls -la backups/

# Восстановление из конкретного бэкапа
cp -r backups/backup_20231201_120000/* .
docker-compose up -d --build
```

## 📈 Масштабирование

### Горизонтальное масштабирование

```yaml
# В docker-compose.yml добавьте:
services:
  smokyapp:
    deploy:
      replicas: 3
    ports:
      - "80-82:80"
```

### Настройка load balancer

```bash
# Используйте nginx или HAProxy для балансировки нагрузки
# между несколькими экземплярами приложения
```

## 🔄 CI/CD интеграция

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        run: |
          ssh user@server 'cd /opt/smokyapp && ./scripts/update.sh'
```

### Webhook для автоматического деплоя

```bash
# Настройте webhook в GitHub для POST запросов на:
# https://your-server.com/webhook

# Обработчик webhook может вызывать:
curl -X POST http://localhost/api/update
```

## 📞 Поддержка

При возникновении проблем:

1. **Проверьте логи** - `docker-compose logs -f`
2. **Проверьте статус** - `./scripts/watch.sh status`
3. **Перезапустите сервисы** - `docker-compose restart`
4. **Обратитесь к документации** - GitHub Issues

---

**Автор:** SmokyApp Team  
**Версия:** 1.0.0  
**Лицензия:** MIT
