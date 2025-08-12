# Makefile для SmokyApp - Telegram Web App
# Упрощает управление Docker контейнерами и деплоем

.PHONY: help install build start stop restart logs status clean update deploy backup restore test lint

# Переменные
COMPOSE_FILE := docker-compose.yml
PROJECT_NAME := smokyapp
BACKUP_DIR := ./backups
LOG_DIR := ./logs

# Цвета для вывода
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

# По умолчанию показываем справку
help: ## Показать справку по командам
	@echo "$(BLUE)SmokyApp - Telegram Web App$(NC)"
	@echo "$(BLUE)==============================$(NC)"
	@echo ""
	@echo "Доступные команды:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "Примеры использования:"
	@echo "  $(YELLOW)make install$(NC)  - Первоначальная установка"
	@echo "  $(YELLOW)make start$(NC)    - Запуск приложения"
	@echo "  $(YELLOW)make logs$(NC)     - Просмотр логов"
	@echo "  $(YELLOW)make update$(NC)   - Обновление приложения"

install: ## Первоначальная установка и настройка
	@echo "$(BLUE)🚀 Установка SmokyApp...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Создание .env файла из примера...$(NC)"; \
		cp .env.example .env; \
		echo "$(RED)⚠️  Настройте .env файл перед запуском!$(NC)"; \
	fi
	@mkdir -p $(BACKUP_DIR) $(LOG_DIR)
	@chmod +x scripts/*.sh
	@echo "$(GREEN)✅ Установка завершена$(NC)"

build: ## Сборка Docker образов
	@echo "$(BLUE)🔨 Сборка Docker образов...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) build --no-cache
	@echo "$(GREEN)✅ Сборка завершена$(NC)"

start: ## Запуск приложения
	@echo "$(BLUE)▶️  Запуск SmokyApp...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)✅ Приложение запущено$(NC)"
	@make status

stop: ## Остановка приложения
	@echo "$(BLUE)⏹️  Остановка SmokyApp...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) down
	@echo "$(GREEN)✅ Приложение остановлено$(NC)"

restart: ## Перезапуск приложения
	@echo "$(BLUE)🔄 Перезапуск SmokyApp...$(NC)"
	@make stop
	@sleep 2
	@make start

logs: ## Просмотр логов приложения
	@echo "$(BLUE)📋 Логи SmokyApp:$(NC)"
	@docker-compose -f $(COMPOSE_FILE) logs -f --tail=50

logs-app: ## Просмотр логов основного приложения
	@docker-compose -f $(COMPOSE_FILE) logs -f smokyapp

logs-updater: ## Просмотр логов службы обновлений
	@docker-compose -f $(COMPOSE_FILE) logs -f updater

logs-nginx: ## Просмотр логов nginx
	@docker exec smokyapp-web tail -f /var/log/nginx/access.log

status: ## Показать статус контейнеров и приложения
	@echo "$(BLUE)📊 Статус SmokyApp:$(NC)"
	@echo ""
	@echo "$(YELLOW)Docker контейнеры:$(NC)"
	@docker-compose -f $(COMPOSE_FILE) ps
	@echo ""
	@echo "$(YELLOW)Использование ресурсов:$(NC)"
	@docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
	@echo ""
	@echo "$(YELLOW)Проверка здоровья:$(NC)"
	@curl -s -o /dev/null -w "HTTP Status: %{http_code} | Response Time: %{time_total}s\n" http://localhost/health || echo "$(RED)❌ Приложение недоступно$(NC)"

clean: ## Очистка неиспользуемых ресурсов Docker
	@echo "$(BLUE)🧹 Очистка Docker ресурсов...$(NC)"
	@docker system prune -f
	@docker volume prune -f
	@echo "$(GREEN)✅ Очистка завершена$(NC)"

clean-all: ## Полная очистка включая образы
	@echo "$(BLUE)🧹 Полная очистка Docker...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) down -v --rmi all
	@docker system prune -a -f
	@echo "$(GREEN)✅ Полная очистка завершена$(NC)"

update: ## Обновление приложения с GitHub
	@echo "$(BLUE)🔄 Обновление SmokyApp...$(NC)"
	@./scripts/update.sh
	@echo "$(GREEN)✅ Обновление завершено$(NC)"

update-force: ## Принудительное обновление
	@echo "$(BLUE)🔄 Принудительное обновление SmokyApp...$(NC)"
	@./scripts/update.sh --force
	@echo "$(GREEN)✅ Принудительное обновление завершено$(NC)"

deploy: ## Автоматическое развертывание
	@echo "$(BLUE)🚀 Развертывание SmokyApp...$(NC)"
	@sudo ./scripts/deploy.sh
	@echo "$(GREEN)✅ Развертывание завершено$(NC)"

backup: ## Создание резервной копии
	@echo "$(BLUE)💾 Создание резервной копии...$(NC)"
	@mkdir -p $(BACKUP_DIR)
	@BACKUP_NAME="backup_$(shell date +%Y%m%d_%H%M%S)"; \
	tar -czf $(BACKUP_DIR)/$$BACKUP_NAME.tar.gz \
		--exclude='logs/*' \
		--exclude='backups/*' \
		--exclude='.git/*' \
		--exclude='node_modules/*' \
		. && \
	echo "$(GREEN)✅ Резервная копия создана: $(BACKUP_DIR)/$$BACKUP_NAME.tar.gz$(NC)"

backup-list: ## Список резервных копий
	@echo "$(BLUE)📋 Доступные резервные копии:$(NC)"
	@ls -la $(BACKUP_DIR)/*.tar.gz 2>/dev/null || echo "$(YELLOW)Резервные копии не найдены$(NC)"

restore: ## Восстановление из резервной копии (использование: make restore BACKUP=backup_name.tar.gz)
	@if [ -z "$(BACKUP)" ]; then \
		echo "$(RED)❌ Укажите имя резервной копии: make restore BACKUP=backup_name.tar.gz$(NC)"; \
		make backup-list; \
		exit 1; \
	fi
	@echo "$(BLUE)🔄 Восстановление из $(BACKUP)...$(NC)"
	@make stop
	@tar -xzf $(BACKUP_DIR)/$(BACKUP) -C .
	@make start
	@echo "$(GREEN)✅ Восстановление завершено$(NC)"

test: ## Запуск тестов
	@echo "$(BLUE)🧪 Запуск тестов...$(NC)"
	@# Здесь можно добавить команды для запуска тестов
	@curl -f http://localhost/health && echo "$(GREEN)✅ Health check passed$(NC)" || echo "$(RED)❌ Health check failed$(NC)"

lint: ## Проверка качества кода
	@echo "$(BLUE)🔍 Проверка качества кода...$(NC)"
	@# Проверка Dockerfile
	@command -v hadolint >/dev/null 2>&1 && hadolint Dockerfile || echo "$(YELLOW)⚠️  hadolint не установлен$(NC)"
	@# Проверка docker-compose.yml
	@docker-compose -f $(COMPOSE_FILE) config >/dev/null && echo "$(GREEN)✅ docker-compose.yml валиден$(NC)" || echo "$(RED)❌ Ошибка в docker-compose.yml$(NC)"
	@# Проверка скриптов bash
	@command -v shellcheck >/dev/null 2>&1 && find scripts -name "*.sh" -exec shellcheck {} \; || echo "$(YELLOW)⚠️  shellcheck не установлен$(NC)"

watch-start: ## Запуск мониторинга обновлений
	@echo "$(BLUE)👁️  Запуск мониторинга обновлений...$(NC)"
	@./scripts/watch.sh start

watch-stop: ## Остановка мониторинга обновлений
	@echo "$(BLUE)⏹️  Остановка мониторинга обновлений...$(NC)"
	@./scripts/watch.sh stop

watch-status: ## Статус мониторинга обновлений
	@./scripts/watch.sh status

watch-logs: ## Логи мониторинга обновлений
	@./scripts/watch.sh logs

shell: ## Подключение к контейнеру приложения
	@docker exec -it smokyapp-web /bin/sh

shell-updater: ## Подключение к контейнеру обновлений
	@docker exec -it smokyapp-updater /bin/sh

ps: ## Показать запущенные процессы в контейнерах
	@echo "$(BLUE)📋 Процессы в контейнерах:$(NC)"
	@docker-compose -f $(COMPOSE_FILE) exec smokyapp ps aux

env-check: ## Проверка переменных окружения
	@echo "$(BLUE)🔧 Проверка переменных окружения:$(NC)"
	@if [ -f .env ]; then \
		echo "$(GREEN)✅ .env файл найден$(NC)"; \
		grep -v '^#' .env | grep -v '^$$' | head -10; \
	else \
		echo "$(RED)❌ .env файл не найден$(NC)"; \
		echo "$(YELLOW)Выполните: make install$(NC)"; \
	fi

ports: ## Показать используемые порты
	@echo "$(BLUE)🔌 Используемые порты:$(NC)"
	@docker-compose -f $(COMPOSE_FILE) ps --format "table {{.Service}}\t{{.Ports}}"

size: ## Показать размер образов Docker
	@echo "$(BLUE)📏 Размер Docker образов:$(NC)"
	@docker images | grep smokyapp

network: ## Информация о сети Docker
	@echo "$(BLUE)🌐 Сеть Docker:$(NC)"
	@docker network ls | grep smokyapp

health: ## Детальная проверка здоровья системы
	@echo "$(BLUE)🏥 Проверка здоровья системы:$(NC)"
	@echo ""
	@echo "$(YELLOW)Доступность приложения:$(NC)"
	@curl -s -w "Status: %{http_code} | Time: %{time_total}s | Size: %{size_download} bytes\n" http://localhost/ -o /dev/null
	@echo ""
	@echo "$(YELLOW)Проверка endpoint'ов:$(NC)"
	@curl -s -w "Health: %{http_code}\n" http://localhost/health -o /dev/null
	@echo ""
	@echo "$(YELLOW)Использование диска:$(NC)"
	@df -h . | tail -1
	@echo ""
	@echo "$(YELLOW)Использование памяти Docker:$(NC)"
	@docker system df

# Алиасы для удобства
up: start ## Алиас для start
down: stop ## Алиас для stop
rebuild: build start ## Пересборка и запуск
