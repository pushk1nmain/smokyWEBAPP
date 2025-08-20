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
        
        // Переходим к следующему экрану через StepRouter
        await navigateToNextScreen();
        
    } catch (error) {
        console.error('❌ ПОДРОБНАЯ ОШИБКА при переходе к следующему экрану:', error);
        console.error('❌ Стек ошибки:', error.stack);
        console.error('❌ Название ошибки:', error.name);
        console.error('❌ Сообщение ошибки:', error.message);
        
        // Скрываем загрузку
        if (window.LoadingManager) {
            window.LoadingManager.hide();
        }
        
        // НЕ показываем ошибку пользователю, а принудительно переходим
        console.log('🔄 ПРИНУДИТЕЛЬНЫЙ переход на levels-explanation несмотря на ошибку');
        window.location.href = '../levels-explanation/index.html';
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
            console.log('🔄 Обновляем шаг до 21 после просмотра уроков (transformation-lessons = шаг 20)');
            const success = await window.StepRouter.updateStep(21);
            
            if (success) {
                console.log('✅ Шаг успешно обновлен до 21');
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
 * Переход к следующему экрану через StepRouter
 */
async function navigateToNextScreen() {
    console.log('🚀 Переходим к следующему экрану через StepRouter');
    
    try {
        // Сохраняем локально информацию о просмотре (без обновления шага на сервере)
        localStorage.setItem('transformationLessonsViewed', 'true');
        localStorage.setItem('transformationLessonsTimestamp', new Date().toISOString());
        console.log('💾 Локальная информация о просмотре сохранена');
        
        // Обновляем шаг до 21 СНАЧАЛА
        if (window.StepRouter) {
            console.log('🔄 Обновляем шаг до 21 после просмотра уроков трансформации');
            const stepUpdateSuccess = await window.StepRouter.updateStep(21);
            
            if (stepUpdateSuccess) {
                console.log('✅ Шаг обновлен до 21, выполняем переход');
            } else {
                console.warn('⚠️ Не удалось обновить шаг, но продолжаем переход');
            }
        }
        
        // Переходим на levels-explanation
        const nextScreen = '../levels-explanation/index.html';
        console.log(`🔄 Переход на: ${nextScreen}`);
        if (window.LoadingManager?.navigateWithTransition) {
            window.LoadingManager.navigateWithTransition(nextScreen);
        } else {
            window.location.href = nextScreen;
        }
        
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