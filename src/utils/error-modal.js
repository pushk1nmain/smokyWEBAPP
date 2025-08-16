/**
 * Универсальный компонент для отображения ошибок в модальном окне
 * Базируется на существующем дизайне error-modal из city-input
 */

/**
 * Создает HTML структуру модального окна для ошибок
 * @param {string} errorText - текст ошибки для отображения
 * @returns {string} HTML строка модального окна
 */
const createErrorModalHTML = (errorText) => {
    return `
        <div class="error-modal" id="errorModal">
            <div class="modal-overlay-blur" id="errorModalOverlay"></div>
            <div class="error-modal-content">
                <h2 class="error-modal-title">Ой!</h2>
                <div class="error-modal-text-container">
                    <p class="error-modal-text" id="errorModalText">${errorText}</p>
                </div>
                <div class="error-modal-buttons">
                    <button class="error-modal-button" id="errorModalOkButton">
                        <span class="confirm-icon">✓</span>
                    </button>
                </div>
            </div>
        </div>
    `;
};

/**
 * CSS стили для модального окна ошибок
 */
const errorModalStyles = `
    .error-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 1;
        transition: opacity 0.3s ease;
    }

    .error-modal.hidden {
        opacity: 0;
        pointer-events: none;
        visibility: hidden;
    }

    .modal-overlay-blur {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 1001;
    }

    .error-modal-content {
        position: relative;
        z-index: 1002;
        background: #ffffff;
        border-radius: 20px;
        padding: 32px 24px 24px;
        margin: 20px;
        max-width: 400px;
        width: calc(100% - 40px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        text-align: center;
        transform: scale(1);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .error-modal.hidden .error-modal-content {
        transform: scale(0.9);
    }

    .error-modal-title {
        font-size: 28px;
        font-weight: 700;
        margin: 0 0 20px 0;
        color: #5A9BF7;
        line-height: 1.2;
    }

    .error-modal-text-container {
        margin-bottom: 32px;
    }

    .error-modal-text {
        font-size: 16px;
        font-weight: 500;
        line-height: 1.5;
        color: #666666;
        margin: 0;
    }

    .error-modal-buttons {
        display: flex;
        justify-content: center;
        gap: 16px;
    }

    .error-modal-button {
        width: 60px;
        height: 60px;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: white;
        transition: all 0.2s ease;
        background: linear-gradient(135deg, #4CAF50, #45a049);
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    }

    .error-modal-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
    }

    .error-modal-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
    }

    .confirm-icon {
        font-size: 26px;
        font-weight: 900;
        line-height: 1;
    }

    @keyframes errorModalSlideIn {
        from {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    .error-modal:not(.hidden) .error-modal-content {
        animation: errorModalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Адаптивность в зависимости от длины текста */
    .error-modal-text.short-text {
        font-size: 18px;
        font-weight: 600;
    }

    .error-modal-text.medium-text {
        font-size: 16px;
        font-weight: 500;
    }

    .error-modal-text.long-text {
        font-size: 15px;
        font-weight: 400;
        line-height: 1.6;
    }

    /* Адаптив для мобильных устройств */
    @media (max-width: 480px) {
        .error-modal-content {
            padding: 28px 20px 20px;
            margin: 16px;
            width: calc(100% - 32px);
        }

        .error-modal-title {
            font-size: 24px;
        }

        .error-modal-text {
            font-size: 15px;
        }

        .error-modal-text.short-text {
            font-size: 16px;
        }

        .error-modal-text.long-text {
            font-size: 14px;
        }

        .error-modal-button {
            width: 56px;
            height: 56px;
            font-size: 22px;
        }
    }
`;

/**
 * Класс для управления модальными окнами ошибок
 */
class ErrorModal {
    constructor() {
        this.modalElement = null;
        this.styleElement = null;
        this.init();
    }

    /**
     * Инициализация - добавление стилей в head
     */
    init() {
        if (!document.getElementById('error-modal-styles')) {
            this.styleElement = document.createElement('style');
            this.styleElement.id = 'error-modal-styles';
            this.styleElement.textContent = errorModalStyles;
            document.head.appendChild(this.styleElement);
        }
    }

    /**
     * Определяет класс текста в зависимости от его длины
     * @param {string} text - текст для анализа
     * @returns {string} класс CSS для текста
     */
    getTextClass(text) {
        if (text.length <= 30) {
            return 'short-text';
        } else if (text.length <= 80) {
            return 'medium-text';
        } else {
            return 'long-text';
        }
    }

    /**
     * Показывает модальное окно с ошибкой
     * @param {string} errorText - текст ошибки
     */
    show(errorText) {
        // Закрываем предыдущее модальное окно, если оно есть
        this.hide();

        // Создаем новое модальное окно
        const modalHTML = createErrorModalHTML(errorText);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHTML;
        this.modalElement = tempDiv.firstElementChild;

        // Добавляем класс в зависимости от длины текста
        const textElement = this.modalElement.querySelector('.error-modal-text');
        const textClass = this.getTextClass(errorText);
        textElement.classList.add(textClass);

        // Добавляем в DOM
        document.body.appendChild(this.modalElement);

        // Обработчик закрытия
        const okButton = this.modalElement.querySelector('#errorModalOkButton');
        const overlay = this.modalElement.querySelector('#errorModalOverlay');

        const closeHandler = () => {
            this.hide();
        };

        okButton.addEventListener('click', closeHandler);
        overlay.addEventListener('click', closeHandler);

        // Показываем модальное окно
        requestAnimationFrame(() => {
            this.modalElement.classList.remove('hidden');
        });

        // Haptic feedback если доступен
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }
    }

    /**
     * Скрывает модальное окно
     */
    hide() {
        if (this.modalElement && !this.modalElement.classList.contains('hidden')) {
            this.modalElement.classList.add('hidden');
            
            // Удаляем элемент после анимации
            setTimeout(() => {
                if (this.modalElement && this.modalElement.parentNode) {
                    this.modalElement.parentNode.removeChild(this.modalElement);
                    this.modalElement = null;
                }
            }, 300);
        }
    }

    /**
     * Уничтожает экземпляр и удаляет стили
     */
    destroy() {
        this.hide();
        if (this.styleElement && this.styleElement.parentNode) {
            this.styleElement.parentNode.removeChild(this.styleElement);
            this.styleElement = null;
        }
    }
}

// Создаем глобальный экземпляр
let globalErrorModal = null;

/**
 * Функция для показа ошибки (глобальная точка входа)
 * @param {string} errorText - текст ошибки
 */
const showErrorModal = (errorText) => {
    if (!globalErrorModal) {
        globalErrorModal = new ErrorModal();
    }
    globalErrorModal.show(errorText);
};

// Экспортируем для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorModal, showErrorModal };
} else {
    // Делаем доступным глобально
    window.ErrorModal = ErrorModal;
    window.showErrorModal = showErrorModal;
}