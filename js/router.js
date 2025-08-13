/**
 * Система навигации и управления экранами для SmokyApp
 * Роутер для переключения между экранами прогрева
 */

/**
 * Базовый класс экрана
 */
class BaseScreen {
  constructor(name, config = {}) {
    this.name = name;
    this.title = config.title || name;
    this.hasMainButton = config.hasMainButton !== false;
    this.hasBackButton = config.hasBackButton !== false;
    this.mainButtonText = config.mainButtonText || 'Продолжить';
    this.isLoaded = false;
    this.container = null;
    this.data = {};
    
    // Привязка методов к контексту
    this.handleMainButton = this.handleMainButton.bind(this);
    this.handleBackButton = this.handleBackButton.bind(this);
  }

  /**
   * Загрузка экрана (HTML, CSS, JS)
   * @returns {Promise<void>}
   */
  async load() {
    if (this.isLoaded) return;

    try {
      let html;
      
      try {
        // Пытаемся загрузить HTML файл экрана
        const htmlResponse = await fetch(`screens/${this.name}/${this.name}.html`);
        if (!htmlResponse.ok) throw new Error(`HTML файл не найден: ${this.name}`);
        html = await htmlResponse.text();
      } catch (htmlError) {
        console.warn(`⚠️ Не удалось загрузить HTML для экрана ${this.name}, используем fallback`);
        html = this.generateFallbackHTML();
      }

      // Пытаемся загрузить CSS (не критично если не получится)
      try {
        await this.loadCSS();
      } catch (cssError) {
        console.warn(`⚠️ Не удалось загрузить CSS для экрана ${this.name}:`, cssError);
      }

      // Создаем контейнер экрана
      this.container = document.createElement('div');
      this.container.className = 'screen';
      this.container.innerHTML = html;

      // Пытаемся загрузить JS логику экрана (не критично если не получится)
      try {
        await this.loadJS();
      } catch (jsError) {
        console.warn(`⚠️ Не удалось загрузить JS для экрана ${this.name}:`, jsError);
      }

      this.isLoaded = true;
    } catch (error) {
      console.error(`❌ Критическая ошибка загрузки экрана ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Генерация fallback HTML для экрана
   * @returns {string} HTML содержимое
   */
  generateFallbackHTML() {
    const screenTitles = {
      'welcome': 'Добро пожаловать в SmokyApp!',
      'name-input': 'Как вас зовут?',
      'city-selection': 'Выберите ваш город',
      'progress-tracker': 'Ваш прогресс'
    };

    const screenDescriptions = {
      'welcome': 'Начните свой путь к жизни без курения',
      'name-input': 'Введите ваше имя для персонализации опыта',
      'city-selection': 'Выберите город для настройки часового пояса',
      'progress-tracker': 'Отслеживайте свой прогресс в отказе от курения'
    };

    const title = screenTitles[this.name] || `Экран: ${this.title}`;
    const description = screenDescriptions[this.name] || 'Данный экран временно недоступен';

    return `
      <div class="screen__header">
        <h1 class="screen__title">${title}</h1>
        <p class="screen__subtitle">${description}</p>
      </div>
      <div class="screen__content">
        <div class="card">
          <div class="card__content">
            ${this.generateScreenContent()}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Генерация содержимого экрана в зависимости от типа
   * @returns {string} HTML содержимое
   */
  generateScreenContent() {
    switch (this.name) {
      case 'welcome':
        return `
          <div class="text-center">
            <div style="font-size: 64px; margin-bottom: var(--spacing-4);">🚭</div>
            <p class="text-lg" style="margin-bottom: var(--spacing-6);">
              Присоединяйтесь к тысячам людей, которые уже начали свой путь к здоровой жизни.
            </p>
            <div style="background: var(--color-surface-variant); padding: var(--spacing-4); border-radius: var(--radius-lg);">
              <p class="text-sm text-secondary">
                ✅ Персональный план отказа от курения<br>
                ✅ Отслеживание прогресса<br>
                ✅ Мотивационная поддержка
              </p>
            </div>
          </div>
        `;
      
      case 'name-input':
        return `
          <div class="form-group">
            <label for="user-name" class="form-label">Ваше имя</label>
            <input 
              type="text" 
              id="user-name" 
              class="form-input" 
              placeholder="Введите ваше имя" 
              maxlength="50"
              autocomplete="given-name"
            />
            <div class="form-help">Это поможет нам персонализировать ваш опыт</div>
          </div>
        `;
      
      case 'city-selection':
        return `
          <div class="form-group">
            <label for="user-city" class="form-label">Ваш город</label>
            <input 
              type="text" 
              id="user-city" 
              class="form-input" 
              placeholder="Введите название города" 
              autocomplete="address-level2"
            />
            <div class="form-help">Нужно для настройки правильного времени уведомлений</div>
          </div>
        `;
      
      case 'progress-tracker':
        return `
          <div class="text-center">
            <div style="font-size: 48px; margin-bottom: var(--spacing-4);">🎯</div>
            <h3 style="margin-bottom: var(--spacing-6); color: var(--color-primary);">Отличная работа!</h3>
            <div style="background: var(--color-surface-variant); padding: var(--spacing-6); border-radius: var(--radius-lg); margin-bottom: var(--spacing-6);">
              <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-primary); margin-bottom: var(--spacing-2);">
                День 1
              </div>
              <p class="text-secondary">Вы начали свой путь!</p>
            </div>
          </div>
        `;
      
      default:
        return `
          <div class="text-center">
            <div style="font-size: 48px; margin-bottom: var(--spacing-4);">⚙️</div>
            <p class="text-secondary">Экран находится в разработке</p>
          </div>
        `;
    }
  }

  /**
   * Загрузка CSS файла экрана
   * @returns {Promise<void>}
   */
  async loadCSS() {
    return new Promise((resolve, reject) => {
      const existingLink = document.querySelector(`link[href*="${this.name}.css"]`);
      if (existingLink) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `screens/${this.name}/${this.name}.css`;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`CSS файл не найден: ${this.name}`));
      document.head.appendChild(link);
    });
  }

  /**
   * Загрузка JS файла экрана
   * @returns {Promise<void>}
   */
  async loadJS() {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src*="${this.name}.js"]`);
      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `screens/${this.name}/${this.name}.js`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`JS файл не найден: ${this.name}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Показ экрана
   * @returns {Promise<void>}
   */
  async show() {
    console.log(`📺 Показываем экран: ${this.name}`);
    
    if (!this.isLoaded) {
      console.log('   - Экран не загружен, загружаем...');
      await this.load();
    }
    
    console.log('   - Состояние загрузки:', { isLoaded: this.isLoaded, hasContainer: !!this.container });

    // Очищаем контейнер и добавляем экран
    const screenContainer = document.getElementById('screen-container');
    if (!screenContainer) {
      throw new Error('Контейнер экранов не найден');
    }
    
    console.log('   - Очищаем контейнер экранов');
    screenContainer.innerHTML = '';
    
    if (!this.container) {
      throw new Error('Контейнер экрана не создан');
    }
    
    console.log('   - Добавляем экран в контейнер');
    console.log('   - HTML содержимое экрана:', this.container.innerHTML.substring(0, 200) + '...');
    screenContainer.appendChild(this.container);
    
    // Проверяем что контент добавился
    console.log('   - Контент добавлен, innerHTML длина:', screenContainer.innerHTML.length);

    // Настраиваем Telegram кнопки
    console.log('   - Настраиваем Telegram кнопки');
    try {
      this.setupTelegramButtons();
    } catch (buttonError) {
      console.warn('⚠️ Ошибка настройки Telegram кнопок:', buttonError);
    }

    // Инициализируем экран
    console.log('   - Инициализируем экран');
    try {
      await this.init();
    } catch (initError) {
      console.warn('⚠️ Ошибка инициализации экрана:', initError);
    }

    // Фокус на экране для accessibility
    try {
      this.container.focus();
    } catch (focusError) {
      console.warn('⚠️ Ошибка установки фокуса:', focusError);
    }
    
    console.log(`✅ Экран ${this.name} показан успешно`);
  }

  /**
   * Настройка Telegram кнопок
   */
  setupTelegramButtons() {
    console.log('🔘 Настройка Telegram кнопок');
    console.log('   - TelegramManager готов:', Utils.isTelegramManagerReady());
    
    if (!Utils.isTelegramManagerReady()) {
      console.warn('⚠️ TelegramManager не готов');
      return;
    }

    // Главная кнопка
    if (this.hasMainButton) {
      console.log('   - Настраиваем главную кнопку:', this.mainButtonText);
      Utils.safeTelegramManagerCall('showMainButton', [this.mainButtonText, this.isValid()]);
      Utils.safeTelegramManagerCall('addEventListener', ['mainButtonClicked', this.handleMainButton]);
    } else {
      console.log('   - Скрываем главную кнопку');
      Utils.safeTelegramManagerCall('hideMainButton');
    }

    // Кнопка назад
    if (this.hasBackButton && Router.canGoBack()) {
      console.log('   - Показываем кнопку назад');
      Utils.safeTelegramManagerCall('showBackButton');
      Utils.safeTelegramManagerCall('addEventListener', ['backButtonClicked', this.handleBackButton]);
    } else {
      console.log('   - Скрываем кнопку назад');
      Utils.safeTelegramManagerCall('hideBackButton');
    }
  }

  /**
   * Инициализация экрана после показа
   * Переопределяется в наследниках
   * @returns {Promise<void>}
   */
  async init() {
    // Базовая инициализация для fallback экранов
    this.setupInputHandlers();
  }

  /**
   * Настройка обработчиков ввода для fallback экранов
   */
  setupInputHandlers() {
    if (!this.container) return;

    // Обработчики для поля имени
    const nameInput = this.container.querySelector('#user-name');
    if (nameInput) {
      nameInput.addEventListener('input', () => {
        this.validateAndUpdateButton();
      });
      
      nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && this.isValid()) {
          this.handleMainButton();
        }
      });
    }

    // Обработчики для поля города
    const cityInput = this.container.querySelector('#user-city');
    if (cityInput) {
      cityInput.addEventListener('input', () => {
        this.validateAndUpdateButton();
      });
      
      cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && this.isValid()) {
          this.handleMainButton();
        }
      });
    }
  }

  /**
   * Валидация и обновление состояния главной кнопки
   */
  validateAndUpdateButton() {
    this.updateMainButton();
  }

  /**
   * Валидация данных экрана
   * Переопределяется в наследниках
   * @returns {boolean}
   */
  isValid() {
    // Базовая валидация для fallback экранов
    switch (this.name) {
      case 'name-input':
        const nameInput = this.container?.querySelector('#user-name');
        return nameInput && Utils.isValidName(nameInput.value);
      
      case 'city-selection':
        const cityInput = this.container?.querySelector('#user-city');
        return cityInput && cityInput.value.trim().length >= 2;
      
      default:
        return true;
    }
  }

  /**
   * Получение данных экрана для сохранения
   * Переопределяется в наследниках
   * @returns {Object}
   */
  getData() {
    // Сбор данных из fallback экранов
    const data = { ...this.data };
    
    switch (this.name) {
      case 'name-input':
        const nameInput = this.container?.querySelector('#user-name');
        if (nameInput) {
          data.name = nameInput.value.trim();
        }
        break;
      
      case 'city-selection':
        const cityInput = this.container?.querySelector('#user-city');
        if (cityInput) {
          data.city = cityInput.value.trim();
        }
        break;
    }
    
    return data;
  }

  /**
   * Обработчик главной кнопки
   * @returns {Promise<void>}
   */
  async handleMainButton() {
    if (!this.isValid()) {
      Utils.safeTelegramManagerCall('hapticFeedback', ['error']);
      return;
    }

    try {
      Utils.safeTelegramManagerCall('hapticFeedback', ['light']);
      await this.save();
      Router.nextScreen();
    } catch (error) {
      console.error('Ошибка при переходе на следующий экран:', error);
      Utils.safeTelegramManagerCall('hapticFeedback', ['error']);
      Utils.showNotification('Ошибка при сохранении данных', 'error');
    }
  }

  /**
   * Обработчик кнопки назад
   */
  handleBackButton() {
    Utils.safeTelegramManagerCall('hapticFeedback', ['light']);
    Router.goBack();
  }

  /**
   * Сохранение данных экрана
   * Переопределяется в наследниках
   * @returns {Promise<void>}
   */
  async save() {
    // Базовое сохранение данных для fallback экранов
    const data = this.getData();
    
    // Сохраняем в localStorage как fallback
    if (data && Object.keys(data).length > 0) {
      try {
        const currentData = Utils.getFromStorage('userData', {});
        const updatedData = { ...currentData, ...data };
        Utils.saveToStorage('userData', updatedData);
        console.log('✅ Данные сохранены локально:', data);
      } catch (error) {
        console.error('❌ Ошибка сохранения данных локально:', error);
      }
    }
  }

  /**
   * Очистка ресурсов при уходе с экрана
   */
  cleanup() {
    Utils.safeTelegramManagerCall('removeEventListener', ['mainButtonClicked', this.handleMainButton]);
    Utils.safeTelegramManagerCall('removeEventListener', ['backButtonClicked', this.handleBackButton]);
  }

  /**
   * Обновление состояния главной кнопки
   */
  updateMainButton() {
    if (!this.hasMainButton) return;
    Utils.safeTelegramManagerCall('setMainButtonEnabled', [this.isValid()]);
  }
}

/**
 * Менеджер роутинга между экранами
 */
class ScreenRouter {
  constructor() {
    this.screens = new Map();
    this.currentScreen = null;
    this.history = [];
    this.currentStep = 0;
    this.totalSteps = 20;
    this.userData = null;
    
    // Определение всех экранов приложения
    this.screenConfig = [
      { name: 'welcome', title: 'Добро пожаловать!' },
      { name: 'name-input', title: 'Как вас зовут?' },
      { name: 'city-selection', title: 'Выберите город' },
      { name: 'progress-tracker', title: 'Ваш прогресс' },
      // TODO: Добавить остальные экраны
    ];
  }

  /**
   * Инициализация роутера (упрощенная версия)
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log('🔄 Инициализация роутера начата');
      
      // Проверяем основные зависимости
      if (!window.Utils) {
        throw new Error('Utils не загружен');
      }
      
      if (!document.getElementById('screen-container')) {
        throw new Error('Контейнер экранов не найден');
      }
      
      console.log('   - Основные зависимости проверены');
      
      // Начинаем с базовых настроек - всегда с welcome экрана
      await this.startWithDefaults();
      
      console.log('✅ Инициализация роутера завершена успешно');
    } catch (error) {
      console.error('❌ Критическая ошибка инициализации роутера:', error);
      this.showEmergencyUI();
    }
  }

  /**
   * Запуск с настройками по умолчанию (упрощенная версия)
   * @returns {Promise<void>}
   */
  async startWithDefaults() {
    try {
      console.log('🔄 Запуск роутера с базовыми настройками');
      
      // Устанавливаем базовые данные
      this.currentStep = 0;
      this.userData = {
        isNewUser: true,
        currentStep: 0,
        user: null
      };
      
      // Обновляем прогресс-бар
      if (window.Utils?.updateProgressBar) {
        Utils.updateProgressBar(this.currentStep, this.totalSteps);
      }
      
      // Просто переходим на welcome экран
      console.log('🔄 Переходим на экран welcome');
      await this.navigateToScreen('welcome');
      
      console.log('✅ Роутер запущен');
    } catch (error) {
      console.error('❌ Ошибка запуска с базовыми настройками:', error);
      this.showEmergencyUI();
    }
  }

  /**
   * Показ аварийного UI при критических ошибках
   */
  showEmergencyUI() {
    const container = document.getElementById('screen-container');
    if (container) {
      container.innerHTML = `
        <div class="screen screen--centered" style="padding: var(--spacing-6); text-align: center;">
          <div style="background: var(--color-surface); padding: var(--spacing-6); border-radius: var(--radius-lg); box-shadow: var(--shadow-2);">
            <h1 style="color: var(--color-error); margin-bottom: var(--spacing-4); font-size: var(--font-size-xl);">
              Ошибка загрузки
            </h1>
            <p style="color: var(--color-text-secondary); margin-bottom: var(--spacing-6); line-height: var(--line-height-relaxed);">
              Произошла ошибка при инициализации приложения. Попробуйте перезагрузить страницу.
            </p>
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
              "
              onmouseover="this.style.background='var(--color-primary-dark)'"
              onmouseout="this.style.background='var(--color-primary)'"
            >
              Перезагрузить
            </button>
          </div>
        </div>
      `;
    }
  }

  /**
   * Получение имени экрана по номеру шага
   * @param {number} step Номер шага
   * @returns {string} Имя экрана
   */
  getScreenNameByStep(step) {
    if (step >= this.screenConfig.length) {
      return this.screenConfig[this.screenConfig.length - 1].name;
    }
    return this.screenConfig[step]?.name || 'welcome';
  }

  /**
   * Регистрация экрана
   * @param {BaseScreen} screen Экземпляр экрана
   */
  registerScreen(screen) {
    this.screens.set(screen.name, screen);
  }

  /**
   * Переход на указанный экран (упрощенная версия)
   * @param {string} screenName Имя экрана
   * @returns {Promise<void>}
   */
  async navigateToScreen(screenName) {
    try {
      console.log(`🔄 Переход на экран: ${screenName}`);
      
      // Показываем загрузку
      if (window.Utils?.toggleLoading) {
        Utils.toggleLoading(true, 'Загрузка экрана...');
      }

      // Получаем контейнер экранов
      const screenContainer = document.getElementById('screen-container');
      if (!screenContainer) {
        throw new Error('Контейнер экранов не найден');
      }

      // Очищаем текущий экран
      if (this.currentScreen?.cleanup) {
        try {
          this.currentScreen.cleanup();
        } catch (cleanupError) {
          console.warn('⚠️ Ошибка очистки экрана:', cleanupError);
        }
      }

      // Получаем или создаем экран
      let screen = this.screens.get(screenName);
      if (!screen) {
        const config = this.screenConfig.find(s => s.name === screenName) || { name: screenName, title: screenName };
        screen = new BaseScreen(screenName, config);
        this.registerScreen(screen);
        console.log('   - Новый экран создан:', screenName);
      }

      // Показываем экран
      await screen.show();
      
      // Обновляем состояние
      this.currentScreen = screen;
      if (!this.history.includes(screenName)) {
        this.history.push(screenName);
      }

      // Обновляем прогресс-бар
      const stepIndex = this.screenConfig.findIndex(s => s.name === screenName);
      if (stepIndex !== -1 && window.Utils?.updateProgressBar) {
        Utils.updateProgressBar(stepIndex, this.totalSteps);
      }

      console.log(`✅ Экран ${screenName} загружен успешно`);

    } catch (error) {
      console.error(`❌ Ошибка загрузки экрана ${screenName}:`, error);
      this.showEmergencyUI();
    } finally {
      if (window.Utils?.toggleLoading) {
        Utils.toggleLoading(false);
      }
    }
  }

  /**
   * Переход на следующий экран
   * @returns {Promise<void>}
   */
  async nextScreen() {
    const currentIndex = this.screenConfig.findIndex(s => s.name === this.currentScreen?.name);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < this.screenConfig.length) {
      this.currentStep = nextIndex;
      const nextScreenName = this.screenConfig[nextIndex].name;
      await this.navigateToScreen(nextScreenName);
    } else {
      // Достигли конца прогрева
      await this.completeOnboarding();
    }
  }

  /**
   * Возврат на предыдущий экран
   * @returns {Promise<void>}
   */
  async goBack() {
    if (this.history.length <= 1) return;
    
    // Удаляем текущий экран из истории
    this.history.pop();
    
    // Получаем предыдущий экран
    const previousScreenName = this.history[this.history.length - 1];
    
    // Переходим на предыдущий экран
    await this.navigateToScreen(previousScreenName);
  }

  /**
   * Проверка возможности возврата назад
   * @returns {boolean}
   */
  canGoBack() {
    return this.history.length > 1;
  }

  /**
   * Завершение прогрева
   * @returns {Promise<void>}
   */
  async completeOnboarding() {
    try {
      // Отправляем данные боту о завершении прогрева
      Utils.safeTelegramManagerCall('sendData', [{
        action: 'onboarding_completed',
        userId: Utils.getTelegramId(),
        completedAt: Utils.getCurrentTimestamp()
      }]);

      Utils.showNotification('Прогрев завершен успешно!', 'success');
      
      // Закрываем WebApp
      setTimeout(() => {
        Utils.safeTelegramManagerCall('close');
      }, 2000);

    } catch (error) {
      console.error('Ошибка завершения прогрева:', error);
      Utils.showNotification('Ошибка завершения прогрева', 'error');
    }
  }

  /**
   * Получение текущего экрана
   * @returns {BaseScreen|null}
   */
  getCurrentScreen() {
    return this.currentScreen;
  }

  /**
   * Получение текущего шага
   * @returns {number}
   */
  getCurrentStep() {
    return this.currentStep;
  }

  /**
   * Получение данных пользователя
   * @returns {Object|null}
   */
  getUserData() {
    return this.userData;
  }
}

// Создаем глобальный экземпляр роутера
const router = new ScreenRouter();

// Экспорт для использования в других модулях
window.Router = router;
window.BaseScreen = BaseScreen;
