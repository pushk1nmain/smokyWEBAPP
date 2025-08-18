/**
 * SmokyApp - Welcome Screen JavaScript
 * Скрипт экрана приветствия для интеграции с Telegram WebApp API
 */

(function() {
    // Глобальные переменные и встроенная конфигурация
    let tg = null;
    let isReady = false;

    // --- Telegram WebApp Keyboard Handling ---
    // This is added for consistency, though welcome screen doesn't have direct input issues
    if (window.Telegram && window.Telegram.WebApp) {
        const WebApp = window.Telegram.WebApp;
        const appContainer = document.querySelector('.app-container');

        // Initial setup for viewport
        WebApp.ready();
        WebApp.expand(); // Ensure the app expands to full height

        // Listen for viewport changes (including keyboard appearance/disappearance)
        WebApp.onEvent('viewportChanged', () => {
            const currentViewportHeight = WebApp.viewportHeight;
            const stableViewportHeight = WebApp.viewportStableHeight;

            const keyboardHeight = stableViewportHeight - currentViewportHeight;

            if (appContainer) {
                // Apply padding to the bottom of the app container
                appContainer.style.paddingBottom = `${Math.max(0, keyboardHeight)}px`;
            }
        });
    }

    const config = {
        api: {
            baseUrl: '/api/v1'
        },
        development: {
            enableDebugLogs: true,
            enableBrowserTestMode: true,
            testUser: {
                id: 123456789,
                first_name: 'Тест',
                last_name: 'Пользователь',
                username: 'testuser',
                language_code: 'ru'
            }
        },
        telegram: {
            enableHapticFeedback: true,
            autoExpand: true,
            applyTheme: true
        },
        ui: {
            loadingAnimationDuration: 500,
            notificationDuration: 3000,
            enableAnimations: true
        }
    };

    /**
     * Отображение критической ошибки на экране
     */
    const showCriticalError = (title, message) => {
        hideLoading();
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ffdddd;
            color: #d8000c;
            padding: 10px;
            z-index: 10000;
            font-size: 14px;
            text-align: center;
            border-bottom: 2px solid #d8000c;
            word-break: break-word;
        `;
        errorDiv.innerHTML = `<b>${title}</b><br><small>${message}</small>`;
        document.body.prepend(errorDiv);
    };

    /**
     * Основная функция инициализации приложения
     */
    const main = async () => {
        try {
            console.log('🚀 Welcome screen запускается...');

            // Дожидаемся инициализации SmokyApp если он доступен
            if (window.SmokyApp) {
                console.log('🔧 SmokyApp уже доступен, дожидаемся его инициализации...');
                let waitCount = 0;
                while (!window.SmokyApp.isInitialized && waitCount < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    waitCount++;
                }
                
                if (window.SmokyApp.isInitialized) {
                    console.log('✅ SmokyApp инициализирован, проверяем навигацию...');
                    
                    // Позволяем SmokyApp обработать навигацию
                    if (window.StepRouter) {
                        const currentStep = await window.StepRouter.getCurrentStep();
                        console.log(`📍 Текущий шаг пользователя: ${currentStep}`);
                        
                        if (currentStep > 1) {
                            console.log('🔄 Пользователь должен быть на шаге больше 1, выполняем переход через StepRouter');
                            
                            // Принудительно выполняем навигацию к правильному шагу
                            await window.StepRouter.navigateToCurrentStep(true);
                            return;
                        }
                    }
                } else {
                    console.warn('⚠️ SmokyApp не инициализировался за 5 секунд');
                }
            }

            // Настройка UI и событий только если остаемся на welcome screen
            setupUI();
            setupEventListeners();
            
            // Предзагружаем следующую страницу для быстрого перехода
            if (window.LoadingManager) {
                LoadingManager.preloadPage('../name-input/index.html');
            }

            // Инициализация Telegram или режима браузера
            if (window.Telegram && window.Telegram.WebApp) {
                tg = window.Telegram.WebApp;
                console.log(`✅ Telegram WebApp API доступен (v${tg.version}). Инициализация...`);
                await setupTelegramWebApp();
            } else {
                console.warn('⚠️ Telegram WebApp API недоступен. Запуск в режиме отладки для браузера.');
                await setupBrowserMode();
            }

            isReady = true;
            console.log('✅ Welcome screen успешно инициализирован!');
            hideLoading();

        } catch (error) {
            console.error('❌ КРИТИЧЕСКАЯ ОШИБКА ПРИ ИНИЦИАЛИЗАЦИИ:', error);
            showCriticalError('Ошибка при запуске приложения', error.message);
            handleError(error, 'Initialization');
        }
    };

    /**
     * Настройка приложения для работы в Telegram
     */
    const setupTelegramWebApp = async () => {
        try {
            console.log('🔧 Настройка для Telegram...');
            tg.ready();
            if (config.telegram.autoExpand) {
                tg.expand();
            }
            if (config.telegram.applyTheme) {
                applyTelegramTheme();
            }
            setupTelegramButtons();

            console.log('👤 Обработка данных пользователя Telegram...');
            
            // Добавляем детальное логирование всего объекта initDataUnsafe
            console.log('🔍 Полные данные от Telegram (initDataUnsafe):', tg.initDataUnsafe);

            const user = tg.initDataUnsafe.user;

            if (user && typeof user === 'object') {
                // Логируем полученный объект пользователя
                console.log('✅ Объект пользователя получен:', user);

                // Проверяем наличие ID
                if (!user.id) {
                    throw new Error('В данных от Telegram отсутствует обязательное поле `user.id`.');
                }
                
                console.log(`👤 ID пользователя: ${user.id}. Начинаем проверку в API...`);
                // Используем LoadingManager для API запроса
                const apiResult = await (window.LoadingManager ? 
                    LoadingManager.wrapApiCall(
                        () => checkUserInAPI(user.id),
                        'Проверяем ваш профиль'
                    ) : 
                    (showLoadingWithText('Проверяем ваш профиль...'), await checkUserInAPI(user.id))
                );
                
                console.log('🎨 Персонализация интерфейса...');
                await personalizeGreeting(user, apiResult);

            } else {
                // Эта ситуация не должна происходить, но добавим обработку
                console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: `tg.initDataUnsafe.user` имеет неверный формат или отсутствует.');
                throw new Error('Не удалось получить корректные данные пользователя от Telegram.');
            }
        } catch (error) {
            console.error('❌ Ошибка на этапе обработки данных пользователя:', error);
            // Показываем ошибку на экране, чтобы пользователь мог ее сообщить
            showCriticalError('Ошибка обработки данных', `Произошла ошибка при обработке вашего профиля Telegram. Пожалуйста, сообщите об этом разработчику. Детали: ${error.message}`);
            // Также отправляем ошибку в глобальный обработчик
            handleError(error, 'setupTelegramWebApp');
        }
    };
    
    /**
     * Настройка приложения для работы в браузере (режим отладки)
     */
    const setupBrowserMode = async () => {
        console.log('🌐 Активирован режим отладки для браузера.');
        const testUser = config?.development?.testUser;
        if (!testUser) {
            throw new Error('Тестовый пользователь не найден в конфигурации (`development.testUser`).');
        }
        
        console.log(`🧪 Используется тестовый пользователь: ${testUser.first_name}`);
        showLoadingWithText('');
        const apiResult = await checkUserInAPI(testUser.id);
        await personalizeGreeting(testUser, apiResult);
    };

    // ... (остальные функции без изменений: applyTelegramTheme, setupTelegramButtons, checkUserInAPI, getUserData, personalizeGreeting, setupUI, setupEventListeners, handleStartClick, и т.д.)
    // NOTE: I will paste the rest of the functions here to ensure the file is complete.
    
    /**
 * Применение темы Telegram
 * Синхронизирует цвета приложения с темой Telegram
 */
const applyTelegramTheme = () => {
    if (!tg?.themeParams) return;
    
    const theme = tg.themeParams;
    const root = document.documentElement;
    
    // Применяем цвета темы
    if (theme.bg_color) {
        root.style.setProperty('--tg-theme-bg-color', theme.bg_color);
    }
    if (theme.text_color) {
        root.style.setProperty('--tg-theme-text-color', theme.text_color);
    }
    if (theme.hint_color) {
        root.style.setProperty('--tg-theme-hint-color', theme.hint_color);
    }
    if (theme.button_color) {
        root.style.setProperty('--tg-theme-button-color', theme.button_color);
    }
    if (theme.button_text_color) {
        root.style.setProperty('--tg-theme-button-text-color', theme.button_text_color);
    }
    if (theme.secondary_bg_color) {
        root.style.setProperty('--tg-theme-secondary-bg-color', theme.secondary_bg_color);
    }
    
    console.log('🎨 Тема Telegram применена:', theme);
};

/**
 * Настройка кнопок Telegram
 * Конфигурирует основные кнопки Telegram WebApp
 */
const setupTelegramButtons = () => {
    if (!tg) return;
    
    // Скрываем кнопку "Назад" на экране приветствия
    tg.BackButton.hide();
    
    // Настраиваем главную кнопку (пока скрываем)
    tg.MainButton.hide();
    
    console.log('🔘 Кнопки Telegram настроены');
};

/**
 * Проверка пользователя в API
 * Отправляет запрос к backend API для проверки существования пользователя
 */
const checkUserInAPI = async (telegramId) => {
    console.log('🔍 === НАЧАЛО ПРОВЕРКИ ПОЛЬЗОВАТЕЛЯ В API ===');
    console.log('📊 telegramId:', telegramId);
    
    try {
        const apiUrl = `${config.api.baseUrl}/user/${telegramId}`;
        
        console.log('🌐 URL для API запроса:', apiUrl);
        
        const headers = {
            'Content-Type': 'application/json'
        };

        if (tg && tg.initData) {
            headers['X-Telegram-WebApp-Data'] = tg.initData;
            console.log('✅ Добавлен заголовок X-Telegram-WebApp-Data:', tg.initData);
        } else {
            console.warn('⚠️ tg.initData отсутствует. Заголовок X-Telegram-WebApp-Data не будет добавлен.');
        }
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: headers
        });
        
        if (response.ok) {
            const userData = await response.json();
            console.log('✅ Пользователь найден в API:', userData);
            return { found: true, userData };
        } else if (response.status === 404) {
            console.log('❌ Пользователь не найден в API (404)');
            return { found: false, userData: null };
        } else {
            // Пытаемся получить детальное сообщение об ошибке с сервера
            let errorMessage = '';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || '';
            } catch (e) {
                // Если не удалось распарсить JSON, пытаемся получить текст
                try {
                    errorMessage = await response.text();
                } catch (e2) {
                    errorMessage = '';
                }
            }
            
            const serverError = errorMessage || `HTTP ${response.status}`;
            console.error('❌ Ошибка API запроса:', response.status, serverError);
            return { found: false, userData: null, error: serverError };
        }
    } catch (error) {
        console.error('❌ Ошибка сети при запросе к API:', error);
        return { found: false, userData: null, error: error.message };
    }
};

/**
 * Получение данных пользователя
 * Извлекает информацию о пользователе из Telegram и проверяет в API
 */
const getUserData = async () => {
    if (!tg?.initDataUnsafe) {
        console.warn('⚠️ Данные пользователя недоступны, используем fallback');
        hideLoading();
        return null;
    }
    
    const user = tg.initDataUnsafe.user;
    
    if (user) {
        showLoadingWithText('Проверяем ваш профиль...');
        const apiResult = await checkUserInAPI(user.id);
        await personalizeGreeting(user, apiResult);
        hideLoading();
        return { telegramUser: user, apiResult };
    }
    
    return null;
};

/**
 * Персонализация приветствия
 */
const personalizeGreeting = async (telegramUser, apiResult) => {
    const titleElement = document.querySelector('.welcome-title');
    if (!titleElement) return;

    let userName = localStorage.getItem('userName');

    if (!userName) {
        if (apiResult.found && apiResult.userData?.name) {
            userName = apiResult.userData.name;
        } else if (telegramUser?.first_name) {
            userName = telegramUser.first_name;
        }
    }
    
    if (userName) {
        titleElement.textContent = `Привет, ${userName}! Я Смоки — Ваш гид к жизни без сигарет`;
    } else {
        titleElement.textContent = 'Привет! Я Смоки — Ваш гид к жизни без сигарет';
    }
};

/**
 * Настройка UI
 */
const setupUI = () => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover');
    }
    console.log('🎨 UI настроен');
};

/**
 * Настройка обработчиков событий
 */
const setupEventListeners = () => {
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', handleStartClick);
        startButton.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && handleStartClick());
    }
    console.log('⚡ Обработчики событий настроены');
};

/**
 * Обработчик нажатия кнопки "Начать" с плавной загрузкой
 */
const handleStartClick = () => {
    console.log('🚀 handleStartClick вызван - Начинаем путь с Смоки!');
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }
    
    // Показываем загрузку и плавно переходим
    console.log('📱 Показываем загрузку...');
    showLoading();
    
    console.log('⏰ Запускаем таймер на 1200мс для перехода...');
    setTimeout(() => {
        console.log('⏰ Таймер сработал, вызываем navigateToNextScreen...');
        navigateToNextScreen();
    }, 1200); // Увеличили для плавности
};

/**
 * Навигация к следующему экрану
 */
const navigateToNextScreen = async () => {
    console.log('🚀 navigateToNextScreen вызван');
    
    if (tg?.sendData) {
        try {
            tg.sendData(JSON.stringify({ type: 'welcome_completed', timestamp: new Date().toISOString() }));
            console.log('📤 Данные отправлены в Telegram');
        } catch (error) {
            console.error('❌ Ошибка отправки данных:', error);
        }
    }
    
    try {
        // Проверяем доступность StepRouter
        console.log('🔍 Проверяем доступность StepRouter:', !!window.StepRouter);
        
        if (window.StepRouter) {
            console.log('🔧 StepRouter найден, проверяем состояние:', window.StepRouter.getState());
            
            console.log('🔄 Вызываем StepRouter.goToNextStep()...');
            const success = await window.StepRouter.goToNextStep();
            
            console.log('📊 Результат StepRouter.goToNextStep():', success);
            
            if (success) {
                console.log('✅ Переход к следующему шагу выполнен успешно через StepRouter');
                return;
            } else {
                console.warn('⚠️ StepRouter.goToNextStep() вернул false, используем fallback');
            }
        } else {
            console.warn('⚠️ window.StepRouter недоступен');
        }
        
        // Fallback переход на следующий экран
        console.log('🔄 Выполняем fallback переход на экран ввода имени');
        window.location.href = '../name-input/index.html';
        
    } catch (error) {
        console.error('❌ Ошибка при переходе к следующему шагу:', error);
        
        // Скрываем загрузку при ошибке
        hideLoading();
        
        // Критический fallback
        console.log('🚨 Выполняем критический fallback переход');
        setTimeout(() => {
            window.location.href = '../name-input/index.html';
        }, 500);
    }
};

/**
 * Показ уведомления
 */
const showNotification = (message) => {
    if (tg?.showAlert) {
        tg.showAlert(message);
    } else {
        alert(message);
    }
    console.log('📢 Уведомление:', message);
};

/**
 * Простые утилиты загрузки без текста
 */
const showLoading = () => {
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
        
        // Добавляем haptic feedback если доступен
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
    }
};

const hideLoading = () => {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        // Плавное скрытие
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
            
            // Haptic feedback при завершении загрузки
            if (tg?.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred('success');
            }
        }, 600);
    }
};

// Для совместимости со старым кодом
const showLoadingWithText = (text) => {
    showLoading();
};

/**
 * Глобальный обработчик ошибок
 */
const handleError = (error, context = 'Unknown') => {
    console.error(`❌ Ошибка в ${context}:`, error);
    if (tg?.sendData) {
        try {
            tg.sendData(JSON.stringify({ type: 'error', context, error: error.message, timestamp: new Date().toISOString() }));
        } catch (e) { /* ignore */ }
    }
};

    // Глобальные обработчики ошибок
    window.addEventListener('error', (event) => handleError(event.error, 'Global Error'));
    window.addEventListener('unhandledrejection', (event) => handleError(event.reason, 'Unhandled Promise Rejection'));

    // Инициализация при загрузке DOM
    document.addEventListener('DOMContentLoaded', main);

    // Экспорт для использования в других модулях
    window.SmokyWelcome = {
        isReady: () => isReady,
        getTelegram: () => tg,
        getUserData: getUserData,
        showNotification: showNotification,
    };
    
    // Дублирующая консоль разработчика удалена - используется глобальная из global-console.js

})();