# Паттерны экранов SmokyApp

## Общее описание

В приложении SmokyApp выявлены два основных типа экранов с различными визуальными стилями и контекстами использования.

## Группа 1: Светлые экраны (вне истории)

### Визуальные характеристики:
- **Фон**: Белый с зеленым градиентом сверху `linear-gradient(180deg, rgba(198, 255, 221, 0.6) 0%, rgba(198, 255, 221, 0.3) 25%, rgba(198, 255, 221, 0.1) 50%, transparent 100%)`
- **Декоративные элементы**: Парящие смайлики (🔥, 🚀, 🚭, 💨, 🌿, 💚, 🤝, 📈, 🪴, ⏳, 🏆)
- **Позиционирование смайликов**: По краям экрана (избегая центральной зоны контента)
- **Анимации смайликов**: Плавное парение с разными скоростями (floatSlow, floatMedium, floatGentle)

### Структурные паттерны:

#### HTML структура:
```html
<div class="app-container">
    <!-- Парящие смайлики на фоне -->
    <div class="floating-emojis">
        <span class="emoji emoji-1">🔥</span>
        <!-- остальные смайлики -->
    </div>
    
    <main class="[screen-name]-screen">
        <div class="character-section">
            <!-- Изображение персонажа или элемента -->
        </div>
        
        <div class="content-section">
            <h1 class="screen-title">Заголовок</h1>
            <p class="screen-description">Описание</p>
            
            <!-- Интерактивные элементы (формы, кнопки) -->
            
            <div class="action-section">
                <button class="common-button">
                    <span class="button-text">Текст</span>
                    <span class="common-arrow-icon"></span>
                </button>
            </div>
        </div>
    </main>
    
    <!-- Загрузочный оверлей -->
    <div class="loading-overlay hidden" id="loadingOverlay">
        <!-- Контент загрузки -->
    </div>
</div>
```

#### CSS паттерны:
- **Цветовая схема**:
  - Заголовки: `#235BDF` (синий)
  - Текст: `#1C3D8C` (темно-синий)
  - Кнопки: `#4CAF50` (зеленый)
- **Layout**: Flexbox с `justify-content: space-between`
- **Адаптивность**: Медиа-запросы для экранов < 380px и < 600px высотой

### Экраны этой группы:
1. **welcome** - экран приветствия с персонажем Смоки
2. **name-input** - ввод имени с полем ввода и иконкой
3. **how-did-you-know** - выбор источника информации с картами опций
4. **city-input** - ввод города (предполагается аналогичная структура)

### API интеграция:
- Проверка пользователя: `GET /api/v1/user/{telegram_id}`
- Отправка имени: `POST /api/v1/name`
- Отправка источника: `POST /api/v1/source`
- Проверка города: `POST /api/v1/check_town`
- Обновление шага: `POST /api/v1/progress_step`

---

## Группа 2: Темные экраны (контекст истории)

### Визуальные характеристики:
- **Фон**: Темный космический градиент
  ```css
  background: 
    radial-gradient(ellipse at top, #1e3c72 0%, #2a5298 50%, #1e3c72 100%),
    linear-gradient(180deg, #0f1729 0%, #1a2847 30%, #2d4578 70%, #1e3c72 100%);
  ```
- **Декоративные элементы**: Анимированные звезды (40 элементов)
- **Эффекты**: Мерцающие звезды с `box-shadow` и `clip-path: polygon()` для формы звезды
- **Текст**: Белый цвет с тенями для контрастности

### Структурные паттерны:

#### HTML структура:
```html
<div class="app-container">
    <!-- Звездное небо -->
    <div class="starry-sky">
        <div class="star star-1"></div>
        <!-- 40 звезд с уникальными позициями -->
    </div>

    <main class="[screen-name]-screen">
        <div class="character-section">
            <!-- Персонаж с космическими эффектами -->
        </div>
        
        <div class="content-section">
            <h1 class="main-title">Заголовок истории</h1>
            <p class="main-description">Текст истории</p>
            
            <div class="action-section">
                <button class="common-button">
                    <span class="button-text">Далее</span>
                    <span class="common-arrow-icon"></span>
                </button>
            </div>
        </div>
    </main>
</div>
```

#### CSS паттерны:
- **Цветовая схема**:
  - Заголовки: `#FFFFFF` (белый)
  - Текст: `#E0E6ED` (светло-серый)
  - Эффекты: Свечение и тени
- **Анимации**: 
  - Появление элементов: `fadeInUp`
  - Мерцание звезд: `starTwinkle`
  - Движение персонажа: `robotAppearance`

### Экраны этой группы:
1. **robot-appearance** - появление робота с космическими эффектами
2. **waking-up** - пробуждение (предполагается аналогичный стиль)

---

## Общие паттерны для всех экранов

### JavaScript архитектура:
```javascript
// Паттерн инициализации
(function() {
    // Глобальные переменные
    let tg = null;
    let isReady = false;
    
    // Конфигурация
    const config = { /* настройки */ };
    
    // Основная функция инициализации
    const main = async () => {
        // Обновление шага в БД
        // Настройка Telegram WebApp
        // Обработка пользователя
        // Настройка UI
    };
    
    // Инициализация при загрузке DOM
    document.addEventListener('DOMContentLoaded', main);
    
    // Экспорт для глобального доступа
    window.SmokyPageName = { /* API */ };
})();
```

### Общие утилиты:
- **step-router.js** - маршрутизация между экранами
- **api-client.js** - HTTP клиент с обработкой ошибок
- **loading-manager.js** - управление состояниями загрузки
- **error-modal.js** - отображение ошибок
- **global-console.js** - консоль разработчика

### Telegram WebApp интеграция:
- Использование `window.Telegram.WebApp` API
- Хэдер `X-Telegram-WebApp-Data` для аутентификации
- Haptic feedback для улучшения UX
- Адаптация под клавиатуру с `viewportChanged`

### Компоненты загрузки:
```html
<div class="loading-overlay hidden" id="loadingOverlay">
    <div class="loading-character">
        <img src="../../assets/icons/smoky_basic.svg" alt="Смоки">
        <div class="loading-rings">
            <div class="loading-ring"></div>
            <div class="loading-ring"></div>
        </div>
    </div>
</div>
```

### CSS переменные:
```css
:root {
    /* Telegram Theme Variables */
    --tg-theme-bg-color: #ffffff;
    --tg-theme-text-color: #000000;
    --tg-theme-button-color: #2196F3;
    
    /* App Variables */
    --smoky-primary: #2196F3;
    --smoky-success: #4CAF50;
    --container-padding: 20px;
    --border-radius: 16px;
    --transition-duration: 0.3s;
}
```

### Адаптивность:
- Медиа-запросы для мобильных устройств (< 380px)
- Адаптация для низких экранов (< 600px)
- Поддержка `prefers-reduced-motion`
- Динамическая высота viewport (`100dvh`)

---

## Выводы

1. **Четкое разделение**: Светлые экраны для интерфейсных задач, темные для повествования
2. **Консистентная архитектура**: Единые паттерны HTML/CSS/JS структур
3. **Модульность**: Переиспользуемые компоненты и утилиты
4. **Telegram-first**: Глубокая интеграция с WebApp API
5. **Прогрессивность**: Система шагов с сохранением состояния
6. **Доступность**: Семантическая разметка и поддержка screen readers