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
     * Отправляет данные об источнике на сервер
     * @param {string} source - источник привлечения
     * @param {Function} errorCallback - callback для показа ошибки (опционально)
     * @returns {Promise<boolean>} успешность операции
     */
    const sendSourceToServer = async (source, errorCallback = null) => {
        try {
            const result = await window.APIClient.sendUserSource(source);
            return result.success === true;
        } catch (error) {
            console.error('Ошибка при отправке источника:', error);
            
            // Показываем ошибку пользователю
            let errorMessage = 'Произошла ошибка при сохранении данных';
            
            if (error instanceof window.APIClient.APIError) {
                errorMessage = error.getUserMessage();
            }
            
            // Используем переданный callback или глобальную функцию
            if (errorCallback) {
                errorCallback(errorMessage);
            } else if (window.showErrorModal) {
                window.showErrorModal(errorMessage);
            }
            
            return false;
        }
    };

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
        
        // Показываем модальное окно синхронно с помощью requestAnimationFrame
        requestAnimationFrame(() => {
            modal.classList.remove('hidden');
        });
        
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
            modal.classList.add('hidden');
            input.value = ''; // Очищаем поле ввода
            
            // Убираем выделение с карточки "Другое"
            optionCards.forEach(card => card.classList.remove('selected'));
        };
        
        const showModalError = (errorText) => {
            // Удаляем предыдущую ошибку если есть
            const existingError = modal.querySelector('.modal-error-message');
            if (existingError) {
                existingError.remove();
            }
            
            // Создаем сообщение об ошибке
            const errorDiv = document.createElement('div');
            errorDiv.className = 'modal-error-message';
            errorDiv.textContent = errorText;
            errorDiv.style.cssText = `
                color: #ff4444;
                font-size: 14px;
                font-weight: 500;
                text-align: center;
                margin-top: 8px;
                padding: 8px;
                background: rgba(255, 68, 68, 0.1);
                border-radius: 8px;
                border: 1px solid rgba(255, 68, 68, 0.2);
                animation: errorShake 0.5s ease-in-out;
            `;
            
            // Добавляем CSS анимацию для тряски
            if (!document.getElementById('modal-error-styles')) {
                const style = document.createElement('style');
                style.id = 'modal-error-styles';
                style.textContent = `
                    @keyframes errorShake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-5px); }
                        75% { transform: translateX(5px); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Вставляем после поля ввода
            const inputContainer = modal.querySelector('.other-source-input-container');
            inputContainer.parentNode.insertBefore(errorDiv, inputContainer.nextSibling);
            
            // Автоматически убираем ошибку через 3 секунды
            setTimeout(() => {
                if (errorDiv && errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 3000);
            
            // Haptic feedback для ошибки
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
            }
        };

        const handleConfirm = async () => {
            const customSource = input.value.trim();
            
            // Валидация минимум 2 символа
            if (customSource.length < 2) {
                showModalError('Пожалуйста, укажите минимум 2 символа');
                return;
            }
            
            // Отправляем данные на сервер с локальным callback для ошибок
            const isSuccess = await sendSourceToServer(customSource, showModalError);
            
            if (isSuccess) {
                // Сохраняем кастомный источник локально (для дублирования)
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
            }
            // Если ошибка - она уже обработана в sendSourceToServer
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
        
        // Фокусируемся на поле ввода сразу
        requestAnimationFrame(() => {
            input.focus();
        });
    };

    /**
     * Обработчик нажатия на карточку выбора
     * @param {Event} event - событие клика
     */
    const handleOptionClick = async (event) => {
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
            
            showOtherSourceModal();
            return;
        }

        // Убираем выделение с других карточек
        optionCards.forEach(card => card.classList.remove('selected'));
        
        // Выделяем выбранную карточку
        card.classList.add('selected');

        // Получаем точное название кнопки из DOM
        const optionTextElement = card.querySelector('.option-text');
        const sourceName = optionTextElement ? optionTextElement.textContent.trim() : option;
        
        // Отправляем данные на сервер
        const isSuccess = await sendSourceToServer(sourceName);
        
        if (isSuccess) {
            // Логируем выбор пользователя
            console.log(`Пользователь ${userName} выбрал источник: ${sourceName}`);
            
            // Сохраняем выбор в localStorage (для дублирования)
            localStorage.setItem('userSourceInfo', sourceName);
            
            // Небольшая задержка перед показом модального окна для лучшего UX
            setTimeout(() => {
                showSuccessModal(option);
            }, 200);
        }
        // Если ошибка - она уже обработана в sendSourceToServer, просто убираем выделение
        else {
            card.classList.remove('selected');
        }
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