/**
 * SmokyApp - Transformation Lessons Screen Script
 * Скрипт экрана уроков трансформации
 */

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎓 Загружается экран уроков трансформации...');
    
    // Инициализируем Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        console.log('📱 Telegram WebApp инициализирован');
        
        // Настройка WebApp
        tg.ready();
        tg.expand();
        
        // Настройка цветов темы
        tg.setHeaderColor('#E6F0FF');
        tg.setBackgroundColor('#E6F0FF');
        
        console.log('✅ Telegram WebApp настроен для экрана уроков');
    }
    
    // Инициализируем экран
    initializeScreen();
});

/**
 * Инициализация экрана уроков трансформации
 */
function initializeScreen() {
    console.log('🎯 Инициализация экрана поддержки');
    
    try {
        // Получаем элементы
        const forwardButton = document.getElementById('forwardButton');
        
        if (!forwardButton) {
            console.error('❌ Не найдены обязательные элементы интерфейса');
            return;
        }
        
        // Устанавливаем имя пользователя в заголовок из кэша
        const cachedUserName = localStorage.getItem('userName');
        const userName = cachedUserName || 'Друг';
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userName;
            console.log(`👤 Установлено имя пользователя из кэша: ${userName}`);
        }

        // Устанавливаем количество выбранных пунктов из предыдущего экрана
        const selectedCount = parseInt(localStorage.getItem('selectedItemsCount') || '0');
        const selectedCountElement = document.getElementById('selectedCount');
        if (selectedCountElement) {
            selectedCountElement.textContent = selectedCount;
            console.log(`📊 Установлено количество выбранных пунктов: ${selectedCount}`);
        }

        // Генерируем правильный текст с склонениями
        const selectedItemsTextElement = document.querySelector('.selected-items-text');
        if (selectedItemsTextElement && selectedCount) {
            const correctText = generateSelectedItemsText(selectedCount);
            selectedItemsTextElement.innerHTML = correctText;
            console.log(`📝 Текст с правильными склонениями: ${correctText}`);
        }
        
        // Добавляем обработчики событий
        forwardButton.addEventListener('click', handleContinueClick);
        
        // Логируем информацию о пользователе
        logUserProgress();
        
        console.log('✅ Экран уроков трансформации инициализирован успешно');
        
    } catch (error) {
        console.error('❌ Ошибка при инициализации экрана уроков:', error);
        
        // Показываем пользователю ошибку
        if (window.showErrorModal) {
            window.showErrorModal(
                'Ошибка загрузки',
                'Не удалось загрузить экран. Попробуйте обновить страницу.',
                [{
                    text: 'Обновить',
                    action: () => window.location.reload()
                }]
            );
        }
    }
}

/**
 * Обработчик клика по кнопке "Далее"
 */
async function handleContinueClick() {
    console.log('▶️ Пользователь нажал "Далее"');
    
    try {
        // Показываем загрузку
        if (window.LoadingManager) {
            window.LoadingManager.show();
        }
        
        // Переходим к следующему экрану сразу
        navigateToNextScreen();
        
    } catch (error) {
        console.error('❌ Ошибка при переходе к следующему экрану:', error);
        
        // Скрываем загрузку
        if (window.LoadingManager) {
            window.LoadingManager.hide();
        }
        
        // Показываем ошибку
        if (window.showErrorModal) {
            window.showErrorModal(
                'Ошибка перехода',
                'Не удалось перейти к следующему экрану. Попробуйте еще раз.',
                [{
                    text: 'Повторить',
                    action: () => handleContinueClick()
                }]
            );
        }
    }
}

/**
 * Обновление прогресса пользователя
 */
async function updateUserProgress() {
    console.log('📊 Обновляем прогресс пользователя после просмотра уроков');
    
    try {
        // Обновляем шаг в БД через StepRouter
        if (window.StepRouter) {
            console.log('🔄 Обновляем шаг до 19 после просмотра уроков');
            const success = await window.StepRouter.updateStep(19);
            
            if (success) {
                console.log('✅ Шаг успешно обновлен до 19');
            } else {
                console.warn('⚠️ Не удалось обновить шаг пользователя');
            }
        }
        
        // Сохраняем локально информацию о просмотре
        localStorage.setItem('transformationLessonsViewed', 'true');
        localStorage.setItem('transformationLessonsTimestamp', new Date().toISOString());
        
        console.log('✅ Прогресс пользователя обновлен');
        
    } catch (error) {
        console.error('❌ Ошибка при обновлении прогресса:', error);
        throw error;
    }
}

/**
 * Переход к следующему экрану
 */
function navigateToNextScreen() {
    console.log('🚀 Переходим к следующему экрану');
    
    try {
        // Переходим на экран объяснения уровней зависимости
        const nextScreen = '../levels-explanation/index.html';
        
        console.log(`🔄 Переходим на экран: ${nextScreen}`);
        
        // Прямой переход без задержки
        window.location.href = nextScreen;
        
    } catch (error) {
        console.error('❌ Ошибка при навигации:', error);
        throw error;
    }
}

/**
 * Генерация текста с правильными склонениями
 */
function generateSelectedItemsText(count) {
    let pointWord;
    
    // Правила склонения для слова "пункт"
    if (count === 1) {
        pointWord = 'пункт';
    } else if (count >= 2 && count <= 4) {
        pointWord = 'пункта';
    } else {
        pointWord = 'пунктов';
    }
    
    return `✅ Вы выбрали <span id="selectedCount">${count}</span> ${pointWord} из списка`;
}

/**
 * Логирование прогресса пользователя
 */
function logUserProgress() {
    console.log('📈 Информация о прогрессе пользователя:');
    
    try {
        const userProgress = {
            currentStep: localStorage.getItem('currentStep') || 'unknown',
            transformationLessonsViewed: localStorage.getItem('transformationLessonsViewed') === 'true',
            timestamp: new Date().toISOString()
        };
        
        console.log('👤 Прогресс пользователя:', userProgress);
        
        // Отправляем аналитику, если доступно
        if (window.gtag) {
            window.gtag('event', 'screen_view', {
                screen_name: 'transformation_lessons',
                user_progress: userProgress.currentStep
            });
        }
        
    } catch (error) {
        console.error('❌ Ошибка при логировании прогресса:', error);
    }
}

/**
 * Обработка ошибок
 */
window.addEventListener('error', function(event) {
    console.error('❌ Глобальная ошибка на экране уроков трансформации:', event.error);
    
    // Можно добавить отправку ошибки на сервер аналитики
    if (window.gtag) {
        window.gtag('event', 'exception', {
            description: event.error?.message || 'Unknown error',
            fatal: false,
            screen_name: 'transformation_lessons'
        });
    }
});

// Экспорт функций для внешнего использования
window.TransformationLessonsScreen = {
    handleContinueClick,
    updateUserProgress,
    navigateToNextScreen
};