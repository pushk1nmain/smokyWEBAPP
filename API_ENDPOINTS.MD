# API Endpoints - Smoky WebApp Backend

Полный перечень всех доступных API endpoints для обращения к серверу.

## Базовая информация

- **Базовый URL**: `https://api.smokybot.com`
- **API версия**: v1
- **Документация**: `/docs` (Swagger UI)
- **ReDoc**: `/redoc`

## Аутентификация и безопасность

### Middleware
- **IP фильтрация**: Проверка разрешенных IP адресов
- **API ключи**: Требуется валидный API ключ в заголовках
- **CORS**: Настроен для работы с Telegram WebApp

### Заголовки
```
X-API-Key: your-api-key
Content-Type: application/json
```

## Основные endpoints

### 1. Корневые endpoints

#### `GET /`
Корневой endpoint для проверки статуса API.

**Ответ:**
```json
{
  "message": "Smoky WebApp Backend API",
  "status": "running", 
  "version": "1.0.0",
  "docs": "/docs"
}
```

#### `GET /health`
Простой health check endpoint для быстрой проверки.

**Ответ:**
```json
{
  "status": "healthy",
  "service": "smoky-webapp-backend"
}
```

#### `GET /health/detailed`
Детальный health check с проверкой всех компонентов системы.

**Ответ:**
```json
{
  "status": "healthy|degraded|critical",
  "timestamp": "2024-01-01T12:00:00",
  "check_duration_ms": 150.5,
  "services": {
    "database": {
      "status": "healthy",
      "message": "База данных доступна",
      "response_time_ms": 10.2
    },
    "openweather": {
      "status": "healthy", 
      "message": "OpenWeather API доступен",
      "response_time_ms": 250.3
    }
  },
  "message": "Все сервисы работают нормально"
}
```

#### `POST /admin/test-telegram-notification`
Endpoint для тестирования системы Telegram уведомлений.

**Ответ:**
```json
{
  "success": true,
  "message": "Тестовое уведомление отправлено администратору"
}
```

---

## API v1 Endpoints

Префикс: `/api/v1`

### 2. Пользователи (`/api/v1/users`)

#### `POST /api/v1/name`
Обновляет имя пользователя.

**Тело запроса:**
```json
{
  "telegram_id": 123456789,
  "name": "Имя пользователя"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Имя пользователя успешно обновлено",
  "data": {
    "telegram_id": 123456789,
    "name": "Имя пользователя"
  }
}
```

#### `POST /api/v1/town`
Обновляет город и часовой пояс пользователя.

**Тело запроса:**
```json
{
  "telegram_id": 123456789,
  "town": "Москва",
  "tz_offset": 3.0
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Город и часовой пояс успешно обновлены",
  "data": {
    "telegram_id": 123456789,
    "town": "Москва",
    "tz_offset": 3.0
  }
}
```

#### `POST /api/v1/timezone`
Обновляет часовой пояс пользователя.

**Тело запроса:**
```json
{
  "telegram_id": 123456789,
  "tz_offset": 3.0
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Часовой пояс успешно обновлен",
  "data": {
    "telegram_id": 123456789,
    "tz_offset": 3.0
  }
}
```

#### `POST /api/v1/progress_step`
Обновляет шаг прогресса пользователя.

**Тело запроса:**
```json
{
  "telegram_id": 123456789,
  "progress_step": 5
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Прогресс пользователя успешно обновлен",
  "data": {
    "telegram_id": 123456789,
    "progress_step": 5
  }
}
```

#### `GET /api/v1/user/{telegram_id}`
Получает информацию о пользователе.

**Параметры:**
- `telegram_id` (int) - ID пользователя в Telegram

**Ответ:**
```json
{
  "telegram_id": 123456789,
  "name": "Имя пользователя",
  "town": "Москва",
  "tz_offset": 3.0,
  "progress_step": 5,
  "created_at": "2024-01-01T12:00:00",
  "updated_at": "2024-01-01T12:00:00"
}
```

### 3. Города (`/api/v1/cities`)

#### `POST /api/v1/check_town`
Проверяет город с использованием кэша и OpenWeather API.

**Особенности:**
- Сначала ищет в локальном кэше (быстрый ответ ~5-10ms)
- При отсутствии в кэше делает запрос к OpenWeather API (~200-500ms)
- Сохраняет результат API в кэш для будущих запросов
- Возвращает источник данных (кэш или API)

**Тело запроса:**
```json
{
  "town": "Москва"
}
```

**Ответ:**
```json
{
  "town": "Moscow",
  "utc_offset": 3.0,
  "cached": true
}
```

**Поля ответа:**
- `town` (string) - Подтвержденное название города
- `utc_offset` (float) - UTC смещение в часах
- `cached` (boolean) - Данные получены из кэша (true) или API (false)

### 4. Администрирование (`/api/v1/admin`)

#### `GET /api/v1/admin/cached-cities`
Получает список кэшированных городов с пагинацией.

**Query параметры:**
- `limit` (int, 1-500) - Количество записей (по умолчанию: 50)
- `offset` (int, ≥0) - Смещение для пагинации (по умолчанию: 0)

**Ответ:**
```json
[
  {
    "city_name": "moscow",
    "confirmed_name": "Moscow",
    "utc_offset": 3.0,
    "created_at": "2024-01-01T12:00:00",
    "updated_at": "2024-01-01T12:00:00"
  }
]
```

#### `GET /api/v1/admin/cache-stats`
Получает статистику по кэшу городов.

**Ответ:**
```json
{
  "success": true,
  "message": "Статистика кэша получена: 150 городов",
  "data": {
    "total_cities": 150,
    "last_updated": "2024-01-01T12:00:00",
    "cache_hit_rate": 85.5
  }
}
```

#### `DELETE /api/v1/admin/cache/{city_name}`
Удаляет конкретный город из кэша.

**Параметры:**
- `city_name` (string) - Название города для удаления

**Ответ:**
```json
{
  "success": true,
  "message": "Город 'Moscow' успешно удален из кэша",
  "data": {
    "deleted_city": "Moscow"
  }
}
```

#### `DELETE /api/v1/admin/cache`
Полностью очищает кэш городов.

**Query параметры:**
- `confirm` (boolean) - Обязательный параметр подтверждения (должен быть true)

**Ответ:**
```json
{
  "success": true,
  "message": "Кэш успешно очищен: удалено 150 городов",
  "data": {
    "deleted_count": 150
  }
}
```

#### `GET /api/v1/admin/environment`
Получает информацию о текущем режиме работы приложения.

**Ответ:**
```json
{
  "success": true,
  "message": "Информация о среде выполнения получена успешно",
  "data": {
    "environment_mode": "production",
    "settings_source": "environment variables (.env file)",
    "environment_settings": {
      "debug": false,
      "log_level": "INFO"
    },
    "cors_origins_configured": 2,
    "rate_limit_settings": {
      "enabled": true,
      "requests_per_minute": 60
    },
    "security_headers_count": 5,
    "log_level": "INFO"
  }
}
```

---

## Коды ошибок

### HTTP Status Codes
- `200` - Успешный запрос
- `400` - Неверный запрос (ошибка валидации)
- `401` - Неавторизованный доступ (неверный API ключ)
- `403` - Доступ запрещен (IP не в белом списке)
- `404` - Ресурс не найден
- `422` - Ошибка валидации данных
- `500` - Внутренняя ошибка сервера

### Структура ошибки
```json
{
  "success": false,
  "message": "Описание ошибки",
  "error_code": "SPECIFIC_ERROR_CODE",
  "details": {
    "field": "Дополнительная информация"
  }
}
```

### Специфичные ошибки
- `CITY_NOT_FOUND` - Город не найден в OpenWeather API
- `EXTERNAL_SERVICE_ERROR` - Ошибка внешнего сервиса (OpenWeather API)
- `DATABASE_ERROR` - Ошибка базы данных
- `USER_NOT_FOUND` - Пользователь не найден
- `VALIDATION_ERROR` - Ошибка валидации входных данных

---

## Примеры использования

### Проверка города
```bash
curl -X POST "https://your-domain.com/api/v1/check_town" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"town": "Москва"}'
```

### Получение пользователя
```bash
curl "https://your-domain.com/api/v1/user/123456789" \
  -H "X-API-Key: your-api-key"
```

### Очистка кэша (только для админов)
```bash
curl -X DELETE "https://your-domain.com/api/v1/admin/cache?confirm=true" \
  -H "X-API-Key: your-admin-api-key"
```

---

## Мониторинг и логирование

### Автоматические уведомления
Система автоматически отправляет Telegram уведомления администратору при:
- Запуске/остановке сервера (только primary воркер)
- Критических ошибках базы данных
- Проблемах с OpenWeather API
- Неверных API ключах OpenWeather
- Общих системных сбоях

### Health Check мониторинг
- `/health` - быстрая проверка (для load balancer)
- `/health/detailed` - полная диагностика всех компонентов
- Автоматические уведомления при критических состояниях

### Производительность
- Кэшированные запросы городов: ~5-10ms
- API запросы к OpenWeather: ~200-500ms
- Запросы к базе данных: ~10-50ms
- Health check: ~100-300ms

---

## Документация OpenAPI

Полная интерактивная документация доступна по адресам:
- **Swagger UI**: `/docs`
- **ReDoc**: `/redoc`

Эти страницы содержат детальное описание всех endpoints, схем данных и возможность тестирования API прямо в браузере.
