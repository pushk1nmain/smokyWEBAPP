document.addEventListener('DOMContentLoaded', () => {
    // Adjust app height dynamically for virtual keyboard
    function adjustAppHeight() {
        const appContainer = document.querySelector('.app-container');
        if (appContainer && window.visualViewport) {
            appContainer.style.height = `${window.visualViewport.height}px`;
        } else if (appContainer) {
            // Fallback for browsers without visualViewport (less accurate for keyboard)
            appContainer.style.height = `${window.innerHeight}px`;
        }
    }

    // Initial adjustment
    adjustAppHeight();

    // Adjust on visual viewport resize (e.g., keyboard appearing/disappearing)
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', adjustAppHeight);
    } else {
        // Fallback for window resize (less accurate for keyboard)
        window.addEventListener('resize', adjustAppHeight);
    }

    const nameInput = document.querySelector('.name-input');
    const nextButton = document.getElementById('nextButton');

    // Function to show Telegram WebApp alert
    const showAlert = (message) => {
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.showAlert(message);
        } else {
            alert(message); // Fallback for testing outside Telegram WebApp
        }
    };

    // --- API Configuration ---
    const config = {
        api: {
            baseUrl: '/api/v1'
        }
    };

    const sendNameToBackend = async (name, telegramId, webAppInitData) => {
        try {
            if (!webAppInitData) {
                showAlert('Ошибка: Данные Telegram WebApp не доступны для аутентификации.');
                console.error('webAppInitData is null or empty.'); // Debugging
                return;
            }
            console.log('Sending name:', name, 'Telegram ID:', telegramId); // Debugging
            console.log('X-Telegram-WebApp-Data:', webAppInitData); // Debugging

            const response = await fetch(`${config.api.baseUrl}/name`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Telegram-WebApp-Data': webAppInitData // Use initData for authentication
                },
                body: JSON.stringify({
                    telegram_id: telegramId,
                    name: name
                })
            });

            const data = await response.json();
            console.log('API Response Status:', response.status); // Debugging
            console.log('API Response Data:', data); // Debugging

            if (response.ok && data.success) {
                showAlert('ЗАПИСАЛ В БД');
                // Proceed to next screen or action
            } else {
                // Handle API error response
                const errorMessage = data.message || 'Неизвестная ошибка при записи в БД.';
                showAlert(`Ошибка: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Ошибка при отправке имени в БД:', error);
            showAlert('Ошибка сети или сервера при записи в БД.');
        }
    };

    nextButton.addEventListener('click', async () => { // Make the event listener async
        const name = nameInput.value.trim(); // Get value and remove leading/trailing spaces

        // Rule 1: Not empty
        if (name === '') {
            showAlert('Имя не может быть пустым.');
            return;
        }

        // Rule 2: Minimum length (e.g., 2 characters)
        if (name.length < 2) {
            showAlert('Имя должно содержать не менее 2 символов.');
            return;
        }

        // Rule 3: Only letters (no numbers, no special characters, no spaces)
        const lettersOnlyRegex = /^[a-zA-Zа-яА-ЯёЁ]+$/;
        if (!lettersOnlyRegex.test(name)) {
            showAlert('Имя должно содержать только буквы (без цифр, пробелов и спецсимволов).');
            return;
            }

        // Get Telegram User ID and initData
        let telegramId = null;
        let webAppInitData = null;

        if (window.Telegram && window.Telegram.WebApp) {
            webAppInitData = window.Telegram.WebApp.initData;
            if (window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
                telegramId = window.Telegram.WebApp.initDataUnsafe.user.id;
            }
        }

        if (!telegramId) {
            console.warn('Telegram User ID not available. Using a placeholder ID for testing.');
            telegramId = 12345; // Placeholder ID for testing outside Telegram WebApp
        }
        if (!webAppInitData) {
            console.warn('Telegram WebApp InitData not available. API calls might fail.');
            // For testing outside WebApp, you might need a mock initData or skip API call
            // For production, this should ideally not happen if running inside WebApp
        }

        if (telegramId) {
            await sendNameToBackend(name, telegramId, webAppInitData);
        } else {
            showAlert('Не удалось получить ID пользователя Telegram.');
        }
    });

    nameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default form submission if any
            nextButton.click(); // Trigger the click event on the button
        }
    });
});