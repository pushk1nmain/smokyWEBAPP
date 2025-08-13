/**
 * Вспомогательные утилиты для SmokyApp
 * Общие функции, которые используются в разных частях приложения
 */

/**
 * Генерация уникального ID
 * @returns {string} Уникальный идентификатор
 */
const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Безопасное получение Telegram ID пользователя
 * @returns {number|null} Telegram ID или null если недоступен
 */
const getTelegramId = () => {
  try {
    const webApp = window.Telegram?.WebApp;
    if (!webApp || !webApp.initDataUnsafe?.user?.id) {
      // В режиме разработки проверяем hostname
      const isDevMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isDevMode) {
        console.log('🔧 Режим разработки: возвращаем тестовый Telegram ID');
        return 123456789; // Тестовый ID для разработки
      }
      console.warn('Telegram WebApp данные недоступны');
      return null;
    }
    return webApp.initDataUnsafe.user.id;
  } catch (error) {
    console.error('Ошибка получения Telegram ID:', error);
    return null;
  }
};

/**
 * Получение данных пользователя из Telegram
 * @returns {Object|null} Объект с данными пользователя или null
 */
const getTelegramUser = () => {
  try {
    const webApp = window.Telegram?.WebApp;
    if (!webApp || !webApp.initDataUnsafe?.user) {
      return null;
    }
    
    const user = webApp.initDataUnsafe.user;
    return {
      id: user.id,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      username: user.username || '',
      languageCode: user.language_code || 'ru',
      isPremium: user.is_premium || false
    };
  } catch (error) {
    console.error('Ошибка получения данных пользователя:', error);
    return null;
  }
};

/**
 * Форматирование имени пользователя
 * @param {string} firstName Имя
 * @param {string} lastName Фамилия
 * @returns {string} Отформатированное имя
 */
const formatUserName = (firstName = '', lastName = '') => {
  const name = `${firstName} ${lastName}`.trim();
  return name || 'Пользователь';
};

/**
 * Дебаунс функции
 * @param {Function} func Функция для дебаунса
 * @param {number} wait Время ожидания в мс
 * @returns {Function} Дебаунсированная функция
 */
const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Троттлинг функции
 * @param {Function} func Функция для троттлинга
 * @param {number} limit Лимит времени в мс
 * @returns {Function} Троттлированная функция
 */
const throttle = (func, limit = 100) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Показ уведомления
 * @param {string} message Текст сообщения
 * @param {string} type Тип уведомления: success, error, warning, info
 * @param {number} duration Длительность показа в мс
 */
const showNotification = (message, type = 'info', duration = 3000) => {
  const container = document.getElementById('notification-container');
  if (!container) return;

  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button type="button" onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;font-size:18px;cursor:pointer;">×</button>
  `;

  container.appendChild(notification);

  // Автоматическое скрытие
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, duration);
};

/**
 * Показ/скрытие индикатора загрузки
 * @param {boolean} show Показать или скрыть
 * @param {string} text Текст загрузки
 */
const toggleLoading = (show = true, text = 'Загрузка...') => {
  const overlay = document.getElementById('loading-overlay');
  const loadingText = document.querySelector('.loading-text');
  
  if (!overlay) return;
  
  if (show) {
    if (loadingText) {
      loadingText.textContent = text;
    }
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
  }
};

/**
 * Обновление прогресс-бара
 * @param {number} step Текущий шаг
 * @param {number} totalSteps Общее количество шагов
 */
const updateProgressBar = (step, totalSteps = 20) => {
  const progressFill = document.getElementById('progress-fill');
  if (!progressFill) return;

  const percentage = Math.min(100, Math.max(0, (step / totalSteps) * 100));
  progressFill.style.width = `${percentage}%`;
};

/**
 * Валидация email
 * @param {string} email Email для проверки
 * @returns {boolean} Результат валидации
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Валидация имени (только буквы и пробелы)
 * @param {string} name Имя для проверки
 * @returns {boolean} Результат валидации
 */
const isValidName = (name) => {
  if (!name || name.trim().length < 2) return false;
  const nameRegex = /^[а-яёa-z\s]+$/i;
  return nameRegex.test(name.trim());
};

/**
 * Сохранение данных в localStorage
 * @param {string} key Ключ
 * @param {any} value Значение
 */
const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Ошибка сохранения в localStorage:', error);
  }
};

/**
 * Получение данных из localStorage
 * @param {string} key Ключ
 * @param {any} defaultValue Значение по умолчанию
 * @returns {any} Сохраненное значение или значение по умолчанию
 */
const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Ошибка чтения из localStorage:', error);
    return defaultValue;
  }
};

/**
 * Удаление данных из localStorage
 * @param {string} key Ключ
 */
const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Ошибка удаления из localStorage:', error);
  }
};

/**
 * Форматирование даты в читаемый вид
 * @param {Date|string} date Дата
 * @returns {string} Отформатированная дата
 */
const formatDate = (date) => {
  try {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Ошибка форматирования даты:', error);
    return '';
  }
};

/**
 * Получение текущего времени в секундах
 * @returns {number} Timestamp в секундах
 */
const getCurrentTimestamp = () => {
  return Math.floor(Date.now() / 1000);
};

/**
 * Проверка поддержки Telegram WebApp
 * @returns {boolean} Поддерживается ли Telegram WebApp
 */
const isTelegramWebAppSupported = () => {
  return !!(window.Telegram && window.Telegram.WebApp);
};

/**
 * Проверка, запущено ли приложение в Telegram
 * @returns {boolean} Запущено ли в Telegram
 */
const isRunningInTelegram = () => {
  return isTelegramWebAppSupported() && window.Telegram.WebApp.initData;
};

/**
 * Безопасное выполнение функции с обработкой ошибок
 * @param {Function} func Функция для выполнения
 * @param {any} fallback Значение по умолчанию при ошибке
 * @returns {any} Результат выполнения функции или fallback
 */
const safeExecute = async (func, fallback = null) => {
  try {
    return await func();
  } catch (error) {
    console.error('Ошибка выполнения функции:', error);
    return fallback;
  }
};

/**
 * Безопасный доступ к TelegramManager с проверкой доступности
 * @param {string} method Название метода TelegramManager
 * @param {Array} args Аргументы для метода
 * @param {any} fallback Значение по умолчанию при недоступности
 * @returns {any} Результат выполнения метода или fallback
 */
const safeTelegramManagerCall = (method, args = [], fallback = null) => {
  try {
    if (!window.TelegramManager) {
      console.warn(`TelegramManager недоступен для вызова ${method}`);
      return fallback;
    }
    
    if (typeof window.TelegramManager[method] !== 'function') {
      console.warn(`Метод ${method} недоступен в TelegramManager`);
      return fallback;
    }
    
    // Для методов, требующих готовности TelegramManager
    const methodsRequiringReady = [
      'showMainButton', 'hideMainButton', 'updateMainButtonText', 'setMainButtonEnabled',
      'showBackButton', 'hideBackButton', 'hapticFeedback', 'sendData', 'close',
      'getViewportSize', 'addEventListener', 'removeEventListener'
    ];
    
    if (methodsRequiringReady.includes(method)) {
      if (typeof window.TelegramManager.isReady !== 'function' || !window.TelegramManager.isReady()) {
        console.warn(`TelegramManager не готов для вызова ${method}`);
        return fallback;
      }
    }
    
    return window.TelegramManager[method](...args);
  } catch (error) {
    console.error(`Ошибка вызова TelegramManager.${method}:`, error);
    return fallback;
  }
};

/**
 * Проверка готовности TelegramManager
 * @returns {boolean} Готовность TelegramManager
 */
const isTelegramManagerReady = () => {
  return !!(
    window.TelegramManager && 
    typeof window.TelegramManager.isReady === 'function' && 
    window.TelegramManager.isReady()
  );
};

// Экспорт для использования в других модулях
window.Utils = {
  generateId,
  getTelegramId,
  getTelegramUser,
  formatUserName,
  debounce,
  throttle,
  showNotification,
  toggleLoading,
  updateProgressBar,
  isValidEmail,
  isValidName,
  saveToStorage,
  getFromStorage,
  removeFromStorage,
  formatDate,
  getCurrentTimestamp,
  isTelegramWebAppSupported,
  isRunningInTelegram,
  safeExecute,
  safeTelegramManagerCall,
  isTelegramManagerReady
};
