/**
 * SmokyApp - Nicotine Selection Screen JavaScript with Cosmic to Light Transition
 * Скрипт экрана выбора типа никотина с анимацией перехода от космического к светлому дизайну
 */

(function() {
    // Глобальные переменные и встроенная конфигурация
    let tg = null;
    let isReady = false;
    let selectedNicotineType = null;
    let transitionCompleted = false;

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
        },
        transition: {
            // Тайминги анимации перехода (в миллисекундах)
            starsDisappearDelay: 1000,      // Когда звезды начинают исчезать
            starsDisappearDuration: 1500,   // Длительность исчезновения звезд
            backgroundTransitionDelay: 500, // Когда фон начинает меняться
            backgroundTransitionDuration: 3000, // Длительность смены фона
            emojisAppearDelay: 2500,        // Когда смайлики появляются
            emojisAppearDuration: 1000,     // Длительность появления смайликов
            contentAppearDelay: 3500,       // Когда контент появляется
            contentAppearDuration: 800,     // Длительность появления контента
            totalDuration: 4500             // Общая длительность перехода
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
     * Анимация перехода от космического к светлому дизайну
     */
    const startCosmicToLightTransition = async () => {
        console.log('🌌➡️☀️ Запуск анимации перехода от космического к светлому дизайну...');

        try {
            const starrySky = document.getElementById('starrySky');
            const floatingEmojis = document.getElementById('floatingEmojis');
            const contentSection = document.getElementById('contentSection');
            const screenTitle = document.getElementById('screenTitle');
            const htmlElement = document.documentElement;
            const bodyElement = document.body;

            // Фаза 1: Начальное состояние (0-1с) - показываем космический фон
            console.log('🌌 Фаза 1: Начальное космическое состояние');
            
            // Фаза 2: Запуск изменения фона (0.5с)
            setTimeout(() => {
                console.log('🌈 Фаза 2: Начало изменения фона');
                htmlElement.classList.add('light-theme');
                bodyElement.classList.add('light-theme');
                
                if (tg?.HapticFeedback) {
                    tg.HapticFeedback.impactOccurred('light');
                }
            }, config.transition.backgroundTransitionDelay);

            // Фаза 3: Исчезновение звезд (1с)
            setTimeout(() => {
                console.log('⭐ Фаза 3: Исчезновение звезд');
                if (starrySky) {
                    starrySky.classList.add('disappearing');
                    // Добавляем класс исчезновения к каждой звезде
                    const stars = starrySky.querySelectorAll('.star');
                    stars.forEach(star => {
                        star.classList.add('disappearing');
                    });
                }
                
                if (tg?.HapticFeedback) {
                    tg.HapticFeedback.impactOccurred('medium');
                }
            }, config.transition.starsDisappearDelay);

            // Фаза 4: Появление смайликов (2.5с)
            setTimeout(() => {
                console.log('😊 Фаза 4: Появление парящих смайликов');
                if (floatingEmojis) {
                    floatingEmojis.classList.remove('hidden');
                    floatingEmojis.classList.add('visible');
                }
                
                if (tg?.HapticFeedback) {
                    tg.HapticFeedback.impactOccurred('medium');
                }
            }, config.transition.emojisAppearDelay);

            // Фаза 5: Изменение цвета заголовка (3с)
            setTimeout(() => {
                console.log('🎨 Фаза 5: Изменение цвета заголовка');
                if (screenTitle) {
                    screenTitle.classList.add('light-theme');
                }
            }, config.transition.emojisAppearDelay + 500);

            // Фаза 6: Появление контента (3.5с)
            setTimeout(() => {
                console.log('📝 Фаза 6: Появление контента экрана');
                if (contentSection) {
                    contentSection.classList.add('visible');
                }
                
                if (tg?.HapticFeedback) {
                    tg.HapticFeedback.notificationOccurred('success');
                }
            }, config.transition.contentAppearDelay);

            // Фаза 7: Завершение перехода (4.5с)
            setTimeout(() => {
                console.log('✅ Фаза 7: Переход завершен');
                transitionCompleted = true;
                
                // Удаляем звездное небо из DOM после завершения анимации
                if (starrySky) {
                    starrySky.remove();
                }
                
                console.log('🎉 Анимация перехода от космического к светлому дизайну завершена!');
            }, config.transition.totalDuration);

        } catch (error) {
            console.error('❌ Ошибка во время анимации перехода:', error);
            handleError(error, 'CosmicToLightTransition');
            // В случае ошибки принудительно показываем контент
            const contentSection = document.getElementById('contentSection');
            if (contentSection) {
                contentSection.classList.add('visible');
            }
            transitionCompleted = true;
        }
    };

    /**
     * Основная функция инициализации приложения
     */
    const main = async () => {
        try {
            console.log('🚀 Nicotine selection screen запускается...');
            
            // Обновляем шаг в БД при загрузке nicotine-selection экрана
            try {
                if (window.StepRouter) {
                    console.log('🔄 Обновляем шаг до 11 (nicotine-selection) через StepRouter');
                    const success = await window.StepRouter.updateStep(11);
                    if (success) {
                        console.log('✅ Шаг успешно обновлен до 11');
                    } else {
                        console.warn('⚠️ Не удалось обновить шаг до 11');
                    }
                } else {
                    console.warn('⚠️ StepRouter недоступен для обновления шага на nicotine-selection экране');
                }
            } catch (error) {
                console.error('❌ Ошибка при обновлении шага на nicotine-selection экране:', error);
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
                        
                        if (currentStep > 11) {
                            console.log('🔄 Пользователь должен быть на шаге больше 11, выполняем переход через StepRouter');
                            
                            // Принудительно выполняем навигацию к правильному шагу
                            await window.StepRouter.navigateToCurrentStep(true);
                            return;
                        }
                    }
                } else {
                    console.warn('⚠️ SmokyApp не инициализировался за 5 секунд');
                }
            }

            // Настройка UI и событий только если остаемся на nicotine-selection screen
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

            // Запускаем анимацию перехода от космического к светлому дизайну
            await startCosmicToLightTransition();

            isReady = true;
            console.log('✅ Nicotine selection screen успешно инициализирован!');
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
                
                console.log(`👤 ID пользователя: ${user.id}. Nicotine selection screen загружен.`);

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
        console.log('✅ Nicotine selection screen загружен в режиме браузера');
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
        
        // Скрываем кнопку "Назад" на экране выбора никотина
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
        const nicotineButtons = document.querySelectorAll('.nicotine-button');
        
        nicotineButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (!transitionCompleted) {
                    console.log('⚠️ Переход еще не завершен, клик игнорируется');
                    return;
                }
                
                const nicotineType = button.getAttribute('data-type');
                handleNicotineChoice(nicotineType, button);
            });
            
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!transitionCompleted) {
                        console.log('⚠️ Переход еще не завершен, клик игнорируется');
                        return;
                    }
                    
                    const nicotineType = button.getAttribute('data-type');
                    handleNicotineChoice(nicotineType, button);
                }
            });
        });
        
        console.log('⚡ Обработчики событий для кнопок выбора никотина настроены');
    };

    /**
     * Обработчик выбора типа никотина
     */
    const handleNicotineChoice = (nicotineType, buttonElement) => {
        console.log(`🚀 handleNicotineChoice вызван с выбором: ${nicotineType}`);
        
        // Предотвращаем повторные клики
        if (selectedNicotineType) return;
        
        selectedNicotineType = nicotineType;
        
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('medium');
        }
        
        // Визуально выделяем выбранную кнопку
        highlightSelectedButton(buttonElement);
        
        // Переходим к следующему экрану после выбора
        console.log(`🔄 Выполняем переход с выбранным типом никотина: ${nicotineType}`);
        setTimeout(() => {
            console.log('⏰ Таймер сработал, вызываем navigateToNextScreen...');
            navigateToNextScreen(nicotineType);
        }, 800); // Задержка чтобы пользователь увидел выделение
    };

    /**
     * Выделение выбранной кнопки
     */
    const highlightSelectedButton = (selectedButton) => {
        const allButtons = document.querySelectorAll('.nicotine-button');
        
        // Убираем выделение с всех кнопок
        allButtons.forEach(button => {
            button.classList.remove('selected');
        });
        
        // Выделяем выбранную кнопку
        selectedButton.classList.add('selected');
        
        const nicotineType = selectedButton.getAttribute('data-type');
        console.log(`✨ Кнопка с типом никотина "${nicotineType}" выделена`);
    };

    /**
     * Навигация к следующему экрану
     */
    const navigateToNextScreen = async (nicotineType) => {
        console.log(`🚀 navigateToNextScreen вызван с выбранным типом никотина: ${nicotineType}`);
        
        if (tg?.sendData) {
            try {
                tg.sendData(JSON.stringify({ 
                    type: 'nicotine_selection_completed', 
                    nicotine_type: nicotineType,
                    timestamp: new Date().toISOString() 
                }));
                console.log('📤 Данные отправлены в Telegram');
            } catch (error) {
                console.error('❌ Ошибка отправки данных:', error);
            }
        }
        
        // Сохраняем выбранный тип никотина для следующего экрана
        if (typeof(Storage) !== "undefined") {
            localStorage.setItem('selectedNicotineType', nicotineType);
            console.log(`💾 Тип никотина "${nicotineType}" сохранен в localStorage`);
        }
        
        // Переход на следующий экран (будет создан позже)
        console.log('🔄 Переходим на следующий экран приложения');
        // Временно переходим на welcome для тестирования
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
    window.SmokyNicotineSelection = {
        isReady: () => isReady,
        getTelegram: () => tg,
        showNotification: showNotification,
        getSelectedNicotineType: () => selectedNicotineType,
        isTransitionCompleted: () => transitionCompleted,
    };

})();