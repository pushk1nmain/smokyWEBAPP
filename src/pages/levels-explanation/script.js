/**
 * SmokyApp - Levels Explanation Screen Script
 * Скрипт экрана объяснения 4 уровней зависимости
 */

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Загружается экран объяснения уровней зависимости...');
    
    // Инициализируем Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        console.log('📱 Telegram WebApp инициализирован');
        
        // Настройка WebApp
        tg.ready();
        tg.expand();
        
        // Настройка цветов темы
        tg.setHeaderColor('#E8F4FD');
        tg.setBackgroundColor('#E8F4FD');
        
        console.log('✅ Telegram WebApp настроен для экрана уровней');
    }
    
    // Инициализируем экран
    initializeScreen();
});

/**
 * Инициализация экрана объяснения уровней
 */
function initializeScreen() {
    console.log('🔧 Инициализация экрана объяснения 4 уровней зависимости');
    
    try {
        // Получаем элементы
        const forwardButton = document.getElementById('forwardButton');
        const levelCards = document.querySelectorAll('.level-card');
        
        if (!forwardButton) {
            console.error('❌ Не найдена кнопка forwardButton');
            return;
        }
        
        console.log(`📋 Найдено ${levelCards.length} карточек уровней`);
        
        // Устанавливаем имя пользователя в заголовок из кэша (если есть)
        const cachedUserName = localStorage.getItem('userName');
        if (cachedUserName) {
            console.log(`👤 Имя пользователя из кэша: ${cachedUserName}`);
        }
        
        // Добавляем обработчики событий
        forwardButton.addEventListener('click', handleContinueClick);
        
        // Добавляем интерактивность карточкам
        levelCards.forEach((card, index) => {
            card.addEventListener('click', () => handleCardClick(index + 1));
        });
        
        // Логируем информацию о пользователе
        logUserProgress();
        
        console.log('✅ Экран объяснения уровней инициализирован успешно');
        
    } catch (error) {
        console.error('❌ Ошибка при инициализации экрана уровней:', error);
        
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
 * Обработчик клика по карточке уровня
 */
function handleCardClick(levelNumber) {
    console.log(`🎯 Клик по карточке уровня ${levelNumber}`);
    
    // Haptic feedback для Telegram
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    
    // Можно добавить дополнительную анимацию или логику
    const card = document.querySelector(`.level-card[data-level="${levelNumber}"]`);
    if (card) {
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);
    }
}

/**
 * Обработчик клика по кнопке "А как работает Смоки?"
 */
async function handleContinueClick() {
    console.log('▶️ Пользователь нажал "А как работает Смоки?"');
    
    try {
        // Показываем загрузку
        if (window.LoadingManager) {
            window.LoadingManager.show();
        }
        
        // Обновляем прогресс пользователя
        await updateUserProgress();
        
        // Переходим к следующему экрану через StepRouter
        await navigateToNextScreen();
        
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
    console.log('📊 Обновляем прогресс пользователя после просмотра уровней зависимости');
    
    try {
        // Обновляем шаг в БД через StepRouter
        if (window.StepRouter) {
            console.log('🔄 Остаемся на шаге 21 - это финальный экран (levels-explanation = шаг 21)');
            const success = true; // Не обновляем шаг, остаемся на 21
            
            if (success) {
                console.log('✅ Остаемся на финальном шаге 21');
            } else {
                console.warn('⚠️ Не удалось обновить шаг пользователя');
            }
        }
        
        // Сохраняем локально информацию о просмотре
        localStorage.setItem('levelsExplanationViewed', 'true');
        localStorage.setItem('levelsExplanationTimestamp', new Date().toISOString());
        
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
        // Обновляем прогресс пользователя
        await updateUserProgress();
        
        // Используем StepRouter для корректного перехода
        if (window.StepRouter) {
            console.log('🔄 Используем StepRouter для перехода к следующему шагу');
            const success = await window.StepRouter.goToNextStep();
            
            // Это финальный экран - показываем пользователю сообщение о завершении
            console.log('🎉 Это финальный экран приложения');
            
            // Показываем пользователю что это конец доступного контента
            if (window.showErrorModal) {
                window.showErrorModal(
                    'Поздравляем! 🎉',
                    'Вы прошли все доступные экраны. Скоро будет добавлено больше контента!',
                    [
                        {
                            text: 'На главную',
                            action: () => window.location.href = '../welcome/index.html'
                        }
                    ]
                );
            } else {
                // Fallback на главную
                window.location.href = '../welcome/index.html';
            }
        } else {
            console.warn('⚠️ StepRouter недоступен, показываем завершающее сообщение');
            
            // Fallback если StepRouter недоступен
            if (window.showErrorModal) {
                window.showErrorModal(
                    'Поздравляем! 🎉',
                    'Вы изучили принципы работы системы. Больше контента скоро будет добавлено!',
                    [
                        {
                            text: 'На главную',
                            action: () => window.location.href = '../welcome/index.html'
                        }
                    ]
                );
            } else {
                window.location.href = '../welcome/index.html';
            }
        }
        
    } catch (error) {
        console.error('❌ Ошибка при навигации:', error);
        throw error;
    }
}

/**
 * Логирование прогресса пользователя
 */
function logUserProgress() {
    console.log('📈 Информация о прогрессе пользователя:');
    
    try {
        const userProgress = {
            currentStep: localStorage.getItem('currentStep') || 'unknown',
            levelsExplanationViewed: localStorage.getItem('levelsExplanationViewed') === 'true',
            selectedItemsCount: localStorage.getItem('selectedItemsCount') || '0',
            timestamp: new Date().toISOString()
        };
        
        console.log('👤 Прогресс пользователя:', userProgress);
        
        // Отправляем аналитику, если доступно
        if (window.gtag) {
            window.gtag('event', 'screen_view', {
                screen_name: 'levels_explanation',
                user_progress: userProgress.currentStep,
                selected_items_count: userProgress.selectedItemsCount
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
    console.error('❌ Глобальная ошибка на экране объяснения уровней:', event.error);
    
    // Можно добавить отправку ошибки на сервер аналитики
    if (window.gtag) {
        window.gtag('event', 'exception', {
            description: event.error?.message || 'Unknown error',
            fatal: false,
            screen_name: 'levels_explanation'
        });
    }
});

// Экспорт функций для внешнего использования
window.LevelsExplanationScreen = {
    handleContinueClick,
    handleCardClick,
    updateUserProgress,
    navigateToNextScreen
};