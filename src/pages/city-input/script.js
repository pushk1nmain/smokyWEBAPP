document.addEventListener('DOMContentLoaded', () => {
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

    // 3. Add logic for the "Continue" button with loading animation
    nextButton.addEventListener('click', () => {
        const city = nameInput.value.trim();
        if (city) {
            // Show loading and simulate saving
            showLoadingWithText('Сохраняем ваш город');
            
            // Save city to localStorage
            localStorage.setItem('userCity', city);
            
            // Simulate API call delay and show completion message
            setTimeout(() => {
                showLoadingWithText('Готово! Начинаем ваше путешествие');
                
                setTimeout(() => {
                    // Here would typically be navigation to next page
                    alert(`Город сохранен: ${city}. Следующий шаг пока не реализован.`);
                    hideLoading();
                }, 1500);
            }, 2000);
            
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
