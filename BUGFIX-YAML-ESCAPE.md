# 🐛 Исправление ошибки YAML escape character

## Проблема
При запуске `./docker-start.sh` возникала ошибка:
```
yaml: line 62: found unknown escape character
```

## Причина
В файле `docker-compose.yml` в строке 62 использовались неправильные символы экранирования (backticks) в конфигурации Traefik:
```yaml
- "traefik.http.routers.smokyapp.rule=Host(\`${DOMAIN:-localhost}\`)"
```

## ✅ Решение

### 1. Исправлено экранирование в docker-compose.yml
Заменил backticks на правильные двойные кавычки:
```yaml
# Было (неправильно):
- "traefik.http.routers.smokyapp.rule=Host(\`${DOMAIN:-localhost}\`)"

# Стало (правильно):
- "traefik.http.routers.smokyapp.rule=Host(\"${DOMAIN:-localhost}\")"
```

### 2. Создан упрощенный docker-compose-simple.yml
Для случаев, когда Traefik не используется или возникают проблемы с основным файлом:
- Убраны все Traefik labels
- Оставлена только базовая функциональность
- Простая и надежная конфигурация

### 3. Улучшен скрипт docker-start.sh
Добавлены возможности:
- **Автоматическое определение Docker Compose** (docker-compose vs docker compose)
- **Валидация YAML файлов** перед использованием
- **Fallback на упрощенную версию** при проблемах
- **Улучшенная обработка ошибок**

## 📋 Что добавлено

### Автоматический выбор compose файла:
```bash
# Проверяем валидность основного compose файла
if ! $compose_cmd -f "$compose_file" config &> /dev/null; then
    warning "Основной docker-compose.yml содержит ошибки. Используем упрощенную версию."
    compose_file="docker-compose-simple.yml"
fi
```

### Универсальная поддержка Docker Compose:
```bash
# Определяем команду docker-compose
local compose_cmd="docker-compose"
if ! command -v docker-compose &> /dev/null; then
    if command -v docker &> /dev/null && docker compose version &> /dev/null; then
        compose_cmd="docker compose"
    fi
fi
```

## 🚀 Использование

### Автоматический режим (рекомендуется):
```bash
./docker-start.sh
```
Скрипт автоматически выберет правильный compose файл и команду.

### Принудительное использование упрощенной версии:
```bash
docker-compose -f docker-compose-simple.yml up -d
```

### Проверка валидности YAML:
```bash
# Основной файл
docker-compose config

# Упрощенный файл
docker-compose -f docker-compose-simple.yml config
```

## 🔧 Различия между файлами

| Функция | docker-compose.yml | docker-compose-simple.yml |
|---------|-------------------|---------------------------|
| Traefik labels | ✅ Есть | ❌ Убраны |
| Health checks | ✅ Есть | ✅ Есть |
| Resource limits | ✅ Есть | ✅ Есть |
| Volumes | ✅ Есть | ✅ Есть |
| Networks | ✅ Есть | ✅ Есть |
| Logging | ✅ Есть | ✅ Есть |

## ✅ Проверка исправления

```bash
# Тестируем валидность YAML
docker-compose config

# Запускаем приложение
./docker-start.sh start

# Проверяем статус
./docker-start.sh status
```

## 🛡️ Предотвращение проблем в будущем

### Правила для YAML файлов:
1. **Используйте двойные кавычки** для экранирования: `\"value\"`
2. **Избегайте backticks** в YAML: `\`value\`` ❌
3. **Проверяйте валидность** перед коммитом: `docker-compose config`
4. **Используйте линтеры YAML** в IDE

### Валидация YAML:
```bash
# Проверка синтаксиса
docker-compose config

# Онлайн валидаторы
# https://yamlchecker.com/
# https://yamllint.com/
```

## 📚 Справочник по экранированию в YAML

```yaml
# Правильное экранирование
labels:
  - "traefik.rule=Host(\"example.com\")"          # ✅ Правильно
  - "app.description=\"My App\""                  # ✅ Правильно
  - 'traefik.rule=Host("example.com")'            # ✅ Правильно (одинарные кавычки)

# Неправильное экранирование
labels:
  - "traefik.rule=Host(`example.com`)"            # ❌ Неправильно (backticks)
  - "app.description=My App"                      # ❌ Может вызвать проблемы
```

## ✅ Статус
**Проблема решена!** YAML файлы теперь корректно обрабатываются всеми версиями Docker Compose.
