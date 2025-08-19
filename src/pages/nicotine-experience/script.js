/**
 * SmokyApp - Nicotine Experience Screen JavaScript
 * Скрипт экрана ввода стажа потребления никотина с динамической генерацией контента
 */

(function() {
    // Глобальные переменные
    let tg = null;
    let isReady = false;
    let selectedNicotineType = null;
    let currentExperience = null;

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

    // Конфигурация стажа по типам никотина
    const nicotineExperienceConfig = {
        cigarettes: {
            title: 'Ваш стаж курения в годах?',
            description: 'Укажите сколько лет вы курите',
            placeholder: 'Лет курения',
            icon: '🚬',
            action: 'курения'
        },
        vape: {
            title: 'Ваш стаж парения в годах?',
            description: 'Укажите сколько лет вы паритесь',
            placeholder: 'Лет парения',
            icon: '💨',
            action: 'парения'
        },
        iqos: {
            title: 'Ваш стаж использования IQOS в годах?',
            description: 'Укажите сколько лет используете IQOS',
            placeholder: 'Лет использования',
            icon: '🔥',
            action: 'использования IQOS'
        },
        hookah: {
            title: 'Ваш стаж курения кальяна в годах?',
            description: 'Укажите сколько лет курите кальян',
            placeholder: 'Лет курения',
            icon: '🫧',
            action: 'курения кальяна'
        },
        snus: {
            title: 'Ваш стаж использования снюса в годах?',
            description: 'Укажите сколько лет используете снюс',
            placeholder: 'Лет использования',
            icon: '🏒',
            action: 'использования снюса'
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
        console.log('🔄 Обновляем контент для стажа типа никотина:', selectedNicotineType);

        const config = nicotineExperienceConfig[selectedNicotineType];
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
        const inputElement = document.getElementById('experienceInput');
        if (inputElement) {
            inputElement.placeholder = config.placeholder;
        }

        // Обновляем иконку
        const iconElement = document.getElementById('nicotineIcon');
        if (iconElement) {
            iconElement.textContent = config.icon;
        }

        console.log('✅ Контент стажа успешно обновлен:', {
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
            console.log('🚀 Nicotine experience screen запускается...');
            
            // Получаем выбранный тип никотина из localStorage
            selectedNicotineType = localStorage.getItem('selectedNicotineType');
            
            if (!selectedNicotineType) {
                console.warn('⚠️ Тип никотина не найден в localStorage, перенаправляем на экран выбора');
                window.location.href = '../nicotine-selection/index.html';
                return;
            }

            console.log('📍 Выбранный тип никотина:', selectedNicotineType);

            // Обновляем шаг в БД при загрузке nicotine-experience экрана
            try {
                if (window.StepRouter) {
                    console.log('🔄 Обновляем шаг до 14 (nicotine-experience) через StepRouter');
                    const success = await window.StepRouter.updateStep(14);
                    if (success) {
                        console.log('✅ Шаг успешно обновлен до 14');
                    } else {
                        console.warn('⚠️ Не удалось обновить шаг до 14');
                    }
                } else {
                    console.warn('⚠️ StepRouter недоступен для обновления шага на nicotine-experience экране');
                }
            } catch (error) {
                console.error('❌ Ошибка при обновлении шага на nicotine-experience экране:', error);
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
                        
                        if (currentStep > 14) {
                            console.log('🔄 Пользователь должен быть на шаге больше 14, выполняем переход через StepRouter');
                            await window.StepRouter.navigateToCurrentStep(true);
                            return;
                        }
                    }
                } else {
                    console.warn('⚠️ SmokyApp не инициализировался за 5 секунд');
                }
            }

            // Настройка UI и событий только если остаемся на nicotine-experience screen
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
            console.log('✅ Nicotine experience screen успешно инициализирован!');
            hideLoading();

            // Устанавливаем фокус на input поле после инициализации
            setTimeout(() => {
                const experienceInput = document.getElementById('experienceInput');
                if (experienceInput) {
                    experienceInput.focus();
                    console.log('🎯 Автофокус установлен на поле ввода стажа');
                }
            }, 500);

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
                
                console.log(`👤 ID пользователя: ${user.id}. Nicotine experience screen загружен.`);

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
        console.log('✅ Nicotine experience screen загружен в режиме браузера');
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
        
        // Показываем кнопку "Назад" на экране стажа никотина
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
        const experienceInput = document.getElementById('experienceInput');
        const backButton = document.getElementById('backButton');
        const forwardButton = document.getElementById('forwardButton');
        
        // Обработчик ввода стажа
        if (experienceInput) {
            experienceInput.addEventListener('input', (e) => {
                let value = e.target.value;
                
                // Убираем все нечисловые символы
                value = value.replace(/[^0-9]/g, '');
                
                // Обновляем значение в поле ввода
                e.target.value = value;
                
                currentExperience = value ? parseInt(value) : null;
                
                // Обновляем состояние кнопки вперед
                updateForwardButtonState();
                
                console.log('⏰ Введен стаж:', currentExperience);
            });

            // Обработчик вставки из буфера обмена
            experienceInput.addEventListener('paste', (e) => {
                e.preventDefault();
                let paste = (e.clipboardData || window.clipboardData).getData('text');
                
                // Убираем все нечисловые символы
                paste = paste.replace(/[^0-9]/g, '');
                
                if (paste) {
                    experienceInput.value = paste;
                    
                    // Имитируем событие input для обновления состояния
                    experienceInput.dispatchEvent(new Event('input'));
                }
            });

            // Обработчик нажатия клавиш для блокировки нечисловых символов
            experienceInput.addEventListener('keydown', (e) => {
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
                        if (currentExperience && currentExperience >= 1 && currentExperience <= 80) {
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
                if (currentExperience && currentExperience >= 1 && currentExperience <= 80) {
                    goForward();
                }
            });
        }
        
        console.log('⚡ Обработчики событий для стажа настроены');
    };

    /**
     * Обновление состояния кнопки "Вперед"
     */
    const updateForwardButtonState = () => {
        const forwardButton = document.getElementById('forwardButton');
        if (!forwardButton) return;

        const isValid = currentExperience && currentExperience >= 1 && currentExperience <= 80;
        
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
        console.log('⬅️ Переход назад к экрану стоимости никотина');
        
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
        
        // Используем LoadingManager если доступен
        if (window.LoadingManager?.navigateWithTransition) {
            window.LoadingManager.navigateWithTransition('../nicotine-cost/index.html');
        } else {
            window.location.href = '../nicotine-cost/index.html';
        }
    };

    /**
     * Переход вперед
     */
    const goForward = async () => {
        if (!currentExperience || currentExperience < 1 || currentExperience > 80) {
            return;
        }

        console.log('➡️ Переход вперед со стажем:', currentExperience);
        
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('medium');
        }

        // Сохраняем стаж никотина
        if (typeof(Storage) !== "undefined") {
            localStorage.setItem('nicotineExperience', currentExperience);
            localStorage.setItem('nicotineExperienceAction', nicotineExperienceConfig[selectedNicotineType]?.action || 'потребления');
            console.log(`💾 Стаж "${currentExperience}" лет сохранен в localStorage`);
        }

        // Отправляем данные в Telegram если доступно
        if (tg?.sendData) {
            try {
                tg.sendData(JSON.stringify({ 
                    type: 'nicotine_experience_completed', 
                    nicotine_type: selectedNicotineType,
                    experience: currentExperience,
                    action: nicotineExperienceConfig[selectedNicotineType]?.action,
                    timestamp: new Date().toISOString() 
                }));
                console.log('📤 Данные стажа отправлены в Telegram');
            } catch (error) {
                console.error('❌ Ошибка отправки данных стажа:', error);
            }
        }

        // Отправляем все собранные данные на API для расчета
        await calculateAndSendNicotineImpact();
    };

    /**
     * Показывает попап с анимированным текстом расчета
     */
    const showCalculationModal = () => {
        const modal = document.getElementById('calculationModal');
        const textElement = document.getElementById('calculationProgressText');
        
        if (!modal || !textElement) {
            console.error('❌ Элементы попапа расчета не найдены');
            return;
        }

        // Показываем попап
        modal.classList.remove('hidden');
        
        // Массив текстов для анимации (по 2 секунды каждый)
        const progressTexts = [
            '🔄 Запускаю супер-мега-калькулятор...',
            '🤖 Заставляю роботов считать на пальцах...',
            '💸 Запрашиваю курс валют на Марсе...',
            '🚀 Сравниваю цены с космическими кораблями...',
            '😱 Цифры не помещаются на экран!'
        ];

        let currentTextIndex = 0;
        
        // Устанавливаем первый текст
        textElement.textContent = progressTexts[currentTextIndex];
        
        // Интервал смены текста каждые 2 секунды
        const textInterval = setInterval(() => {
            currentTextIndex++;
            
            if (currentTextIndex < progressTexts.length) {
                textElement.style.opacity = '0';
                
                setTimeout(() => {
                    textElement.textContent = progressTexts[currentTextIndex];
                    textElement.style.opacity = '1';
                }, 150);
            } else {
                // Все тексты показаны, останавливаем интервал
                clearInterval(textInterval);
            }
        }, 2000);
        
        // Сохраняем интервал для возможной очистки
        return textInterval;
    };

    /**
     * Скрывает попап расчета
     */
    const hideCalculationModal = () => {
        const modal = document.getElementById('calculationModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    };

    /**
     * Сбор всех данных из localStorage и отправка на API для расчета влияния никотина
     */
    const calculateAndSendNicotineImpact = async () => {
        try {
            console.log('🧮 Начинаем расчет влияния никотина...');
            
            // ОДНОВРЕМЕННО запускаем анимацию и API запросы
            const textInterval = showCalculationModal();

            // Подготавливаем данные для API запроса
            const nicotineType = localStorage.getItem('selectedNicotineType');
            const nicotineAmount = localStorage.getItem('nicotineAmount');
            const nicotineCost = localStorage.getItem('nicotineCost');
            const nicotineExperience = localStorage.getItem('nicotineExperience');

            console.log('📊 Собранные данные из localStorage:', {
                nicotineType,
                nicotineAmount,
                nicotineCost,
                nicotineExperience
            });

            // Проверяем что все данные собраны
            if (!nicotineType || !nicotineAmount || !nicotineCost || !nicotineExperience) {
                throw new Error('Не все данные собраны для расчета. Отсутствуют данные в localStorage.');
            }

            // Получаем telegram_id
            let telegramId = null;
            if (window.APIClient?.getTelegramUserId) {
                telegramId = window.APIClient.getTelegramUserId();
            }
            
            if (!telegramId && tg?.initDataUnsafe?.user?.id) {
                telegramId = tg.initDataUnsafe.user.id;
            }

            if (!telegramId) {
                throw new Error('Не удалось получить Telegram ID пользователя');
            }

            console.log('👤 Telegram ID пользователя:', telegramId);

            // Преобразуем строки в числа согласно API документации
            const requestData = {
                telegram_id: parseInt(telegramId),
                nicotine_type: nicotineType,
                daily_amount: parseFloat(nicotineAmount),
                unit_cost: parseFloat(nicotineCost),
                experience_years: parseFloat(nicotineExperience)
            };

            // Получаем Telegram WebApp Data для заголовка
            let telegramWebAppData = '';
            if (tg?.initData) {
                telegramWebAppData = tg.initData;
            }

            // ПАРАЛЛЕЛЬНО запускаем API запросы с retry логикой и анимацию
            let apiResult = null;
            let retryCount = 0;
            const maxRetries = 10; // Максимум попыток
            const retryDelay = 5000; // 5 секунд между попытками

            // Функция для выполнения API запроса с таймаутом
            const makeApiRequest = async () => {
                console.log(`📤 API запрос #${retryCount + 1}:`, requestData);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), retryDelay);

                try {
                    const response = await fetch('/api/v1/calculate-nicotine-impact', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Telegram-WebApp-Data': telegramWebAppData
                        },
                        body: JSON.stringify(requestData),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(`Ошибка API: ${response.status} - ${errorData.message || 'Неизвестная ошибка'}`);
                    }

                    const resultData = await response.json();
                    
                    if (!resultData.success) {
                        throw new Error(resultData.message || 'API вернул неуспешный результат');
                    }

                    return resultData;
                } catch (error) {
                    clearTimeout(timeoutId);
                    if (error.name === 'AbortError') {
                        throw new Error('API запрос превысил таймаут 5 секунд');
                    }
                    throw error;
                }
            };

            // Цикл retry с интервалом 5 секунд
            while (!apiResult && retryCount < maxRetries) {
                try {
                    apiResult = await makeApiRequest();
                    console.log(`✅ API запрос #${retryCount + 1} успешен:`, apiResult);
                    break;
                } catch (error) {
                    retryCount++;
                    console.warn(`⚠️ API запрос #${retryCount} неудачен: ${error.message}`);
                    
                    if (retryCount < maxRetries) {
                        console.log(`🔄 Повторный запрос через 5 секунд... (попытка ${retryCount + 1}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                    } else {
                        throw new Error(`Все ${maxRetries} попыток API запроса неудачны. Последняя ошибка: ${error.message}`);
                    }
                }
            }

            // Сохраняем результаты сразу после получения
            if (apiResult) {
                localStorage.setItem('nicotineCalculationResult', JSON.stringify(apiResult.data));
                console.log('💾 Результаты расчета сохранены в localStorage');

                // Отправляем результат в Telegram если доступно
                if (tg?.sendData) {
                    try {
                        tg.sendData(JSON.stringify({ 
                            type: 'nicotine_calculation_completed', 
                            telegram_id: telegramId,
                            calculation_result: apiResult.data,
                            timestamp: new Date().toISOString() 
                        }));
                        console.log('📤 Результаты расчета отправлены в Telegram');
                    } catch (error) {
                        console.error('❌ Ошибка отправки результатов в Telegram:', error);
                    }
                }
            }

            // Теперь дожидаемся окончания всей анимации (10 секунд)
            console.log('✅ API данные получены. Дожидаемся окончания анимации...');
            const totalAnimationTime = 10000; // 10 секунд для всех 5 текстов
            const animationStartTime = Date.now();
            
            // Ждем до завершения анимации, если она еще не закончилась
            const elapsedTime = Date.now() - animationStartTime;
            const remainingAnimationTime = Math.max(0, totalAnimationTime - elapsedTime);
            
            if (remainingAnimationTime > 0) {
                await new Promise(resolve => setTimeout(resolve, remainingAnimationTime));
            }

            console.log('🎬 Анимация завершена, переходим на экран результатов');

            // Скрываем попап и очищаем интервал
            if (textInterval) {
                clearInterval(textInterval);
            }
            hideCalculationModal();

            // Переходим на экран с результатами расчета
            console.log('🔄 Переходим на экран с результатами расчета');
            
            if (window.LoadingManager?.navigateWithTransition) {
                window.LoadingManager.navigateWithTransition('../calculation-results/index.html');
            } else {
                window.location.href = '../calculation-results/index.html';
            }

        } catch (error) {
            console.error('❌ Ошибка при расчете влияния никотина:', error);
            
            // Скрываем попап и очищаем интервал при ошибке
            if (typeof textInterval !== 'undefined') {
                clearInterval(textInterval);
            }
            hideCalculationModal();
            
            // Показываем уведомление об ошибке
            const errorMessage = `Произошла ошибка при расчете: ${error.message}`;
            showNotification(errorMessage);
            
            // Отправляем ошибку в Telegram если доступно
            if (tg?.sendData) {
                try {
                    tg.sendData(JSON.stringify({ 
                        type: 'calculation_error', 
                        error: error.message,
                        timestamp: new Date().toISOString() 
                    }));
                } catch (e) { /* ignore */ }
            }
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
    window.SmokyNicotineExperience = {
        isReady: () => isReady,
        getTelegram: () => tg,
        showNotification: showNotification,
        getSelectedNicotineType: () => selectedNicotineType,
        getCurrentExperience: () => currentExperience,
        goBack: goBack,
        goForward: goForward
    };

})();