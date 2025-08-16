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

    // Получаем все карточки выбора
    const optionCards = document.querySelectorAll('.option-card');

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
     * Показывает модальное окно для опции "Другое"
     */
    const showOtherSourceModal = () => {
        const modal = document.getElementById('otherSourceModal');
        const modalText = document.getElementById('otherSourceModalText');
        
        // Персонализируем текст с именем пользователя
        modalText.textContent = `Вы настоящий исследователь! ${userName}, а где же вы обо мне услышали? Может, это был подкаст, статья или даже сарафанное радио в очереди за кофе?`;
        
        // Показываем модальное окно
        modal.classList.add('show');
        
        // Haptic feedback
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        }
        
        // Обработчики кнопок
        const backButton = document.getElementById('otherSourceBackButton');
        const confirmButton = document.getElementById('otherSourceConfirmButton');
        const overlay = document.getElementById('otherSourceOverlay');
        const input = document.getElementById('otherSourceInput');
        
        const closeModal = () => {
            modal.classList.remove('show');
            input.value = ''; // Очищаем поле ввода
            
            // Убираем выделение с карточки "Другое"
            optionCards.forEach(card => card.classList.remove('selected'));
        };
        
        const handleConfirm = () => {
            const customSource = input.value.trim();
            if (!customSource) {
                // Показываем ошибку если поле пустое
                if (window.showErrorModal) {
                    window.showErrorModal('Пожалуйста, укажите где вы узнали о Смоки');
                }
                return;
            }
            
            // Сохраняем кастомный источник
            localStorage.setItem('userSourceInfo', `other: ${customSource}`);
            console.log(`Пользователь ${userName} выбрал кастомный источник: ${customSource}`);
            
            // Закрываем модальное окно
            closeModal();
            
            // Показываем обычное модальное окно "Принял!"
            setTimeout(() => {
                showSuccessModal('other');
            }, 300);
            
            // Haptic feedback
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }
        };
        
        // Добавляем обработчики (удаляем старые если есть)
        const newBackButton = backButton.cloneNode(true);
        const newConfirmButton = confirmButton.cloneNode(true);
        const newOverlay = overlay.cloneNode(true);
        
        backButton.parentNode.replaceChild(newBackButton, backButton);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
        overlay.parentNode.replaceChild(newOverlay, overlay);
        
        newBackButton.addEventListener('click', closeModal);
        newConfirmButton.addEventListener('click', handleConfirm);
        newOverlay.addEventListener('click', closeModal);
        
        // Обработчик Enter в поле ввода
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleConfirm();
            }
        });
        
        // Фокусируемся на поле ввода
        setTimeout(() => {
            input.focus();
        }, 300);
    };

    /**
     * Обработчик нажатия на карточку выбора
     * @param {Event} event - событие клика
     */
    const handleOptionClick = (event) => {
        const card = event.currentTarget;
        const option = card.getAttribute('data-option');

        // Haptic feedback при выборе
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }

        // Если выбрана опция "Другое", показываем специальное модальное окно
        if (option === 'other') {
            // Выделяем карточку
            optionCards.forEach(card => card.classList.remove('selected'));
            card.classList.add('selected');
            
            setTimeout(() => {
                showOtherSourceModal();
            }, 200);
            return;
        }

        // Для остальных опций показываем обычное модальное окно
        // Убираем выделение с других карточек
        optionCards.forEach(card => card.classList.remove('selected'));
        
        // Выделяем выбранную карточку
        card.classList.add('selected');

        // Небольшая задержка перед показом модального окна для лучшего UX
        setTimeout(() => {
            showSuccessModal(option);
        }, 200);

        // Логируем выбор пользователя
        console.log(`Пользователь ${userName} выбрал источник: ${option}`);
        
        // Сохраняем выбор в localStorage (для будущего использования)
        localStorage.setItem('userSourceInfo', option);
    };

    // Добавляем обработчики событий на все карточки выбора
    optionCards.forEach(card => {
        card.addEventListener('click', handleOptionClick);
    });

    // Предзагружаем следующую страницу (если будет нужна в будущем)
    if (window.LoadingManager) {
        // Пока что закомментируем, так как следующая страница еще не определена
        // LoadingManager.preloadPage('../next-page/index.html');
    }
});