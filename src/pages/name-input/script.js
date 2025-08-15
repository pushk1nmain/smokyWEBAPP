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
     * Утилиты загрузки
     */
    const showLoadingWithText = (text) => {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.querySelector('.loading-text');
        
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
            
            // Добавляем haptic feedback если доступен
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
            }
        }
        
        if (loadingText) {
            // Плавная смена текста с анимацией
            loadingText.style.opacity = '0';
            setTimeout(() => {
                loadingText.innerHTML = text + '<span class="loading-dots"></span>';
                loadingText.style.opacity = '1';
            }, 200);
        }
    };

    const hideLoading = () => {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            // Добавляем небольшую задержку для плавности
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
                
                // Haptic feedback при завершении загрузки
                if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                }
            }, 800);
        }
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
            // Используем LoadingManager для API запроса
            try {
                const isSuccess = await (window.LoadingManager ? 
                    LoadingManager.wrapApiCall(
                        () => sendNameToBackend(name, telegramId, webAppInitData),
                        'Сохраняем ваше имя'
                    ) : 
                    (showLoadingWithText('Сохраняем ваше имя'), await sendNameToBackend(name, telegramId, webAppInitData))
                );
                
                if (isSuccess) {
                    // Быстрый переход без лишних задержек
                    if (window.LoadingManager) {
                        LoadingManager.fastNavigate('../city-input/index.html', 200);
                    } else {
                        window.location.href = '../city-input/index.html';
                    }
                } else {
                    // If backend fails, remove the stored name to avoid inconsistency
                    localStorage.removeItem('userName');
                }
            } catch (error) {
                console.error('Ошибка при сохранении имени:', error);
                localStorage.removeItem('userName');
            }
        } else {
            // Fallback for testing outside Telegram - быстрый переход
            console.warn('Telegram data not available. Redirecting in test mode.');
            if (window.LoadingManager) {
                LoadingManager.fastNavigate('../city-input/index.html', 100);
            } else {
                window.location.href = '../city-input/index.html';
            }
        }
    });

    nameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            nextButton.click();
        }
    });
});
