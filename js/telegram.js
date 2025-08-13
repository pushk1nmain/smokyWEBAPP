/**
 * Интеграция с Telegram WebApp API
 * Обработка специфичных для Telegram функций и UI элементов
 */

// Добавляем отладочную информацию о загрузке скрипта
console.log('📡 Telegram.js начинает загрузку...');
console.log('   - Текущее время:', new Date().toISOString());
console.log('   - window.Telegram доступен:', !!window.Telegram);
console.log('   - window.Telegram.WebApp доступен:', !!window.Telegram?.WebApp);
console.log('   - Статус DOM:', document.readyState);

/**
 * Менеджер Telegram WebApp интеграции
 */
class TelegramManager {
  constructor() {
    this.webApp = null;
    this.isInitialized = false;
    this.initData = null;
    this.user = null;
    
    // Событийные слушатели
    this.eventListeners = {
      mainButtonClicked: [],
      backButtonClicked: [],
      viewportChanged: [],
      themeChanged: []
    };
  }

  /**
   * Упрощенная инициализация Telegram WebApp
   * @returns {Promise<boolean>} Успешность инициализации
   */
  async initialize() {
    try {
      console.log('🔄 TelegramManager: Начинаем упрощенную инициализацию...');
      
      // Проверяем доступность Telegram WebApp
      if (!window.Telegram?.WebApp) {
        console.error('❌ Telegram WebApp API недоступен');
        return false;
      }

      this.webApp = window.Telegram.WebApp;
      console.log('✅ WebApp объект получен');
      
      // КРИТИЧЕСКИ ВАЖНО: готовность WebApp должна быть первой!
      console.log('📞 Вызываем WebApp.ready()...');
      this.webApp.ready();
      console.log('✅ WebApp.ready() выполнен');
      
      // Даем время на обработку ready()
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Получаем данные пользователя ПОСЛЕ ready()
      this.initData = this.webApp.initData || '';
      this.user = this.webApp.initDataUnsafe?.user || null;
      
      console.log('📊 Данные получены:', {
        hasInitData: !!(this.initData && this.initData.length > 0),
        hasUser: !!this.user,
        initDataLength: this.initData ? this.initData.length : 0
      });
      
      // Проверяем критические данные
      if (!this.initData || this.initData.length === 0) {
        console.warn('⚠️ InitData пустые - возможна проблема с настройкой бота');
      }
      
      if (!this.user) {
        console.warn('⚠️ User данные недоступны');
      }
      
      // Пытаемся расширить viewport (не критично если не получится)
      try {
        this.webApp.expand();
        console.log('✅ Viewport расширен');
      } catch (error) {
        console.warn('⚠️ Не удалось расширить viewport:', error);
      }
      
      // Минимальная настройка внешнего вида
      this.setupMinimalAppearance();
      
      // Минимальная настройка событий
      this.setupMinimalEventHandlers();
      
      this.isInitialized = true;
      console.log('✅ TelegramManager инициализирован успешно');
      
      return true;
    } catch (error) {
      console.error('❌ Критическая ошибка инициализации TelegramManager:', error);
      return false;
    }
  }

  /**
   * Минимальная настройка внешнего вида (упрощенная версия)
   */
  setupMinimalAppearance() {
    if (!this.webApp) return;
    
    console.log('🎨 Минимальная настройка внешнего вида...');
    
    try {
      // Скрываем все кнопки по умолчанию
      if (this.webApp.MainButton) {
        this.webApp.MainButton.hide();
      }
      if (this.webApp.BackButton) {
        this.webApp.BackButton.hide();
      }
      console.log('✅ Кнопки скрыты');
    } catch (error) {
      console.warn('⚠️ Ошибка настройки кнопок:', error);
    }
  }

  /**
   * Минимальная настройка событий (упрощенная версия)
   */
  setupMinimalEventHandlers() {
    if (!this.webApp) return;
    
    console.log('📡 Минимальная настройка событий...');
    
    try {
      // Обработчик главной кнопки
      this.webApp.onEvent('mainButtonClicked', () => {
        console.log('🔘 MainButton clicked');
        this.triggerEvent('mainButtonClicked');
      });

      // Обработчик кнопки назад
      this.webApp.onEvent('backButtonClicked', () => {
        console.log('◀️ BackButton clicked');
        this.triggerEvent('backButtonClicked');
      });
      
      console.log('✅ Основные события настроены');
    } catch (error) {
      console.warn('⚠️ Ошибка настройки событий:', error);
    }
  }

  /**
   * Настройка внешнего вида приложения согласно Telegram Mini Apps документации
   */
  setupAppearance() {
    if (!this.webApp) return;

    // Отключаем вертикальные свайпы (если поддерживается)
    if (typeof this.webApp.disableVerticalSwipes === 'function') {
      try {
        this.webApp.disableVerticalSwipes();
      } catch (error) {
        console.warn('Не удалось отключить вертикальные свайпы:', error);
      }
    }
    
    // Используем современный способ настройки цветов (свойства, а не методы)
    try {
      // Устанавливаем цвет заголовка через свойство
      if ('headerColor' in this.webApp) {
        this.webApp.headerColor = '#FAFAFA';
      } else if (typeof this.webApp.setHeaderColor === 'function') {
        // Fallback для старых версий
        this.webApp.setHeaderColor('#FAFAFA');
      }
      
      // Устанавливаем цвет фона через свойство
      if ('backgroundColor' in this.webApp) {
        this.webApp.backgroundColor = '#FAFAFA';
      } else if (typeof this.webApp.setBackgroundColor === 'function') {
        // Fallback для старых версий
        this.webApp.setBackgroundColor('#FAFAFA');
      }
    } catch (error) {
      console.warn('Не удалось установить цвета приложения:', error);
    }

    // Скрываем кнопки по умолчанию
    this.hideMainButton();
    this.hideBackButton();
  }

  /**
   * Настройка обработчиков событий Telegram
   */
  setupEventHandlers() {
    if (!this.webApp) return;

    // Обработчик главной кнопки
    this.webApp.onEvent('mainButtonClicked', () => {
      this.triggerEvent('mainButtonClicked');
    });

    // Обработчик кнопки назад
    this.webApp.onEvent('backButtonClicked', () => {
      this.triggerEvent('backButtonClicked');
    });

    // Обработчик изменения viewport
    this.webApp.onEvent('viewportChanged', (data) => {
      this.triggerEvent('viewportChanged', data);
    });

    // Обработчик изменения темы
    this.webApp.onEvent('themeChanged', () => {
      this.triggerEvent('themeChanged');
    });
  }

  /**
   * Показ главной кнопки
   * @param {string} text Текст кнопки
   * @param {boolean} enabled Активность кнопки
   */
  showMainButton(text = 'Продолжить', enabled = true) {
    if (!this.webApp?.MainButton) return;

    this.webApp.MainButton.setText(text);
    this.webApp.MainButton.show();
    
    if (enabled) {
      this.webApp.MainButton.enable();
    } else {
      this.webApp.MainButton.disable();
    }
  }

  /**
   * Скрытие главной кнопки
   */
  hideMainButton() {
    if (!this.webApp?.MainButton) return;
    this.webApp.MainButton.hide();
  }

  /**
   * Обновление текста главной кнопки
   * @param {string} text Новый текст
   */
  updateMainButtonText(text) {
    if (!this.webApp?.MainButton) return;
    this.webApp.MainButton.setText(text);
  }

  /**
   * Активация/деактивация главной кнопки
   * @param {boolean} enabled Активность кнопки
   */
  setMainButtonEnabled(enabled) {
    if (!this.webApp?.MainButton) return;
    
    if (enabled) {
      this.webApp.MainButton.enable();
    } else {
      this.webApp.MainButton.disable();
    }
  }

  /**
   * Показ кнопки назад
   */
  showBackButton() {
    if (!this.webApp?.BackButton) return;
    this.webApp.BackButton.show();
  }

  /**
   * Скрытие кнопки назад
   */
  hideBackButton() {
    if (!this.webApp?.BackButton) return;
    this.webApp.BackButton.hide();
  }

  /**
   * Закрытие WebApp
   */
  close() {
    if (!this.webApp) return;
    this.webApp.close();
  }

  /**
   * Отправка данных боту
   * @param {Object} data Данные для отправки
   */
  sendData(data) {
    if (!this.webApp) return;
    
    try {
      const jsonData = JSON.stringify(data);
      this.webApp.sendData(jsonData);
    } catch (error) {
      console.error('Ошибка отправки данных боту:', error);
    }
  }

  /**
   * Вибрация устройства
   * @param {string} type Тип вибрации: light, medium, heavy
   */
  hapticFeedback(type = 'light') {
    if (!this.webApp?.HapticFeedback) return;
    
    try {
      switch (type) {
        case 'light':
          this.webApp.HapticFeedback.impactOccurred('light');
          break;
        case 'medium':
          this.webApp.HapticFeedback.impactOccurred('medium');
          break;
        case 'heavy':
          this.webApp.HapticFeedback.impactOccurred('heavy');
          break;
        case 'success':
          this.webApp.HapticFeedback.notificationOccurred('success');
          break;
        case 'warning':
          this.webApp.HapticFeedback.notificationOccurred('warning');
          break;
        case 'error':
          this.webApp.HapticFeedback.notificationOccurred('error');
          break;
        default:
          this.webApp.HapticFeedback.impactOccurred('light');
      }
    } catch (error) {
      console.error('Ошибка воспроизведения haptic feedback:', error);
    }
  }

  /**
   * Получение информации о пользователе
   * @returns {Object|null} Данные пользователя
   */
  getUserData() {
    return this.user;
  }

  /**
   * Получение ID пользователя
   * @returns {number|null} Telegram ID пользователя
   */
  getUserId() {
    return this.user?.id || null;
  }

  /**
   * Проверка версии WebApp
   * @param {string} version Минимальная версия
   * @returns {boolean} Поддерживается ли версия
   */
  isVersionAtLeast(version) {
    if (!this.webApp?.isVersionAtLeast) return false;
    return this.webApp.isVersionAtLeast(version);
  }

  /**
   * Получение параметров темы
   * @returns {Object} Параметры темы
   */
  getThemeParams() {
    return this.webApp?.themeParams || {};
  }

  /**
   * Получение размеров viewport
   * @returns {Object} Размеры viewport
   */
  getViewportSize() {
    if (!this.webApp) return { width: 0, height: 0 };
    
    return {
      width: this.webApp.viewportWidth || window.innerWidth,
      height: this.webApp.viewportHeight || window.innerHeight,
      stableHeight: this.webApp.viewportStableHeight || window.innerHeight
    };
  }

  /**
   * Добавление слушателя событий
   * @param {string} eventType Тип события
   * @param {Function} handler Обработчик события
   */
  addEventListener(eventType, handler) {
    if (!this.eventListeners[eventType]) {
      this.eventListeners[eventType] = [];
    }
    this.eventListeners[eventType].push(handler);
  }

  /**
   * Удаление слушателя событий
   * @param {string} eventType Тип события
   * @param {Function} handler Обработчик события
   */
  removeEventListener(eventType, handler) {
    if (!this.eventListeners[eventType]) return;
    
    const index = this.eventListeners[eventType].indexOf(handler);
    if (index > -1) {
      this.eventListeners[eventType].splice(index, 1);
    }
  }

  /**
   * Вызов событий
   * @param {string} eventType Тип события
   * @param {any} data Данные события
   */
  triggerEvent(eventType, data = null) {
    if (!this.eventListeners[eventType]) return;
    
    this.eventListeners[eventType].forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Ошибка в обработчике события ${eventType}:`, error);
      }
    });
  }

  /**
   * Проверка инициализации
   * @returns {boolean} Инициализирован ли менеджер
   */
  isReady() {
    return this.isInitialized && this.webApp;
  }

  /**
   * Получение статуса запуска в Telegram
   * @returns {boolean} Запущено ли в Telegram
   */
  isRunningInTelegram() {
    return !!(this.webApp && this.initData);
  }
}

// Создаем глобальный экземпляр менеджера
const telegramManager = new TelegramManager();

// Создаем объект-прокси для экспорта
const TelegramManagerProxy = {
  // Свойства
  get webApp() { return telegramManager.webApp; },
  set webApp(value) { telegramManager.webApp = value; },
  
  get user() { return telegramManager.user; },
  set user(value) { telegramManager.user = value; },
  
  get initData() { return telegramManager.initData; },
  set initData(value) { telegramManager.initData = value; },
  
  get isInitialized() { return telegramManager.isInitialized; },
  set isInitialized(value) { telegramManager.isInitialized = value; },
  
  // Методы - привязываем к контексту экземпляра с использованием bind
  initialize: telegramManager.initialize.bind(telegramManager),
  isReady: telegramManager.isReady.bind(telegramManager),
  isRunningInTelegram: telegramManager.isRunningInTelegram.bind(telegramManager),
  showMainButton: telegramManager.showMainButton.bind(telegramManager),
  hideMainButton: telegramManager.hideMainButton.bind(telegramManager),
  showBackButton: telegramManager.showBackButton.bind(telegramManager),
  hideBackButton: telegramManager.hideBackButton.bind(telegramManager),
  setMainButtonEnabled: telegramManager.setMainButtonEnabled.bind(telegramManager),
  updateMainButtonText: telegramManager.updateMainButtonText.bind(telegramManager),
  hapticFeedback: telegramManager.hapticFeedback.bind(telegramManager),
  addEventListener: telegramManager.addEventListener.bind(telegramManager),
  removeEventListener: telegramManager.removeEventListener.bind(telegramManager),
  sendData: telegramManager.sendData.bind(telegramManager),
  close: telegramManager.close.bind(telegramManager),
  getUserData: telegramManager.getUserData.bind(telegramManager),
  getUserId: telegramManager.getUserId.bind(telegramManager),
  getViewportSize: telegramManager.getViewportSize.bind(telegramManager),
  isVersionAtLeast: telegramManager.isVersionAtLeast.bind(telegramManager),
  getThemeParams: telegramManager.getThemeParams.bind(telegramManager),
  
  // Доступ к внутреннему экземпляру для отладки
  _instance: telegramManager
};

// Безопасный экспорт TelegramManager с проверкой
try {
  // Экспортируем прокси
  window.TelegramManager = TelegramManagerProxy;
  
  // Проверяем, что экспорт успешен
  if (!window.TelegramManager) {
    throw new Error('Экспорт TelegramManager не удался');
  }
  
  // Делаем объект неизменяемым для защиты от случайной перезаписи
  Object.freeze(window.TelegramManager);
  
  // Отладочная информация для проверки экспорта
  console.log('🔧 TelegramManager экспортирован успешно:', {
    type: typeof window.TelegramManager,
    hasInitialize: typeof window.TelegramManager.initialize,
    hasIsReady: typeof window.TelegramManager.isReady,
    hasGetUserData: typeof window.TelegramManager.getUserData,
    keys: Object.keys(window.TelegramManager),
    isFrozen: Object.isFrozen(window.TelegramManager)
  });
} catch (error) {
  console.error('🔴 КРИТИЧЕСКАЯ ОШИБКА экспорта TelegramManager:', error);
  
  // Создаем минимальный fallback
  window.TelegramManager = {
    initialize: async () => false,
    isReady: () => false,
    isRunningInTelegram: () => false,
    _error: 'Ошибка экспорта TelegramManager'
  };
}

// Дополнительная диагностика для Telegram WebApp контекста
console.log('📡 Диагностика Telegram WebApp окружения:', {
  hasTelegramObject: !!window.Telegram,
  hasWebApp: !!window.Telegram?.WebApp,
  hasInitData: !!(window.Telegram?.WebApp?.initData),
  initDataLength: window.Telegram?.WebApp?.initData?.length || 0,
  userAgent: navigator.userAgent.includes('Telegram') ? 'Telegram' : 'Другой',
  isInFrame: window.parent !== window,
  hasWebviewProxy: !!window.TelegramWebviewProxy
});

// Установка глобального флага готовности
window.TelegramManagerLoaded = true;

// TelegramManager готов - выполняем проверку
console.log('📡 TelegramManager загружен и готов к использованию');

// Проверяем, что TelegramManager действительно доступен
setTimeout(() => {
    if (!window.TelegramManager) {
        console.error('🔴 КРИТИЧЕСКАЯ ОШИБКА: TelegramManager не экспортирован в window!');
        // Отправляем событие ошибки
        window.dispatchEvent(new CustomEvent('telegramManagerError', {
            detail: { error: 'TelegramManager не экспортирован' }
        }));
    } else if (typeof window.TelegramManager.initialize !== 'function') {
        console.error('🔴 КРИТИЧЕСКАЯ ОШИБКА: TelegramManager.initialize не является функцией!');
        // Отправляем событие ошибки
        window.dispatchEvent(new CustomEvent('telegramManagerError', {
            detail: { error: 'TelegramManager.initialize недоступен' }
        }));
    } else {
        console.log('✅ TelegramManager прошел проверку экспорта');
        // Отправляем событие готовности
        window.dispatchEvent(new CustomEvent('telegramManagerReady', {
            detail: { telegramManager: window.TelegramManager }
        }));
    }
}, 10);
