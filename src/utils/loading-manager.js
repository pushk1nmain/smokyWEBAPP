/**
 * Универсальный менеджер предсказательной загрузки
 * Показывает загрузку только при необходимости и оптимизирует UX
 */
const LoadingManager = {
    activeTimeouts: new Set(),
    
    /**
     * Показать загрузку только для долгих операций (>300ms)
     * @param {string} text - Текст загрузки
     * @param {number} minDelay - Минимальная задержка перед показом (мс)
     * @returns {number|null} ID таймаута для отмены
     */
    showConditional: (text, minDelay = 300) => {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.querySelector('.loading-text');
        
        if (!loadingOverlay) return null;
        
        const timeoutId = setTimeout(() => {
            loadingOverlay.classList.remove('hidden');
            
            if (loadingText) {
                loadingText.style.opacity = '0';
                setTimeout(() => {
                    loadingText.innerHTML = text + '<span class="loading-dots"></span>';
                    loadingText.style.opacity = '1';
                }, 200);
            }
            
            // Haptic feedback
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
            }
        }, minDelay);
        
        LoadingManager.activeTimeouts.add(timeoutId);
        return timeoutId;
    },
    
    /**
     * Скрыть загрузку мгновенно или с задержкой
     * @param {number|null} timeoutId - ID таймаута для отмены
     * @param {number} delay - Задержка перед скрытием
     */
    hide: (timeoutId = null, delay = 0) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            LoadingManager.activeTimeouts.delete(timeoutId);
        }
        
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (!loadingOverlay) return;
        
        if (delay > 0) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                }
            }, delay);
        } else {
            loadingOverlay.classList.add('hidden');
        }
    },
    
    /**
     * Обертка для API запросов с автоматическим управлением загрузкой
     * @param {Function} apiCall - Асинхронная функция API запроса
     * @param {string} loadingText - Текст загрузки
     * @returns {Promise} Результат API запроса
     */
    wrapApiCall: async (apiCall, loadingText = 'Загружаем') => {
        const timeoutId = LoadingManager.showConditional(loadingText);
        try {
            const result = await apiCall();
            LoadingManager.hide(timeoutId);
            return result;
        } catch (error) {
            LoadingManager.hide(timeoutId);
            throw error;
        }
    },
    
    /**
     * Предзагрузка следующей страницы в фоне
     * @param {string} url - URL страницы для предзагрузки
     */
    preloadPage: (url) => {
        if (!url) return;
        
        // Предзагружаем основную страницу
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
        
        // Предзагружаем связанные ресурсы
        const preloadResources = [
            url.replace('index.html', 'script.js'),
            url.replace('index.html', 'style.css')
        ];
        
        preloadResources.forEach(resource => {
            const resourceLink = document.createElement('link');
            resourceLink.rel = 'prefetch';
            resourceLink.href = resource;
            document.head.appendChild(resourceLink);
        });
        
        console.log(`🚀 Предзагружена страница: ${url}`);
    },
    
    /**
     * Быстрый переход без загрузки для локальных операций
     * @param {string} url - URL для перехода
     * @param {number} delay - Минимальная задержка для плавности (мс)
     */
    fastNavigate: (url, delay = 100) => {
        setTimeout(() => {
            window.location.href = url;
        }, delay);
    },
    
    /**
     * Очистка всех активных таймаутов (для cleanup)
     */
    cleanup: () => {
        LoadingManager.activeTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        LoadingManager.activeTimeouts.clear();
    }
};

// Экспорт для использования в других модулях
if (typeof window !== 'undefined') {
    window.LoadingManager = LoadingManager;
}