/**
 * API клиент для SmokyApp
 * Работа с бэкенд API для сохранения прогресса и данных пользователей
 */

/**
 * Конфигурация API
 */
const API_CONFIG = {
  baseURL: '/api/v1',
  timeout: 10000, // 10 секунд
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key' // TODO: Получать из переменных окружения
  }
};

/**
 * Базовый HTTP клиент с обработкой ошибок
 */
class HTTPClient {
  /**
   * Выполнение HTTP запроса
   * @param {string} url URL эндпоинта
   * @param {Object} options Опции запроса
   * @returns {Promise<Object>} Ответ сервера
   */
  static async request(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    try {
      const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
        ...options,
        headers: {
          ...API_CONFIG.headers,
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Проверка статуса ответа
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания запроса');
      }
      
      console.error('API запрос неудачен:', error);
      throw error;
    }
  }

  /**
   * GET запрос
   * @param {string} url URL эндпоинта
   * @param {Object} params Query параметры
   * @returns {Promise<Object>} Ответ сервера
   */
  static async get(url, params = {}) {
    const searchParams = new URLSearchParams(params);
    const queryString = searchParams.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    
    return this.request(fullUrl, {
      method: 'GET'
    });
  }

  /**
   * POST запрос
   * @param {string} url URL эндпоинта
   * @param {Object} data Данные для отправки
   * @returns {Promise<Object>} Ответ сервера
   */
  static async post(url, data = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT запрос
   * @param {string} url URL эндпоинта
   * @param {Object} data Данные для отправки
   * @returns {Promise<Object>} Ответ сервера
   */
  static async put(url, data = {}) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE запрос
   * @param {string} url URL эндпоинта
   * @returns {Promise<Object>} Ответ сервера
   */
  static async delete(url) {
    return this.request(url, {
      method: 'DELETE'
    });
  }
}

/**
 * API методы для работы с пользователями
 */
class UserAPI {
  /**
   * Получение данных пользователя по Telegram ID
   * @param {number} telegramId Telegram ID пользователя
   * @returns {Promise<Object>} Данные пользователя
   */
  static async getUser(telegramId) {
    if (!telegramId) {
      throw new Error('Telegram ID обязателен');
    }

    try {
      const response = await HTTPClient.get(`/user/${telegramId}`);
      return response.data || null;
    } catch (error) {
      // Если пользователь не найден, возвращаем null
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Сохранение/обновление имени пользователя
   * @param {number} telegramId Telegram ID пользователя
   * @param {string} name Имя пользователя
   * @returns {Promise<Object>} Результат операции
   */
  static async saveName(telegramId, name) {
    if (!telegramId || !name) {
      throw new Error('Telegram ID и имя обязательны');
    }

    if (!Utils.isValidName(name)) {
      throw new Error('Некорректное имя пользователя');
    }

    return HTTPClient.post('/name', {
      telegram_id: telegramId,
      name: name.trim()
    });
  }

  /**
   * Сохранение города и часового пояса
   * @param {number} telegramId Telegram ID пользователя
   * @param {string} town Название города
   * @param {number} tzOffset Смещение часового пояса в секундах
   * @returns {Promise<Object>} Результат операции
   */
  static async saveTown(telegramId, town, tzOffset) {
    if (!telegramId || !town || tzOffset === undefined) {
      throw new Error('Все параметры обязательны');
    }

    return HTTPClient.post('/town', {
      telegram_id: telegramId,
      town: town.trim(),
      tz_offset: tzOffset
    });
  }

  /**
   * Обновление часового пояса
   * @param {number} telegramId Telegram ID пользователя
   * @param {number} tzOffset Смещение часового пояса в секундах
   * @returns {Promise<Object>} Результат операции
   */
  static async updateTimezone(telegramId, tzOffset) {
    if (!telegramId || tzOffset === undefined) {
      throw new Error('Telegram ID и часовой пояс обязательны');
    }

    return HTTPClient.post('/timezone', {
      telegram_id: telegramId,
      tz_offset: tzOffset
    });
  }

  /**
   * Обновление шага прогресса
   * @param {number} telegramId Telegram ID пользователя
   * @param {number} progressStep Номер шага прогресса
   * @returns {Promise<Object>} Результат операции
   */
  static async updateProgressStep(telegramId, progressStep) {
    if (!telegramId || progressStep === undefined) {
      throw new Error('Telegram ID и шаг прогресса обязательны');
    }

    if (progressStep < 0 || progressStep > 20) {
      throw new Error('Шаг прогресса должен быть от 0 до 20');
    }

    return HTTPClient.post('/progress_step', {
      telegram_id: telegramId,
      progress_step: progressStep
    });
  }
}

/**
 * API методы для работы с городами
 */
class CityAPI {
  /**
   * Проверка города через OpenWeather API
   * @param {string} town Название города
   * @returns {Promise<Object>} Информация о городе
   */
  static async checkTown(town) {
    if (!town || town.trim().length < 2) {
      throw new Error('Название города слишком короткое');
    }

    return HTTPClient.post('/check_town', {
      town: town.trim()
    });
  }

  /**
   * Получение списка предложений городов (если потребуется)
   * @param {string} query Поисковый запрос
   * @returns {Promise<Array>} Список городов
   */
  static async searchCities(query) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // TODO: Реализовать если появится соответствующий эндпоинт
    // Пока возвращаем пустой массив
    return [];
  }
}

/**
 * Высокоуровневые API методы для работы с приложением
 */
class AppAPI {
  /**
   * Инициализация пользователя при первом запуске
   * @param {number} telegramId Telegram ID пользователя
   * @returns {Promise<Object>} Данные пользователя и текущий шаг
   */
  static async initializeUser(telegramId) {
    try {
      Utils.toggleLoading(true, 'Инициализация пользователя...');
      
      // Получаем данные пользователя
      const userData = await UserAPI.getUser(telegramId);
      
      if (userData) {
        // Пользователь существует, возвращаем его данные
        return {
          user: userData,
          isNewUser: false,
          currentStep: userData.progress_step || 0
        };
      } else {
        // Новый пользователь
        return {
          user: null,
          isNewUser: true,
          currentStep: 0
        };
      }
    } catch (error) {
      console.error('Ошибка инициализации пользователя:', error);
      
      // В режиме разработки возвращаем mock данные
      const isDevMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isDevMode) {
        console.log('🔧 Режим разработки: возвращаем mock данные пользователя');
        return {
          user: {
            id: telegramId,
            telegram_id: telegramId,
            first_name: 'Тест',
            last_name: 'Пользователь',
            username: 'testuser',
            language_code: 'ru',
            progress_step: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          isNewUser: true,
          currentStep: 0
        };
      }
      
      throw new Error('Не удалось инициализировать пользователя');
    } finally {
      Utils.toggleLoading(false);
    }
  }

  /**
   * Сохранение данных шага и переход к следующему
   * @param {number} telegramId Telegram ID пользователя
   * @param {number} currentStep Текущий шаг
   * @param {Object} stepData Данные текущего шага
   * @returns {Promise<boolean>} Успешность операции
   */
  static async saveStepAndProgress(telegramId, currentStep, stepData = {}) {
    try {
      Utils.toggleLoading(true, 'Сохранение данных...');
      
      // Сохраняем данные в зависимости от типа шага
      if (stepData.name) {
        await UserAPI.saveName(telegramId, stepData.name);
      }
      
      if (stepData.town && stepData.tzOffset !== undefined) {
        await UserAPI.saveTown(telegramId, stepData.town, stepData.tzOffset);
      }
      
      if (stepData.tzOffset !== undefined && !stepData.town) {
        await UserAPI.updateTimezone(telegramId, stepData.tzOffset);
      }
      
      // Обновляем прогресс
      const nextStep = currentStep + 1;
      await UserAPI.updateProgressStep(telegramId, nextStep);
      
      Utils.showNotification('Данные успешно сохранены', 'success');
      return true;
    } catch (error) {
      console.error('Ошибка сохранения данных шага:', error);
      Utils.showNotification('Ошибка сохранения данных', 'error');
      throw error;
    } finally {
      Utils.toggleLoading(false);
    }
  }

  /**
   * Валидация города с получением часового пояса
   * @param {string} cityName Название города
   * @returns {Promise<Object>} Данные о городе
   */
  static async validateCity(cityName) {
    try {
      Utils.toggleLoading(true, 'Проверка города...');
      
      const cityData = await CityAPI.checkTown(cityName);
      
      if (cityData.success) {
        return {
          isValid: true,
          town: cityData.town,
          utcOffset: cityData.utc_offset,
          cached: cityData.cached || false
        };
      } else {
        return {
          isValid: false,
          error: 'Город не найден'
        };
      }
    } catch (error) {
      console.error('Ошибка валидации города:', error);
      return {
        isValid: false,
        error: 'Ошибка проверки города'
      };
    } finally {
      Utils.toggleLoading(false);
    }
  }
}

// Экспорт API для использования в других модулях
window.API = {
  // Низкоуровневые API
  UserAPI,
  CityAPI,
  
  // Высокоуровневые методы из AppAPI
  initializeUser: AppAPI.initializeUser,
  saveStepAndProgress: AppAPI.saveStepAndProgress,
  validateCity: AppAPI.validateCity,
  
  // HTTP клиент для специальных случаев
  HTTPClient,
  
  // Конфигурация
  config: API_CONFIG
};
