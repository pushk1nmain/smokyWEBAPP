# 🚀 Быстрый старт SmokyApp

## Автоматическая установка (рекомендуется)

### Одной командой:

```bash
curl -sSL https://raw.githubusercontent.com/smokyapp/webapp/main/scripts/quick-start.sh | bash
```

### Или локально:

```bash
git clone https://github.com/smokyapp/webapp.git
cd webapp
chmod +x scripts/quick-start.sh
./scripts/quick-start.sh
```

## Ручная установка

### Шаг 1: Подготовка

```bash
# Клонируйте репозиторий
git clone https://github.com/smokyapp/webapp.git
cd webapp

# Создайте конфигурационный файл
cp .env.example .env
nano .env  # Настройте по своим нуждам
```

### Шаг 2: Запуск

```bash
# Простой запуск
make install
make start

# Или через Docker Compose
docker-compose up -d --build
```

## Базовые команды

```bash
# Управление приложением
make start      # Запуск
make stop       # Остановка
make restart    # Перезапуск
make status     # Статус
make logs       # Логи

# Обновления
make update     # Обновление с GitHub
./scripts/watch.sh start  # Автоматические обновления

# Обслуживание
make backup     # Резервная копия
make clean      # Очистка
make help       # Справка
```

## Проверка работы

После запуска проверьте:

- 🌐 **Веб-приложение**: http://localhost
- 🏥 **Здоровье системы**: http://localhost/health
- 📊 **Статус Docker**: `docker-compose ps`

## Уведомления

Для настройки Telegram уведомлений добавьте в `.env`:

```env
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

## Помощь

- 📖 **Полная документация**: [README-DOCKER.md](README-DOCKER.md)
- 🐛 **Проблемы**: [GitHub Issues](https://github.com/smokyapp/webapp/issues)
- 💬 **Поддержка**: Telegram @smokyapp

---

**Готово! Ваше приложение запущено и готово к работе! 🎉**
