document.addEventListener('DOMContentLoaded', () => {
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
    const pageTitle = document.getElementById('page-title');
    const nameInput = document.querySelector('.name-input');
    const nextButton = document.getElementById('nextButton');

    // 1. Get user's name from localStorage
    const userName = localStorage.getItem('userName');

    // 2. Update the page title
    if (userName) {
        pageTitle.textContent = `${userName}, где Вы живете?`;
    } else {
        // Fallback if name is not found
        pageTitle.textContent = `Где Вы живете?`;
    }

    /**
     * Функция для получения данных Telegram WebApp для API запросов
     * Возвращает строку initData, необходимую для аутентификации на сервере
     */
    const getTelegramWebAppData = () => {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
            return window.Telegram.WebApp.initData;
        }
        // Для тестирования в браузере без Telegram
        if (window.SmokyConfig && window.SmokyConfig.development.enableBrowserTestMode) {
            return 'query_id=test&user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%2C%22last_name%22%3A%22User%22%7D&auth_date=1678886400&hash=test_hash';
        }
        return null;
    };

    /**
     * Функция для проверки города через API приватного сервера
     * Отправляет запрос на /api/v1/check_town и получает подтвержденное название и временную зону
     */
    const checkCityWithAPI = async (cityName) => {
        try {
            const telegramData = getTelegramWebAppData();
            if (!telegramData) {
                throw new Error('Отсутствуют данные аутентификации Telegram');
            }

            const apiUrl = '/api/v1';
            
            const response = await fetch(`${apiUrl}/check_town`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Telegram-WebApp-Data': telegramData
                },
                body: JSON.stringify({
                    town: cityName
                })
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Город не найден. Проверьте правильность написания.');
                }
                throw new Error(`Ошибка сервера: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                confirmedName: data.town,
                utcOffset: data.utc_offset,
                cached: data.cached
            };
        } catch (error) {
            console.error('Ошибка при проверке города:', error);
            return {
                success: false,
                error: error.message
            };
        }
    };

    /**
     * Функция для вычисления локального времени пользователя
     * Принимает UTC смещение в часах и возвращает отформатированное время
     */
    const calculateLocalTime = (utcOffsetHours) => {
        const now = new Date();
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        const localTime = new Date(utcTime + (utcOffsetHours * 3600000));
        
        return localTime.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    /**
     * Функция для показа модального окна подтверждения города
     * Отображает модальное окно с подтвержденным названием и локальным временем
     */
    const showCityConfirmationModal = (confirmedName, utcOffset) => {
        const modal = document.getElementById('cityConfirmationModal');
        const modalTitle = document.getElementById('modalTitle');
        const localTimeDisplay = document.getElementById('localTimeDisplay');
        const modalBackButton = document.getElementById('modalBackButton');
        const modalConfirmButton = document.getElementById('modalConfirmButton');
        
        // Устанавливаем название города в заголовок
        modalTitle.textContent = `${confirmedName}?`;
        
        // Вычисляем и устанавливаем локальное время
        const localTime = calculateLocalTime(utcOffset);
        localTimeDisplay.textContent = localTime;
        
        // Показываем модальное окно
        modal.classList.remove('hidden');
        
        // Haptic feedback при показе модального окна
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        }
        
        // Обработчик кнопки "Назад"
        const handleBackClick = () => {
            modal.classList.add('hidden');
            // Haptic feedback для кнопки назад
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
            }
            // Очищаем обработчики
            modalBackButton.removeEventListener('click', handleBackClick);
            modalConfirmButton.removeEventListener('click', handleConfirmClick);
        };
        
        // Обработчик кнопки "Подтвердить"
        const handleConfirmClick = () => {
            // Сохраняем данные в localStorage
            localStorage.setItem('userCity', confirmedName);
            localStorage.setItem('userTimezone', utcOffset.toString());
            
            // Haptic feedback для подтверждения
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }
            
            // Скрываем модальное окно
            modal.classList.add('hidden');
            
            // Показываем уведомление об успешном сохранении
            setTimeout(() => {
                if (window.Telegram && window.Telegram.WebApp) {
                    window.Telegram.WebApp.showAlert(`Отлично! Город ${confirmedName} сохранен. Следующий этап пока в разработке.`);
                } else {
                    alert(`Отлично! Город ${confirmedName} сохранен. Следующий этап пока в разработке.`);
                }
            }, 300);
            
            // Очищаем обработчики
            modalBackButton.removeEventListener('click', handleBackClick);
            modalConfirmButton.removeEventListener('click', handleConfirmClick);
        };
        
        // Добавляем обработчики событий
        modalBackButton.addEventListener('click', handleBackClick);
        modalConfirmButton.addEventListener('click', handleConfirmClick);
        
        // Обработчик клика по overlay для закрытия модального окна
        const modalOverlay = document.getElementById('modalOverlay');
        const handleOverlayClick = () => {
            handleBackClick();
            modalOverlay.removeEventListener('click', handleOverlayClick);
        };
        modalOverlay.addEventListener('click', handleOverlayClick);
    };

    // 3. Обработчик кнопки "Продолжить" с API проверкой города
    nextButton.addEventListener('click', async () => {
        const city = nameInput.value.trim();
        if (!city) {
            if (window.Telegram && window.Telegram.WebApp) {
                window.Telegram.WebApp.showAlert('Пожалуйста, введите ваш город.');
            } else {
                alert('Пожалуйста, введите ваш город.');
            }
            return;
        }

        // Показываем загрузку
        showLoading();
        
        try {
            // Проверяем город через API
            const result = await checkCityWithAPI(city);
            
            // Скрываем загрузку
            hideLoading();
            
            if (result.success) {
                // Если город найден, показываем модальное окно подтверждения
                setTimeout(() => {
                    showCityConfirmationModal(result.confirmedName, result.utcOffset);
                }, 200);
            } else {
                // Если город не найден, показываем ошибку
                setTimeout(() => {
                    if (window.Telegram && window.Telegram.WebApp) {
                        window.Telegram.WebApp.showAlert(result.error || 'Город не найден. Проверьте правильность написания.');
                    } else {
                        alert(result.error || 'Город не найден. Проверьте правильность написания.');
                    }
                }, 200);
            }
        } catch (error) {
            // Скрываем загрузку при ошибке
            hideLoading();
            
            setTimeout(() => {
                if (window.Telegram && window.Telegram.WebApp) {
                    window.Telegram.WebApp.showAlert('Произошла ошибка при проверке города. Попробуйте еще раз.');
                } else {
                    alert('Произошла ошибка при проверке города. Попробуйте еще раз.');
                }
            }, 200);
            
            console.error('Ошибка при проверке города:', error);
        }
    });

     nameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            nextButton.click();
        }
    });
});
