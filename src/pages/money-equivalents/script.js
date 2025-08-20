/**
 * SmokyApp - Money Equivalents Screen JavaScript
 * Скрипт экрана эквивалентов трат на никотин
 */

(function() {
    // Глобальные переменные
    let tg = null;
    let isReady = false;
    let calculationResults = null;

    // --- Telegram WebApp Keyboard Handling ---
    if (window.Telegram && window.Telegram.WebApp) {
        const WebApp = window.Telegram.WebApp;
        const appContainer = document.querySelector('.app-container');

        // Initial setup for viewport
        WebApp.ready();
        WebApp.expand();

        // Listen for viewport changes (including keyboard appearance/disappearance)
        WebApp.onEvent('viewportChanged', () => {
            const currentViewportHeight = WebApp.viewportHeight;
            const stableViewportHeight = WebApp.viewportStableHeight;

            const keyboardHeight = stableViewportHeight - currentViewportHeight;

            if (appContainer) {
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
     * Загрузка и отображение эквивалентов
     */
    const loadAndDisplayEquivalents = () => {
        console.log('💰 Загружаем эквиваленты трат...');

        try {
            // Получаем результаты из localStorage
            const resultsData = localStorage.getItem('nicotineCalculationResult');
            
            if (!resultsData) {
                throw new Error('Результаты расчета не найдены в localStorage');
            }

            calculationResults = JSON.parse(resultsData);
            console.log('✅ Результаты расчета загружены:', calculationResults);

            // Отображаем эквиваленты
            displayEquivalents();

        } catch (error) {
            console.error('❌ Ошибка при загрузке эквивалентов:', error);
            showCriticalError('Ошибка загрузки данных', error.message);
        }
    };

    /**
     * Отображение эквивалентов с анимацией
     */
    const displayEquivalents = () => {
        const familyDinnersElement = document.getElementById('familyDinners');
        const gymMembershipsElement = document.getElementById('gymMemberships');
        const seaTripsElement = document.getElementById('seaTrips');
        
        if (!calculationResults?.equivalents) {
            console.error('❌ Данные эквивалентов отсутствуют');
            return;
        }

        const equivalents = calculationResults.equivalents;
        console.log('📊 Отображаем эквиваленты:', equivalents);

        // Отображаем семейные ужины
        if (familyDinnersElement && equivalents.family_dinners) {
            familyDinnersElement.textContent = equivalents.family_dinners;
            console.log('🍽️ Семейные ужины:', equivalents.family_dinners);
        }

        // Отображаем абонементы в спортзал
        if (gymMembershipsElement && equivalents.gym_memberships) {
            gymMembershipsElement.textContent = equivalents.gym_memberships;
            console.log('💪 Абонементы в спортзал:', equivalents.gym_memberships);
        }

        // Отображаем поездки на море
        if (seaTripsElement && equivalents.sea_trips) {
            seaTripsElement.textContent = equivalents.sea_trips;
            console.log('🌊 Поездки на море:', equivalents.sea_trips);
        }

        console.log('✅ Эквиваленты отображены');
    };

    /**
     * Основная функция инициализации приложения
     */
    const main = async () => {
        try {
            console.log('🚀 Money equivalents screen запускается...');

            // Обновляем шаг в БД при загрузке equivalents экрана
            try {
                if (window.StepRouter) {
                    console.log('🔄 Обновляем шаг до 16 (money-equivalents) через StepRouter');
                    const success = await window.StepRouter.updateStep(16);
                    if (success) {
                        console.log('✅ Шаг успешно обновлен до 16');
                    } else {
                        console.warn('⚠️ Не удалось обновить шаг до 16');
                    }
                } else {
                    console.warn('⚠️ StepRouter недоступен для обновления шага на equivalents экране');
                }
            } catch (error) {
                console.error('❌ Ошибка при обновлении шага на equivalents экране:', error);
            }

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
                        
                        if (currentStep > 16) {
                            console.log('🔄 Пользователь должен быть на шаге больше 16, выполняем переход через StepRouter');
                            await window.StepRouter.navigateToCurrentStep(true);
                            return;
                        }
                    }
                } else {
                    console.warn('⚠️ SmokyApp не инициализировался за 5 секунд');
                }
            }

            // Загружаем и отображаем эквиваленты
            loadAndDisplayEquivalents();
            
            // Настройка UI и событий
            setupUI();
            setupEventListeners();

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
            console.log('✅ Money equivalents screen успешно инициализирован!');
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
            
            const user = tg.initDataUnsafe?.user;

            if (user && typeof user === 'object') {
                console.log('✅ Объект пользователя получен:', user);

                if (!user.id) {
                    throw new Error('В данных от Telegram отсутствует обязательное поле `user.id`.');
                }
                
                console.log(`👤 ID пользователя: ${user.id}. Money equivalents screen загружен.`);

            } else {
                console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: `tg.initDataUnsafe.user` имеет неверный формат или отсутствует.');
                throw new Error('Не удалось получить корректные данные пользователя от Telegram.');
            }
        } catch (error) {
            console.error('❌ Ошибка на этапе обработки данных пользователя:', error);
            showCriticalError('Ошибка обработки данных', `Произошла ошибка при обработке вашего профиля Telegram. Детали: ${error.message}`);
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
        console.log('✅ Money equivalents screen загружен в режиме браузера');
    };

    /**
     * Применение темы Telegram
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
     */
    const setupTelegramButtons = () => {
        if (!tg) return;
        
        // Скрываем кнопку "Назад" на экране эквивалентов
        tg.BackButton.hide();
        
        // Настраиваем главную кнопку (пока скрываем)
        tg.MainButton.hide();
        
        console.log('🔘 Кнопки Telegram настроены');
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
        const forwardButton = document.getElementById('forwardButton');
        
        // Обработчик кнопки вперед
        if (forwardButton) {
            forwardButton.addEventListener('click', goForward);
            console.log('🔘 Кнопка "Далее" найдена с классами:', forwardButton.className);
        } else {
            console.error('❌ Кнопка forwardButton не найдена!');
        }
        
        console.log('⚡ Обработчики событий настроены');
    };

    /**
     * Переход вперед
     */
    const goForward = () => {
        console.log('➡️ Переход к следующему экрану');
        
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('medium');
        }

        // Отправляем данные в Telegram если доступно
        if (tg?.sendData) {
            try {
                tg.sendData(JSON.stringify({ 
                    type: 'equivalents_viewed', 
                    equivalents: calculationResults?.equivalents,
                    timestamp: new Date().toISOString() 
                }));
                console.log('📤 Событие просмотра эквивалентов отправлено в Telegram');
            } catch (error) {
                console.error('❌ Ошибка отправки события:', error);
            }
        }

        // Переход на следующий экран (пока на welcome для тестирования)
        console.log('🔄 Переходим на следующий экран приложения');
        
        if (window.LoadingManager?.navigateWithTransition) {
            window.LoadingManager.navigateWithTransition('../welcome/index.html');
        } else {
            window.location.href = '../welcome/index.html';
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
     * Простые утилиты загрузки
     */
    const showLoading = () => {
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
            
            if (tg?.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('light');
            }
        }
    };

    const hideLoading = () => {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
                
                if (tg?.HapticFeedback) {
                    tg.HapticFeedback.notificationOccurred('success');
                }
            }, 600);
        }
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
    window.SmokyMoneyEquivalents = {
        isReady: () => isReady,
        getTelegram: () => tg,
        showNotification: showNotification,
        getCalculationResults: () => calculationResults,
        goForward: goForward
    };

})();