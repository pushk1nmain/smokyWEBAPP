# SmokyApp - Telegram Web App

Веб-приложение для Telegram Bot, помогающее пользователям бросить курить.



## 📁 Структура проекта

```
frontend/
├── index.html          # Главная страница
├── css/               # Стили
├── js/                # JavaScript модули
├── elements/          # Статические ресурсы
├── screens/           # HTML шаблоны экранов

└── package.json       # Метаданные проекта
```

## ⚙️ Технические детали

- **Статический сайт**: Чистый HTML, CSS, JavaScript
- **Telegram Web App API**: Интеграция с Telegram
- **Отзывчивый дизайн**: Оптимизирован для мобильных устройств
- **Безопасность**: Настроены CSP заголовки

## 🔧 Локальная разработка

```bash
# Запуск локального сервера
npm run dev
# или
python3 -m http.server 8000
```

Откройте http://localhost:8000 в браузере

## 🐳 Docker Деплой

### Быстрый старт:
```bash
# Автоматическая установка
curl -sSL https://raw.githubusercontent.com/smokyapp/webapp/main/scripts/quick-start.sh | bash

# Или локально
make install && make start
```

### Управление:
```bash
make start          # Запуск приложения
make stop           # Остановка приложения  
make update         # Обновление с GitHub
make status         # Статус системы
make logs           # Просмотр логов
make help           # Полная справка
```

### Автоматические обновления:
```bash
./scripts/watch.sh start    # Запуск мониторинга GitHub
./scripts/update.sh         # Ручное обновление
```

📖 **Подробная документация**: [README-DOCKER.md](README-DOCKER.md) | [QUICK-START.md](QUICK-START.md)

## 📱 Telegram Bot Integration

Для интеграции с Telegram Bot:

1. Создайте Web App в BotFather
2. Установите URL на ваш домен
3. Настройте webhook для получения данных от бота

## 🔒 Переменные окружения

Настройте следующие переменные окружения:

- `NODE_ENV=production`
- Другие API ключи по необходимости

## 📊 Мониторинг

- Настроен CSP для безопасности
- Кэширование статических ресурсов

## 🐛 Отладка

Для отладки в режиме разработки:
- Откройте `debug.html` для тестирования
- Используйте DevTools браузера
- Проверьте консоль на ошибки

## 📝 Лицензия

MIT License
