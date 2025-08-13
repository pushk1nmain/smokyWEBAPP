/**
 * SmokyApp - Welcome Screen JavaScript
 * Скрипт экрана приветствия для интеграции с Telegram WebApp API
 */

// Глобальные переменные
let tg = null;
let isReady = false;

/**
 * Инициализация экрана приветствия
 * Проверяет доступность Telegram WebApp API и настраивает приложение
 */
const initializeWelcomeScreen = () => {
    console.log('🚀 Инициализация экрана приветствия SmokyApp...');
    
    // Проверяем доступность Telegram WebApp API
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        tg = window.Telegram.WebApp;
        console.log('✅ Telegram WebApp API доступен');
        
        // Инициализируем Telegram WebApp
        setupTelegramWebApp();
    } else {
        console.warn('⚠️ Telegram WebApp API недоступен, работаем в режиме браузера');
        
        // Инициализируем в режиме браузера
        setupBrowserMode();
    }
    
    // Настраиваем UI и события
    setupUI();
    setupEventListeners();
    
    // Скрываем загрузку
    hideLoading();
    
    isReady = true;
    console.log('✅ Экран приветствия SmokyApp инициализирован успешно');
};

/**
 * Настройка Telegram WebApp
 * Конфигурирует приложение для работы в Telegram
 */
const setupTelegramWebApp = () => {
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
        
        // Получаем данные пользователя
        getUserData();
        
        console.log('🎨 Telegram WebApp настроен');
    } catch (error) {
        console.error('❌ Ошибка настройки Telegram WebApp:', error);
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
 * Получение данных пользователя
 * Извлекает информацию о пользователе из Telegram
 */
const getUserData = () => {
    if (!tg?.initDataUnsafe) return null;
    
    const user = tg.initDataUnsafe.user;
    if (user) {
        console.log('👤 Данные пользователя:', {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            username: user.username,
            languageCode: user.language_code
        });
        
        // Персонализируем приветствие
        personalizeGreeting(user);
        
        return user;
    }
    
    return null;
};

/**
 * Персонализация приветствия
 * Настраивает приветствие под конкретного пользователя
 */
const personalizeGreeting = (user) => {
    const titleElement = document.querySelector('.welcome-title');
    if (titleElement && user.first_name) {
        titleElement.textContent = `Привет, ${user.first_name}! Я Смоки — ваш робот-друг на пути к жизни без сигарет`;
    }
};

/**
 * Режим браузера
 * Настройка приложения для работы в обычном браузере (для отладки)
 */
const setupBrowserMode = () => {
    console.log('🌐 Режим браузера активирован');
    
    // Применяем стандартную тему
    const root = document.documentElement;
    root.style.setProperty('--tg-theme-bg-color', '#ffffff');
    root.style.setProperty('--tg-theme-text-color', '#000000');
    root.style.setProperty('--tg-theme-hint-color', '#999999');
    root.style.setProperty('--tg-theme-button-color', '#2196F3');
    root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
    root.style.setProperty('--tg-theme-secondary-bg-color', '#f1f1f1');
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
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен, инициализируем экран приветствия...');
    
    // Выводим отладочную информацию
    logDebugInfo();
    
    // Инициализируем экран приветствия
    initializeWelcomeScreen();
});

// Экспорт для использования в других модулях
window.SmokyWelcome = {
    isReady: () => isReady,
    getTelegram: () => tg,
    getUserData: getUserData,
    showNotification: showNotification,
    navigateToNextScreen: navigateToNextScreen
};
