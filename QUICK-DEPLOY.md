# 🚀 Быстрый деплой SmokyApp для webapp.smokybot.com

## ⚡ Экспресс-инструкция (5 минут)

### 1. Подготовка сервера
```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Автоматическая настройка Nginx + SSL
```bash
# Клонируем проект
git clone https://github.com/smokyapp/webapp.git
cd webapp/frontend

# Запускаем автонастройку (требует sudo)
sudo ./setup-nginx-ssl.sh
```

### 3. Запуск приложения
```bash
# Настраиваем .env
cp .env.example .env
nano .env  # Измените HOST_PORT=8080

# Запускаем контейнеры
./docker-start.sh
```

### 4. Проверка
```bash
# Проверяем работу
curl https://webapp.smokybot.com/health.html

# Смотрим статус
docker-compose ps
```

---

## 🔧 Ручная настройка (если автоскрипт не подходит)

### Nginx конфигурация
```bash
# Создаем конфиг
sudo nano /etc/nginx/sites-available/webapp.smokybot.com
```

```nginx
server {
    listen 80;
    server_name webapp.smokybot.com www.webapp.smokybot.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Telegram WebApp headers
        add_header X-Frame-Options "ALLOWALL" always;
        add_header Access-Control-Allow-Origin "https://web.telegram.org" always;
    }
}
```

```bash
# Активируем
sudo ln -s /etc/nginx/sites-available/webapp.smokybot.com /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### SSL сертификат
```bash
# Устанавливаем Certbot
sudo apt install certbot python3-certbot-nginx

# Получаем сертификат
sudo certbot --nginx -d webapp.smokybot.com -d www.webapp.smokybot.com
```

---

## 📊 Команды мониторинга

```bash
# Статус всех сервисов
sudo systemctl status nginx docker
docker-compose ps

# Логи
docker-compose logs -f
sudo tail -f /var/log/nginx/webapp.smokybot.com.access.log

# Ресурсы
docker stats smokyapp-web
htop

# Проверка сайта
curl -I https://webapp.smokybot.com
```

---

## 🔄 Команды управления

```bash
# Перезапуск приложения
./docker-start.sh restart

# Обновление
./scripts/update.sh

# Остановка
./docker-start.sh stop

# Полная очистка
./docker-start.sh clean
```

---

## 🚨 Решение проблем

| Проблема | Решение |
|----------|---------|
| 502 Bad Gateway | `docker-compose restart` |
| SSL не работает | `sudo certbot renew --force-renewal` |
| Порт занят | Изменить `HOST_PORT` в `.env` |
| Нет места | `docker system prune -f` |
| Высокая нагрузка | Увеличить лимиты в `.env` |

---

## 📱 Telegram Bot Setup

Для уведомлений об обновлениях:

1. Создайте бота через @BotFather
2. Получите токен и chat_id
3. Добавьте в `.env`:
```bash
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

---

## ✅ Чеклист деплоя

- [ ] Сервер обновлен
- [ ] Docker установлен
- [ ] Nginx настроен
- [ ] SSL сертификат получен
- [ ] DNS домена настроен
- [ ] Контейнеры запущены
- [ ] Health check работает
- [ ] Логи без ошибок
- [ ] Автообновления настроены
- [ ] Мониторинг работает

**Готово! 🎉**
