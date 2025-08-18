document.addEventListener('DOMContentLoaded', () => {
    // Предзагружаем следующую страницу
    if (window.LoadingManager) {
        LoadingManager.preloadPage('../city-input/index.html');
    }
    const nameInput = document.querySelector('.name-input');
    const nextButton = document.getElementById('nextButton');
    const characterSection = document.querySelector('.character-section');

    const showAlert = (message) => {
        if (window.showErrorModal) {
            window.showErrorModal(message);
        } else if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.showAlert(message);
        } else {
            alert(message); // Fallback
        }
    };

    // --- Keyboard Handling ---
    let initialViewportHeight = window.innerHeight;
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        setTimeout(() => { initialViewportHeight = window.innerHeight; }, 100);
    }

    const handleViewportChange = () => {
        if (!characterSection) return;
        const isKeyboardOpen = window.innerHeight < initialViewportHeight - 150;
        characterSection.style.display = isKeyboardOpen ? 'none' : '';
    };

    window.addEventListener('resize', handleViewportChange);
    if (window.Telegram && window.Telegram.WebApp) {
        try {
            window.Telegram.WebApp.onEvent('viewportChanged', handleViewportChange);
        } catch (e) {
            console.log('viewportChanged event not available, using resize fallback.');
        }
    }
    nameInput.addEventListener('focus', () => setTimeout(handleViewportChange, 300));
    nameInput.addEventListener('blur', () => setTimeout(handleViewportChange, 300));

    // --- API Configuration ---
    const config = {
        api: {
            baseUrl: '/api/v1'
        }
    };

    /**
     * Простые утилиты загрузки без текста
     */
    const showLoading = () => {
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
            
            // Добавляем haptic feedback если доступен
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
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
                if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                }
            }, 600);
        }
    };
    
    // Для совместимости со старым кодом
    const showLoadingWithText = (text) => {
        showLoading();
    };

    const sendNameToBackend = async (name, telegramId, webAppInitData) => {
        try {
            if (!webAppInitData) {
                showAlert('Ошибка: Данные Telegram WebApp не доступны для аутентификации.');
                return false;
            }
            
            const response = await fetch(`${config.api.baseUrl}/name`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Telegram-WebApp-Data': webAppInitData
                },
                body: JSON.stringify({
                    telegram_id: telegramId,
                    name: name
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                return true; // API call was successful
            } else {
                const errorMessage = data.message || 'Неизвестная ошибка при записи в БД.';
                showAlert(`Ошибка: ${errorMessage}`);
                return false; // API call failed
            }
        } catch (error) {
            console.error('Ошибка при отправке имени в БД:', error);
            showAlert('Ошибка сети или сервера при записи в БД.');
            return false; // Network or other error
        }
    };

    /**
     * Валидация имени пользователя
     * @param {string} name - введенное имя
     * @returns {object} - объект с результатом валидации и сообщением об ошибке
     */
    const validateName = (name) => {
        // Убираем пробелы в начале и конце
        const trimmedName = name.trim();
        
        // Проверка длины
        if (trimmedName.length < 2) {
            return { isValid: false, error: 'Имя должно содержать от 2 до 20 символов' };
        }
        
        if (trimmedName.length > 20) {
            return { isValid: false, error: 'Имя должно содержать от 2 до 20 символов' };
        }
        
        // Проверка допустимых символов (кириллица, латиница, пробелы, дефисы)
        const validCharsRegex = /^[a-zA-Zа-яА-ЯёЁ\s\-]+$/;
        if (!validCharsRegex.test(trimmedName)) {
            return { isValid: false, error: 'Имя может содержать только буквы, пробелы и дефисы' };
        }
        
        // Проверка на множественные пробелы
        if (/\s{2,}/.test(trimmedName)) {
            return { isValid: false, error: 'Имя может содержать только буквы, пробелы и дефисы' };
        }
        
        // Проверка, что имя не начинается и не заканчивается дефисом
        if (trimmedName.startsWith('-') || trimmedName.endsWith('-')) {
            return { isValid: false, error: 'Имя может содержать только буквы, пробелы и дефисы' };
        }
        
        // Проверка на несколько дефисов подряд
        if (/\-{2,}/.test(trimmedName)) {
            return { isValid: false, error: 'Имя может содержать только буквы, пробелы и дефисы' };
        }
        
        // Проверка на пробел или дефис в начале/конце (дополнительная проверка)
        if (trimmedName.startsWith(' ') || trimmedName.endsWith(' ')) {
            return { isValid: false, error: 'Имя может содержать только буквы, пробелы и дефисы' };
        }
        
        // Капитализация: первая буква каждого слова (разделенного пробелом или дефисом) в верхнем регистре
        const capitalizedName = trimmedName
            .split(/(\s+|\-+)/) // Разделяем по пробелам и дефисам, сохраняя разделители
            .map(part => {
                // Если это разделитель (пробел или дефис), оставляем как есть
                if (/^(\s+|\-+)$/.test(part)) {
                    return part;
                }
                // Если это слово, капитализируем первую букву
                if (part.length > 0) {
                    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
                }
                return part;
            })
            .join('');
        
        return { isValid: true, cleanedName: capitalizedName };
    };

    nextButton.addEventListener('click', async () => {
        const name = nameInput.value;
        
        // Валидация имени
        const validation = validateName(name);
        
        if (!validation.isValid) {
            showAlert(validation.error);
            return;
        }
        
        // Используем очищенное имя
        const cleanedName = validation.cleanedName;

        // --- Save name and redirect ---
        localStorage.setItem('userName', cleanedName);

        let telegramId = null;
        let webAppInitData = null;

        if (window.Telegram && window.Telegram.WebApp) {
            webAppInitData = window.Telegram.WebApp.initData;
            if (window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
                telegramId = window.Telegram.WebApp.initDataUnsafe.user.id;
            }
        }

        if (telegramId && webAppInitData) {
            // Показываем загрузку на время API запроса
            showLoading();
            
            try {
                const isSuccess = await sendNameToBackend(cleanedName, telegramId, webAppInitData);
                
                if (isSuccess) {
                    // Плавный переход к следующей странице
                    setTimeout(async () => {
                        // Используем StepRouter для перехода на следующий шаг
                        if (window.StepRouter) {
                            console.log('📈 Обновляем прогресс до шага 3 (город)');
                            const success = await window.StepRouter.goToNextStep();
                            
                            if (success) {
                                console.log('✅ Переход к следующему шагу выполнен через StepRouter');
                                return;
                            } else {
                                console.warn('⚠️ StepRouter не смог выполнить переход, используем fallback');
                            }
                        }
                        
                        // Fallback навигация
                        window.location.href = '../city-input/index.html';
                    }, 800);
                } else {
                    hideLoading();
                    localStorage.removeItem('userName');
                }
            } catch (error) {
                console.error('Ошибка при сохранении имени:', error);
                hideLoading();
                localStorage.removeItem('userName');
                // Восстанавливаем кнопку
                nextButton.disabled = false;
                nextButton.classList.remove('loading');
            }
        } else {
            // Показываем загрузку и для fallback
            console.warn('Telegram data not available. Redirecting in test mode.');
            showLoading();
            setTimeout(async () => {
                // Используем StepRouter для перехода на следующий шаг
                if (window.StepRouter) {
                    console.log('📈 Обновляем прогресс до шага 3 (город) - тестовый режим');
                    const success = await window.StepRouter.goToNextStep();
                    
                    if (success) {
                        console.log('✅ Переход к следующему шагу выполнен через StepRouter');
                        return;
                    } else {
                        console.warn('⚠️ StepRouter не смог выполнить переход, используем fallback');
                    }
                }
                
                // Fallback навигация
                window.location.href = '../city-input/index.html';
            }, 1000);
        }
    });

    nameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            nextButton.click();
        }
    });
});
