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
    // Определяем debug режим только по hostname в конструкторе
    // Окончательное определение среды будет в initializeTelegram()
    this.debug = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1';
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
   * Инициализация Telegram WebApp согласно документации Telegram Mini Apps
   * @returns {Promise<void>}
   */
  async initializeTelegram() {
    console.log('🔄 Инициализация Telegram WebApp...');
    
    // Проверяем наличие Telegram WebApp API
    const hasTelegramAPI = !!(window.Telegram?.WebApp);
    const initData = window.Telegram?.WebApp?.initData;
    const hasValidInitData = initData && initData !== '';
    
    // Определяем рабочую среду
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isInTelegram = hasTelegramAPI && hasValidInitData;
    
    console.log('   - Telegram API доступен:', hasTelegramAPI);
    console.log('   - InitData присутствует:', !!initData);
    console.log('   - InitData валидные:', hasValidInitData);
    console.log('   - Локальная разработка:', isLocalDev);
    console.log('   - Запущено в Telegram:', isInTelegram);
    
    // Если локальная разработка или нет Telegram API
    if (isLocalDev || !hasTelegramAPI) {
      console.warn('🔧 Переходим в режим разработки');
      await this.setupDevelopmentMode();
      return;
    }
    
    try {
      // Инициализируем TelegramManager
      if (!window.TelegramManager) {
        throw new Error('TelegramManager не загружен');
      }
      
      console.log('   - Инициализируем TelegramManager...');
      const telegramInitialized = await window.TelegramManager.initialize();
      
      if (!telegramInitialized) {
        throw new Error('TelegramManager не удалось инициализировать');
      }
      
      // Важно: вызываем ready() ТОЛЬКО после полной инициализации!
      console.log('   - Вызываем Telegram.WebApp.ready()...');
      window.Telegram.WebApp.ready();
      
      console.log('✅ Telegram WebApp инициализирован успешно');
    } catch (error) {
      console.error('❌ Ошибка инициализации Telegram WebApp:', error);
      console.warn('⚠️ Переходим в режим разработки из-за ошибки');
      await this.setupDevelopmentMode();
    }
  }

  /**
   * Показ ошибки недоступности TelegramManager
   */
  showTelegramManagerError() {
    console.error('💥 Показываем ошибку недоступности TelegramManager');
    
    const container = document.getElementById('screen-container');
    if (container) {
      container.innerHTML = `
        <div class="screen screen--centered" style="padding: var(--spacing-6); text-align: center;">
          <div style="background: var(--color-surface); padding: var(--spacing-6); border-radius: var(--radius-lg); box-shadow: var(--shadow-2);">
            <div style="font-size: 64px; margin-bottom: var(--spacing-4);">⚠️</div>
            <h1 style="color: var(--color-error); margin-bottom: var(--spacing-4); font-size: var(--font-size-xl);">
              TelegramManager недоступен
            </h1>
            <p style="color: var(--color-text-secondary); margin-bottom: var(--spacing-6); line-height: var(--line-height-relaxed);">
              Произошла ошибка при загрузке компонентов приложения. 
              Убедитесь, что у вас установлена последняя версия Telegram и попробуйте перезапустить приложение.
            </p>
            <div style="margin-bottom: var(--spacing-6); padding: var(--spacing-4); background: var(--color-surface-variant); border-radius: var(--radius-md);">
              <h3 style="margin-bottom: var(--spacing-3); color: var(--color-text-primary);">Возможные решения:</h3>
              <ul style="text-align: left; margin: 0; color: var(--color-text-secondary);">
                <li style="margin-bottom: var(--spacing-2);">• <strong>Обновите Telegram</strong> до последней версии</li>
                <li style="margin-bottom: var(--spacing-2);">• <strong>Windows пользователи:</strong> установите Microsoft Edge WebView2</li>
                <li style="margin-bottom: var(--spacing-2);">• <strong>Мобильные устройства:</strong> освободите память и перезапустите Telegram</li>
                <li style="margin-bottom: var(--spacing-2);">• Отключите VPN и блокировщики рекламы</li>
                <li style="margin-bottom: var(--spacing-2);">• Очистите кэш Telegram</li>
                <li>• Попробуйте через 30-60 секунд еще раз</li>
              </ul>
            </div>
            <div style="margin-bottom: var(--spacing-4); padding: var(--spacing-3); background: var(--color-warning-bg, #fff3cd); border: 1px solid var(--color-warning, #ffc107); border-radius: var(--radius-md);">
              <p style="margin: 0; font-size: var(--font-size-sm); color: var(--color-warning-text, #856404);">
                <strong>Для Windows 10/11:</strong> Скачайте WebView2 с сайта 
                <a href="https://developer.microsoft.com/microsoft-edge/webview2/" target="_blank" style="color: var(--color-primary);">
                  Microsoft
                </a>
              </p>
            </div>
            <button 
              onclick="location.reload()" 
              style="
                background: var(--color-primary);
                color: var(--color-text-inverse);
                border: none;
                padding: var(--spacing-3) var(--spacing-6);
                border-radius: var(--radius-md);
                font-size: var(--font-size-base);
                cursor: pointer;
                transition: var(--transition-fast);
                margin-right: var(--spacing-3);
              "
              onmouseover="this.style.background='var(--color-primary-dark)'"
              onmouseout="this.style.background='var(--color-primary)'"
            >
              Перезагрузить
            </button>
            <button 
              onclick="window.Telegram?.WebApp?.close?.()" 
              style="
                background: var(--color-surface-variant);
                color: var(--color-text-secondary);
                border: 1px solid var(--color-border);
                padding: var(--spacing-3) var(--spacing-6);
                border-radius: var(--radius-md);
                font-size: var(--font-size-base);
                cursor: pointer;
                transition: var(--transition-fast);
              "
              onmouseover="this.style.background='var(--color-surface-hover)'"
              onmouseout="this.style.background='var(--color-surface-variant)'"
            >
              Закрыть
            </button>
          </div>
        </div>
      `;
    }
    
    // Также скрываем загрузку
    Utils.toggleLoading(false);
  }

  /**
   * Настройка режима разработки
   */
  async setupDevelopmentMode() {
    console.log('🔧 Режим разработки: настройка mock Telegram WebApp');
    
    // Создаем mock объект для эмуляции Telegram WebApp
    window.Telegram = {
      WebApp: {
        ready: () => console.log('📱 Mock: WebApp ready'),
        expand: () => console.log('📱 Mock: WebApp expand'),
        close: () => console.log('📱 Mock: WebApp close'),
        sendData: (data) => console.log('📱 Mock sendData:', data),
        disableVerticalSwipes: () => console.log('📱 Mock: disableVerticalSwipes'),
        setHeaderColor: (color) => console.log('📱 Mock: setHeaderColor:', color),
        setBackgroundColor: (color) => console.log('📱 Mock: setBackgroundColor:', color),
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
    
    // Ждем инициализации TelegramManager используя глобальную функцию
    const telegramManagerReady = await window.waitForTelegramManager();
    
    // Принудительно настраиваем TelegramManager для режима разработки
    if (telegramManagerReady && window.TelegramManager) {
      // Устанавливаем mock данные в TelegramManager
      window.TelegramManager.webApp = window.Telegram.WebApp;
      window.TelegramManager.user = window.Telegram.WebApp.initDataUnsafe.user;
      window.TelegramManager.initData = window.Telegram.WebApp.initData;
      window.TelegramManager.isInitialized = true;
      
      console.log('✅ TelegramManager настроен для режима разработки');
      console.log('   - webApp:', !!window.TelegramManager.webApp);
      console.log('   - user:', window.TelegramManager.user);
      console.log('   - isInitialized:', window.TelegramManager.isInitialized);
    } else {
      console.warn('⚠️ TelegramManager не найден даже в режиме разработки');
      console.warn('   - Создаем минимальный TelegramManager stub...');
      
      // Создаем минимальный stub для TelegramManager
      window.TelegramManager = {
        webApp: window.Telegram.WebApp,
        user: window.Telegram.WebApp.initDataUnsafe.user,
        initData: window.Telegram.WebApp.initData,
        isInitialized: true,
        isReady: () => true,
        isRunningInTelegram: () => false,
        initialize: async () => true,
        showMainButton: () => console.log('🔘 Stub: showMainButton'),
        hideMainButton: () => console.log('🔘 Stub: hideMainButton'),
        updateMainButtonText: (text) => console.log('🔘 Stub: updateMainButtonText:', text),
        setMainButtonEnabled: (enabled) => console.log('🔘 Stub: setMainButtonEnabled:', enabled),
        showBackButton: () => console.log('◀️ Stub: showBackButton'),
        hideBackButton: () => console.log('◀️ Stub: hideBackButton'),
        hapticFeedback: (type) => console.log('📳 Stub: hapticFeedback:', type),
        addEventListener: (event, handler) => console.log('📡 Stub: addEventListener:', event),
        removeEventListener: (event, handler) => console.log('📡 Stub: removeEventListener:', event),
        sendData: (data) => console.log('📱 Stub: sendData:', data),
        close: () => console.log('📱 Stub: close'),
        getUserData: () => window.Telegram.WebApp.initDataUnsafe.user,
        getUserId: () => window.Telegram.WebApp.initDataUnsafe.user.id,
        getViewportSize: () => ({ width: window.innerWidth, height: window.innerHeight }),
        isVersionAtLeast: () => true,
        getThemeParams: () => ({})
      };
      
      console.log('✅ Минимальный TelegramManager stub создан');
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
    if (window.TelegramManager && typeof window.TelegramManager.isReady === 'function' && window.TelegramManager.isReady()) {
      window.TelegramManager.addEventListener('viewportChanged', () => {
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
    
    if (window.TelegramManager && typeof window.TelegramManager.isReady === 'function' && window.TelegramManager.isReady()) {
      viewportSize = window.TelegramManager.getViewportSize();
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

// Приложение готово к использованию
console.log('🚀 SmokyApp загружен и готов к инициализации');
