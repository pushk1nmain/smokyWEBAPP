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
      // Загружаем HTML
      const htmlResponse = await fetch(`screens/${this.name}/${this.name}.html`);
      if (!htmlResponse.ok) throw new Error(`HTML файл не найден: ${this.name}`);
      const html = await htmlResponse.text();

      // Загружаем CSS
      await this.loadCSS();

      // Создаем контейнер экрана
      this.container = document.createElement('div');
      this.container.className = 'screen';
      this.container.innerHTML = html;

      // Загружаем JS логику экрана
      await this.loadJS();

      this.isLoaded = true;
    } catch (error) {
      console.error(`Ошибка загрузки экрана ${this.name}:`, error);
      throw error;
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
    if (!this.isLoaded) {
      await this.load();
    }

    // Очищаем контейнер и добавляем экран
    const screenContainer = document.getElementById('screen-container');
    screenContainer.innerHTML = '';
    screenContainer.appendChild(this.container);

    // Настраиваем Telegram кнопки
    this.setupTelegramButtons();

    // Инициализируем экран
    await this.init();

    // Фокус на экране для accessibility
    this.container.focus();
  }

  /**
   * Настройка Telegram кнопок
   */
  setupTelegramButtons() {
    console.log('🔘 Настройка Telegram кнопок');
    console.log('   - TelegramManager доступен:', !!window.TelegramManager);
    console.log('   - TelegramManager.isReady доступен:', typeof window.TelegramManager?.isReady);
    
    if (!TelegramManager?.isReady) {
      console.warn('⚠️ TelegramManager.isReady недоступен');
      return;
    }
    
    const isReady = TelegramManager.isReady();
    console.log('   - TelegramManager готов:', isReady);
    
    if (!isReady) {
      console.warn('⚠️ TelegramManager не готов');
      return;
    }

    // Главная кнопка
    if (this.hasMainButton) {
      console.log('   - Настраиваем главную кнопку:', this.mainButtonText);
      TelegramManager.showMainButton(this.mainButtonText, this.isValid());
      TelegramManager.addEventListener('mainButtonClicked', this.handleMainButton);
    } else {
      console.log('   - Скрываем главную кнопку');
      TelegramManager.hideMainButton();
    }

    // Кнопка назад
    if (this.hasBackButton && Router.canGoBack()) {
      console.log('   - Показываем кнопку назад');
      TelegramManager.showBackButton();
      TelegramManager.addEventListener('backButtonClicked', this.handleBackButton);
    } else {
      console.log('   - Скрываем кнопку назад');
      TelegramManager.hideBackButton();
    }
  }

  /**
   * Инициализация экрана после показа
   * Переопределяется в наследниках
   * @returns {Promise<void>}
   */
  async init() {
    // Базовая инициализация
  }

  /**
   * Валидация данных экрана
   * Переопределяется в наследниках
   * @returns {boolean}
   */
  isValid() {
    return true;
  }

  /**
   * Получение данных экрана для сохранения
   * Переопределяется в наследниках
   * @returns {Object}
   */
  getData() {
    return this.data;
  }

  /**
   * Обработчик главной кнопки
   * @returns {Promise<void>}
   */
  async handleMainButton() {
    if (!this.isValid()) {
      TelegramManager.hapticFeedback('error');
      return;
    }

    try {
      TelegramManager.hapticFeedback('light');
      await this.save();
      Router.nextScreen();
    } catch (error) {
      console.error('Ошибка при переходе на следующий экран:', error);
      TelegramManager.hapticFeedback('error');
      Utils.showNotification('Ошибка при сохранении данных', 'error');
    }
  }

  /**
   * Обработчик кнопки назад
   */
  handleBackButton() {
    TelegramManager.hapticFeedback('light');
    Router.goBack();
  }

  /**
   * Сохранение данных экрана
   * Переопределяется в наследниках
   * @returns {Promise<void>}
   */
  async save() {
    // Базовое сохранение данных
  }

  /**
   * Очистка ресурсов при уходе с экрана
   */
  cleanup() {
    if (TelegramManager.isReady()) {
      TelegramManager.removeEventListener('mainButtonClicked', this.handleMainButton);
      TelegramManager.removeEventListener('backButtonClicked', this.handleBackButton);
    }
  }

  /**
   * Обновление состояния главной кнопки
   */
  updateMainButton() {
    if (!this.hasMainButton || !TelegramManager.isReady()) return;
    TelegramManager.setMainButtonEnabled(this.isValid());
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
   * Инициализация роутера
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log('🔄 Инициализация роутера начата');
      
      // Проверяем доступность зависимостей
      console.log('   - Utils доступен:', !!window.Utils);
      console.log('   - API доступен:', !!window.API);
      console.log('   - API.initializeUser доступен:', typeof window.API?.initializeUser);
      
      // Получаем Telegram ID
      const telegramId = Utils.getTelegramId();
      console.log('   - Telegram ID получен:', telegramId);
      
      if (!telegramId) {
        throw new Error('Telegram ID недоступен');
      }

      // Инициализируем пользователя
      console.log('   - Инициализируем пользователя...');
      const initResult = await API.initializeUser(telegramId);
      console.log('   - Результат инициализации:', initResult);
      
      this.userData = initResult;
      this.currentStep = initResult.currentStep;

      // Определяем стартовый экран
      const startScreenName = this.getScreenNameByStep(this.currentStep);
      console.log('   - Стартовый экран:', startScreenName, 'для шага', this.currentStep);
      
      // Обновляем прогресс-бар
      Utils.updateProgressBar(this.currentStep, this.totalSteps);

      // Переходим на стартовый экран
      console.log('   - Переходим на стартовый экран...');
      await this.navigateToScreen(startScreenName);
      
      console.log('✅ Инициализация роутера завершена успешно');

    } catch (error) {
      console.error('❌ Ошибка инициализации роутера:', error);
      Utils.showNotification('Ошибка инициализации приложения', 'error');
      
      // Fallback на экран приветствия
      console.log('🔄 Fallback на экран приветствия');
      await this.navigateToScreen('welcome');
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
   * Переход на указанный экран
   * @param {string} screenName Имя экрана
   * @returns {Promise<void>}
   */
  async navigateToScreen(screenName) {
    try {
      Utils.toggleLoading(true, 'Загрузка экрана...');

      // Очистка текущего экрана
      if (this.currentScreen) {
        this.currentScreen.cleanup();
      }

      // Получение или создание экрана
      let screen = this.screens.get(screenName);
      if (!screen) {
        const config = this.screenConfig.find(s => s.name === screenName);
        screen = new BaseScreen(screenName, config);
        this.registerScreen(screen);
      }

      // Показ экрана
      await screen.show();
      
      // Обновление состояния
      this.currentScreen = screen;
      this.history.push(screenName);

      // Обновление прогресс-бара
      const stepIndex = this.screenConfig.findIndex(s => s.name === screenName);
      if (stepIndex !== -1) {
        Utils.updateProgressBar(stepIndex, this.totalSteps);
      }

    } catch (error) {
      console.error(`Ошибка навигации на экран ${screenName}:`, error);
      Utils.showNotification('Ошибка загрузки экрана', 'error');
    } finally {
      Utils.toggleLoading(false);
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
      if (TelegramManager.isReady()) {
        TelegramManager.sendData({
          action: 'onboarding_completed',
          userId: Utils.getTelegramId(),
          completedAt: Utils.getCurrentTimestamp()
        });
      }

      Utils.showNotification('Прогрев завершен успешно!', 'success');
      
      // Закрываем WebApp
      setTimeout(() => {
        TelegramManager.close();
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
