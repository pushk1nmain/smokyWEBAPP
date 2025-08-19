/**
 * SmokyApp - Health Realization Screen JavaScript
 * Скрипт экрана осознания ценности здоровья для интеграции с Telegram WebApp API
 */

(function() {
    // Глобальные переменные и встроенная конфигурация
    let tg = null;
    let isReady = false;
    let userName = null;

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
     * Получение telegram_id пользователя
     */
    const getUserTelegramId = () => {
        // Пытаемся получить ID из Telegram
        if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id) {
            return tg.initDataUnsafe.user.id;
        }
        
        // Fallback для режима разработки
        if (config.development.enableBrowserTestMode) {
            return config.development.testUser.id;
        }
        
        return null;
    };

    /**
     * Загрузка имени пользователя по API из БД
     */
    const loadUserName = async () => {
        try {
            console.log('🔍 Загружаем имя пользователя из БД...');

            // Получаем telegram_id пользователя
            const telegramId = getUserTelegramId();
            if (!telegramId) {
                console.warn('⚠️ Не удалось получить telegram_id, используем fallback');
                userName = 'Друг';
                return userName;
            }

            console.log(`👤 Используем telegram_id: ${telegramId}`);

            // Основной запрос к API для получения имени из БД
            if (window.apiClient && typeof window.apiClient.get === 'function') {
                try {
                    const endpoint = `/user/${telegramId}`;
                    console.log(`🔗 API Client запрос: ${endpoint}`);
                    const response = await window.apiClient.get(endpoint);
                    
                    if (response && response.name) {
                        userName = response.name;
                        console.log(`✅ Имя пользователя получено из БД через API Client: ${userName}`);
                        return userName;
                    }
                } catch (apiError) {
                    console.error('❌ Ошибка API Client запроса к БД:', apiError);
                }
            }

            // Fallback: прямой fetch запрос к API
            try {
                const apiUrl = `${config.api.baseUrl}/user/${telegramId}`;
                console.log(`🌐 Выполняем прямой fetch запрос: ${apiUrl}`);
                
                const headers = {
                    'Content-Type': 'application/json'
                };

                // Добавляем заголовок авторизации согласно документации
                if (tg && tg.initData) {
                    headers['X-Telegram-WebApp-Data'] = tg.initData;
                    console.log('🔐 Добавлен заголовок X-Telegram-WebApp-Data для авторизации');
                }
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers
                });

                if (response.ok) {
                    const userData = await response.json();
                    console.log('📊 Полученные данные пользователя:', userData);
                    
                    if (userData && userData.name) {
                        userName = userData.name;
                        console.log(`✅ Имя пользователя получено через fetch из БД: ${userName}`);
                        return userName;
                    } else {
                        console.warn('⚠️ В ответе API отсутствует поле name');
                    }
                } else {
                    console.error(`❌ API вернул ошибку: ${response.status} ${response.statusText}`);
                    const errorText = await response.text();
                    console.error('❌ Текст ошибки:', errorText);
                }
            } catch (fetchError) {
                console.error('❌ Ошибка fetch запроса:', fetchError);
            }

            // Второй fallback: получаем имя из Telegram (если API недоступно)
            if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
                const telegramUser = tg.initDataUnsafe.user;
                userName = telegramUser.first_name || telegramUser.username || 'Друг';
                console.log(`⚠️ Fallback: Имя получено из Telegram: ${userName}`);
                return userName;
            }

            // Третий fallback: тестовый пользователь в режиме разработки
            if (config.development.enableBrowserTestMode) {
                userName = config.development.testUser.first_name;
                console.log(`⚠️ Fallback: Имя тестового пользователя: ${userName}`);
                return userName;
            }

            // Последний fallback
            userName = 'Друг';
            console.warn('⚠️ Все способы получения имени не сработали, используем финальный fallback');
            return userName;

        } catch (error) {
            console.error('❌ Критическая ошибка при загрузке имени пользователя:', error);
            userName = 'Друг';
            return userName;
        }
    };

    /**
     * Обновление заголовка с именем пользователя
     */
    const updateTitleWithUserName = (name) => {
        const userNameElement = document.getElementById('userName');
        if (userNameElement && name) {
            userNameElement.textContent = name;
            console.log(`✨ Заголовок обновлен с именем: ${name}`);
        }
    };

    /**
     * Основная функция инициализации приложения
     */
    const main = async () => {
        try {
            console.log('🚀 Health realization screen запускается...');
            
            // Обновляем шаг в БД при загрузке health-realization экрана
            try {
                if (window.StepRouter) {
                    console.log('🔄 Обновляем шаг до 10 (health-realization) через StepRouter');
                    const success = await window.StepRouter.updateStep(10);
                    if (success) {
                        console.log('✅ Шаг успешно обновлен до 10');
                    } else {
                        console.warn('⚠️ Не удалось обновить шаг до 10');
                    }
                } else {
                    console.warn('⚠️ StepRouter недоступен для обновления шага на health-realization экране');
                }
            } catch (error) {
                console.error('❌ Ошибка при обновлении шага на health-realization экране:', error);
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
                        
                        if (currentStep > 10) {
                            console.log('🔄 Пользователь должен быть на шаге больше 10, выполняем переход через StepRouter');
                            
                            // Принудительно выполняем навигацию к правильному шагу
                            await window.StepRouter.navigateToCurrentStep(true);
                            return;
                        }
                    }
                } else {
                    console.warn('⚠️ SmokyApp не инициализировался за 5 секунд');
                }
            }

            // Настройка UI и событий только если остаемся на health-realization screen
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

            // Загружаем имя пользователя и обновляем заголовок
            const name = await loadUserName();
            updateTitleWithUserName(name);

            isReady = true;
            console.log('✅ Health realization screen успешно инициализирован!');
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
                
                console.log(`👤 ID пользователя: ${user.id}. Health realization screen загружен.`);

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
        console.log('✅ Health realization screen загружен в режиме браузера');
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
        const continueButton = document.getElementById('continueButton');

        if (continueButton) {
            continueButton.addEventListener('click', () => handleContinueClick());
            continueButton.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && handleContinueClick());
            console.log('⚡ Обработчик кнопки "Продолжить" подключен');
        } else {
            console.error('❌ Кнопка continueButton не найдена');
        }

        console.log('⚡ Обработчики событий настроены');
    };

    /**
     * Обработчик нажатия кнопки "Продолжить"
     */
    const handleContinueClick = () => {
        console.log(`🚀 handleContinueClick вызван`);
        
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('medium');
        }
        
        // Бесшовный переход - переходим к следующему экрану
        console.log(`🔄 Выполняем переход к следующему экрану`);
        setTimeout(() => {
            console.log('⏰ Таймер сработал, вызываем navigateToNextScreen...');
            navigateToNextScreen();
        }, 300); // Небольшая задержка для визуального фидбека
    };

    /**
     * Навигация к следующему экрану
     */
    const navigateToNextScreen = async () => {
        console.log(`🚀 navigateToNextScreen вызван`);
        
        if (tg?.sendData) {
            try {
                tg.sendData(JSON.stringify({ 
                    type: 'health_realization_completed',
                    user_name: userName,
                    timestamp: new Date().toISOString() 
                }));
                console.log('📤 Данные отправлены в Telegram');
            } catch (error) {
                console.error('❌ Ошибка отправки данных:', error);
            }
        }
        
        // Переход на следующий экран (пока на welcome для тестирования)
        console.log('🔄 Переходим на следующий экран приложения');
        window.location.href = '../welcome/index.html';
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
    window.SmokyHealthRealization = {
        isReady: () => isReady,
        getTelegram: () => tg,
        showNotification: showNotification,
        getUserName: () => userName,
    };

})();