document.addEventListener('DOMContentLoaded', () => {
    // Предзагружаем следующую страницу
    if (window.LoadingManager) {
        LoadingManager.preloadPage('../city-input/index.html');
    }
    const nameInput = document.querySelector('.name-input');
    const nextButton = document.getElementById('nextButton');
    const characterSection = document.querySelector('.character-section');

    const showAlert = (message) => {
        if (window.Telegram && window.Telegram.WebApp) {
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

    nextButton.addEventListener('click', async () => {
        const name = nameInput.value.trim();

        if (name === '' || name.length < 2 || !/^[a-zA-Zа-яА-ЯёЁ]+$/.test(name)) {
            showAlert('Имя должно содержать только буквы (минимум 2) и не может быть пустым.');
            return;
        }

        // --- Save name and redirect ---
        localStorage.setItem('userName', name);

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
                const isSuccess = await sendNameToBackend(name, telegramId, webAppInitData);
                
                if (isSuccess) {
                    // Плавный переход к следующей странице
                    setTimeout(() => {
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
            }
        } else {
            // Показываем загрузку и для fallback
            console.warn('Telegram data not available. Redirecting in test mode.');
            showLoading();
            setTimeout(() => {
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
