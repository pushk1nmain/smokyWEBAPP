/**
 * SmokyApp - Recognition Quiz Screen Script
 * Скрипт экрана "Узнали себя?" с чекбоксами
 */

(function() {
    // Глобальные переменные
    let tg = null;
    let isReady = false;
    let selectedItems = new Set();

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
     * Основная функция инициализации приложения
     */
    const main = async () => {
        try {
            console.log('🚀 Recognition quiz screen запускается...');

            // Обновляем шаг до 19 при загрузке экрана recognition-quiz
            if (window.StepRouter) {
                console.log('🔄 Обновляем шаг до 19 при загрузке recognition-quiz');
                await window.StepRouter.updateStep(19);
                console.log('✅ Шаг обновлен до 19');
            }
            console.log('📍 recognition-quiz экран загружен (шаг 19)');

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
                        
                        if (currentStep > 19) {
                            console.log('🔄 Пользователь должен быть на шаге больше 19, выполняем переход через StepRouter');
                            await window.StepRouter.navigateToCurrentStep(true);
                            return;
                        }
                    }
                } else {
                    console.warn('⚠️ SmokyApp не инициализировался за 5 секунд');
                }
            }
            
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
            console.log('✅ Recognition quiz screen успешно инициализирован!');
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
                
                console.log(`👤 ID пользователя: ${user.id}. Recognition quiz screen загружен.`);

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
        console.log('✅ Recognition quiz screen загружен в режиме браузера');
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
        
        // Скрываем кнопку "Назад" на экране
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
        const checkboxItems = document.querySelectorAll('.checkbox-item');
        
        // Обработчик кнопки продолжить
        if (continueButton) {
            continueButton.addEventListener('click', goForward);
            console.log('🔘 Кнопка "Да, это про меня" найдена');
        } else {
            console.error('❌ Кнопка continueButton не найдена!');
        }

        // Обработчики чекбоксов - слушаем изменения чекбоксов напрямую
        checkboxItems.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.addEventListener('change', handleCheckboxChange);
                console.log(`⚙️ Обработчик установлен для: ${checkbox.id}`);
            }
        });
        
        console.log('⚡ Обработчики событий настроены');
    };

    /**
     * Обработка изменения чекбокса
     */
    const handleCheckboxChange = (event) => {
        const checkbox = event.target;
        const checkboxId = checkbox.id;
        
        console.log(`🔄 Изменение чекбокса ${checkboxId}: ${checkbox.checked}`);
        
        // Обновляем набор выбранных элементов
        if (checkbox.checked) {
            selectedItems.add(checkboxId);
            console.log(`✅ Выбран пункт: ${checkboxId}`);
        } else {
            selectedItems.delete(checkboxId);
            console.log(`❌ Снят выбор с пункта: ${checkboxId}`);
        }

        // Haptic feedback
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }

        // Обновляем состояние кнопки
        updateButtonState();

        console.log('📊 Выбранные пункты:', Array.from(selectedItems));
    };

    /**
     * Обновление состояния кнопки в зависимости от выбранных элементов
     */
    const updateButtonState = () => {
        const continueButton = document.getElementById('continueButton');
        if (!continueButton) return;

        if (selectedItems.size > 0) {
            // Активируем кнопку
            continueButton.classList.remove('disabled');
            continueButton.disabled = false;
            console.log('🟢 Кнопка активирована');
        } else {
            // Деактивируем кнопку
            continueButton.classList.add('disabled');
            continueButton.disabled = true;
            console.log('🔘 Кнопка деактивирована');
        }
    };

    /**
     * Переход вперед
     */
    const goForward = async () => {
        // Проверяем, что выбран минимум 1 пункт
        if (selectedItems.size === 0) {
            console.warn('⚠️ Попытка перехода без выбора пунктов');
            if (tg?.showAlert) {
                tg.showAlert('Пожалуйста, выберите хотя бы один пункт');
            }
            return;
        }

        console.log('➡️ Переход к следующему экрану');
        
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('medium');
        }

        // Сохраняем выбранные пункты
        const recognitionData = {
            selectedItems: Array.from(selectedItems),
            selectedCount: selectedItems.size,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('recognitionQuizResult', JSON.stringify(recognitionData));
        localStorage.setItem('selectedItemsCount', selectedItems.size.toString());
        console.log('💾 Результаты опроса сохранены:', recognitionData);

        // Отправляем данные в Telegram если доступно
        if (tg?.sendData) {
            try {
                tg.sendData(JSON.stringify({ 
                    type: 'recognition_quiz_completed', 
                    data: recognitionData,
                    timestamp: new Date().toISOString() 
                }));
                console.log('📤 Результаты опроса отправлены в Telegram');
            } catch (error) {
                console.error('❌ Ошибка отправки результатов:', error);
            }
        }

        // Используем StepRouter для корректного перехода к следующему шагу
        console.log('🔄 Переходим к следующему экрану через StepRouter');
        
        try {
            if (window.StepRouter) {
                const success = await window.StepRouter.goToNextStep();
                if (success) {
                    console.log('✅ Переход выполнен через StepRouter');
                    return; // Выходим, StepRouter сам выполнил переход
                } else {
                    console.warn('⚠️ StepRouter не смог выполнить переход, используем fallback');
                }
            } else {
                console.warn('⚠️ StepRouter недоступен');
            }
        } catch (error) {
            console.error('❌ Ошибка при переходе через StepRouter:', error);
        }
        
        // Fallback: прямой переход на transformation-lessons (20-й шаг)
        console.log('🔄 Fallback: прямой переход на transformation-lessons');
        if (window.LoadingManager?.navigateWithTransition) {
            window.LoadingManager.navigateWithTransition('../transformation-lessons/index.html');
        } else {
            window.location.href = '../transformation-lessons/index.html';
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
    window.SmokyRecognitionQuiz = {
        isReady: () => isReady,
        getTelegram: () => tg,
        showNotification: showNotification,
        goForward: goForward,
        getSelectedItems: () => Array.from(selectedItems)
    };

})();