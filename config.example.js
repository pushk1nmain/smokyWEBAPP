/**
 * Конфигурация SmokyApp - Шаблон
 * 
 * Скопируйте этот файл как config.js и заполните своими данными
 * config.js автоматически игнорируется Git'ом для безопасности
 */

window.SmokyConfig = {
    // Конфигурация API Backend
    api: {
        // Базовый URL для API endpoints
        baseUrl: 'https://api.smokybot.com/api/v1',
        
        // API ключ для аутентификации
        // Получите ключ у администратора или из .env файла сервера
        apiKey: 'YOUR_API_KEY_HERE'
    },
    
    // Конфигурация для разработки
    development: {
        // Включить детальное логирование
        enableDebugLogs: true,
        
        // Включить тестовый режим в браузере
        enableBrowserTestMode: true,
        
        // Данные тестового пользователя для браузера
        testUser: {
            id: 123456789,
            first_name: 'Тест',
            last_name: 'Пользователь',
            username: 'testuser',
            language_code: 'ru'
        }
    },
    
    // Конфигурация Telegram WebApp
    telegram: {
        // Включить haptic feedback
        enableHapticFeedback: true,
        
        // Автоматически разворачивать приложение
        autoExpand: true,
        
        // Применять тему Telegram
        applyTheme: true
    },
    
    // Конфигурация UI
    ui: {
        // Время анимации загрузки (мс)
        loadingAnimationDuration: 500,
        
        // Время показа уведомлений (мс)
        notificationDuration: 3000,
        
        // Включить анимации (отключить для accessibility)
        enableAnimations: true
    }
};

// Проверяем корректность конфигурации
if (window.SmokyConfig.api.apiKey === 'YOUR_API_KEY_HERE') {
    console.warn('⚠️ ВНИМАНИЕ: Используется тестовый API ключ! Замените на реальный в config.js');
}
