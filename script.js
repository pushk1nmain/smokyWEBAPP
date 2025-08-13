/**
 * SmokyApp - Root Redirect Script
 * Скрипт перенаправления с корневой страницы на welcome экран
 * Этот файл остается для обратной совместимости, но основная логика теперь в screens/welcome/
 */

console.log('🔄 Корневой скрипт SmokyApp - перенаправление...');

// Этот файл больше не используется для основной логики приложения
// Вся функциональность перенесена в screens/welcome/script.js
// Данный файл остается только для обратной совместимости

// Дополнительная проверка перенаправления если она не сработала в HTML
(function() {
    const currentPath = window.location.pathname;
    
    // Если мы все еще в корне и не перенаправились
    if (!currentPath.includes('/screens/') && !window.location.href.includes('screens/welcome')) {
        console.log('🔄 Дополнительное перенаправление на welcome экран...');
        
        setTimeout(() => {
            window.location.replace('./screens/welcome/index.html');
        }, 100);
    }
})();

/**
 * Глобальный объект для совместимости
 * Ограниченная функциональность для старых ссылок
 */
window.SmokyApp = {
    // Заглушки для обратной совместимости
    isReady: () => false,
    getTelegram: () => null,
    getUserData: () => null,
    showNotification: (message) => {
        console.log('📢 Сообщение (корневая страница):', message);
        alert(message);
    },
    
    // Перенаправление на welcome экран
    redirectToWelcome: () => {
        window.location.replace('./screens/welcome/index.html');
    }
};
