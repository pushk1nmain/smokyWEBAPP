# Настройка конфигурации SmokyApp

## Описание

Для обеспечения безопасности API ключи и другие чувствительные данные выделены в отдельные конфигурационные файлы, которые не попадают в Git репозиторий.

## Быстрая настройка

### 1. Создание конфигурации

```bash
# Скопируйте шаблон конфигурации
cp config.example.js config.js

# Отредактируйте config.js и замените YOUR_API_KEY_HERE на реальный ключ
nano config.js  # или любой редактор
```

### 2. Получение API ключа

API ключ можно получить:
- Из `.env` файла бэкенда (переменная `API_KEY`)
- У администратора системы
- Через панель управления backend'а

### 3. Проверка настройки

Откройте приложение в браузере и проверьте консоль разработчика:
- ✅ `Конфигурация SmokyApp загружена успешно`
- ✅ `Конфигурация инициализирована`

## Структура конфигурации

### config.js (основной файл)
```javascript
window.SmokyConfig = {
    api: {
        baseUrl: 'https://api.smokybot.com/api/v1',
        apiKey: 'РЕАЛЬНЫЙ_API_КЛЮЧ'
    },
    development: { /* настройки разработки */ },
    telegram: { /* настройки Telegram WebApp */ },
    ui: { /* настройки интерфейса */ }
};
```

### config.example.js (шаблон)
Содержит пример конфигурации с placeholder'ами. Используется как основа для создания реального `config.js`.

## Безопасность

### ✅ Правильно
- `config.js` добавлен в `.gitignore`
- API ключи хранятся только в локальных файлах
- Шаблон `config.example.js` в репозитории

### ❌ Неправильно
- Захардкоженные ключи в JavaScript коде
- Коммит `config.js` в Git
- Передача ключей через URL параметры

## Развертывание

### Development (локальная разработка)
1. Скопируйте `config.example.js` → `config.js`
2. Укажите тестовый API ключ
3. Установите `enableBrowserTestMode: true`

### Staging/Production
1. Создайте `config.js` с production ключами
2. Установите `enableDebugLogs: false`
3. Установите `enableBrowserTestMode: false`

### Docker deployment
```dockerfile
# В Dockerfile добавить копирование конфигурации
COPY config.js /app/config.js

# Или создать config.js из переменных окружения
RUN echo "window.SmokyConfig = { api: { apiKey: '${API_KEY}' } };" > /app/config.js
```

### CI/CD Pipeline
```yaml
# GitHub Actions пример
- name: Create config
  run: |
    cp config.example.js config.js
    sed -i 's/YOUR_API_KEY_HERE/${{ secrets.API_KEY }}/g' config.js
```

## Troubleshooting

### Ошибка: "Конфигурация SmokyConfig не найдена"
- Проверьте что файл `config.js` существует
- Убедитесь что `<script src="../../config.js"></script>` загружается до `script.js`

### Ошибка: "Не заданы обязательные параметры API"
- Откройте `config.js` и проверьте поле `api.apiKey`
- Убедитесь что ключ не равен `'YOUR_API_KEY_HERE'`

### Ошибка сети при API запросах
- Проверьте правильность `api.baseUrl`
- Убедитесь что backend сервер доступен
- Проверьте CORS настройки на сервере

## Переменные конфигурации

### api.*
- `baseUrl` - базовый URL API сервера
- `apiKey` - ключ для аутентификации

### development.*
- `enableDebugLogs` - включить детальное логирование
- `enableBrowserTestMode` - тестовый режим для браузера
- `testUser` - данные тестового пользователя

### telegram.*
- `enableHapticFeedback` - включить тактильную обратную связь
- `autoExpand` - автоматически разворачивать приложение
- `applyTheme` - применять тему Telegram

### ui.*
- `loadingAnimationDuration` - время анимации загрузки
- `notificationDuration` - время показа уведомлений
- `enableAnimations` - включить анимации

## Миграция с захардкоженных значений

Если у вас есть старый код с захардкоженными ключами:

```javascript
// ❌ Старый способ
const API_KEY = 'SMOKY-abc123...';

// ✅ Новый способ  
const API_KEY = config.api.apiKey;
```

Замените все прямые обращения к ключам на `config.*` переменные.
