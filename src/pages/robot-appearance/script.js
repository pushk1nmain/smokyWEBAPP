/**
 * SmokyApp - Robot Appearance Screen Script
 * Скрипт экрана появления робота с анимациями и переходами
 */

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 Robot-appearance экран загружен, обновляем шаг в БД');
    
    // Обновляем шаг в БД при загрузке robot-appearance экрана
    try {
        if (window.StepRouter) {
            console.log('🔄 Обновляем шаг до 6 (robot-appearance) через StepRouter');
            const success = await window.StepRouter.updateStep(6);
            if (success) {
                console.log('✅ Шаг успешно обновлен до 6');
            } else {
                console.warn('⚠️ Не удалось обновить шаг до 6');
            }
        } else {
            console.warn('⚠️ StepRouter недоступен для обновления шага');
        }
    } catch (error) {
        console.error('❌ Ошибка при обновлении шага:', error);
    }
    
    new RobotAppearanceScreen();
});

class RobotAppearanceScreen {
    constructor() {
        this.continueButton = document.getElementById('continueButton');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        this.init();
    }

    /**
     * Инициализация компонента экрана появления робота
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
            
            console.log('🌟 Telegram WebApp инициализирован для экрана появления робота');
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
            document.querySelector('.robot-appearance-screen').classList.add('content-visible');
        }, 100);

        // Создаем эффект голубого свечения для робота
        this.createRobotGlow();
    }

    /**
     * Создание эффекта свечения для робота
     * Добавление голубых световых эффектов
     */
    createRobotGlow() {
        const robot = document.querySelector('.robot-character');
        if (robot) {
            // Добавляем голубое свечение с пульсацией
            robot.style.filter = `
                drop-shadow(0 0 20px rgba(33, 150, 243, 0.6))
                drop-shadow(0 0 40px rgba(33, 150, 243, 0.4))
                drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))
            `;
        }
    }

    /**
     * Плавное появление контента с задержкой
     * Анимация теперь реализована через CSS, этот метод больше не нужен
     */
    showContentWithDelay() {
        // Анимация теперь управляется через CSS @keyframes
        // Элементы автоматически появляются при загрузке страницы
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
        console.log('👆 Пользователь нажал "Далее" на экране появления робота');
        
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
     * Переход к следующему этапу истории
     */
    navigateToNextScreen() {
        console.log('📍 Переход к следующему этапу истории');
        
        // Переход на экран сломанного навигатора
        window.location.href = '../navigator-broken/index.html';
    }

    /**
     * Обработка ошибок
     * Показ сообщений об ошибках пользователю
     */
    handleError(error) {
        console.error('❌ Ошибка в экране появления робота:', error);
        
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

// Обработка ошибок JavaScript
window.addEventListener('error', (event) => {
    console.error('🚨 JavaScript ошибка:', event.error);
});

// Обработка необработанных промисов
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Необработанная ошибка промиса:', event.reason);
});