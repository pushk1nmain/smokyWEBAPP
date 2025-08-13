/**
 * SmokyApp - Welcome Screen JavaScript
 * Скрипт экрана приветствия для интеграции с Telegram WebApp API
 */

// Глобальные переменные
let tg = null;
let isReady = false;
let config = null;

/**
 * Инициализация конфигурации
 * Проверяет доступность конфигурации и валидирует ключи
 */
const initializeConfig = () => {
    if (typeof window === 'undefined' || !window.SmokyConfig) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Конфигурация SmokyConfig не найдена!');
        console.error('💡 Убедитесь что файл config.js подключен и содержит window.SmokyConfig');
        throw new Error('Конфигурация приложения не загружена');
    }
    
    config = window.SmokyConfig;
    
    // Валидация обязательных полей
    if (!config.api?.baseUrl || !config.api?.apiKey) {
        console.error('❌ ОШИБКА КОНФИГУРАЦИИ: Не заданы обязательные параметры API');
        throw new Error('Неполная конфигурация API');
    }
    
    // Проверка на тестовый ключ
    if (config.api.apiKey === 'YOUR_API_KEY_HERE') {
        console.warn('⚠️ ВНИМАНИЕ: Используется placeholder для API ключа!');
    }
    
    console.log('✅ Конфигурация инициализирована:', {
        apiBaseUrl: config.api.baseUrl,
        hasApiKey: !!config.api.apiKey,
        debugMode: config.development?.enableDebugLogs || false
    });
    
    return config;
};

/**
 * Инициализация экрана приветствия
 * Проверяет доступность Telegram WebApp API и настраивает приложение
 */
const initializeWelcomeScreen = async () => {
    console.log('🚀 Инициализация экрана приветствия SmokyApp...');
    
    // Инициализируем конфигурацию
    try {
        initializeConfig();
    } catch (error) {
        console.error('❌ Ошибка инициализации конфигурации:', error);
        showNotification('Ошибка конфигурации приложения');
        return;
    }
    
    // Проверяем доступность Telegram WebApp API
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        tg = window.Telegram.WebApp;
        console.log('✅ Telegram WebApp API доступен');
        
        // Инициализируем Telegram WebApp (асинхронно)
        await setupTelegramWebApp();
    } else {
        console.warn('⚠️ Telegram WebApp API недоступен, работаем в режиме браузера');
        
        // Инициализируем в режиме браузера (асинхронно)
        await setupBrowserMode();
        
        // Скрываем загрузку в режиме браузера
        hideLoading();
    }
    
    // Настраиваем UI и события
    setupUI();
    setupEventListeners();
    
    isReady = true;
    console.log('✅ Экран приветствия SmokyApp инициализирован успешно');
};

/**
 * Настройка Telegram WebApp
 * Конфигурирует приложение для работы в Telegram
 */
const setupTelegramWebApp = async () => {
    try {
        // Готовность приложения
        tg.ready();
        console.log('📱 Telegram WebApp готов');
        
        // Разворачиваем приложение на весь экран
        tg.expand();
        
        // Применяем тему Telegram
        applyTelegramTheme();
        
        // Настраиваем кнопки Telegram
        setupTelegramButtons();
        
        // Получаем данные пользователя (асинхронно)
        await getUserData();
        
        console.log('🎨 Telegram WebApp настроен');
    } catch (error) {
        console.error('❌ Ошибка настройки Telegram WebApp:', error);
        hideLoading(); // Скрываем загрузку в случае ошибки
    }
};

/**
 * Применение темы Telegram
 * Синхронизирует цвета приложения с темой Telegram
 */
const applyTelegramTheme = () => {
    if (!tg?.themeParams) return;
    
    const theme = tg.themeParams;
    const root = document.documentElement;
    
    // Применяем цвета темы
    if (theme.bg_color) {
        root.style.setProperty('--tg-theme-bg-color', theme.bg_color);
    }
    if (theme.text_color) {
        root.style.setProperty('--tg-theme-text-color', theme.text_color);
    }
    if (theme.hint_color) {
        root.style.setProperty('--tg-theme-hint-color', theme.hint_color);
    }
    if (theme.button_color) {
        root.style.setProperty('--tg-theme-button-color', theme.button_color);
    }
    if (theme.button_text_color) {
        root.style.setProperty('--tg-theme-button-text-color', theme.button_text_color);
    }
    if (theme.secondary_bg_color) {
        root.style.setProperty('--tg-theme-secondary-bg-color', theme.secondary_bg_color);
    }
    
    console.log('🎨 Тема Telegram применена:', theme);
};

/**
 * Настройка кнопок Telegram
 * Конфигурирует основные кнопки Telegram WebApp
 */
const setupTelegramButtons = () => {
    if (!tg) return;
    
    // Скрываем кнопку "Назад" на экране приветствия
    tg.BackButton.hide();
    
    // Настраиваем главную кнопку (пока скрываем)
    tg.MainButton.hide();
    
    console.log('🔘 Кнопки Telegram настроены');
};

/**
 * Проверка пользователя в API
 * Отправляет запрос к backend API для проверки существования пользователя
 */
const checkUserInAPI = async (telegramId) => {
    try {
        if (!config?.api) {
            console.error('❌ Конфигурация API недоступна');
            return { found: false, userData: null, error: 'Конфигурация не загружена' };
        }
        
        console.log(`🔍 Проверяем пользователя в API: ${telegramId}`);
        
        const response = await fetch(`${config.api.baseUrl}/user/${telegramId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': config.api.apiKey
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            console.log('✅ Пользователь найден в API:', userData);
            return { found: true, userData };
        } else if (response.status === 404) {
            console.log('❌ Пользователь не найден в API (404)');
            return { found: false, userData: null };
        } else {
            console.error('❌ Ошибка API запроса:', response.status, response.statusText);
            return { found: false, userData: null, error: `HTTP ${response.status}` };
        }
    } catch (error) {
        console.error('❌ Ошибка сети при запросе к API:', error);
        return { found: false, userData: null, error: error.message };
    }
};

/**
 * Получение данных пользователя
 * Извлекает информацию о пользователе из Telegram и проверяет в API
 */
const getUserData = async () => {
    if (!tg?.initDataUnsafe) return null;
    
    const user = tg.initDataUnsafe.user;
    if (user) {
        console.log('👤 Данные пользователя из Telegram:', {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            username: user.username,
            languageCode: user.language_code
        });
        
        // Показываем индикатор загрузки
        showLoadingWithText('Проверяем ваш профиль...');
        
        // Проверяем пользователя в API
        const apiResult = await checkUserInAPI(user.id);
        
        // Персонализируем приветствие на основе результата API
        await personalizeGreeting(user, apiResult);
        
        // Скрываем индикатор загрузки
        hideLoading();
        
        return { telegramUser: user, apiResult };
    }
    
    return null;
};

/**
 * Персонализация приветствия
 * Настраивает приветствие под конкретного пользователя на основе API данных или Telegram
 */
const personalizeGreeting = async (telegramUser, apiResult) => {
    const titleElement = document.querySelector('.welcome-title');
    if (!titleElement) return;
    
    let userName = '';
    
    // Определяем имя пользователя в зависимости от результата API
    if (apiResult.found && apiResult.userData?.name) {
        // Пользователь найден в БД - используем имя из БД
        userName = apiResult.userData.name;
        console.log(`📝 Используем имя из БД: ${userName}`);
    } else if (telegramUser?.first_name) {
        // Пользователь не найден в БД - используем имя из Telegram
        userName = telegramUser.first_name;
        console.log(`📝 Используем имя из Telegram: ${userName}`);
    }
    
    // Обновляем приветствие
    if (userName) {
        titleElement.textContent = `Привет, ${userName}! Я Смоки — ваш робот-друг на пути к жизни без сигарет`;
        console.log(`👋 Персонализированное приветствие установлено для: ${userName}`);
    } else {
        // Fallback на стандартное приветствие
        titleElement.textContent = 'Привет! Я Смоки — ваш робот-друг на пути к жизни без сигарет';
        console.log('👋 Использовано стандартное приветствие');
    }
};

/**
 * Режим браузера
 * Настройка приложения для работы в обычном браузере (для отладки)
 */
const setupBrowserMode = async () => {
    console.log('🌐 Режим браузера активирован');
    
    // Применяем стандартную тему
    const root = document.documentElement;
    root.style.setProperty('--tg-theme-bg-color', '#ffffff');
    root.style.setProperty('--tg-theme-text-color', '#000000');
    root.style.setProperty('--tg-theme-hint-color', '#999999');
    root.style.setProperty('--tg-theme-button-color', '#2196F3');
    root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
    root.style.setProperty('--tg-theme-secondary-bg-color', '#f1f1f1');
    
    // Симулируем пользователя для тестирования в браузере
    const testUser = config?.development?.testUser || {
        id: 123456789,
        first_name: 'Тест',
        last_name: 'Пользователь',
        username: 'testuser',
        language_code: 'ru'
    };
    
    console.log('🧪 Тестируем функциональность с тестовым пользователем');
    
    // Показываем индикатор загрузки
    showLoadingWithText('Проверяем тестового пользователя...');
    
    // Тестируем API запрос
    const apiResult = await checkUserInAPI(testUser.id);
    
    // Применяем персонализированное приветствие
    await personalizeGreeting(testUser, apiResult);
    
    console.log('🧪 Тестирование в режиме браузера завершено');
};

/**
 * Настройка UI
 * Инициализирует пользовательский интерфейс
 */
const setupUI = () => {
    // Настраиваем viewport для мобильных устройств
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover');
    }
    
    console.log('🎨 UI настроен');
};

/**
 * Настройка обработчиков событий
 * Устанавливает слушатели событий для интерактивных элементов
 */
const setupEventListeners = () => {
    const startButton = document.getElementById('startButton');
    
    if (startButton) {
        // Обработчик клика
        startButton.addEventListener('click', handleStartClick);
        
        // Обработчик клавиатуры для доступности
        startButton.addEventListener('keydown', handleStartKeyDown);
        
        console.log('⚡ Обработчики событий настроены');
    }
};

/**
 * Обработчик нажатия кнопки "Начать"
 * Запускает основной процесс приложения и переходит к следующему экрану
 */
const handleStartClick = () => {
    console.log('🚀 Начинаем путь с Смоки!');
    
    // Haptic feedback для Telegram
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }
    
    // Показываем уведомление
    showNotification('Добро пожаловать в SmokyApp! 🎉');
    
    // Переходим к следующему этапу приложения
    setTimeout(() => {
        navigateToNextScreen();
    }, 1500);
};

/**
 * Навигация к следующему экрану
 * Переходит к основному интерфейсу приложения
 */
const navigateToNextScreen = () => {
    // Отправляем данные в Telegram бот о начале использования
    if (tg?.sendData) {
        try {
            tg.sendData(JSON.stringify({
                type: 'welcome_completed',
                action: 'start_journey',
                timestamp: new Date().toISOString(),
                user_data: getUserData()
            }));
            console.log('📤 Данные отправлены в Telegram бот');
        } catch (error) {
            console.error('❌ Ошибка отправки данных:', error);
        }
    }
    
    // В будущем здесь будет переход на следующий экран приложения
    showNotification('Переходим к основному интерфейсу... 🛠️');
    
    // Для демонстрации показываем сообщение о разработке
    setTimeout(() => {
        showNotification('Основной функционал находится в разработке! 📱');
    }, 2000);
};

/**
 * Обработчик клавиатуры для кнопки "Начать"
 * Обеспечивает доступность через клавиатуру
 */
const handleStartKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleStartClick();
    }
};

/**
 * Показ уведомления
 * Отображает уведомление пользователю
 */
const showNotification = (message) => {
    // Используем Telegram уведомления если доступны
    if (tg?.showAlert) {
        tg.showAlert(message);
    } else {
        // Fallback для браузера
        alert(message);
    }
    
    console.log('📢 Уведомление:', message);
};

/**
 * Показ индикатора загрузки с текстом
 * Отображает экран загрузки с заданным текстом
 */
const showLoadingWithText = (text) => {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.querySelector('.loading-text');
    
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
        console.log(`⏳ Показываем загрузку: ${text}`);
    }
    
    if (loadingText) {
        loadingText.textContent = text;
    }
};

/**
 * Скрытие индикатора загрузки
 * Убирает экран загрузки после инициализации
 */
const hideLoading = () => {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
            console.log('⏳ Загрузка скрыта');
        }, 500);
    }
};

/**
 * Обработка ошибок
 * Глобальный обработчик ошибок приложения
 */
const handleError = (error, context = 'Unknown') => {
    console.error(`❌ Ошибка в ${context}:`, error);
    
    // Отправляем ошибку в Telegram если возможно
    if (tg?.sendData) {
        try {
            tg.sendData(JSON.stringify({
                type: 'error',
                screen: 'welcome',
                context: context,
                error: error.message,
                timestamp: new Date().toISOString()
            }));
        } catch (sendError) {
            console.error('❌ Ошибка отправки данных в Telegram:', sendError);
        }
    }
};

/**
 * Отладочная информация
 * Выводит полезную информацию для разработки
 */
const logDebugInfo = () => {
    console.log('🔍 Отладочная информация Welcome Screen:');
    console.log('- User Agent:', navigator.userAgent);
    console.log('- Telegram WebApp доступен:', !!window.Telegram?.WebApp);
    console.log('- Версия WebApp:', tg?.version || 'N/A');
    console.log('- Платформа:', tg?.platform || 'Unknown');
    console.log('- Данные инициализации:', tg?.initData || 'N/A');
    console.log('- Экран:', 'Welcome');
};

// Глобальные обработчики ошибок
window.addEventListener('error', (event) => {
    handleError(event.error, 'Global Error');
});

window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason, 'Unhandled Promise Rejection');
});

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM загружен, инициализируем экран приветствия...');
    
    // Выводим отладочную информацию
    logDebugInfo();
    
    // Инициализируем экран приветствия (асинхронно)
    await initializeWelcomeScreen();
});

// Экспорт для использования в других модулях
window.SmokyWelcome = {
    isReady: () => isReady,
    getTelegram: () => tg,
    getUserData: getUserData,
    showNotification: showNotification,
    navigateToNextScreen: navigateToNextScreen
};

/* ============================================
   ВСТРОЕННАЯ КОНСОЛЬ РАЗРАБОТЧИКА
   ============================================ */

/**
 * Встроенная консоль разработчика для отладки Telegram WebApp
 * Перехватывает все console методы и отображает их в UI
 */
class DevConsole {
    constructor() {
        this.logs = [];
        this.maxLogs = 500;
        this.isCollapsed = false;
        this.isHidden = false;
        this.activeFilter = 'all';
        this.startTime = Date.now();
        
        // Элементы DOM
        this.consoleElement = null;
        this.contentElement = null;
        this.countElement = null;
        this.filtersElement = null;
        
        // Оригинальные методы console
        this.originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug,
            trace: console.trace,
            table: console.table,
            group: console.group,
            groupEnd: console.groupEnd
        };
        
        this.init();
    }
    
    /**
     * Инициализация консоли разработчика
     */
    init() {
        this.findDOMElements();
        this.setupEventListeners();
        this.interceptConsoleMethods();
        this.logToConsole('info', '🔧 Встроенная консоль разработчика активирована');
        
        // Показываем консоль для разработки
        this.show();
    }
    
    /**
     * Поиск элементов DOM
     */
    findDOMElements() {
        this.consoleElement = document.getElementById('devConsole');
        this.contentElement = document.getElementById('consoleContent');
        this.countElement = document.getElementById('logCount');
        this.filtersElement = document.getElementById('consoleFilters');
        
        if (!this.consoleElement) {
            console.error('❌ DevConsole: Элемент консоли не найден');
            return;
        }
    }
    
    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        // Переключение видимости консоли
        const toggleBtn = document.getElementById('consoleToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
        
        // Очистка логов
        const clearBtn = document.getElementById('clearLogs');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clear());
        }
        
        // Переключение фильтров
        const filterToggleBtn = document.getElementById('filterToggle');
        if (filterToggleBtn) {
            filterToggleBtn.addEventListener('click', () => this.toggleFilters());
        }
        
        // Фильтры логов
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                this.setFilter(filter);
            });
        });
        
        // Клик по заголовку для сворачивания
        const header = document.querySelector('.dev-console-header');
        if (header) {
            header.addEventListener('click', (e) => {
                // Игнорируем клики по кнопкам
                if (!e.target.closest('.dev-console-btn')) {
                    this.toggleCollapse();
                }
            });
        }
    }
    
    /**
     * Перехват методов console
     */
    interceptConsoleMethods() {
        const self = this;
        
        // Перехватываем все основные методы console
        console.log = function(...args) {
            self.originalConsole.log.apply(console, args);
            self.logToConsole('log', ...args);
        };
        
        console.info = function(...args) {
            self.originalConsole.info.apply(console, args);
            self.logToConsole('info', ...args);
        };
        
        console.warn = function(...args) {
            self.originalConsole.warn.apply(console, args);
            self.logToConsole('warn', ...args);
        };
        
        console.error = function(...args) {
            self.originalConsole.error.apply(console, args);
            self.logToConsole('error', ...args);
        };
        
        console.debug = function(...args) {
            self.originalConsole.debug.apply(console, args);
            self.logToConsole('debug', ...args);
        };
        
        // Перехватываем fetch для логирования API запросов
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const url = args[0];
            const options = args[1] || {};
            
            self.logToConsole('api', `🌐 API Запрос: ${options.method || 'GET'} ${url}`);
            
            return originalFetch.apply(this, args)
                .then(response => {
                    const status = response.status;
                    const statusText = response.statusText;
                    const logType = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'api';
                    
                    self.logToConsole(logType, `🌐 API Ответ: ${status} ${statusText} - ${url}`);
                    return response;
                })
                .catch(error => {
                    self.logToConsole('error', `🌐 API Ошибка: ${error.message} - ${url}`);
                    throw error;
                });
        };
        
        // Перехватываем глобальные ошибки
        window.addEventListener('error', (event) => {
            self.logToConsole('error', `💥 JavaScript Ошибка: ${event.message}`, event.filename, `Строка: ${event.lineno}`);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            self.logToConsole('error', `🚫 Необработанный Promise: ${event.reason}`);
        });
    }
    
    /**
     * Добавление лога в консоль
     */
    logToConsole(type, ...args) {
        const timestamp = this.getTimestamp();
        const message = this.formatMessage(args);
        
        const logEntry = {
            type,
            timestamp,
            message,
            raw: args
        };
        
        this.logs.push(logEntry);
        
        // Ограничиваем количество логов
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        this.renderLog(logEntry);
        this.updateLogCount();
        this.scrollToBottom();
    }
    
    /**
     * Форматирование сообщения
     */
    formatMessage(args) {
        return args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
    }
    
    /**
     * Получение временной метки
     */
    getTimestamp() {
        const now = new Date();
        const elapsed = now.getTime() - this.startTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        const h = String(hours).padStart(2, '0');
        const m = String(minutes % 60).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        
        return `${h}:${m}:${s}`;
    }
    
    /**
     * Отрисовка лога
     */
    renderLog(logEntry) {
        if (!this.contentElement) return;
        
        const logElement = document.createElement('div');
        logElement.className = `dev-console-log ${logEntry.type} new`;
        logElement.dataset.type = logEntry.type;
        
        // Определяем иконку по типу
        const icons = {
            log: '📝',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
            debug: '🐛',
            api: '🌐'
        };
        
        logElement.innerHTML = `
            <span class="log-time">${logEntry.timestamp}</span>
            <span class="log-type">${icons[logEntry.type] || '📝'}</span>
            <span class="log-message ${logEntry.type}">${this.escapeHtml(logEntry.message)}</span>
        `;
        
        // Если есть объекты, добавляем их отдельно
        if (logEntry.raw.some(arg => typeof arg === 'object' && arg !== null)) {
            const objectsDiv = document.createElement('div');
            objectsDiv.className = 'log-object';
            
            const objects = logEntry.raw.filter(arg => typeof arg === 'object' && arg !== null);
            objects.forEach(obj => {
                const pre = document.createElement('pre');
                try {
                    pre.textContent = JSON.stringify(obj, null, 2);
                } catch (e) {
                    pre.textContent = String(obj);
                }
                objectsDiv.appendChild(pre);
            });
            
            logElement.appendChild(objectsDiv);
        }
        
        this.contentElement.appendChild(logElement);
        
        // Удаляем класс анимации через некоторое время
        setTimeout(() => {
            logElement.classList.remove('new');
        }, 300);
        
        // Применяем текущий фильтр
        this.applyFilter();
    }
    
    /**
     * Экранирование HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Обновление счетчика логов
     */
    updateLogCount() {
        if (this.countElement) {
            this.countElement.textContent = this.logs.length;
        }
    }
    
    /**
     * Прокрутка в конец
     */
    scrollToBottom() {
        if (this.contentElement && !this.isCollapsed) {
            setTimeout(() => {
                this.contentElement.scrollTop = this.contentElement.scrollHeight;
            }, 50);
        }
    }
    
    /**
     * Установка фильтра
     */
    setFilter(filter) {
        this.activeFilter = filter;
        
        // Обновляем активные кнопки фильтров
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.applyFilter();
    }
    
    /**
     * Применение фильтра
     */
    applyFilter() {
        if (!this.contentElement) return;
        
        const logs = this.contentElement.querySelectorAll('.dev-console-log:not(.startup)');
        logs.forEach(log => {
            const logType = log.dataset.type;
            const shouldShow = this.activeFilter === 'all' || logType === this.activeFilter;
            log.classList.toggle('hidden', !shouldShow);
        });
    }
    
    /**
     * Переключение видимости фильтров
     */
    toggleFilters() {
        if (this.filtersElement) {
            this.filtersElement.classList.toggle('hidden');
        }
    }
    
    /**
     * Показать консоль
     */
    show() {
        if (this.consoleElement) {
            this.consoleElement.classList.remove('hidden');
            this.isHidden = false;
        }
    }
    
    /**
     * Скрыть консоль
     */
    hide() {
        if (this.consoleElement) {
            this.consoleElement.classList.add('hidden');
            this.isHidden = true;
        }
    }
    
    /**
     * Переключение видимости консоли
     */
    toggle() {
        if (this.isHidden) {
            this.show();
        } else {
            this.hide();
        }
        
        // Обновляем иконку кнопки
        const toggleBtn = document.getElementById('consoleToggle');
        if (toggleBtn) {
            toggleBtn.textContent = this.isHidden ? '⬆️' : '⬇️';
        }
    }
    
    /**
     * Переключение сворачивания консоли
     */
    toggleCollapse() {
        if (this.consoleElement) {
            this.consoleElement.classList.toggle('collapsed');
            this.isCollapsed = !this.isCollapsed;
        }
    }
    
    /**
     * Очистка логов
     */
    clear() {
        this.logs = [];
        if (this.contentElement) {
            // Оставляем только стартовое сообщение
            const startupLogs = this.contentElement.querySelectorAll('.startup');
            this.contentElement.innerHTML = '';
            startupLogs.forEach(log => this.contentElement.appendChild(log));
        }
        this.updateLogCount();
        this.logToConsole('info', '🧹 Консоль очищена');
    }
    
    /**
     * Восстановление оригинальных методов console
     */
    restore() {
        Object.keys(this.originalConsole).forEach(method => {
            console[method] = this.originalConsole[method];
        });
    }
}

// Инициализируем консоль разработчика при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    // Небольшая задержка для инициализации после основного скрипта
    setTimeout(() => {
        if (typeof window !== 'undefined') {
            window.devConsole = new DevConsole();
            
            // Логируем информацию о Telegram WebApp
            if (window.Telegram?.WebApp) {
                console.info('📱 Telegram WebApp обнаружен:', {
                    version: window.Telegram.WebApp.version,
                    platform: window.Telegram.WebApp.platform,
                    colorScheme: window.Telegram.WebApp.colorScheme,
                    isExpanded: window.Telegram.WebApp.isExpanded
                });
            } else {
                console.warn('⚠️ Telegram WebApp API недоступен - запуск в режиме браузера');
            }
        }
    }, 100);
});
