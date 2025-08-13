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
