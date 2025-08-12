# ✅ Чеклист деплоя SmokyApp

## Предварительная проверка

- [ ] **Docker установлен и запущен**
  ```bash
  docker --version && docker-compose --version
  ```

- [ ] **Git настроен и доступен**
  ```bash
  git --version && git config --list
  ```

- [ ] **Порты 80/443 свободны**
  ```bash
  netstat -tulpn | grep :80
  ```

- [ ] **Достаточно места на диске (минимум 2GB)**
  ```bash
  df -h
  ```

## Быстрая установка

- [ ] **Скачать и запустить скрипт автоматической установки**
  ```bash
  curl -sSL https://raw.githubusercontent.com/smokyapp/webapp/main/scripts/quick-start.sh | bash
  ```

**ИЛИ**

## Ручная установка

### Шаг 1: Подготовка проекта
- [ ] **Клонировать репозиторий**
  ```bash
  git clone https://github.com/smokyapp/webapp.git
  cd webapp
  ```

- [ ] **Создать .env файл**
  ```bash
  cp .env.example .env
  nano .env  # Настроить параметры
  ```

- [ ] **Сделать скрипты исполняемыми**
  ```bash
  chmod +x scripts/*.sh
  ```

### Шаг 2: Сборка и запуск
- [ ] **Собрать Docker образы**
  ```bash
  make build
  # или
  docker-compose build --no-cache
  ```

- [ ] **Запустить контейнеры**
  ```bash
  make start
  # или
  docker-compose up -d
  ```

## Проверка после установки

### Основные проверки
- [ ] **Контейнеры запущены**
  ```bash
  docker-compose ps
  # Должны быть: smokyapp-web (Up), smokyapp-updater (Up)
  ```

- [ ] **Приложение отвечает**
  ```bash
  curl -f http://localhost/
  curl -f http://localhost/health
  ```

- [ ] **Health check проходит**
  ```bash
  make health
  ```

### Логи и мониторинг
- [ ] **Проверить логи приложения**
  ```bash
  make logs
  # Не должно быть критических ошибок
  ```

- [ ] **Проверить логи nginx**
  ```bash
  docker exec smokyapp-web tail -f /var/log/nginx/error.log
  ```

- [ ] **Запустить мониторинг обновлений**
  ```bash
  ./scripts/watch.sh start
  ./scripts/watch.sh status
  ```

## Настройка автоматических обновлений

- [ ] **Проверить настройки GitHub в .env**
  ```env
  REPO_URL=https://github.com/smokyapp/webapp.git
  BRANCH=main
  UPDATE_INTERVAL=300
  ```

- [ ] **Тестовое обновление**
  ```bash
  ./scripts/update.sh --dry-run
  ```

- [ ] **Настроить уведомления (опционально)**
  ```env
  TELEGRAM_BOT_TOKEN=your-bot-token
  TELEGRAM_CHAT_ID=your-chat-id
  ```

## Настройка безопасности

- [ ] **Настроить firewall**
  ```bash
  # Ubuntu/Debian
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw enable
  
  # CentOS/RHEL
  firewall-cmd --permanent --add-service=http
  firewall-cmd --permanent --add-service=https
  firewall-cmd --reload
  ```

- [ ] **Изменить стандартные секреты в .env**
  ```env
  WEBHOOK_SECRET=your-unique-secret-key
  ```

- [ ] **Настроить HTTPS (для продакшена)**
  - Получить SSL сертификат
  - Настроить nginx для HTTPS
  - Обновить docker-compose.yml

## Системные настройки

- [ ] **Настроить автозапуск при перезагрузке**
  ```bash
  # Systemd service
  sudo ./scripts/deploy.sh  # Создаст systemd сервис
  
  # Или добавить в crontab
  @reboot cd /path/to/webapp && make start
  ```

- [ ] **Настроить ротацию логов**
  ```bash
  # Автоматически настраивается скриптом deploy.sh
  # Или вручную добавить в logrotate
  ```

- [ ] **Настроить резервное копирование**
  ```bash
  # Добавить в crontab ежедневный бэкап
  0 2 * * * cd /path/to/webapp && make backup
  ```

## Тестирование функциональности

### Telegram Web App тестирование
- [ ] **Проверить заголовки Telegram Web App**
  ```bash
  curl -I http://localhost/
  # Должен содержать X-Frame-Options: ALLOWALL
  ```

- [ ] **Проверить CSP заголовки**
  ```bash
  curl -I http://localhost/ | grep Content-Security-Policy
  ```

- [ ] **Тестирование в Telegram**
  - Создать тестового бота
  - Настроить Web App URL
  - Протестировать в реальном Telegram

### Тестирование обновлений
- [ ] **Сделать тестовый коммит в репозиторий**
- [ ] **Проверить автоматическое обновление**
  ```bash
  # Посмотреть логи обновлений
  tail -f logs/update.log
  ```

- [ ] **Проверить откат при ошибке**
  - Сделать коммит с ошибкой
  - Убедиться, что произошел автоматический откат

## Мониторинг и обслуживание

- [ ] **Настроить мониторинг ресурсов**
  ```bash
  make status  # Регулярно проверять
  ```

- [ ] **Настроить алерты на критические события**
  - Недоступность приложения
  - Ошибки обновления
  - Переполнение диска

- [ ] **Документировать процедуры восстановления**
  ```bash
  # Восстановление из бэкапа
  make restore BACKUP=backup_name.tar.gz
  
  # Полная переустановка
  make clean-all && make install
  ```

## Финальная проверка

- [ ] **Все основные URL доступны**
  - http://localhost/ ✅
  - http://localhost/health ✅

- [ ] **Автоматические обновления работают**
  ```bash
  ./scripts/watch.sh status
  # Статус: ЗАПУЩЕНА
  ```

- [ ] **Логи не содержат ошибок**
  ```bash
  make logs | grep -i error
  # Не должно быть критических ошибок
  ```

- [ ] **Резервное копирование настроено**
  ```bash
  make backup
  ls -la backups/
  ```

- [ ] **Документация обновлена**
  - [ ] README.md содержит актуальную информацию
  - [ ] .env файл настроен под среду
  - [ ] Контакты для поддержки указаны

## 🎉 Деплой завершен!

После прохождения всех пунктов чеклиста:

1. **Приложение готово к работе** 🚀
2. **Автоматические обновления настроены** 🔄  
3. **Мониторинг работает** 📊
4. **Резервное копирование настроено** 💾

### Полезные команды для ежедневного использования:

```bash
make status     # Проверка статуса
make logs       # Просмотр логов
make update     # Ручное обновление
make backup     # Создание бэкапа
make help       # Полный список команд
```

---

**Команда SmokyApp желает успешного деплоя! 🎯**
