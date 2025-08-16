/**
 * API клиент для взаимодействия с Smoky WebApp Backend
 * Содержит методы для отправки запросов к API с автоматической обработкой ошибок
 */

/**
 * Получает базовый URL для API из конфигурации
 */
const getApiBaseUrl = () => {
    if (window.SmokyConfig && window.SmokyConfig.api && window.SmokyConfig.api.baseUrl) {
        return window.SmokyConfig.api.baseUrl;
    }
    // Fallback для случая если конфигурация не загружена
    return '/api/v1';
};

/**
 * Получает данные Telegram WebApp для аутентификации
 * @returns {string} строка initData для заголовка X-Telegram-WebApp-Data
 */
const getTelegramWebAppData = () => {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
        return window.Telegram.WebApp.initData;
    }
    // Fallback для разработки
    return 'query_id=dev&user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Dev%22%7D&auth_date=1678886400&hash=dev';
};

/**
 * Получает telegram_id пользователя из initData
 * @returns {number} telegram_id пользователя
 */
const getTelegramUserId = () => {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
        return window.Telegram.WebApp.initDataUnsafe.user.id;
    }
    // Fallback для разработки
    return 123456789;
};

/**
 * Универсальная функция для выполнения API запросов
 * @param {string} endpoint - endpoint для запроса (например, '/api/v1/source')
 * @param {Object} options - опции запроса
 * @param {string} options.method - HTTP метод (GET, POST, PUT, DELETE)
 * @param {Object} options.body - тело запроса (будет сериализовано в JSON)
 * @param {Object} options.headers - дополнительные заголовки
 * @returns {Promise<Object>} результат API запроса
 */
const apiRequest = async (endpoint, options = {}) => {
    const {
        method = 'GET',
        body = null,
        headers = {}
    } = options;

    try {
        // Формируем заголовки запроса
        const requestHeaders = {
            'Content-Type': 'application/json',
            'X-Telegram-WebApp-Data': getTelegramWebAppData(),
            ...headers
        };

        // Конфигурация запроса
        const requestConfig = {
            method,
            headers: requestHeaders
        };

        // Добавляем тело запроса если есть
        if (body && method !== 'GET') {
            requestConfig.body = JSON.stringify(body);
        }

        // Выполняем запрос
        const response = await fetch(`${getApiBaseUrl()}${endpoint}`, requestConfig);

        // Парсим ответ
        const data = await response.json();

        // Проверяем статус ответа
        if (!response.ok) {
            throw new APIError(data.message || 'Произошла ошибка при выполнении запроса', response.status, data.error_code);
        }

        return data;
    } catch (error) {
        // Обрабатываем различные типы ошибок
        if (error instanceof APIError) {
            throw error;
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new APIError('Нет подключения к интернету', 0, 'NETWORK_ERROR');
        } else if (error.name === 'SyntaxError') {
            throw new APIError('Сервер вернул некорректный ответ', 0, 'PARSE_ERROR');
        } else {
            throw new APIError('Неизвестная ошибка: ' + error.message, 0, 'UNKNOWN_ERROR');
        }
    }
};

/**
 * Класс для API ошибок с дополнительной информацией
 */
class APIError extends Error {
    constructor(message, statusCode = 0, errorCode = null) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.errorCode = errorCode;
    }

    /**
     * Получает пользовательское сообщение об ошибке
     * @returns {string} сообщение для отображения пользователю
     */
    getUserMessage() {
        switch (this.errorCode) {
            case 'CITY_NOT_FOUND':
                return 'Город не найден. Попробуйте ввести другое название.';
            case 'EXTERNAL_SERVICE_ERROR':
                return 'Сервис временно недоступен. Попробуйте позже.';
            case 'DATABASE_ERROR':
                return 'Ошибка сохранения данных. Попробуйте еще раз.';
            case 'USER_NOT_FOUND':
                return 'Пользователь не найден.';
            case 'VALIDATION_ERROR':
                return 'Некорректные данные. Проверьте введенную информацию.';
            case 'NETWORK_ERROR':
                return 'Проблемы с подключением. Проверьте интернет.';
            case 'PARSE_ERROR':
                return 'Ошибка обработки данных с сервера.';
            default:
                return this.message || 'Произошла неизвестная ошибка.';
        }
    }
}

/**
 * Отправляет источник привлечения пользователя
 * @param {string} source - источник привлечения (например, "tiktok", "youtube", "реклама в телеграме")
 * @returns {Promise<Object>} результат API запроса
 */
const sendUserSource = async (source) => {
    const telegram_id = getTelegramUserId();
    
    return await apiRequest('/api/v1/source', {
        method: 'POST',
        body: {
            telegram_id,
            source
        }
    });
};

/**
 * Получает все источники привлечения для пользователя
 * @param {number} telegram_id - ID пользователя в Telegram
 * @returns {Promise<Array>} массив источников привлечения
 */
const getUserSources = async (telegram_id) => {
    return await apiRequest(`/api/v1/source/${telegram_id}`);
};

/**
 * Проверяет город с использованием OpenWeather API
 * @param {string} town - название города
 * @returns {Promise<Object>} информация о городе
 */
const checkTown = async (town) => {
    return await apiRequest('/api/v1/check_town', {
        method: 'POST',
        body: { town }
    });
};

/**
 * Обновляет имя пользователя
 * @param {string} name - имя пользователя
 * @returns {Promise<Object>} результат API запроса
 */
const updateUserName = async (name) => {
    const telegram_id = getTelegramUserId();
    
    return await apiRequest('/api/v1/name', {
        method: 'POST',
        body: {
            telegram_id,
            name
        }
    });
};

/**
 * Обновляет город и часовой пояс пользователя
 * @param {string} town - название города
 * @param {number} tz_offset - смещение часового пояса
 * @returns {Promise<Object>} результат API запроса
 */
const updateUserTown = async (town, tz_offset) => {
    const telegram_id = getTelegramUserId();
    
    return await apiRequest('/api/v1/town', {
        method: 'POST',
        body: {
            telegram_id,
            town,
            tz_offset
        }
    });
};

/**
 * Обновляет шаг прогресса пользователя
 * @param {number} progress_step - шаг прогресса
 * @returns {Promise<Object>} результат API запроса
 */
const updateProgressStep = async (progress_step) => {
    const telegram_id = getTelegramUserId();
    
    return await apiRequest('/api/v1/progress_step', {
        method: 'POST',
        body: {
            telegram_id,
            progress_step
        }
    });
};

/**
 * Получает информацию о пользователе
 * @param {number} telegram_id - ID пользователя в Telegram
 * @returns {Promise<Object>} информация о пользователе
 */
const getUserInfo = async (telegram_id) => {
    return await apiRequest(`/api/v1/user/${telegram_id}`);
};

// Экспортируем для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        apiRequest,
        APIError,
        sendUserSource,
        getUserSources,
        checkTown,
        updateUserName,
        updateUserTown,
        updateProgressStep,
        getUserInfo,
        getTelegramUserId,
        getTelegramWebAppData
    };
} else {
    // Делаем доступными глобально
    window.APIClient = {
        apiRequest,
        APIError,
        sendUserSource,
        getUserSources,
        checkTown,
        updateUserName,
        updateUserTown,
        updateProgressStep,
        getUserInfo,
        getTelegramUserId,
        getTelegramWebAppData
    };
}