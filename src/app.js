/**
 * SmokyApp - Main Application Entry Point
 * Главная точка входа приложения с системой шагов
 * Определяет куда направить пользователя в зависимости от его прогресса
 */

class SmokyApp {
    constructor() {
        this.isInitialized = false;
        this.router = null;
        
        this.init();
    }

    /**
     * Инициализация главного приложения
     * Настройка всех необходимых компонентов
     */
    async init() {
        try {
            console.log('🚀 Инициализация SmokyApp...');
            
            // Инициализируем Telegram WebApp
            this.initTelegramWebApp();
            
            // Ждем загрузки всех необходимых скриптов
            await this.waitForDependencies();
            
            // Инициализируем роутер шагов
            await this.initStepRouter();
            
            // Определяем и выполняем навигацию
            await this.handleInitialNavigation();
            
            this.isInitialized = true;
            console.log('✅ SmokyApp успешно инициализирован');
            
        } catch (error) {
            console.error('❌ Критическая ошибка при инициализации SmokyApp:', error);
            
            // В случае ошибки пытаемся перенаправить на экран приветствия
            this.fallbackToWelcome();
        }
    }

    /**
     * Инициализация Telegram WebApp API
     * Базовая настройка для работы в Telegram
     */
    initTelegramWebApp() {
        if (window.Telegram?.WebApp) {
            try {
                // Уведомляем Telegram что приложение готово
                window.Telegram.WebApp.ready();
                
                // Расширяем на весь экран
                window.Telegram.WebApp.expand();
                
                // Включаем подтверждение закрытия
                window.Telegram.WebApp.enableClosingConfirmation();
                
                // Настраиваем цветовую схему
                if (window.Telegram.WebApp.colorScheme === 'dark') {
                    document.documentElement.classList.add('dark-theme');
                }
                
                // Логируем информацию о пользователе
                const user = window.Telegram.WebApp.initDataUnsafe?.user;
                if (user) {
                    console.log(`👤 Пользователь Telegram: ${user.first_name} (ID: ${user.id})`);
                }
                
                console.log('📱 Telegram WebApp инициализирован');
                
            } catch (error) {
                console.error('❌ Ошибка инициализации Telegram WebApp:', error);
            }
        } else {
            console.warn('⚠️ Telegram WebApp API недоступен (не в Telegram или тестовый режим)');
        }
    }

    /**
     * Ожидание загрузки всех зависимостей
     * Проверяет доступность необходимых компонентов
     */
    async waitForDependencies() {
        const maxWaitTime = 10000; // Максимум 10 секунд ожидания
        const checkInterval = 100; // Проверяем каждые 100мс
        let waitTime = 0;
        
        return new Promise((resolve, reject) => {
            const checkDependencies = () => {
                // Проверяем наличие необходимых компонентов
                const hasStepRouter = typeof window.StepRouter !== 'undefined';
                const hasAPIClient = typeof window.APIClient !== 'undefined';
                
                if (hasStepRouter && hasAPIClient) {
                    console.log('📦 Все зависимости загружены');
                    resolve();
                    return;
                }
                
                waitTime += checkInterval;
                
                if (waitTime >= maxWaitTime) {
                    console.warn('⚠️ Не все зависимости загружены за отведенное время');
                    console.warn(`   StepRouter: ${hasStepRouter ? '✅' : '❌'}`);
                    console.warn(`   APIClient: ${hasAPIClient ? '✅' : '❌'}`);
                    resolve(); // Продолжаем работу даже без всех зависимостей
                    return;
                }
                
                setTimeout(checkDependencies, checkInterval);
            };
            
            checkDependencies();
        });
    }

    /**
     * Инициализация роутера шагов
     * Подготовка системы навигации
     */
    async initStepRouter() {
        try {
            if (window.StepRouter) {
                this.router = window.StepRouter;
                
                // Дожидаемся инициализации роутера
                if (!this.router.isInitialized) {
                    await this.router.init();
                }
                
                console.log('🧭 StepRouter готов к работе');
            } else {
                throw new Error('StepRouter не найден');
            }
        } catch (error) {
            console.error('❌ Ошибка инициализации роутера:', error);
            throw error;
        }
    }

    /**
     * Обработка начальной навигации
     * Определяет на какой экран направить пользователя
     */
    async handleInitialNavigation() {
        try {
            // Получаем текущий путь
            const currentPath = window.location.pathname;
            console.log(`📍 Текущий путь: ${currentPath}`);
            console.log(`🔧 Статус роутера: ${this.router ? 'Доступен' : 'Недоступен'}`);
            
            if (this.router) {
                console.log(`📊 Состояние роутера:`, this.router.getState());
            }
            
            // Проверяем, не находимся ли мы уже на главной странице приложения
            if (this.isMainAppPage(currentPath)) {
                console.log('🏠 Находимся на главной странице, выполняем перенаправление');
                
                // Используем роутер для навигации к правильному шагу
                if (this.router) {
                    await this.router.navigateToCurrentStep();
                } else {
                    console.error('❌ Роутер недоступен для навигации');
                    this.fallbackToWelcome();
                }
                return;
            }
            
            // Если мы уже на одном из экранов приложения, проверяем корректность
            if (this.isAppScreen(currentPath)) {
                console.log('📱 Находимся на экране приложения, проверяем корректность...');
                await this.validateCurrentScreen();
                
                // Настраиваем обработчики событий для текущего экрана
                this.setupScreenEventHandlers(currentPath);
                return;
            }
            
            // Неизвестная страница - перенаправляем через роутер
            console.log('❓ Неизвестная страница, используем роутер для навигации');
            if (this.router) {
                await this.router.navigateToCurrentStep();
            } else {
                console.error('❌ Роутер недоступен для неизвестной страницы');
                this.fallbackToWelcome();
            }
            
        } catch (error) {
            console.error('❌ Ошибка при обработке начальной навигации:', error);
            this.fallbackToWelcome();
        }
    }

    /**
     * Проверяет, является ли путь главной страницей приложения
     * @param {string} path Текущий путь
     * @returns {boolean} True если это главная страница
     */
    isMainAppPage(path) {
        const mainPaths = [
            '/',
            '/index.html',
            '/frontend/',
            '/frontend/index.html'
        ];
        
        const isMain = mainPaths.some(mainPath => path === mainPath || path.endsWith(mainPath));
        console.log(`🏠 isMainAppPage(${path}) = ${isMain}`);
        return isMain;
    }

    /**
     * Проверяет, является ли путь одним из экранов приложения
     * @param {string} path Текущий путь
     * @returns {boolean} True если это экран приложения
     */
    isAppScreen(path) {
        const screenPaths = [
            '/src/pages/welcome/',
            '/src/pages/name-input/',
            '/src/pages/city-input/',
            '/src/pages/how-did-you-know/',
            '/src/pages/waking-up/'
        ];
        
        return screenPaths.some(screenPath => path.includes(screenPath));
    }

    /**
     * Валидирует текущий экран с прогрессом пользователя
     * Проверяет, должен ли пользователь находиться на этом экране
     */
    async validateCurrentScreen() {
        try {
            if (!this.router) {
                console.warn('⚠️ Роутер недоступен для валидации');
                return;
            }
            
            // Получаем текущий шаг пользователя
            const currentStep = await this.router.getCurrentStep();
            const expectedScreenUrl = this.router.getScreenForStep(currentStep);
            
            if (!expectedScreenUrl) {
                console.error(`❌ Не найден экран для шага ${currentStep}`);
                this.fallbackToWelcome();
                return;
            }
            
            // Проверяем, соответствует ли текущий путь ожидаемому
            const currentPath = window.location.pathname;
            console.log(`🔍 Проверяем соответствие: текущий путь = ${currentPath}, ожидаемый = ${expectedScreenUrl}`);
            
            if (currentPath === expectedScreenUrl || currentPath.includes(expectedScreenUrl) || expectedScreenUrl.includes(currentPath)) {
                console.log(`✅ Пользователь находится на правильном экране для шага ${currentStep}`);
                return;
            }
            
            // Пользователь на неправильном экране - перенаправляем
            console.log(`🔄 Перенаправляем с шага ${this.getStepFromPath(currentPath)} на правильный шаг ${currentStep}`);
            console.log(`🚀 Переход: ${currentPath} → ${expectedScreenUrl}`);
            await this.router.navigateToCurrentStep(true);
            
        } catch (error) {
            console.error('❌ Ошибка при валидации текущего экрана:', error);
        }
    }

    /**
     * Определяет номер шага по текущему пути
     * @param {string} path Текущий путь
     * @returns {number|null} Номер шага или null если не найден
     */
    getStepFromPath(path) {
        const stepMappings = {
            '/src/pages/welcome/': 1,
            '/src/pages/name-input/': 2,
            '/src/pages/city-input/': 3,
            '/src/pages/how-did-you-know/': 4,
            '/src/pages/waking-up/': 5
        };
        
        for (const [screenPath, step] of Object.entries(stepMappings)) {
            if (path.includes(screenPath)) {
                return step;
            }
        }
        
        return null;
    }

    /**
     * Резервный переход на экран приветствия
     * Используется в случае критических ошибок
     */
    fallbackToWelcome() {
        console.log('🏠 Выполняем резервный переход на экран приветствия');
        
        const welcomeUrl = '/src/pages/welcome/index.html';
        
        try {
            if (window.LoadingManager?.navigateWithTransition) {
                window.LoadingManager.navigateWithTransition(welcomeUrl);
            } else {
                window.location.href = welcomeUrl;
            }
        } catch (error) {
            console.error('❌ Ошибка даже при резервном переходе:', error);
            // Последняя попытка - жесткий переход
            window.location.replace(welcomeUrl);
        }
    }

    /**
     * Получает информацию о состоянии приложения
     * @returns {Object} Состояние приложения
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            currentPath: window.location.pathname,
            routerState: this.router?.getState() || null,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Настройка обработчиков событий для текущего экрана
     * @param {string} currentPath Текущий путь
     */
    setupScreenEventHandlers(currentPath) {
        // Обработчик для экрана приветствия
        if (currentPath.includes('/welcome/')) {
            console.log('🔧 Настраиваем обработчики для welcome screen');
            
            const startButton = document.getElementById('startButton');
            if (startButton && !startButton.hasAttribute('data-smoky-handler')) {
                startButton.setAttribute('data-smoky-handler', 'true');
                startButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('🚀 SmokyApp: обработка кнопки Поехали!');
                    
                    // Haptic feedback если доступен
                    if (window.Telegram?.WebApp?.HapticFeedback) {
                        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
                    }
                    
                    try {
                        // Переходим к следующему шагу через роутер
                        if (this.router) {
                            const success = await this.router.goToNextStep();
                            if (!success) {
                                console.error('❌ StepRouter не смог выполнить переход');
                                // Fallback
                                window.location.href = '../name-input/index.html';
                            }
                        } else {
                            console.error('❌ Роутер недоступен для перехода');
                            window.location.href = '../name-input/index.html';
                        }
                    } catch (error) {
                        console.error('❌ Ошибка при переходе к следующему шагу:', error);
                        window.location.href = '../name-input/index.html';
                    }
                });
                
                console.log('✅ Обработчик кнопки welcome настроен');
            }
        }
        
        // Здесь можно добавить обработчики для других экранов
        // if (currentPath.includes('/name-input/')) { ... }
        // if (currentPath.includes('/city-input/')) { ... }
    }

    /**
     * Обработка ошибок приложения
     * Централизованная обработка всех ошибок
     */
    static handleGlobalError(error, source = 'unknown') {
        console.error(`🚨 Глобальная ошибка [${source}]:`, error);
        
        // Отправляем информацию об ошибке в Telegram если доступно
        if (window.Telegram?.WebApp?.showAlert) {
            window.Telegram.WebApp.showAlert(
                'Произошла техническая ошибка. Попробуйте перезапустить приложение.'
            );
        }
        
        // Логируем дополнительную информацию для отладки
        console.error('Stack trace:', error.stack);
        console.error('User Agent:', navigator.userAgent);
        console.error('Current URL:', window.location.href);
    }
}

// Создаем глобальный экземпляр приложения
window.SmokyApp = new SmokyApp();

// Глобальная обработка ошибок
window.addEventListener('error', (event) => {
    SmokyApp.handleGlobalError(event.error, 'window.error');
});

window.addEventListener('unhandledrejection', (event) => {
    SmokyApp.handleGlobalError(event.reason, 'unhandled.promise');
});

console.log('🔧 SmokyApp загружен');