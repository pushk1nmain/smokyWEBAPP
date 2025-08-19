/**
 * SmokyApp - Step Router
 * Центральный роутер для управления шагами прогресса пользователя
 * Определяет какой экран показать в зависимости от текущего шага
 */

class StepRouter {
    constructor() {
        this.currentStep = null;
        this.telegramId = null;
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Маппинг шагов к экранам приложения
     * Каждый шаг соответствует определенному экрану
     */
    static STEP_TO_SCREEN = {
        1: '/src/pages/welcome/index.html',           // Приветствие с Смоки
        2: '/src/pages/name-input/index.html',        // Ввод имени пользователя
        3: '/src/pages/city-input/index.html',        // Ввод города и часового пояса
        4: '/src/pages/how-did-you-know/index.html',  // Источник информации о приложении
        5: '/src/pages/waking-up/index.html',         // Экран пробуждения (начало истории)
        6: '/src/pages/robot-appearance/index.html',  // Появление робота
        7: '/src/pages/navigator-broken/index.html',  // Сломанный навигатор
        8: '/src/pages/charger-question/index.html',  // Вопрос о курении
        9: '/src/pages/system-explanation/index.html', // Объяснение системы 4 в 1
        10: '/src/pages/price-question/index.html',   // Вопрос о цене жизни
        11: '/src/pages/nicotine-selection/index.html', // Выбор типа никотина
        12: '/src/pages/nicotine-amount/index.html',  // Ввод количества потребления никотина
        13: '/src/pages/nicotine-cost/index.html',   // Ввод стоимости никотина
        14: '/src/pages/nicotine-experience/index.html', // Ввод стажа потребления никотина
        15: '/src/pages/calculation-results/index.html', // Результаты расчета никотинового воздействия
        // Здесь будут добавляться новые экраны по мере развития приложения
    };

    /**
     * Названия шагов для логирования и отладки
     */
    static STEP_NAMES = {
        1: 'Приветствие',
        2: 'Ввод имени',
        3: 'Ввод города', 
        4: 'Источник информации',
        5: 'Начало истории',
        6: 'Появление робота',
        7: 'Сломанный навигатор',
        8: 'Вопрос о курении',
        9: 'Система 4 в 1',
        10: 'Цена жизни',
        11: 'Выбор типа никотина',
        12: 'Количество потребления',
        13: 'Стоимость никотина',
        14: 'Стаж потребления',
        15: 'Результаты расчета',
    };

    /**
     * Инициализация роутера
     * Получает данные пользователя из Telegram WebApp
     */
    async init() {
        try {
            // Инициализируем Telegram WebApp если доступен
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.ready();
                window.Telegram.WebApp.expand();
                
                // Получаем ID пользователя из Telegram
                const user = window.Telegram.WebApp.initDataUnsafe?.user;
                if (user?.id) {
                    this.telegramId = user.id;
                    console.log(`🔧 StepRouter инициализирован для пользователя ${this.telegramId}`);
                } else {
                    console.warn('⚠️ Не удалось получить Telegram ID пользователя');
                }
            }
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ Ошибка инициализации StepRouter:', error);
            this.isInitialized = true; // Продолжаем работу даже при ошибке
        }
    }

    /**
     * Получает текущий шаг пользователя с сервера
     * @returns {Promise<number>} Текущий шаг пользователя
     */
    async getCurrentStep() {
        if (!this.telegramId) {
            console.warn('⚠️ Telegram ID не найден, начинаем с первого шага');
            return 1;
        }

        try {
            // Проверяем доступность API клиента
            if (!window.APIClient) {
                console.warn('⚠️ API клиент недоступен, начинаем с первого шага');
                return 1;
            }

            // Запрашиваем данные пользователя
            const userData = await window.APIClient.getUser(this.telegramId);
            
            if (userData && typeof userData.progress_step === 'number') {
                let userStep = userData.progress_step;
                const maxStep = this.getMaxStep();
                
                // Если шаг пользователя больше максимального доступного - используем максимальный
                if (userStep > maxStep) {
                    console.warn(`⚠️ Шаг пользователя (${userStep}) больше максимального доступного (${maxStep}). Перенаправляем на последний доступный шаг.`);
                    userStep = maxStep;
                    
                    // Обновляем шаг на сервере до максимального доступного
                    try {
                        await this.updateStep(maxStep);
                        console.log(`✅ Шаг пользователя скорректирован до ${maxStep}`);
                    } catch (updateError) {
                        console.error('❌ Не удалось обновить шаг пользователя:', updateError);
                    }
                }
                
                // Проверяем что шаг не меньше 1
                if (userStep < 1) {
                    console.warn(`⚠️ Некорректный шаг пользователя (${userStep}). Устанавливаем первый шаг.`);
                    userStep = 1;
                }
                
                this.currentStep = userStep;
                console.log(`📍 Текущий шаг пользователя: ${this.currentStep} (${StepRouter.STEP_NAMES[this.currentStep] || 'Неизвестный'})`);
                return this.currentStep;
            } else {
                // Новый пользователь или нет данных о прогрессе
                console.log('👋 Новый пользователь, начинаем с первого шага');
                return 1;
            }
            
        } catch (error) {
            // Если пользователь не найден (404) или другая ошибка - начинаем с первого шага
            if (error.message?.includes('404') || error.message?.includes('не найден')) {
                console.log('👋 Пользователь не найден в системе, начинаем с первого шага');
            } else {
                console.error('❌ Ошибка при получении текущего шага:', error);
            }
            return 1;
        }
    }

    /**
     * Обновляет шаг прогресса пользователя на сервере
     * @param {number} newStep Новый шаг для сохранения
     * @returns {Promise<boolean>} Успешность операции
     */
    async updateStep(newStep) {
        // Попытаемся получить telegram_id разными способами
        let telegramId = this.telegramId;
        console.log('🔍 StepRouter.telegramId:', telegramId);
        
        if (!telegramId) {
            console.warn('⚠️ StepRouter telegram_id не найден, пытаемся получить через APIClient...');
            // Используем API Client для получения telegram_id
            if (window.APIClient?.getTelegramUserId) {
                telegramId = window.APIClient.getTelegramUserId();
                console.log(`🔧 Получен telegram_id через APIClient: ${telegramId}`);
                
                // Сохраняем для будущих вызовов
                this.telegramId = telegramId;
            } else {
                console.error('❌ APIClient.getTelegramUserId недоступен');
            }
        }
        
        if (!telegramId) {
            console.error('❌ Не можем обновить шаг: Telegram ID не найден ни в StepRouter, ни в APIClient');
            console.error('❌ Доступные объекты:', {
                'window.APIClient': !!window.APIClient,
                'window.Telegram': !!window.Telegram,
                'window.Telegram.WebApp': !!window.Telegram?.WebApp,
                'initDataUnsafe': !!window.Telegram?.WebApp?.initDataUnsafe,
                'user': !!window.Telegram?.WebApp?.initDataUnsafe?.user
            });
            return false;
        }

        if (!Number.isInteger(newStep) || newStep < 1) {
            console.error('❌ Некорректный номер шага:', newStep);
            return false;
        }

        try {
            // Проверяем доступность API клиента
            if (!window.APIClient) {
                console.warn('⚠️ API клиент недоступен, не можем обновить шаг');
                return false;
            }

            console.log(`📤 Отправляем обновление шага: telegram_id=${telegramId}, step=${newStep}`);
            
            // Отправляем обновление на сервер
            const result = await window.APIClient.updateProgressStep(telegramId, newStep);
            
            console.log(`📥 Получен ответ от сервера:`, result);
            
            if (result && result.success) {
                this.currentStep = newStep;
                console.log(`✅ Шаг обновлен: ${newStep} (${StepRouter.STEP_NAMES[newStep] || 'Неизвестный'})`);
                return true;
            } else {
                console.error('❌ Сервер вернул ошибку при обновлении шага:', result);
                return false;
            }
            
        } catch (error) {
            console.error('❌ Ошибка при обновлении шага:', error);
            console.error('❌ Детали ошибки:', {
                name: error?.name,
                message: error?.message,
                stack: error?.stack
            });
            return false;
        }
    }

    /**
     * Получает URL экрана для указанного шага
     * @param {number} step Номер шага
     * @returns {string|null} URL экрана или null если шаг не найден
     */
    getScreenForStep(step) {
        const screenPath = StepRouter.STEP_TO_SCREEN[step];
        if (!screenPath) {
            console.error(`❌ Экран для шага ${step} не найден`);
            return null;
        }
        
        // Возвращаем абсолютный путь (уже содержит /)
        return screenPath;
    }

    /**
     * Перенаправляет пользователя на экран соответствующий его текущему шагу
     * @param {boolean} force Принудительно перенаправить даже если уже на нужном экране
     */
    async navigateToCurrentStep(force = false) {
        try {
            console.log(`🔍 navigateToCurrentStep вызван, force=${force}`);
            
            // Дожидаемся инициализации
            if (!this.isInitialized) {
                console.log(`⏳ Ожидаем инициализации StepRouter...`);
                await this.init();
            }

            // Получаем текущий шаг
            console.log(`📊 Получаем текущий шаг пользователя...`);
            const currentStep = await this.getCurrentStep();
            console.log(`📍 Получен текущий шаг: ${currentStep}`);
            
            const targetUrl = this.getScreenForStep(currentStep);
            console.log(`🎯 URL для шага ${currentStep}: ${targetUrl}`);
            
            if (!targetUrl) {
                console.error(`❌ Не найден экран для шага ${currentStep}`);
                // Перенаправляем на первый шаг в случае ошибки
                const fallbackUrl = this.getScreenForStep(1);
                if (fallbackUrl) {
                    console.log(`🔄 Fallback на первый экран: ${fallbackUrl}`);
                    window.location.href = fallbackUrl;
                }
                return;
            }

            // Проверяем, не находимся ли мы уже на нужном экране
            const currentPath = window.location.pathname;
            console.log(`📍 Текущий путь: ${currentPath}`);
            console.log(`🎯 Целевой путь: ${targetUrl}`);
            
            if (!force && (currentPath === targetUrl || currentPath.endsWith(targetUrl))) {
                console.log(`✅ Уже находимся на правильном экране для шага ${currentStep}`);
                return;
            }

            // Выполняем навигацию
            console.log(`🚀 ВЫПОЛНЯЕМ ПЕРЕХОД: ${currentPath} → ${targetUrl}`);
            
            // Используем LoadingManager если доступен для плавного перехода
            if (window.LoadingManager?.navigateWithTransition) {
                console.log(`🔄 Используем LoadingManager для перехода`);
                window.LoadingManager.navigateWithTransition(targetUrl);
            } else {
                console.log(`🔄 Прямой переход через window.location.href`);
                window.location.href = targetUrl;
            }
            
        } catch (error) {
            console.error('❌ Ошибка при навигации к текущему шагу:', error);
            
            // В случае критической ошибки перенаправляем на первый экран
            const fallbackUrl = this.getScreenForStep(1);
            if (fallbackUrl) {
                console.log(`🔄 Критическая ошибка, fallback на: ${fallbackUrl}`);
                window.location.href = fallbackUrl;
            }
        }
    }

    /**
     * Переходит к следующему шагу
     * Обновляет прогресс на сервере и перенаправляет на следующий экран
     * @returns {Promise<boolean>} Успешность перехода
     */
    async goToNextStep() {
        try {
            const currentStep = this.currentStep || await this.getCurrentStep();
            const nextStep = currentStep + 1;
            const maxStep = this.getMaxStep();
            
            // Проверяем, не превышает ли следующий шаг максимальный доступный
            if (nextStep > maxStep) {
                console.warn(`⚠️ Следующий шаг ${nextStep} превышает максимальный доступный шаг ${maxStep}. Остаемся на текущем шаге.`);
                return false;
            }
            
            // Проверяем существование следующего экрана
            const nextScreenUrl = this.getScreenForStep(nextStep);
            if (!nextScreenUrl) {
                console.warn(`⚠️ Следующий шаг ${nextStep} не определен`);
                return false;
            }

            // Обновляем шаг на сервере
            const updateSuccess = await this.updateStep(nextStep);
            if (!updateSuccess) {
                console.error('❌ Не удалось обновить шаг на сервере');
                return false;
            }

            // Переходим на следующий экран
            console.log(`➡️ Переход к шагу ${nextStep}: ${nextScreenUrl}`);
            
            if (window.LoadingManager?.navigateWithTransition) {
                window.LoadingManager.navigateWithTransition(nextScreenUrl);
            } else {
                window.location.href = nextScreenUrl;
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка при переходе к следующему шагу:', error);
            return false;
        }
    }

    /**
     * Возвращается к предыдущему шагу
     * @returns {Promise<boolean>} Успешность перехода
     */
    async goToPreviousStep() {
        try {
            const currentStep = this.currentStep || await this.getCurrentStep();
            const previousStep = currentStep - 1;
            
            if (previousStep < 1) {
                console.warn('⚠️ Нельзя вернуться назад с первого шага');
                return false;
            }

            // Проверяем существование предыдущего экрана
            const previousScreenUrl = this.getScreenForStep(previousStep);
            if (!previousScreenUrl) {
                console.error(`❌ Предыдущий шаг ${previousStep} не определен`);
                return false;
            }

            // Обновляем шаг на сервере
            const updateSuccess = await this.updateStep(previousStep);
            if (!updateSuccess) {
                console.error('❌ Не удалось обновить шаг на сервере');
                return false;
            }

            // Переходим на предыдущий экран
            console.log(`⬅️ Возврат к шагу ${previousStep}: ${previousScreenUrl}`);
            
            if (window.LoadingManager?.navigateWithTransition) {
                window.LoadingManager.navigateWithTransition(previousScreenUrl);
            } else {
                window.location.href = previousScreenUrl;
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка при возврате к предыдущему шагу:', error);
            return false;
        }
    }

    /**
     * Получает информацию о текущем состоянии роутера
     * @returns {Object} Объект с информацией о состоянии
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            telegramId: this.telegramId,
            currentStep: this.currentStep,
            currentStepName: StepRouter.STEP_NAMES[this.currentStep] || 'Неизвестный',
            totalSteps: Object.keys(StepRouter.STEP_TO_SCREEN).length,
            availableSteps: Object.keys(StepRouter.STEP_TO_SCREEN).map(Number)
        };
    }

    /**
     * Получает максимальный доступный шаг
     * @returns {number} Максимальный номер шага
     */
    getMaxStep() {
        const steps = Object.keys(StepRouter.STEP_TO_SCREEN).map(Number);
        return Math.max(...steps);
    }

    /**
     * Проверяет, является ли шаг валидным
     * @param {number} step Номер шага для проверки
     * @returns {boolean} True если шаг существует
     */
    isValidStep(step) {
        return Number.isInteger(step) && step >= 1 && StepRouter.STEP_TO_SCREEN.hasOwnProperty(step);
    }
}

// Создаем глобальный экземпляр роутера
window.StepRouter = new StepRouter();

// Экспортируем класс для использования в модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StepRouter;
}

console.log('🔧 StepRouter загружен');