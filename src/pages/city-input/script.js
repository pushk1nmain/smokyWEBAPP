document.addEventListener('DOMContentLoaded', () => {
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

    // 3. Add logic for the "Continue" button (for now, just an alert)
    nextButton.addEventListener('click', () => {
        const city = nameInput.value.trim();
        if (city) {
            alert(`Город для сохранения: ${city}. Следующий шаг пока не реализован.`);
            // Here you would typically save the city and navigate to the next page
            // For example:
            // localStorage.setItem('userCity', city);
            // window.location.href = '../next-page/index.html';
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
