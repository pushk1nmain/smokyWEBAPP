/**
 * Логика приветственного экрана с персонажем Смоки
 * Первый экран в Telegram Web App для знакомства с приложением
 */

/**
 * Класс приветственного экрана
 */
class WelcomeScreen extends BaseScreen {
  constructor() {
    super('welcome', {
      title: 'Меня зовут Смоки',
      hasMainButton: false, // Используем кастомную кнопку
      hasBackButton: false
    });
    
    this.animationTimeout = null;
    this.isInitialized = false;
  }

  /**
   * Инициализация экрана после показа
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized) return;
    
    try {
      // Настройка Telegram Web App
      this.setupTelegramWebApp();
      
      // Анимация появления элементов
      await this.animateElements();
      
      // Настройка интерактивности
      this.setupInteractions();
      
      // Получение данных пользователя из Telegram
      this.loadUserData();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Ошибка инициализации экрана приветствия:', error);
    }
  }

  /**
   * Настройка Telegram Web App API
   */
  setupTelegramWebApp() {
    if (!window.Telegram?.WebApp) {
      console.warn('Telegram Web App API недоступен');
      return;
    }

    const webApp = window.Telegram.WebApp;
    
    // Расширяем viewport до полного размера
    webApp.expand();
    
    // Настраиваем цвета темы
    webApp.setHeaderColor('#C6FFDD');
    webApp.setBackgroundColor('#FFFFFF');
    
    // Показываем, что приложение готово
    webApp.ready();
    
    // Отправляем событие готовности
    this.trackInteraction('telegram_app_ready', {
      version: webApp.version,
      platform: webApp.platform,
      color_scheme: webApp.colorScheme
    });
  }

  /**
   * Анимация элементов экрана с временными задержками
   * @returns {Promise<void>}
   */
  async animateElements() {
    return new Promise((resolve) => {
      const smokyCharacter = this.container.querySelector('.smoky-character');
      const title = this.container.querySelector('.welcome-title');
      const description = this.container.querySelector('.welcome-description');
      const button = this.container.querySelector('.start-button');
      
      // Последовательная анимация появления элементов
      const elements = [smokyCharacter, title, description, button];
      
      elements.forEach((element, index) => {
        if (element) {
          setTimeout(() => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            
            // Запускаем анимацию появления
            setTimeout(() => {
              element.style.opacity = '1';
              element.style.transform = 'translateY(0)';
            }, 50);
          }, index * 200);
        }
      });
      
      // Завершаем анимацию через время последнего элемента
      setTimeout(() => {
        resolve();
      }, elements.length * 200 + 600);
    });
  }

  /**
   * Настройка интерактивности
   */
  setupInteractions() {
    const startButton = this.container.querySelector('.start-button');
    const smokyImage = this.container.querySelector('.smoky-image');
    
    // Обработчик для кнопки старта
    if (startButton) {
      startButton.addEventListener('click', this.handleStartClick.bind(this));
      startButton.addEventListener('keydown', this.handleStartKeyDown.bind(this));
    }
    
    // Интерактивность персонажа Смоки
    if (smokyImage) {
      smokyImage.addEventListener('click', this.handleSmokyClick.bind(this));
      smokyImage.style.cursor = 'pointer';
      smokyImage.setAttribute('tabindex', '0');
      smokyImage.setAttribute('aria-label', 'Смоки - ваш гид к здоровой жизни');
    }
  }

  /**
   * Загрузка данных пользователя из Telegram
   */
  loadUserData() {
    if (!window.Telegram?.WebApp?.initDataUnsafe?.user) {
      return;
    }
    
    const telegramUser = window.Telegram.WebApp.initDataUnsafe.user;
    
    if (telegramUser.first_name) {
      // Персонализируем приветствие
      const title = this.container.querySelector('.welcome-title');
      if (title) {
        title.textContent = `Привет, ${telegramUser.first_name}! Меня зовут Смоки`;
      }
    }
    
    // Отправляем аналитику пользователя
    this.trackInteraction('user_loaded', {
      has_username: !!telegramUser.username,
      language_code: telegramUser.language_code,
      is_premium: telegramUser.is_premium
    });
  }

  /**
   * Обработчик клика по кнопке старта
   * @param {Event} event
   */
  handleStartClick(event) {
    event.preventDefault();
    
    // Haptic feedback для Telegram
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    
    // Анимация нажатия кнопки
    const button = event.currentTarget;
    button.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
      button.style.transform = '';
      this.navigateToNextScreen();
    }, 150);
    
    this.trackInteraction('start_button_clicked');
  }

  /**
   * Обработчик нажатия клавиш на кнопке старта
   * @param {KeyboardEvent} event
   */
  handleStartKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleStartClick(event);
    }
  }

  /**
   * Обработчик клика по персонажу Смоки
   * @param {Event} event
   */
  handleSmokyClick(event) {
    // Легкая haptic обратная связь
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    
    // Анимация персонажа
    const smokyCharacter = this.container.querySelector('.smoky-character');
    if (smokyCharacter) {
      smokyCharacter.style.animation = 'none';
      setTimeout(() => {
        smokyCharacter.style.animation = 'floatAnimation 2s ease-in-out';
      }, 10);
    }
    
    this.trackInteraction('smoky_character_clicked');
  }

  /**
   * Переход к следующему экрану
   */
  async navigateToNextScreen() {
    try {
      // Сохраняем данные текущего экрана
      await this.save();
      
      // Переходим к экрану ввода имени
      if (window.Router) {
        Router.navigate('name-input');
      }
    } catch (error) {
      console.error('Ошибка при переходе к следующему экрану:', error);
      
      // Показываем уведомление об ошибке
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert('Произошла ошибка. Попробуйте еще раз.');
      }
    }
  }

  /**
   * Отправка аналитики взаимодействий
   * @param {string} action Действие пользователя
   * @param {Object} data Дополнительные данные
   */
  trackInteraction(action, data = {}) {
    try {
      const eventData = {
        screen: 'welcome',
        action: action,
        timestamp: Date.now(),
        user_id: window.Telegram?.WebApp?.initDataUnsafe?.user?.id,
        session_id: this.generateSessionId(),
        ...data
      };
      
      // В debug режиме выводим в консоль
      if (window.SmokyApp?.debug) {
        console.log('Analytics event:', eventData);
      }
      
      // В продакшене здесь будет отправка на сервер аналитики
      
    } catch (error) {
      console.error('Ошибка отправки аналитики:', error);
    }
  }

  /**
   * Генерация ID сессии
   * @returns {string}
   */
  generateSessionId() {
    if (!this.sessionId) {
      this.sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    return this.sessionId;
  }

  /**
   * Валидация экрана (всегда валиден)
   * @returns {boolean}
   */
  isValid() {
    return true;
  }

  /**
   * Получение данных экрана
   * @returns {Object}
   */
  getData() {
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    
    return {
      screen: 'welcome',
      completed_at: Date.now(),
      telegram_user: telegramUser ? {
        id: telegramUser.id,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username,
        language_code: telegramUser.language_code,
        is_premium: telegramUser.is_premium
      } : null,
      session_id: this.generateSessionId(),
      interactions_count: this.interactionsCount || 0
    };
  }

  /**
   * Сохранение данных экрана
   * @returns {Promise<void>}
   */
  async save() {
    try {
      const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
      if (!telegramId) {
        throw new Error('Telegram ID недоступен');
      }

      const screenData = this.getData();
      
      // В продакшене здесь будет API вызов для сохранения данных
      if (window.API && window.API.saveStepAndProgress) {
        await window.API.saveStepAndProgress(telegramId, 0, screenData);
      }
      
      // Сохраняем в localStorage как fallback
      localStorage.setItem('smoky_welcome_completed', JSON.stringify(screenData));
      
      // Отправляем событие завершения
      this.trackInteraction('welcome_screen_completed', {
        completion_time: screenData.completed_at,
        data: screenData
      });
      
      // Haptic feedback для успеха
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
      
    } catch (error) {
      console.error('Ошибка сохранения данных экрана приветствия:', error);
      throw error;
    }
  }

  /**
   * Очистка ресурсов при уходе с экрана
   */
  cleanup() {
    if (typeof super.cleanup === 'function') {
      super.cleanup();
    }
    
    // Очищаем таймауты анимации
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
    
    // Удаляем обработчики событий
    const startButton = this.container?.querySelector('.start-button');
    const smokyImage = this.container?.querySelector('.smoky-image');
    
    if (startButton) {
      startButton.removeEventListener('click', this.handleStartClick);
      startButton.removeEventListener('keydown', this.handleStartKeyDown);
    }
    
    if (smokyImage) {
      smokyImage.removeEventListener('click', this.handleSmokyClick);
    }
    
    this.isInitialized = false;
  }
}

/**
 * Глобальная функция для обработки клика по кнопке старта
 * Используется в HTML атрибуте onclick
 */
window.handleStartClick = function() {
  const welcomeScreen = window.Router?.currentScreen;
  if (welcomeScreen && typeof welcomeScreen.handleStartClick === 'function') {
    welcomeScreen.handleStartClick({ preventDefault: () => {}, currentTarget: event.target });
  } else {
    // Fallback если роутер недоступен
    console.log('Начинаем путь к здоровой жизни!');
    
    // Haptic feedback
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    
    // Простейший переход (в продакшене будет через роутер)
    if (window.location) {
      // Можно добавить переход к следующему экрану
      console.log('Переходим к следующему экрану...');
    }
  }
};

// Регистрируем экран в роутере
if (window.Router) {
  const welcomeScreen = new WelcomeScreen();
  Router.registerScreen(welcomeScreen);
}
