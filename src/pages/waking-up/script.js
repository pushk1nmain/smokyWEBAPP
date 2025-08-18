/**
 * SmokyApp - Waking Up Screen Script
 * Скрипт экрана пробуждения с анимациями и переходами
 */

class WakingUpScreen {
    constructor() {
        this.continueButton = document.getElementById('continueButton');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        this.init();
    }

    /**
     * Инициализация компонента экрана пробуждения
     * Настройка Telegram WebApp API и обработчиков событий
     */
    init() {
        this.setupTelegramWebApp();
        this.setupEventListeners();
        this.setupAnimations();
        
        // Добавляем небольшую задержку для плавного появления контента
        this.showContentWithDelay();
    }

    /**
     * Настройка Telegram WebApp API
     * Конфигурация темы и основных кнопок
     */
    setupTelegramWebApp() {
        if (window.Telegram?.WebApp) {
            // Расширяем приложение на весь экран
            window.Telegram.WebApp.expand();
            
            // Включаем закрытие по свайпу вниз
            window.Telegram.WebApp.enableClosingConfirmation();
            
            // Настраиваем цвета темы
            if (window.Telegram.WebApp.colorScheme === 'dark') {
                document.documentElement.classList.add('dark-theme');
            }
            
            // Скрываем главную кнопку Telegram (используем свою)
            window.Telegram.WebApp.MainButton.hide();
            
            console.log('🌟 Telegram WebApp инициализирован для экрана пробуждения');
        }
    }

    /**
     * Настройка обработчиков событий
     * Подключение интерактивности к элементам интерфейса
     */
    setupEventListeners() {
        // Обработчик кнопки "Далее"
        this.continueButton.addEventListener('click', () => {
            this.handleContinue();
        });

        // Поддержка клавиатуры (Enter для продолжения)
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
                event.preventDefault();
                this.handleContinue();
            }
        });

        // Обработка касаний для мобильных устройств
        this.continueButton.addEventListener('touchstart', () => {
            this.continueButton.classList.add('touched');
        });

        this.continueButton.addEventListener('touchend', () => {
            this.continueButton.classList.remove('touched');
        });
    }

    /**
     * Настройка анимаций
     * Добавление плавных переходов и эффектов
     */
    setupAnimations() {
        // Добавляем класс для анимации появления контента
        setTimeout(() => {
            document.querySelector('.waking-up-screen').classList.add('content-visible');
        }, 100);

        // Создаем эффект мерцания для создания атмосферы пробуждения
        this.createGlowEffect();
    }

    /**
     * Создание эффекта свечения для усиления атмосферы
     * Добавление тонких световых эффектов
     */
    createGlowEffect() {
        const sleepingPerson = document.querySelector('.sleeping-person');
        if (sleepingPerson) {
            // Добавляем тонкое голубое свечение
            sleepingPerson.style.filter = `
                drop-shadow(0 8px 16px var(--smoky-shadow))
                drop-shadow(0 0 20px rgba(33, 150, 243, 0.1))
            `;
        }
    }

    /**
     * Плавное появление контента с задержкой
     * Создание эффекта постепенного пробуждения
     */
    showContentWithDelay() {
        const elements = [
            document.querySelector('.character-section'),
            document.querySelector('.main-title'),
            document.querySelector('.main-description'),
            document.querySelector('.action-section')
        ];

        elements.forEach((element, index) => {
            if (element) {
                element.style.opacity = '0';
                element.style.transform = 'translateY(20px)';
                element.style.transition = 'all 0.6s ease-out';
                
                setTimeout(() => {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, 200 + (index * 150));
            }
        });
    }

    /**
     * Обработка нажатия кнопки "Далее"
     * Переход к следующему экрану истории
     */
    handleContinue() {
        // Предотвращаем множественные клики
        if (this.continueButton.disabled) return;
        
        this.continueButton.disabled = true;
        
        // Добавляем визуальную обратную связь
        this.continueButton.classList.add('processing');
        
        // Логируем действие пользователя
        console.log('👆 Пользователь нажал "Далее" на экране пробуждения');
        
        // Плавный переход к следующему экрану
        this.transitionToNextScreen();
    }

    /**
     * Переход к следующему экрану
     * Прямая навигация без загрузки
     */
    transitionToNextScreen() {
        console.log('🚀 Переход к следующему экрану истории');
        this.navigateToNextScreen();
    }

    /**
     * Показ индикатора загрузки
     * Визуальная обратная связь при переходе
     */
    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('hidden');
        }
    }

    /**
     * Скрытие индикатора загрузки
     * Завершение процесса загрузки
     */
    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('hidden');
        }
    }

    /**
     * Навигация к следующему экрану
     * Переход к экрану появления робота
     */
    navigateToNextScreen() {
        console.log('📍 Переход к экрану появления робота');
        
        // Переход на экран появления робота
        window.location.href = '../robot-appearance/index.html';
    }

    /**
     * Обработка ошибок
     * Показ сообщений об ошибках пользователю
     */
    handleError(error) {
        console.error('❌ Ошибка в экране пробуждения:', error);
        
        this.hideLoading();
        this.continueButton.disabled = false;
        this.continueButton.classList.remove('processing');
        
        // Показываем пользователю сообщение об ошибке
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.showAlert('Произошла ошибка. Попробуйте еще раз.');
        } else {
            alert('Произошла ошибка. Попробуйте еще раз.');
        }
    }
}

// Инициализация экрана при загрузке DOM
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 Waking-up экран загружен, обновляем шаг в БД');
    
    // Обновляем шаг в БД при загрузке waking-up экрана
    try {
        if (window.StepRouter) {
            console.log('🔄 Обновляем шаг до 5 (waking-up) через StepRouter');
            const success = await window.StepRouter.updateStep(5);
            if (success) {
                console.log('✅ Шаг успешно обновлен до 5');
            } else {
                console.warn('⚠️ Не удалось обновить шаг до 5');
            }
        } else {
            console.warn('⚠️ StepRouter недоступен для обновления шага');
        }
    } catch (error) {
        console.error('❌ Ошибка при обновлении шага:', error);
    }
    
    new WakingUpScreen();
});

// Обработка ошибок JavaScript
window.addEventListener('error', (event) => {
    console.error('🚨 JavaScript ошибка:', event.error);
});

// Обработка необработанных промисов
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Необработанная ошибка промиса:', event.reason);
});