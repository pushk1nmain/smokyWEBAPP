/**
 * Логика экрана ввода имени (Name Input Screen)
 * Второй экран в прогреве пользователя
 */

/**
 * Класс экрана ввода имени
 */
class NameInputScreen extends BaseScreen {
  constructor() {
    super('name-input', {
      title: 'Как к вам обращаться?',
      hasMainButton: true,
      hasBackButton: true,
      mainButtonText: 'Продолжить'
    });
    
    this.nameInput = null;
    this.nameError = null;
    this.currentName = '';
    this.isValidName = false;
    this.debounceTimeout = null;
    
    // Привязка методов
    this.handleNameInput = this.handleNameInput.bind(this);
    this.handleNameKeydown = this.handleNameKeydown.bind(this);
    this.handleSuggestionClick = this.handleSuggestionClick.bind(this);
  }

  /**
   * Инициализация экрана после показа
   * @returns {Promise<void>}
   */
  async init() {
    // Получаем элементы DOM
    this.setupDOMReferences();
    
    // Настраиваем обработчики событий
    this.setupEventHandlers();
    
    // Загружаем данные пользователя
    this.loadUserData();
    
    // Показываем предложения имен
    this.showNameSuggestions();
    
    // Фокус на поле ввода
    this.focusNameInput();
    
    // Обновляем главную кнопку
    this.updateMainButton();
  }

  /**
   * Получение ссылок на DOM элементы
   */
  setupDOMReferences() {
    this.nameInput = this.container.querySelector('#userName');
    this.nameError = this.container.querySelector('#nameError');
    this.nameSuggestions = this.container.querySelector('#nameSuggestions');
    this.suggestionsList = this.container.querySelector('#suggestionsList');
  }

  /**
   * Настройка обработчиков событий
   */
  setupEventHandlers() {
    if (!this.nameInput) return;

    // Обработчик ввода текста
    this.nameInput.addEventListener('input', this.handleNameInput);
    
    // Обработчик клавиш
    this.nameInput.addEventListener('keydown', this.handleNameKeydown);
    
    // Обработчики фокуса
    this.nameInput.addEventListener('focus', () => {
      this.nameInput.classList.add('typing');
    });
    
    this.nameInput.addEventListener('blur', () => {
      this.nameInput.classList.remove('typing');
    });
  }

  /**
   * Загрузка данных пользователя
   */
  loadUserData() {
    const telegramUser = Utils.getTelegramUser();
    const userData = Router.getUserData();
    
    // Проверяем сохраненное имя
    if (userData?.user?.name) {
      this.setName(userData.user.name);
      return;
    }
    
    // Используем имя из Telegram
    if (telegramUser?.firstName) {
      this.setName(telegramUser.firstName);
    }
  }

  /**
   * Установка имени в поле ввода
   * @param {string} name Имя пользователя
   */
  setName(name) {
    if (!this.nameInput || !name) return;
    
    this.nameInput.value = name;
    this.currentName = name;
    this.validateName(name);
    this.updateMainButton();
  }

  /**
   * Показ предложений имен
   */
  showNameSuggestions() {
    const telegramUser = Utils.getTelegramUser();
    const suggestions = [];
    
    // Добавляем имя из Telegram если есть
    if (telegramUser?.firstName && !this.nameInput.value) {
      suggestions.push(telegramUser.firstName);
    }
    
    // Добавляем популярные имена
    const popularNames = [
      'Александр', 'Дмитрий', 'Михаил', 'Андрей', 'Алексей',
      'Екатерина', 'Анна', 'Мария', 'Елена', 'Ольга'
    ];
    
    // Добавляем несколько популярных имен, которых нет в списке
    popularNames.forEach(name => {
      if (suggestions.length < 6 && !suggestions.includes(name)) {
        suggestions.push(name);
      }
    });
    
    if (suggestions.length > 0) {
      this.renderNameSuggestions(suggestions);
      this.nameSuggestions.classList.remove('hidden');
    }
  }

  /**
   * Отрисовка предложений имен
   * @param {Array<string>} suggestions Массив предложенных имен
   */
  renderNameSuggestions(suggestions) {
    if (!this.suggestionsList) return;
    
    this.suggestionsList.innerHTML = '';
    
    suggestions.forEach(name => {
      const chip = document.createElement('button');
      chip.className = 'suggestion-chip';
      chip.textContent = name;
      chip.setAttribute('type', 'button');
      chip.setAttribute('aria-label', `Выбрать имя ${name}`);
      chip.addEventListener('click', () => this.handleSuggestionClick(name));
      
      this.suggestionsList.appendChild(chip);
    });
  }

  /**
   * Обработчик ввода в поле имени
   * @param {Event} event Событие ввода
   */
  handleNameInput(event) {
    const name = event.target.value;
    this.currentName = name;
    
    // Дебаунс валидации
    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(() => {
      this.validateName(name);
      this.updateMainButton();
    }, 300);
    
    // Скрываем предложения при вводе
    if (name.length > 0) {
      this.nameSuggestions.classList.add('hidden');
    } else {
      this.nameSuggestions.classList.remove('hidden');
    }
  }

  /**
   * Обработчик клавиш в поле имени
   * @param {KeyboardEvent} event Событие клавиши
   */
  handleNameKeydown(event) {
    // Enter для продолжения (если имя валидно)
    if (event.key === 'Enter' && this.isValidName) {
      event.preventDefault();
      this.handleMainButton();
    }
    
    // Escape для очистки поля
    if (event.key === 'Escape') {
      event.preventDefault();
      this.nameInput.value = '';
      this.currentName = '';
      this.validateName('');
      this.updateMainButton();
      this.nameSuggestions.classList.remove('hidden');
    }
  }

  /**
   * Обработчик клика по предложению имени
   * @param {string} name Выбранное имя
   */
  handleSuggestionClick(name) {
    if (!TelegramManager.isReady()) return;
    
    TelegramManager.hapticFeedback('light');
    
    this.setName(name);
    this.nameSuggestions.classList.add('hidden');
    
    // Анимация выбора
    const selectedChip = event.target;
    selectedChip.style.transform = 'scale(0.95)';
    setTimeout(() => {
      selectedChip.style.transform = '';
    }, 150);
    
    // Фокус на поле ввода
    this.focusNameInput();
    
    // Аналитика
    this.trackInteraction('name_suggestion_selected', { selected_name: name });
  }

  /**
   * Валидация имени
   * @param {string} name Имя для валидации
   */
  validateName(name) {
    const trimmedName = name.trim();
    this.isValidName = Utils.isValidName(trimmedName);
    
    // Обновляем визуальное состояние
    this.updateInputState();
    
    // Показываем/скрываем ошибку
    this.updateErrorState();
  }

  /**
   * Обновление визуального состояния поля ввода
   */
  updateInputState() {
    if (!this.nameInput) return;
    
    // Удаляем предыдущие классы состояния
    this.nameInput.classList.remove('name-input--valid', 'name-input--invalid');
    
    if (this.currentName.length > 0) {
      if (this.isValidName) {
        this.nameInput.classList.add('name-input--valid');
      } else {
        this.nameInput.classList.add('name-input--invalid');
      }
    }
  }

  /**
   * Обновление состояния ошибки
   */
  updateErrorState() {
    if (!this.nameError) return;
    
    if (this.currentName.length > 0 && !this.isValidName) {
      this.nameError.classList.remove('hidden');
      this.nameError.classList.add('show');
    } else {
      this.nameError.classList.add('hidden');
      this.nameError.classList.remove('show');
    }
  }

  /**
   * Установка фокуса на поле ввода
   */
  focusNameInput() {
    if (!this.nameInput) return;
    
    setTimeout(() => {
      this.nameInput.focus();
      
      // Перемещаем курсор в конец
      const length = this.nameInput.value.length;
      this.nameInput.setSelectionRange(length, length);
    }, 100);
  }

  /**
   * Валидация экрана
   * @returns {boolean}
   */
  isValid() {
    return this.isValidName && this.currentName.trim().length >= 2;
  }

  /**
   * Получение данных экрана
   * @returns {Object}
   */
  getData() {
    return {
      name: this.currentName.trim(),
      completed_at: Utils.getCurrentTimestamp()
    };
  }

  /**
   * Сохранение данных экрана
   * @returns {Promise<void>}
   */
  async save() {
    try {
      const telegramId = Utils.getTelegramId();
      if (!telegramId) {
        throw new Error('Telegram ID недоступен');
      }

      const data = this.getData();
      
      // Сохраняем имя через API
      await API.saveStepAndProgress(telegramId, 1, data);
      
      // Отправляем аналитику
      this.trackInteraction('name_saved', { name_length: data.name.length });
      
      // Haptic feedback
      if (TelegramManager.isReady()) {
        TelegramManager.hapticFeedback('success');
      }
      
    } catch (error) {
      console.error('Ошибка сохранения имени:', error);
      throw error;
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
        screen: 'name-input',
        action: action,
        timestamp: Utils.getCurrentTimestamp(),
        user_id: Utils.getTelegramId(),
        ...data
      };
      
      if (SmokyApp.debug) {
        console.log('Analytics event:', eventData);
      }
    } catch (error) {
      console.error('Ошибка отправки аналитики:', error);
    }
  }

  /**
   * Очистка ресурсов при уходе с экрана
   */
  cleanup() {
    super.cleanup();
    
    // Очищаем таймауты
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    
    // Удаляем обработчики событий
    if (this.nameInput) {
      this.nameInput.removeEventListener('input', this.handleNameInput);
      this.nameInput.removeEventListener('keydown', this.handleNameKeydown);
    }
    
    // Очищаем ссылки на DOM
    this.nameInput = null;
    this.nameError = null;
    this.nameSuggestions = null;
    this.suggestionsList = null;
  }
}

// Регистрируем экран в роутере
if (window.Router) {
  const nameInputScreen = new NameInputScreen();
  Router.registerScreen(nameInputScreen);
}
