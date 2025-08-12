/**
 * Главный файл приложения SmokyApp
 * Инициализация и запуск Telegram WebApp
 */

/**
 * Класс основного приложения
 */
class SmokyApp {
  constructor() {
    this.isInitialized = false;
    this.version = '1.0.0';
    this.debug = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }

  /**
   * Инициализация приложения
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      if (this.debug) {
        console.log(`SmokyApp v${this.version} - Инициализация начата`);
      }

      // Показываем загрузку
      Utils.toggleLoading(true, 'Инициализация приложения...');

      // Проверяем поддержку современных браузеров
      this.checkBrowserSupport();

      // Ждем загрузки DOM
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Инициализируем Telegram WebApp
      await this.initializeTelegram();

      // Инициализируем роутер
      await this.initializeRouter();

      // Настраиваем глобальные обработчики
      this.setupGlobalHandlers();

      // Настраиваем отзывчивость
      this.setupResponsiveness();

      this.isInitialized = true;

      if (this.debug) {
        console.log('SmokyApp - Инициализация завершена успешно');
      }

    } catch (error) {
      console.error('Критическая ошибка инициализации приложения:', error);
      this.handleCriticalError(error);
    } finally {
      Utils.toggleLoading(false);
    }
  }

  /**
   * Проверка поддержки браузера
   */
  checkBrowserSupport() {
    const requiredFeatures = [
      'fetch',
      'Promise',
      'localStorage',
      'addEventListener'
    ];

    const missingFeatures = requiredFeatures.filter(feature => {
      return typeof window[feature] === 'undefined';
    });

    if (missingFeatures.length > 0) {
      throw new Error(`Браузер не поддерживает: ${missingFeatures.join(', ')}`);
    }
  }

  /**
   * Инициализация Telegram WebApp
   * @returns {Promise<void>}
   */
  async initializeTelegram() {
    console.log('🔄 Инициализация Telegram WebApp...');
    console.log('   - TelegramManager доступен:', !!window.TelegramManager);
    console.log('   - initialize доступен:', typeof window.TelegramManager?.initialize);
    
    // В режиме разработки сразу настраиваем mock
    if (this.debug) {
      console.warn('🔧 Запуск в режиме разработки');
      this.setupDevelopmentMode();
      return;
    }
    
    // Проверяем доступность TelegramManager
    if (!window.TelegramManager || typeof TelegramManager.initialize !== 'function') {
      throw new Error('TelegramManager недоступен');
    }

    try {
      const telegramInitialized = await TelegramManager.initialize();
      
      if (!telegramInitialized) {
        throw new Error('Telegram WebApp не инициализирован');
      }
      
      console.log('✅ Telegram WebApp инициализирован');
    } catch (error) {
      console.error('❌ Ошибка инициализации Telegram WebApp:', error);
      throw error;
    }
  }

  /**
   * Настройка режима разработки
   */
  setupDevelopmentMode() {
    console.log('🔧 Режим разработки: настройка mock Telegram WebApp');
    
    // Создаем mock объект для эмуляции Telegram WebApp
    window.Telegram = {
      WebApp: {
        ready: () => console.log('📱 Mock: WebApp ready'),
        expand: () => console.log('📱 Mock: WebApp expand'),
        close: () => console.log('📱 Mock: WebApp close'),
        sendData: (data) => console.log('📱 Mock sendData:', data),
        MainButton: {
          show: () => {
            console.log('🔘 Mock: MainButton show');
            this.showMockMainButton();
          },
          hide: () => {
            console.log('🔘 Mock: MainButton hide');
            this.hideMockMainButton();
          },
          setText: (text) => {
            console.log('🔘 Mock: MainButton setText:', text);
            this.updateMockMainButton(text);
          },
          enable: () => console.log('🔘 Mock: MainButton enable'),
          disable: () => console.log('🔘 Mock: MainButton disable')
        },
        BackButton: {
          show: () => {
            console.log('◀️ Mock: BackButton show');
            this.showMockBackButton();
          },
          hide: () => {
            console.log('◀️ Mock: BackButton hide');
            this.hideMockBackButton();
          }
        },
        HapticFeedback: {
          impactOccurred: (type) => console.log('📳 Mock haptic impact:', type),
          notificationOccurred: (type) => console.log('📳 Mock haptic notification:', type)
        },
        initDataUnsafe: {
          user: {
            id: 123456789,
            first_name: 'Тест',
            last_name: 'Пользователь',
            username: 'testuser',
            language_code: 'ru'
          }
        },
        initData: 'test_data',
        onEvent: (event, handler) => {
          console.log(`📡 Mock event listener: ${event}`);
          // Сохраняем обработчики для mock кнопок
          this.mockEventHandlers = this.mockEventHandlers || {};
          this.mockEventHandlers[event] = handler;
        },
        isVersionAtLeast: (version) => true,
        themeParams: {},
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        viewportStableHeight: window.innerHeight
      }
    };

    // Инициализируем mock UI для кнопок
    this.setupMockUI();
    
    // Принудительно настраиваем TelegramManager для режима разработки
    if (window.TelegramManager) {
      // Устанавливаем mock данные в TelegramManager
      TelegramManager.webApp = window.Telegram.WebApp;
      TelegramManager.user = window.Telegram.WebApp.initDataUnsafe.user;
      TelegramManager.initData = window.Telegram.WebApp.initData;
      TelegramManager.isInitialized = true;
      
      console.log('✅ TelegramManager настроен для режима разработки');
      console.log('   - webApp:', !!TelegramManager.webApp);
      console.log('   - user:', TelegramManager.user);
      console.log('   - isInitialized:', TelegramManager.isInitialized);
    }
  }

  /**
   * Настройка mock UI для режима разработки
   */
  setupMockUI() {
    // Создаем контейнер для mock кнопок
    const mockContainer = document.createElement('div');
    mockContainer.id = 'mock-telegram-ui';
    mockContainer.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 10px;
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: monospace;
      font-size: 14px;
    `;
    
    document.body.appendChild(mockContainer);
    this.mockContainer = mockContainer;
    this.mockEventHandlers = {};
  }

  /**
   * Показ mock главной кнопки
   */
  showMockMainButton() {
    if (!this.mockContainer) return;
    
    let mainBtn = this.mockContainer.querySelector('#mock-main-btn');
    if (!mainBtn) {
      mainBtn = document.createElement('button');
      mainBtn.id = 'mock-main-btn';
      mainBtn.style.cssText = `
        background: #007AFF;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      `;
      mainBtn.onclick = () => {
        if (this.mockEventHandlers?.mainButtonClicked) {
          this.mockEventHandlers.mainButtonClicked();
        }
      };
      this.mockContainer.appendChild(mainBtn);
    }
    mainBtn.style.display = 'block';
  }

  /**
   * Обновление текста mock главной кнопки
   */
  updateMockMainButton(text) {
    const mainBtn = this.mockContainer?.querySelector('#mock-main-btn');
    if (mainBtn) {
      mainBtn.textContent = text;
    }
  }

  /**
   * Скрытие mock главной кнопки
   */
  hideMockMainButton() {
    const mainBtn = this.mockContainer?.querySelector('#mock-main-btn');
    if (mainBtn) {
      mainBtn.style.display = 'none';
    }
  }

  /**
   * Показ mock кнопки назад
   */
  showMockBackButton() {
    if (!this.mockContainer) return;
    
    let backBtn = this.mockContainer.querySelector('#mock-back-btn');
    if (!backBtn) {
      backBtn = document.createElement('button');
      backBtn.id = 'mock-back-btn';
      backBtn.textContent = '← Назад';
      backBtn.style.cssText = `
        background: #666;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      `;
      backBtn.onclick = () => {
        if (this.mockEventHandlers?.backButtonClicked) {
          this.mockEventHandlers.backButtonClicked();
        }
      };
      this.mockContainer.appendChild(backBtn);
    }
    backBtn.style.display = 'block';
  }

  /**
   * Скрытие mock кнопки назад
   */
  hideMockBackButton() {
    const backBtn = this.mockContainer?.querySelector('#mock-back-btn');
    if (backBtn) {
      backBtn.style.display = 'none';
    }
  }

  /**
   * Инициализация роутера
   * @returns {Promise<void>}
   */
  async initializeRouter() {
    await Router.initialize();
  }

  /**
   * Настройка глобальных обработчиков событий
   */
  setupGlobalHandlers() {
    // Обработка ошибок JavaScript
    window.addEventListener('error', (event) => {
      console.error('JavaScript ошибка:', event.error);
      this.handleError(event.error);
    });

    // Обработка Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled Promise rejection:', event.reason);
      this.handleError(event.reason);
    });

    // Обработка изменения видимости страницы
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.onAppPause();
      } else {
        this.onAppResume();
      }
    });

    // Обработка изменения online/offline статуса
    window.addEventListener('online', () => {
      Utils.showNotification('Соединение восстановлено', 'success');
    });

    window.addEventListener('offline', () => {
      Utils.showNotification('Нет соединения с интернетом', 'warning');
    });

    // Обработка beforeunload
    window.addEventListener('beforeunload', () => {
      this.onAppUnload();
    });
  }

  /**
   * Настройка отзывчивости интерфейса
   */
  setupResponsiveness() {
    // Обработка изменения размеров экрана
    const handleResize = Utils.throttle(() => {
      this.updateViewportSize();
    }, 100);

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Начальная настройка
    this.updateViewportSize();

    // Обработка изменений viewport в Telegram
    if (TelegramManager && typeof TelegramManager.isReady === 'function' && TelegramManager.isReady()) {
      TelegramManager.addEventListener('viewportChanged', () => {
        this.updateViewportSize();
      });
    }
  }

  /**
   * Обновление размеров viewport
   */
  updateViewportSize() {
    if (this.debug) {
      console.log('📐 Обновление размеров viewport');
      console.log('   - TelegramManager доступен:', !!window.TelegramManager);
      console.log('   - TelegramManager.isReady доступен:', typeof window.TelegramManager?.isReady);
    }
    
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // Обновляем CSS переменные для viewport
    let viewportSize;
    
    if (TelegramManager && typeof TelegramManager.isReady === 'function' && TelegramManager.isReady()) {
      viewportSize = TelegramManager.getViewportSize();
      if (this.debug) {
        console.log('   - Используем Telegram viewport:', viewportSize);
      }
    } else {
      viewportSize = { width: window.innerWidth, height: window.innerHeight };
      if (this.debug) {
        console.log('   - Используем обычный viewport:', viewportSize);
      }
    }

    document.documentElement.style.setProperty('--viewport-width', `${viewportSize.width}px`);
    document.documentElement.style.setProperty('--viewport-height', `${viewportSize.height}px`);
  }

  /**
   * Обработка паузы приложения
   */
  onAppPause() {
    if (this.debug) {
      console.log('App paused');
    }
    
    // Сохраняем состояние приложения
    this.saveAppState();
  }

  /**
   * Обработка возобновления приложения
   */
  onAppResume() {
    if (this.debug) {
      console.log('App resumed');
    }
    
    // Восстанавливаем состояние приложения
    this.restoreAppState();
  }

  /**
   * Обработка выгрузки приложения
   */
  onAppUnload() {
    if (this.debug) {
      console.log('App unloading');
    }
    
    // Финальное сохранение состояния
    this.saveAppState();
  }

  /**
   * Сохранение состояния приложения
   */
  saveAppState() {
    try {
      const state = {
        currentStep: Router.getCurrentStep(),
        timestamp: Utils.getCurrentTimestamp(),
        userData: Router.getUserData()
      };

      Utils.saveToStorage('appState', state);
    } catch (error) {
      console.error('Ошибка сохранения состояния приложения:', error);
    }
  }

  /**
   * Восстановление состояния приложения
   */
  restoreAppState() {
    try {
      const state = Utils.getFromStorage('appState');
      if (state) {
        if (this.debug) {
          console.log('Восстановлено состояние приложения:', state);
        }
      }
    } catch (error) {
      console.error('Ошибка восстановления состояния приложения:', error);
    }
  }

  /**
   * Обработка обычных ошибок
   * @param {Error} error Ошибка
   */
  handleError(error) {
    if (this.debug) {
      console.error('Обработка ошибки:', error);
    }

    // Отправляем ошибку в систему мониторинга (если есть)
    this.reportError(error);

    // Показываем пользователю уведомление
    Utils.showNotification('Произошла ошибка, попробуйте еще раз', 'error');
  }

  /**
   * Обработка критических ошибок
   * @param {Error} error Критическая ошибка
   */
  handleCriticalError(error) {
    console.error('Критическая ошибка:', error);
    
    // Показываем экран ошибки
    const errorScreen = this.createErrorScreen(error.message);
    const container = document.getElementById('screen-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(errorScreen);
    }

    // Отправляем критическую ошибку
    this.reportError(error, true);
  }

  /**
   * Создание экрана ошибки
   * @param {string} message Сообщение об ошибке
   * @returns {HTMLElement} DOM элемент экрана ошибки
   */
  createErrorScreen(message) {
    const screen = document.createElement('div');
    screen.className = 'screen screen--centered';
    screen.innerHTML = `
      <div class="card">
        <div class="card__header">
          <h1 class="card__title">Произошла ошибка</h1>
        </div>
        <div class="card__content">
          <p class="text-secondary">${message}</p>
        </div>
        <div class="card__footer">
          <button class="btn btn--primary btn--full" onclick="location.reload()">
            Перезагрузить приложение
          </button>
        </div>
      </div>
    `;
    return screen;
  }

  /**
   * Отправка ошибки в систему мониторинга
   * @param {Error} error Ошибка
   * @param {boolean} isCritical Критическая ли ошибка
   */
  reportError(error, isCritical = false) {
    try {
      // TODO: Интеграция с системой мониторинга ошибок
      const errorData = {
        message: error.message,
        stack: error.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Utils.getCurrentTimestamp(),
        userId: Utils.getTelegramId(),
        appVersion: this.version,
        isCritical
      };

      if (this.debug) {
        console.log('Error report:', errorData);
      }

      // В продакшене здесь будет отправка на сервер мониторинга
    } catch (reportError) {
      console.error('Ошибка отправки отчета об ошибке:', reportError);
    }
  }

  /**
   * Получение информации о приложении
   * @returns {Object} Информация о приложении
   */
  getAppInfo() {
    return {
      version: this.version,
      isInitialized: this.isInitialized,
      debug: this.debug,
      telegramSupported: Utils.isTelegramWebAppSupported(),
      runningInTelegram: Utils.isRunningInTelegram()
    };
  }
}

// Создаем глобальный экземпляр приложения
const app = new SmokyApp();

// Экспорт для использования в других модулях
window.SmokyApp = app;

// Автоматический запуск приложения
(async () => {
  try {
    await app.initialize();
  } catch (error) {
    console.error('Фатальная ошибка запуска приложения:', error);
  }
})();
