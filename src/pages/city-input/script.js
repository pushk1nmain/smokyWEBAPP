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

    // 3. Add logic for the "Continue" button with smooth loading
    nextButton.addEventListener('click', () => {
        const city = nameInput.value.trim();
        if (city) {
            // Показываем загрузку для плавности
            showLoading();
            
            // Сохраняем город в localStorage
            localStorage.setItem('userCity', city);
            
            // Плавное завершение с задержкой
            setTimeout(() => {
                hideLoading();
                setTimeout(() => {
                    alert(`Город сохранен: ${city}. Следующий шаг пока не реализован.`);
                }, 200);
            }, 800);
            
        } else {
            if (window.Telegram && window.Telegram.WebApp) {
                window.Telegram.WebApp.showAlert('Пожалуйста, введите ваш город.');
            } else {
                alert('Пожалуйста, введите ваш город.');
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
