console.log('🔥 ТЕСТОВЫЙ СКРИПТ ЗАГРУЖАЕТСЯ!');
console.log('📊 window.Telegram:', !!window.Telegram);
console.log('📊 window.SmokyConfig:', !!window.SmokyConfig);

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM готов в тестовом скрипте');
    
    // Попробуем просто поменять текст
    const titleElement = document.querySelector('.welcome-title');
    if (titleElement) {
        titleElement.textContent = '🔥 ТЕСТОВЫЙ СКРИПТ РАБОТАЕТ! JavaScript загружается правильно!';
        titleElement.style.color = 'red';
        console.log('✅ Заголовок изменен тестовым скриптом');
    } else {
        console.error('❌ Не найден элемент .welcome-title');
    }
});

console.log('🔥 ТЕСТОВЫЙ СКРИПТ ПОЛНОСТЬЮ ЗАГРУЖЕН!');
