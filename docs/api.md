🔗 API Эндпоинты (API v1)
Все endpoints теперь используют префикс /api/v1/

👤 Пользователи
POST /api/v1/name
Сохранение/обновление имени пользователя

Заголовки:

X-API-Key: your-api-key
Content-Type: application/json
Тело запроса:

{
  "telegram_id": 123456789,
  "name": "Иван Иванов"
}
POST /api/v1/town
Сохранение города и часового пояса

Тело запроса:

{
  "telegram_id": 123456789,
  "town": "Москва",
  "tz_offset": 10800
}
POST /api/v1/timezone
Обновление часового пояса

Тело запроса:

{
  "telegram_id": 123456789,
  "tz_offset": 10800
}
POST /api/v1/progress_step
Обновление шага прогресса

Тело запроса:

{
  "telegram_id": 123456789,
  "progress_step": 2
}
GET /api/v1/user/{telegram_id}
Получение данных пользователя

Ответ:

{
  "success": true,
  "data": {
    "telegram_id": 123456789,
    "name": "Иван Иванов",
    "town": "Москва",
    "tz_offset": 10800,
    "progress_step": 2
  }
}
🌍 Города
POST /api/v1/check_town
Проверка города через OpenWeather API

Тело запроса:

{
  "town": "Москва"
}
Ответ:

{
  "success": true,
  "town": "Москва",
  "utc_offset": 10800,
  "cached": true
}
🔧 Администрирование
GET /api/v1/admin/environment
Информация о режиме работы

GET /api/v1/admin/cache-stats
Статистика кэша городов

GET /api/v1/admin/cached-cities
Список закэшированных городов

DELETE /api/v1/admin/cache/{city_name}
Удаление города из кэша

DELETE /api/v1/admin/cache
Очистка всего кэша городов

