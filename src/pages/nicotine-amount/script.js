/**
 * SmokyApp - Nicotine Amount Screen JavaScript
 * Скрипт экрана ввода количества потребления никотина с динамической генерацией контента
 */

(function() {
    // Глобальные переменные
    let tg = null;
    let isReady = false;
    let selectedNicotineType = null;
    let currentAmount = null;

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

    // Конфигурация типов никотина
    const nicotineConfig = {
        cigarettes: {
            title: 'Сколько сигарет в день вы выкуриваете?',
            description: 'Это поможет лучше понять ваши привычки',
            placeholder: 'Количество сигарет',
            icon: '🚬',
            unit: 'штук',
            unitShort: 'шт.'
        },
        vape: {
            title: 'Сколько банок в неделю вы используете?',
            description: 'Укажите примерное количество банок жидкости',
            placeholder: 'Количество банок',
            icon: '💨',
            unit: 'банок',
            unitShort: 'бан.'
        },
        iqos: {
            title: 'Сколько стиков в день вы выкуриваете?',
            description: 'Укажите среднее количество стиков',
            placeholder: 'Количество стиков',
            icon: '🔥',
            unit: 'стиков',
            unitShort: 'шт.'
        },
        hookah: {
            title: 'Сколько сеансов кальяна в неделю?',
            description: 'Укажите количество сеансов',
            placeholder: 'Количество сеансов',
            icon: '🫧',
            unit: 'сеансов',
            unitShort: 'сес.'
        },
        snus: {
            title: 'Сколько банок снюса в неделю?',
            description: 'Укажите примерное количество банок',
            placeholder: 'Количество банок',
            icon: '🏒',
            unit: 'банок',
            unitShort: 'бан.'
        }
    };

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
     * Динамическое обновление контента в зависимости от типа никотина
     */
    const updateContentByNicotineType = () => {
        console.log('🔄 Обновляем контент для типа никотина:', selectedNicotineType);

        const config = nicotineConfig[selectedNicotineType];
        if (!config) {
            console.error('❌ Неизвестный тип никотина:', selectedNicotineType);
            return;
        }

        // Обновляем заголовок
        const titleElement = document.getElementById('dynamicTitle');
        if (titleElement) {
            titleElement.textContent = config.title;
        }

        // Обновляем описание
        const descriptionElement = document.getElementById('dynamicDescription');
        if (descriptionElement) {
            descriptionElement.textContent = config.description;
        }

        // Обновляем placeholder инпута
        const inputElement = document.getElementById('amountInput');
        if (inputElement) {
            inputElement.placeholder = config.placeholder;
        }

        // Обновляем иконку
        const iconElement = document.getElementById('nicotineIcon');
        if (iconElement) {
            iconElement.textContent = config.icon;
        }

        console.log('✅ Контент успешно обновлен:', {
            title: config.title,
            icon: config.icon,
            placeholder: config.placeholder
        });
    };

    /**
     * Основная функция инициализации приложения
     */
    const main = async () => {
        try {
            console.log('🚀 Nicotine amount screen запускается...');
            
            // Получаем выбранный тип никотина из localStorage
            selectedNicotineType = localStorage.getItem('selectedNicotineType');
            
            if (!selectedNicotineType) {
                console.warn('⚠️ Тип никотина не найден в localStorage, перенаправляем на экран выбора');
                window.location.href = '../nicotine-selection/index.html';
                return;
            }

            console.log('📍 Выбранный тип никотина:', selectedNicotineType);

            // Обновляем шаг в БД при загрузке nicotine-amount экрана
            try {
                if (window.StepRouter) {
                    console.log('🔄 Обновляем шаг до 12 (nicotine-amount) через StepRouter');
                    const success = await window.StepRouter.updateStep(12);
                    if (success) {
                        console.log('✅ Шаг успешно обновлен до 12');
                    } else {
                        console.warn('⚠️ Не удалось обновить шаг до 12');
                    }
                } else {
                    console.warn('⚠️ StepRouter недоступен для обновления шага на nicotine-amount экране');
                }
            } catch (error) {
                console.error('❌ Ошибка при обновлении шага на nicotine-amount экране:', error);
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
                        
                        if (currentStep > 12) {
                            console.log('🔄 Пользователь должен быть на шаге больше 12, выполняем переход через StepRouter');
                            await window.StepRouter.navigateToCurrentStep(true);
                            return;
                        }
                    }
                } else {
                    console.warn('⚠️ SmokyApp не инициализировался за 5 секунд');
                }
            }

            // Настройка UI и событий только если остаемся на nicotine-amount screen
            updateContentByNicotineType();
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
            console.log('✅ Nicotine amount screen успешно инициализирован!');
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
                
                console.log(`👤 ID пользователя: ${user.id}. Nicotine amount screen загружен.`);

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
        console.log('✅ Nicotine amount screen загружен в режиме браузера');
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
        
        // Показываем кнопку "Назад" на экране количества никотина
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            goBack();
        });
        
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
        const amountInput = document.getElementById('amountInput');
        const backButton = document.getElementById('backButton');
        const forwardButton = document.getElementById('forwardButton');
        
        // Обработчик ввода количества
        if (amountInput) {
            amountInput.addEventListener('input', (e) => {
                let value = e.target.value;
                
                // Убираем все нечисловые символы
                value = value.replace(/[^0-9]/g, '');
                
                // Обновляем значение в поле ввода
                e.target.value = value;
                
                currentAmount = value ? parseInt(value) : null;
                
                // Обновляем состояние кнопки вперед
                updateForwardButtonState();
                
                console.log('📊 Введено количество:', currentAmount);
            });

            // Обработчик вставки из буфера обмена
            amountInput.addEventListener('paste', (e) => {
                e.preventDefault();
                let paste = (e.clipboardData || window.clipboardData).getData('text');
                
                // Убираем все нечисловые символы
                paste = paste.replace(/[^0-9]/g, '');
                
                if (paste) {
                    amountInput.value = paste;
                    
                    // Имитируем событие input для обновления состояния
                    amountInput.dispatchEvent(new Event('input'));
                }
            });

            // Обработчик нажатия клавиш для блокировки нечисловых символов
            amountInput.addEventListener('keydown', (e) => {
                // Разрешаем: цифры, Backspace, Delete, Tab, Escape, Enter, стрелки
                if ([46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
                    // Разрешаем Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                    (e.keyCode === 65 && e.ctrlKey === true) ||
                    (e.keyCode === 67 && e.ctrlKey === true) ||
                    (e.keyCode === 86 && e.ctrlKey === true) ||
                    (e.keyCode === 88 && e.ctrlKey === true) ||
                    // Разрешаем стрелки
                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                    
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (currentAmount && currentAmount >= 1 && currentAmount <= 60) {
                            goForward();
                        }
                    }
                    return;
                }
                
                // Блокируем все кроме цифр
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                }
            });
        }
        
        // Обработчик кнопки назад
        if (backButton) {
            backButton.addEventListener('click', goBack);
        }
        
        // Обработчик кнопки вперед
        if (forwardButton) {
            forwardButton.addEventListener('click', () => {
                if (currentAmount && currentAmount > 0) {
                    goForward();
                }
            });
        }
        
        console.log('⚡ Обработчики событий настроены');
    };

    /**
     * Обновление состояния кнопки "Вперед"
     */
    const updateForwardButtonState = () => {
        const forwardButton = document.getElementById('forwardButton');
        if (!forwardButton) return;

        const isValid = currentAmount && currentAmount >= 1 && currentAmount <= 60;
        
        if (isValid) {
            forwardButton.classList.add('active');
            forwardButton.removeAttribute('disabled');
        } else {
            forwardButton.classList.remove('active');
            forwardButton.setAttribute('disabled', 'true');
        }
    };

    /**
     * Переход назад
     */
    const goBack = () => {
        console.log('⬅️ Переход назад к экрану выбора никотина');
        
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
        
        // Используем LoadingManager если доступен
        if (window.LoadingManager?.navigateWithTransition) {
            window.LoadingManager.navigateWithTransition('../nicotine-selection/index.html');
        } else {
            window.location.href = '../nicotine-selection/index.html';
        }
    };

    /**
     * Показ модального окна с ошибкой валидации
     */
    const showAmountErrorModal = () => {
        const modal = document.getElementById('amountErrorModal');
        const okButton = document.getElementById('amountErrorOkButton');
        
        // Показываем модальное окно
        modal.classList.remove('hidden');
        
        // Haptic feedback при показе модального окна
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('error');
        }
        
        // Обработчик кнопки "OK"
        const handleOkClick = () => {
            modal.classList.add('hidden');
            
            // Haptic feedback для кнопки OK
            if (tg?.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('light');
            }
            
            // Фокус на поле ввода
            const amountInput = document.getElementById('amountInput');
            if (amountInput) {
                amountInput.focus();
            }
            
            // Очищаем обработчик
            okButton.removeEventListener('click', handleOkClick);
        };
        
        okButton.addEventListener('click', handleOkClick);
        
        // Обработчик клика по overlay для закрытия модального окна
        const modalOverlay = document.getElementById('amountErrorOverlay');
        const handleOverlayClick = () => {
            handleOkClick();
            modalOverlay.removeEventListener('click', handleOverlayClick);
        };
        modalOverlay.addEventListener('click', handleOverlayClick);
    };

    /**
     * Переход вперед
     */
    const goForward = () => {
        if (!currentAmount || currentAmount < 1 || currentAmount > 60) {
            showAmountErrorModal();
            return;
        }

        console.log('➡️ Переход вперед с количеством:', currentAmount);
        
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('medium');
        }

        // Сохраняем количество потребления
        if (typeof(Storage) !== "undefined") {
            localStorage.setItem('nicotineAmount', currentAmount);
            localStorage.setItem('nicotineUnit', nicotineConfig[selectedNicotineType]?.unit || 'единиц');
            console.log(`💾 Количество "${currentAmount}" сохранено в localStorage`);
        }

        // Отправляем данные в Telegram если доступно
        if (tg?.sendData) {
            try {
                tg.sendData(JSON.stringify({ 
                    type: 'nicotine_amount_completed', 
                    nicotine_type: selectedNicotineType,
                    amount: currentAmount,
                    unit: nicotineConfig[selectedNicotineType]?.unit,
                    timestamp: new Date().toISOString() 
                }));
                console.log('📤 Данные отправлены в Telegram');
            } catch (error) {
                console.error('❌ Ошибка отправки данных:', error);
            }
        }

        // Переход на следующий экран - ввод стоимости никотина
        console.log('🔄 Переходим на экран ввода стоимости никотина');
        
        // Используем LoadingManager если доступен для плавного перехода
        if (window.LoadingManager?.navigateWithTransition) {
            window.LoadingManager.navigateWithTransition('../nicotine-cost/index.html');
        } else {
            window.location.href = '../nicotine-cost/index.html';
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
    window.SmokyNicotineAmount = {
        isReady: () => isReady,
        getTelegram: () => tg,
        showNotification: showNotification,
        getSelectedNicotineType: () => selectedNicotineType,
        getCurrentAmount: () => currentAmount,
        goBack: goBack,
        goForward: goForward
    };

})();