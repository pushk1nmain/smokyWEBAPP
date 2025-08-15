document.addEventListener('DOMContentLoaded', () => {
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

    nextButton.addEventListener('click', () => {
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
        // Using a regular expression to check for only Cyrillic or Latin letters
        const lettersOnlyRegex = /^[a-zA-Zа-яА-ЯёЁ]+$/;
        if (!lettersOnlyRegex.test(name)) {
            showAlert('Имя должно содержать только буквы (без цифр, пробелов и спецсимволов).');
            return;
        }

        // Rule 4: No leading/trailing spaces (already handled by .trim())
        // Rule 5: No multiple internal spaces (already handled by regex if no spaces allowed)

        // If all checks pass
        showAlert('ОК');
        // In a real application, you would proceed to the next step here
    });
});