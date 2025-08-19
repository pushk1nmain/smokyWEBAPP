/**
 * SmokyApp - Charger Question Screen JavaScript
 * Скрипт экрана вопроса о зарядке для интеграции с Telegram WebApp API
 */

(function() {
    // Глобальные переменные и встроенная конфигурация
    let tg = null;
    let isReady = false;
    let userChoice = null;

    // --- Telegram WebApp Keyboard Handling ---
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
            console.log('🚀 Charger question screen запускается...');
            
            // Обновляем шаг в БД при загрузке charger-question экрана
            try {
                if (window.StepRouter) {
                    console.log('🔄 Обновляем шаг до 8 (charger-question) через StepRouter');
                    const success = await window.StepRouter.updateStep(8);
                    if (success) {
                        console.log('✅ Шаг успешно обновлен до 8');
                    } else {
                        console.warn('⚠️ Не удалось обновить шаг до 8');
                    }
                } else {
                    console.warn('⚠️ StepRouter недоступен для обновления шага на charger-question экране');
                }
            } catch (error) {
                console.error('❌ Ошибка при обновлении шага на charger-question экране:', error);
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
                        
                        if (currentStep > 8) {
                            console.log('🔄 Пользователь должен быть на шаге больше 8, выполняем переход через StepRouter');
                            
                            // Принудительно выполняем навигацию к правильному шагу
                            await window.StepRouter.navigateToCurrentStep(true);
                            return;
                        }
                    }
                } else {
                    console.warn('⚠️ SmokyApp не инициализировался за 5 секунд');
                }
            }

            // Настройка UI и событий только если остаемся на charger-question screen
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
            console.log('✅ Charger question screen успешно инициализирован!');
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
                
                console.log(`👤 ID пользователя: ${user.id}. Charger question screen загружен.`);

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
        console.log('✅ Charger question screen загружен в режиме браузера');
    };

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
        
        // Скрываем кнопку "Назад" на экране истории
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
        const smokingButton = document.getElementById('smokingButton');
        const quittingButton = document.getElementById('quittingButton');

        if (smokingButton) {
            smokingButton.addEventListener('click', () => handleChoiceClick('smoking'));
            smokingButton.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && handleChoiceClick('smoking'));
            console.log('⚡ Обработчик кнопки "Курю" подключен');
        } else {
            console.error('❌ Кнопка smokingButton не найдена');
        }

        if (quittingButton) {
            quittingButton.addEventListener('click', () => handleChoiceClick('quitting'));
            quittingButton.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && handleChoiceClick('quitting'));
            console.log('⚡ Обработчик кнопки "Хочу бросить" подключен');
        } else {
            console.error('❌ Кнопка quittingButton не найдена');
        }

        console.log('⚡ Обработчики событий настроены');
    };

    /**
     * Обработчик нажатия кнопки выбора
     */
    const handleChoiceClick = (choice) => {
        console.log(`🚀 handleChoiceClick вызван с выбором: ${choice}`);
        
        // Предотвращаем повторные клики
        if (userChoice) return;
        
        userChoice = choice;
        
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('medium');
        }
        
        // Визуально выделяем выбранную кнопку
        highlightSelectedButton(choice);
        
        // Бесшовный переход - переходим к следующему экрану сразу после выбора
        console.log(`🔄 Выполняем бесшовный переход с выбором: ${choice}`);
        setTimeout(() => {
            console.log('⏰ Таймер сработал, вызываем navigateBasedOnChoice...');
            navigateBasedOnChoice(choice);
        }, 500); // Небольшая задержка чтобы пользователь увидел выделение кнопки
    };

    /**
     * Выделение выбранной кнопки
     */
    const highlightSelectedButton = (choice) => {
        const smokingButton = document.getElementById('smokingButton');
        const quittingButton = document.getElementById('quittingButton');
        
        // Убираем выделение с обеих кнопок
        smokingButton.classList.remove('selected');
        quittingButton.classList.remove('selected');
        
        // Выделяем выбранную кнопку
        if (choice === 'smoking') {
            smokingButton.classList.add('selected');
        } else if (choice === 'quitting') {
            quittingButton.classList.add('selected');
        }
        
        console.log(`✨ Кнопка "${choice}" выделена`);
    };

    /**
     * Навигация в зависимости от выбора пользователя
     */
    const navigateBasedOnChoice = async (choice) => {
        console.log(`🚀 navigateBasedOnChoice вызван с выбором: ${choice}`);
        
        if (tg?.sendData) {
            try {
                tg.sendData(JSON.stringify({ 
                    type: 'charger_question_completed', 
                    choice: choice,
                    timestamp: new Date().toISOString() 
                }));
                console.log('📤 Данные отправлены в Telegram');
            } catch (error) {
                console.error('❌ Ошибка отправки данных:', error);
            }
        }
        
        // В зависимости от выбора переходим на разные экраны
        if (choice === 'smoking') {
            console.log('🔄 Пользователь курит - переходим на экран для курящих');
            // Пока что переходим на welcome для тестирования
            window.location.href = '../welcome/index.html';
        } else if (choice === 'quitting') {
            console.log('🔄 Пользователь хочет бросить - переходим на экран для желающих бросить');
            // Пока что переходим на name-input для тестирования
            window.location.href = '../name-input/index.html';
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
    window.SmokyChargerQuestion = {
        isReady: () => isReady,
        getTelegram: () => tg,
        showNotification: showNotification,
        getUserChoice: () => userChoice,
    };

})();