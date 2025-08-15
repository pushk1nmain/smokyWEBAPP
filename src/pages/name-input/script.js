document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.querySelector('.name-input');
    const nextButton = document.getElementById('nextButton');
    const nameInputScreen = document.querySelector('.name-input-screen'); // Get the main screen element
    const characterSection = document.querySelector('.character-section'); // Get the character section

    // Function to show Telegram WebApp alert
    const showAlert = (message) => {
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.showAlert(message);
        } else {
            alert(message); // Fallback for testing outside Telegram WebApp
        }
    };

    // --- Telegram WebApp Keyboard Handling ---
    if (window.Telegram && window.Telegram.WebApp) {
        const WebApp = window.Telegram.WebApp;

        // Initial setup for viewport
        WebApp.ready();
        WebApp.expand(); // Ensure the app expands to full height

        // Listen for viewport changes (including keyboard appearance/disappearance)
        WebApp.onEvent('viewportChanged', () => {
            const currentViewportHeight = WebApp.viewportHeight;
            const stableViewportHeight = WebApp.viewportStableHeight;

            const keyboardHeight = stableViewportHeight - currentViewportHeight;

            if (nameInputScreen) {
                // Apply padding to the bottom of the screen to push content up
                // Only apply if keyboard is detected (height > 0)
                nameInputScreen.style.paddingBottom = `${Math.max(0, keyboardHeight)}px`;
                
                // Dynamically adjust character section height
                if (characterSection) {
                    if (keyboardHeight > 0) {
                        // Keyboard is open, shrink character section
                        characterSection.style.maxHeight = '0px'; // Shrink to 0px
                        characterSection.style.opacity = '0'; // Fade out
                        characterSection.style.overflow = 'hidden'; // Hide overflow content
                    } else {
                        // Keyboard is closed, revert character section
                        characterSection.style.maxHeight = ''; // Revert to CSS default
                        characterSection.style.opacity = ''; // Revert to CSS default
                        characterSection.style.overflow = ''; // Revert to CSS default
                    }
                }

                // Scroll the active input into view if it's focused
                if (document.activeElement === nameInput && keyboardHeight > 0) {
                    nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });

        // Trigger initial viewport check
        // WebApp.onEvent('mainButtonPress', () => {}); // Removed as it might interfere with other logic
    }

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