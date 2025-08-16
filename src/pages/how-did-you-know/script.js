/**
 * SmokyApp - How Did You Know Screen Script
 * Обработка выбора источника информации о приложении
 */

document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    // Загружаем имя пользователя из localStorage и обновляем заголовок
    const userName = localStorage.getItem('userName') || 'Пользователь';
    const screenTitle = document.getElementById('screenTitle');
    if (screenTitle) {
        screenTitle.textContent = `${userName}, откуда Вы узнали о Смоки?`;
    }

    // Получаем все кнопки выбора
    const optionButtons = document.querySelectorAll('.option-button');

    /**
     * Создает и показывает модальное окно с сообщением об успехе
     * @param {string} selectedOption - выбранная опция
     */
    const showSuccessModal = (selectedOption) => {
        // Удаляем предыдущее модальное окно, если оно есть
        const existingModal = document.querySelector('.success-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Создаем модальное окно
        const modalHTML = `
            <div class="success-modal" id="successModal">
                <div class="modal-overlay-blur"></div>
                <div class="success-modal-content">
                    <h2 class="success-modal-title">Принял!</h2>
                    <div class="success-modal-text-container">
                        <p class="success-modal-text">Спасибо за информацию!</p>
                    </div>
                    <div class="success-modal-buttons">
                        <button class="success-modal-button" id="successModalOkButton">
                            <span class="confirm-icon">✓</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Добавляем модальное окно в DOM
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHTML;
        const modal = tempDiv.firstElementChild;
        document.body.appendChild(modal);

        // Обработчики закрытия модального окна
        const okButton = modal.querySelector('#successModalOkButton');
        const overlay = modal.querySelector('.modal-overlay-blur');

        const closeModal = () => {
            modal.classList.add('hidden');
            setTimeout(() => {
                if (modal && modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        };

        okButton.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);

        // Показываем модальное окно
        requestAnimationFrame(() => {
            modal.classList.remove('hidden');
        });

        // Haptic feedback если доступен
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
    };

    /**
     * Обработчик нажатия на кнопку выбора
     * @param {Event} event - событие клика
     */
    const handleOptionClick = (event) => {
        const button = event.currentTarget;
        const option = button.getAttribute('data-option');

        // Убираем выделение с других кнопок
        optionButtons.forEach(btn => btn.classList.remove('selected'));
        
        // Выделяем выбранную кнопку
        button.classList.add('selected');

        // Haptic feedback при выборе
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }

        // Небольшая задержка перед показом модального окна для лучшего UX
        setTimeout(() => {
            showSuccessModal(option);
        }, 200);

        // Логируем выбор пользователя
        console.log(`Пользователь ${userName} выбрал источник: ${option}`);
        
        // Сохраняем выбор в localStorage (для будущего использования)
        localStorage.setItem('userSourceInfo', option);
    };

    // Добавляем обработчики событий на все кнопки выбора
    optionButtons.forEach(button => {
        button.addEventListener('click', handleOptionClick);
    });

    // Предзагружаем следующую страницу (если будет нужна в будущем)
    if (window.LoadingManager) {
        // Пока что закомментируем, так как следующая страница еще не определена
        // LoadingManager.preloadPage('../next-page/index.html');
    }
});