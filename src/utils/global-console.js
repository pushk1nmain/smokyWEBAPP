/**
 * SmokyApp - Global Development Console
 * Глобальная консоль разработчика для всех экранов
 */

class GlobalDevConsole {
    constructor() {
        this.isVisible = false;
        this.logs = [];
        this.maxLogs = 500;
        this.activeFilter = 'all';
        this.startTime = Date.now();
        
        // Элементы DOM
        this.consoleElement = null;
        this.contentElement = null;
        this.countElement = null;
        this.filtersElement = null;
        this.toggleButton = null;
        
        // Оригинальные методы console
        this.originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug
        };
        
        this.init();
    }
    
    /**
     * Инициализация глобальной консоли
     */
    init() {
        this.createConsoleElements();
        this.setupEventListeners();
        this.interceptConsoleMethods();
        this.logToConsole('info', '🔧 Глобальная консоль разработчика активирована');
        
        // Проверяем есть ли сохраненное состояние
        const savedState = localStorage.getItem('devConsoleVisible');
        if (savedState === 'true') {
            this.show();
        }
    }
    
    /**
     * Создание элементов консоли
     */
    createConsoleElements() {
        // Создаем кнопку переключения
        this.createToggleButton();
        
        // Создаем саму консоль
        this.createConsole();
    }
    
    /**
     * Создание кнопки переключения консоли
     */
    createToggleButton() {
        this.toggleButton = document.createElement('button');
        this.toggleButton.id = 'globalConsoleToggle';
        this.toggleButton.innerHTML = '🔧';
        this.toggleButton.title = 'Консоль разработчика';
        this.toggleButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10001;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Hover эффекты
        this.toggleButton.addEventListener('mouseenter', () => {
            this.toggleButton.style.transform = 'scale(1.1)';
            this.toggleButton.style.boxShadow = '0 6px 16px rgba(33, 150, 243, 0.6)';
        });
        
        this.toggleButton.addEventListener('mouseleave', () => {
            this.toggleButton.style.transform = 'scale(1)';
            this.toggleButton.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.4)';
        });
        
        document.body.appendChild(this.toggleButton);
    }
    
    /**
     * Создание элементов консоли
     */
    createConsole() {
        const consoleHTML = `
            <div class="global-dev-console" id="globalDevConsole" style="display: none;">
                <div class="console-header">
                    <div class="console-title">
                        <span class="console-icon">🔧</span>
                        <span>Консоль разработчика</span>
                        <span class="console-count" id="globalLogCount">0</span>
                    </div>
                    <div class="console-controls">
                        <button class="console-btn" id="globalClearLogs" title="Очистить логи">🗑️</button>
                        <button class="console-btn" id="globalFilterToggle" title="Фильтры">🔍</button>
                        <button class="console-btn" id="globalCloseConsole" title="Закрыть">✕</button>
                    </div>
                </div>
                
                <div class="console-filters hidden" id="globalConsoleFilters">
                    <button class="filter-btn active" data-filter="all">Все</button>
                    <button class="filter-btn" data-filter="log">📝 Log</button>
                    <button class="filter-btn" data-filter="info">ℹ️ Info</button>
                    <button class="filter-btn" data-filter="warn">⚠️ Warn</button>
                    <button class="filter-btn" data-filter="error">❌ Error</button>
                    <button class="filter-btn" data-filter="api">🌐 API</button>
                </div>
                
                <div class="console-content" id="globalConsoleContent">
                    <div class="console-log startup" data-type="info">
                        <span class="log-time">00:00:00</span>
                        <span class="log-type">ℹ️</span>
                        <span class="log-message">🚀 Глобальная консоль инициализирована</span>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем стили
        this.addConsoleStyles();
        
        // Добавляем HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = consoleHTML;
        this.consoleElement = tempDiv.firstElementChild;
        document.body.appendChild(this.consoleElement);
        
        // Получаем ссылки на элементы
        this.contentElement = document.getElementById('globalConsoleContent');
        this.countElement = document.getElementById('globalLogCount');
        this.filtersElement = document.getElementById('globalConsoleFilters');
    }
    
    /**
     * Добавление стилей консоли
     */
    addConsoleStyles() {
        const styles = `
            .global-dev-console {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #1a1a1a;
                color: #e0e0e0;
                font-family: 'SF Mono', 'Monaco', 'Consolas', 'Roboto Mono', monospace;
                font-size: 12px;
                line-height: 1.4;
                z-index: 10000;
                max-height: 50vh;
                border-bottom: 2px solid #333;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                transition: transform 0.3s ease-out;
            }
            
            .console-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background: #2d2d2d;
                border-bottom: 1px solid #444;
                user-select: none;
            }
            
            .console-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                color: #fff;
            }
            
            .console-icon {
                font-size: 16px;
            }
            
            .console-count {
                background: #FF9800;
                color: #000;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: bold;
                min-width: 20px;
                text-align: center;
            }
            
            .console-controls {
                display: flex;
                gap: 6px;
            }
            
            .console-btn {
                background: transparent;
                border: 1px solid #555;
                color: #e0e0e0;
                padding: 6px 10px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
                user-select: none;
            }
            
            .console-btn:hover {
                background: #444;
                border-color: #777;
                transform: scale(1.05);
            }
            
            .console-btn:active {
                transform: scale(0.95);
            }
            
            .console-filters {
                display: flex;
                gap: 6px;
                padding: 10px 12px;
                background: #252525;
                border-bottom: 1px solid #444;
                overflow-x: auto;
            }
            
            .console-filters.hidden {
                display: none;
            }
            
            .filter-btn {
                background: transparent;
                border: 1px solid #555;
                color: #ccc;
                padding: 4px 10px;
                border-radius: 14px;
                cursor: pointer;
                font-size: 11px;
                white-space: nowrap;
                transition: all 0.2s ease;
                user-select: none;
            }
            
            .filter-btn:hover {
                background: #333;
                border-color: #777;
            }
            
            .filter-btn.active {
                background: #2196F3;
                border-color: #2196F3;
                color: #fff;
            }
            
            .console-content {
                max-height: calc(50vh - 140px);
                overflow-y: auto;
                padding: 8px 0;
                background: #1a1a1a;
            }
            
            .console-content::-webkit-scrollbar {
                width: 8px;
            }
            
            .console-content::-webkit-scrollbar-track {
                background: #2d2d2d;
            }
            
            .console-content::-webkit-scrollbar-thumb {
                background: #555;
                border-radius: 4px;
            }
            
            .console-content::-webkit-scrollbar-thumb:hover {
                background: #777;
            }
            
            .console-log {
                display: flex;
                padding: 6px 12px;
                border-bottom: 1px solid #2a2a2a;
                transition: background-color 0.2s ease;
                word-break: break-word;
            }
            
            .console-log:hover {
                background: #222;
            }
            
            .console-log.hidden {
                display: none;
            }
            
            .console-log.startup {
                background: rgba(76, 175, 80, 0.1);
                border-left: 3px solid #4CAF50;
            }
            
            .console-log.api {
                background: rgba(33, 150, 243, 0.1);
                border-left: 3px solid #2196F3;
            }
            
            .console-log.error {
                background: rgba(244, 67, 54, 0.1);
                border-left: 3px solid #f44336;
            }
            
            .console-log.warn {
                background: rgba(255, 152, 0, 0.1);
                border-left: 3px solid #FF9800;
            }
            
            .log-time {
                color: #888;
                margin-right: 10px;
                font-size: 10px;
                min-width: 65px;
                flex-shrink: 0;
            }
            
            .log-type {
                margin-right: 10px;
                flex-shrink: 0;
                font-size: 12px;
            }
            
            .log-message {
                flex: 1;
                color: #e0e0e0;
            }
            
            .log-message.error { color: #ff6b6b; }
            .log-message.warn { color: #ffb347; }
            .log-message.info { color: #64b5f6; }
            .log-message.api { color: #81c784; }
            
            @media (max-width: 480px) {
                .global-dev-console {
                    max-height: 40vh;
                    font-size: 11px;
                }
                
                .console-header {
                    padding: 8px 10px;
                }
                
                .console-title span:not(.console-icon):not(.console-count) {
                    display: none;
                }
                
                .console-btn {
                    padding: 4px 8px;
                    font-size: 11px;
                }
                
                .console-log {
                    padding: 4px 10px;
                    flex-direction: column;
                    gap: 2px;
                }
                
                .log-time {
                    min-width: auto;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        // Кнопка переключения
        this.toggleButton.addEventListener('click', () => {
            this.toggle();
        });
        
        // Обработчики в консоли (будут добавлены после создания)
        document.addEventListener('click', (e) => {
            if (e.target.id === 'globalClearLogs') {
                this.clear();
            } else if (e.target.id === 'globalFilterToggle') {
                this.toggleFilters();
            } else if (e.target.id === 'globalCloseConsole') {
                this.hide();
            } else if (e.target.classList.contains('filter-btn')) {
                const filter = e.target.dataset.filter;
                this.setFilter(filter);
            }
        });
    }
    
    /**
     * Перехват методов console
     */
    interceptConsoleMethods() {
        const self = this;
        
        console.log = function(...args) {
            self.originalConsole.log.apply(console, args);
            self.logToConsole('log', ...args);
        };
        
        console.info = function(...args) {
            self.originalConsole.info.apply(console, args);
            self.logToConsole('info', ...args);
        };
        
        console.warn = function(...args) {
            self.originalConsole.warn.apply(console, args);
            self.logToConsole('warn', ...args);
        };
        
        console.error = function(...args) {
            self.originalConsole.error.apply(console, args);
            self.logToConsole('error', ...args);
        };
        
        // Перехват fetch для API логов
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const url = args[0];
            const options = args[1] || {};
            
            self.logToConsole('api', `🌐 API Запрос: ${options.method || 'GET'} ${url}`);
            
            return originalFetch.apply(this, args)
                .then(async response => {
                    const status = response.status;
                    const statusText = response.statusText;
                    const logType = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'api';
                    
                    // Клонируем response чтобы можно было прочитать body дважды
                    const responseClone = response.clone();
                    
                    try {
                        // Пытаемся прочитать response как JSON
                        const responseData = await responseClone.json();
                        
                        // Логируем ответ с данными
                        self.logToConsole(logType, `🌐 API Ответ: ${status} ${statusText} - ${url}`, responseData);
                    } catch (parseError) {
                        // Если не JSON, пытаемся как текст
                        try {
                            const responseText = await responseClone.text();
                            if (responseText) {
                                self.logToConsole(logType, `🌐 API Ответ: ${status} ${statusText} - ${url}`, `Текст: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
                            } else {
                                self.logToConsole(logType, `🌐 API Ответ: ${status} ${statusText} - ${url}`, 'Пустой ответ');
                            }
                        } catch (textError) {
                            self.logToConsole(logType, `🌐 API Ответ: ${status} ${statusText} - ${url}`, 'Не удалось прочитать ответ');
                        }
                    }
                    
                    return response;
                })
                .catch(error => {
                    self.logToConsole('error', `🌐 API Ошибка: ${error.message} - ${url}`);
                    throw error;
                });
        };
    }
    
    /**
     * Добавление лога в консоль
     */
    logToConsole(type, ...args) {
        const timestamp = this.getTimestamp();
        const message = this.formatMessage(args);
        
        const logEntry = {
            type,
            timestamp,
            message,
            raw: args
        };
        
        this.logs.push(logEntry);
        
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        this.renderLog(logEntry);
        this.updateLogCount();
        this.scrollToBottom();
    }
    
    /**
     * Форматирование сообщения
     */
    formatMessage(args) {
        return args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
    }
    
    /**
     * Получение временной метки
     */
    getTimestamp() {
        const now = new Date();
        const elapsed = now.getTime() - this.startTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        const h = String(hours).padStart(2, '0');
        const m = String(minutes % 60).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        
        return `${h}:${m}:${s}`;
    }
    
    /**
     * Отрисовка лога
     */
    renderLog(logEntry) {
        if (!this.contentElement) return;
        
        const logElement = document.createElement('div');
        logElement.className = `console-log ${logEntry.type}`;
        logElement.dataset.type = logEntry.type;
        
        const icons = {
            log: '📝',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
            debug: '🐛',
            api: '🌐'
        };
        
        logElement.innerHTML = `
            <span class="log-time">${logEntry.timestamp}</span>
            <span class="log-type">${icons[logEntry.type] || '📝'}</span>
            <span class="log-message ${logEntry.type}">${this.escapeHtml(logEntry.message)}</span>
        `;
        
        // Если есть объекты в сыром виде, показываем их отдельно
        if (logEntry.raw.some(arg => typeof arg === 'object' && arg !== null)) {
            const objectsDiv = document.createElement('div');
            objectsDiv.className = 'log-object';
            
            const objects = logEntry.raw.filter(arg => typeof arg === 'object' && arg !== null);
            objects.forEach(obj => {
                const pre = document.createElement('pre');
                pre.style.cssText = `
                    background: #2a2a2a;
                    border: 1px solid #444;
                    border-radius: 4px;
                    padding: 8px;
                    margin: 4px 0;
                    font-family: 'SF Mono', 'Monaco', 'Consolas', 'Roboto Mono', monospace;
                    overflow-x: auto;
                    font-size: 11px;
                    color: #e0e0e0;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                `;
                
                try {
                    pre.textContent = JSON.stringify(obj, null, 2);
                } catch (e) {
                    pre.textContent = String(obj);
                }
                objectsDiv.appendChild(pre);
            });
            
            logElement.appendChild(objectsDiv);
        }
        
        this.contentElement.appendChild(logElement);
        this.applyFilter();
    }
    
    /**
     * Экранирование HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Показать консоль
     */
    show() {
        if (this.consoleElement) {
            this.consoleElement.style.display = 'block';
            this.isVisible = true;
            localStorage.setItem('devConsoleVisible', 'true');
            
            // Меняем иконку кнопки
            this.toggleButton.innerHTML = '🔧';
            this.toggleButton.style.background = '#f44336';
        }
    }
    
    /**
     * Скрыть консоль
     */
    hide() {
        if (this.consoleElement) {
            this.consoleElement.style.display = 'none';
            this.isVisible = false;
            localStorage.setItem('devConsoleVisible', 'false');
            
            // Меняем иконку кнопки
            this.toggleButton.innerHTML = '🔧';
            this.toggleButton.style.background = '#2196F3';
        }
    }
    
    /**
     * Переключить видимость консоли
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Обновление счетчика логов
     */
    updateLogCount() {
        if (this.countElement) {
            this.countElement.textContent = this.logs.length;
        }
    }
    
    /**
     * Прокрутка в конец
     */
    scrollToBottom() {
        if (this.contentElement) {
            setTimeout(() => {
                this.contentElement.scrollTop = this.contentElement.scrollHeight;
            }, 50);
        }
    }
    
    /**
     * Установка фильтра
     */
    setFilter(filter) {
        this.activeFilter = filter;
        
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.applyFilter();
    }
    
    /**
     * Применение фильтра
     */
    applyFilter() {
        if (!this.contentElement) return;
        
        const logs = this.contentElement.querySelectorAll('.console-log:not(.startup)');
        logs.forEach(log => {
            const logType = log.dataset.type;
            const shouldShow = this.activeFilter === 'all' || logType === this.activeFilter;
            log.classList.toggle('hidden', !shouldShow);
        });
    }
    
    /**
     * Переключение видимости фильтров
     */
    toggleFilters() {
        if (this.filtersElement) {
            this.filtersElement.classList.toggle('hidden');
        }
    }
    
    /**
     * Очистка логов
     */
    clear() {
        this.logs = [];
        if (this.contentElement) {
            const startupLogs = this.contentElement.querySelectorAll('.startup');
            this.contentElement.innerHTML = '';
            startupLogs.forEach(log => this.contentElement.appendChild(log));
        }
        this.updateLogCount();
        this.logToConsole('info', '🧹 Консоль очищена');
    }
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window !== 'undefined' && !window.globalDevConsole) {
        window.globalDevConsole = new GlobalDevConsole();
        console.log('🔧 Глобальная консоль разработчика готова');
    }
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalDevConsole;
}