# 🔗 Настройка SmokyApp с внешним nginx

Если у вас уже есть nginx на сервере, используйте эту инструкцию для настройки проксирования.

## 🚀 Быстрая настройка

### Шаг 1: Подготовка приложения

```bash
# Используем конфигурацию для проксирования
cp docker-compose-proxy.yml docker-compose.yml

# Создаем сеть для проксирования
docker network create nginx-proxy

# Запускаем приложение (без внешних портов)
docker-compose up -d --build
```

### Шаг 2: Автоматическая настройка SSL

```bash
# Запустить автоматическую настройку
sudo ./scripts/setup-ssl.sh

# Скрипт автоматически:
# - Установит certbot (если нужно)
# - Получит SSL сертификаты
# - Настроит nginx конфигурацию
# - Настроит автоматическое обновление
```

### Шаг 3: Проверка

```bash
# Проверить работу приложения
curl -f https://ваш-домен.com/health

# Проверить статус контейнеров
docker-compose ps
```

## ⚙️ Ручная настройка

### 1. Изменение Docker конфигурации

Используйте `docker-compose-proxy.yml` вместо обычного `docker-compose.yml`:

```yaml
# Основные отличия:
- Нет внешних портов (80/443)
- Только expose: ["80"] для внутреннего доступа
- Подключение к внешней сети nginx-proxy
```

### 2. Создание Docker сети

```bash
# Создать общую сеть для nginx и приложения
docker network create nginx-proxy

# Проверить создание
docker network ls | grep nginx-proxy
```

### 3. Настройка nginx конфигурации

Скопируйте `nginx-proxy.conf` в ваш nginx:

```bash
# Скопировать конфигурацию
sudo cp nginx-proxy.conf /etc/nginx/sites-available/smokyapp

# Заменить домены на ваши
sudo sed -i 's/your-domain.com/ваш-домен.com/g' /etc/nginx/sites-available/smokyapp

# Активировать конфигурацию
sudo ln -s /etc/nginx/sites-available/smokyapp /etc/nginx/sites-enabled/

# Проверить и перезагрузить
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Получение SSL сертификатов

#### Автоматически (рекомендуется):

```bash
sudo ./scripts/setup-ssl.sh
```

#### Вручную:

```bash
# Установить certbot
sudo apt install certbot python3-certbot-nginx  # Ubuntu/Debian
sudo yum install certbot python3-certbot-nginx  # CentOS

# Получить сертификаты
sudo certbot --nginx -d ваш-домен.com -d www.ваш-домен.com

# Настроить автообновление
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## 🔧 Конфигурационные файлы

### docker-compose-proxy.yml

- ✅ Убраны внешние порты 80/443
- ✅ Добавлен expose: ["80"] для внутреннего доступа
- ✅ Подключение к сети nginx-proxy
- ✅ Все остальные функции сохранены

### nginx-proxy.conf

- ✅ HTTP -> HTTPS редирект
- ✅ Правильные заголовки для Telegram Web App
- ✅ SSL настройки безопасности
- ✅ Проксирование к контейнеру smokyapp-web:80
- ✅ Кэширование статических файлов
- ✅ WebSocket поддержка (на будущее)

### scripts/setup-ssl.sh

- ✅ Автоматическая установка certbot
- ✅ Получение Let's Encrypt сертификатов
- ✅ Настройка nginx конфигурации
- ✅ Автоматическое обновление сертификатов
- ✅ Создание Docker сети
- ✅ Тестирование конфигурации

## 🌐 Структура доменов

```
https://ваш-домен.com          -> smokyapp-web:80 (основное приложение)
https://www.ваш-домен.com      -> smokyapp-web:80 (с www)
https://api.ваш-домен.com      -> готово для будущего API
```

## 🔍 Диагностика проблем

### Проверка сети Docker

```bash
# Список сетей
docker network ls

# Детали сети nginx-proxy
docker network inspect nginx-proxy

# Проверка подключения контейнера
docker inspect smokyapp-web | grep NetworkMode
```

### Проверка nginx

```bash
# Статус nginx
sudo systemctl status nginx

# Тест конфигурации
sudo nginx -t

# Логи nginx
sudo tail -f /var/log/nginx/smokyapp_*.log
```

### Проверка SSL

```bash
# Статус сертификатов
sudo certbot certificates

# Тест SSL
echo | openssl s_client -servername ваш-домен.com -connect ваш-домен.com:443

# Проверка обновления (dry-run)
sudo certbot renew --dry-run
```

### Проверка приложения

```bash
# Внутренняя проверка (из хоста)
docker exec smokyapp-web curl -f http://localhost/health

# Внешняя проверка
curl -f https://ваш-домен.com/health

# Логи приложения
docker-compose logs -f smokyapp
```

## 🚀 Запуск с проксированием

```bash
# 1. Подготовка
cp docker-compose-proxy.yml docker-compose.yml

# 2. Настройка SSL (интерактивно)
sudo ./scripts/setup-ssl.sh

# 3. Запуск приложения
docker-compose up -d --build

# 4. Проверка
curl -f https://ваш-домен.com/health
```

## 🔄 Обновления

Обновления работают так же, как и раньше:

```bash
# Автоматическое обновление
./update-frontend.sh

# Или через скрипты
./scripts/update.sh

# Мониторинг обновлений
./scripts/watch.sh start
```

## 🎯 Полезные команды

```bash
# Перезапуск только nginx
sudo systemctl reload nginx

# Перезапуск приложения
docker-compose restart smokyapp

# Просмотр всех логов
sudo tail -f /var/log/nginx/smokyapp_*.log
docker-compose logs -f

# Проверка портов
netstat -tulpn | grep :80
netstat -tulpn | grep :443

# Тест производительности
curl -w "@curl-format.txt" -o /dev/null -s https://ваш-домен.com/
```

---

**Готово! Ваше приложение работает за nginx прокси с SSL! 🔒✨**
