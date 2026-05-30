class DashboardApp {
    constructor() {
        this.modules = {};
        this.currentSection = 'schedule';
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.isAdmin = this.user?.role === 'admin';
    }
    
    handleSessionExpired(message) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.setItem(
            'auth_message',
            message || 'Сессия истекла. Войдите снова.'
        );
        window.location.href = '/';
    }

    async init() {
        console.log('🚀 Инициализация Dashboard...');
        
        // Проверка авторизации
        if (!this.token || !this.user) {
            window.location.href = '/';
            return;
        }

        const sessionValid = await this.verifySession();
        if (!sessionValid) {
            return;
        }

        if (this.isAdmin) {
            this.currentSection = 'admin-requests';
        }
        
        // Настройка базового интерфейса
        this.setupBaseUI();
        
        // Инициализируем модули
        await this.initModules();
        
        // Загружаем данные для активного раздела
        await this.loadCurrentSectionData();
        
        console.log('✅ Dashboard инициализирован');
    }
    
    setupBaseUI() {
        console.log('⚙️ Настройка базового UI...');
        
        // Отображаем информацию о пользователе
        this.displayUserInfo();
        
        // Навигация по секциям
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });
        
        // Кнопка выхода
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }
    
    displayUserInfo() {
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        const welcomeTextEl = document.getElementById('welcomeText');
        
        if (userNameEl) {
            userNameEl.textContent = this.user.full_name || this.user.email;
        }
        
        if (userRoleEl) {
            userRoleEl.textContent = this.user.role === 'admin' ? 'Администратор' : 'Преподаватель';
        }
        
        if (welcomeTextEl) {
            if (this.isAdmin) {
                welcomeTextEl.textContent =
                    'Панель администратора: просмотр всех заявок и истории замен.';
            } else {
                welcomeTextEl.textContent = 
                    `Приветствуем, ${this.user.full_name || this.user.email}! Вы вошли как преподаватель.`;
            }
        }

        if (this.isAdmin) {
            this.setupAdminLayout();
        }
    }

    setupAdminLayout() {
        document.querySelectorAll('.teacher-only').forEach((el) => {
            el.classList.add('hidden');
            el.classList.remove('active');
            if (el.classList.contains('content-section')) {
                el.style.display = 'none';
            }
        });

        document.querySelectorAll('.admin-only').forEach((el) => {
            el.classList.remove('hidden');
        });

        const adminRequestsSection = document.getElementById('admin-requests-section');
        if (adminRequestsSection) {
            adminRequestsSection.classList.add('active');
            adminRequestsSection.style.display = 'block';
        }
    }
    
    async initModules() {
        console.log('📦 Инициализация модулей...');
        
        try {
            if (this.isAdmin) {
                if (typeof AdminModule !== 'undefined') {
                    this.modules.admin = new AdminModule(this);
                    await this.modules.admin.init();
                }
                return;
            }

            this.modules.schedule = new ScheduleModule(this);
            await this.modules.schedule.init();
            
            if (typeof RequestsModule !== 'undefined') {
                this.modules.requests = new RequestsModule(this);
                await this.modules.requests.init();
            }
            
            if (typeof NewRequestModule !== 'undefined') {
                this.modules['new-request'] = new NewRequestModule(this);
                await this.modules['new-request'].init();
            }
            
            if (typeof ProfileModule !== 'undefined') {
                this.modules.profile = new ProfileModule(this);
                await this.modules.profile.init();
            }
            
        } catch (error) {
            console.error('❌ Ошибка инициализации модулей:', error);
        }
    }
    
    async loadCurrentSectionData() {
        console.log(`📊 Загрузка данных для раздела: ${this.currentSection}`);
        
        if (this.isAdmin && this.modules.admin) {
            try {
                await this.modules.admin.loadData();
            } catch (error) {
                console.error('❌ Ошибка загрузки данных админки:', error);
                this.showError(`Не удалось загрузить данные: ${error.message}`);
            }
            return;
        }

        const module = this.modules[this.currentSection];
        if (module && typeof module.loadData === 'function') {
            try {
                await module.loadData();
            } catch (error) {
                console.error(`❌ Ошибка загрузки данных для ${this.currentSection}:`, error);
                this.showError(`Не удалось загрузить данные для ${this.currentSection}: ${error.message}`);
            }
        }
    }
    
    async showSection(section) {
        console.log(`🔄 Переключение на раздел: ${section}`);

        // Повторный клик по вкладке админа — перезагрузить с учётом полей фильтра
        if (this.currentSection === section) {
            if (this.isAdmin && this.modules.admin) {
                await this.loadCurrentSectionData();
            }
            return;
        }

        if (this.isAdmin) {
            document.getElementById('adminFiltersPanel')?.classList.remove('hidden');
        }
        
        // Скрываем текущий раздел
        const currentSectionEl = document.getElementById(`${this.currentSection}-section`);
        const currentNavBtn = document.querySelector(`.nav-btn[data-section="${this.currentSection}"]`);
        
        if (currentSectionEl) {
            currentSectionEl.classList.remove('active');
            currentSectionEl.style.display = 'none';
        }
        if (currentNavBtn) currentNavBtn.classList.remove('active');
        
        // Показываем новый раздел
        this.currentSection = section;
        
        const newSectionEl = document.getElementById(`${section}-section`);
        const newNavBtn = document.querySelector(`.nav-btn[data-section="${section}"]`);
        
        if (newSectionEl) {
            newSectionEl.classList.add('active');
            newSectionEl.style.display = 'block';
        }
        if (newNavBtn) newNavBtn.classList.add('active');
        
        // Загружаем данные для нового раздела
        await this.loadCurrentSectionData();
    }
    
    async verifySession() {
        const profile = await this.apiRequest('/profile', {}, { skipAuthRedirect: true });
        if (profile?.success) {
            return true;
        }

        this.handleSessionExpired(
            profile?.message?.includes('токен')
                ? 'Сессия истекла. Войдите снова.'
                : (profile?.message || 'Не удалось проверить сессию. Войдите снова.')
        );
        return false;
    }

    // API запросы - ИСПРАВЛЕННАЯ ВЕРСИЯ
    async apiRequest(endpoint, options = {}, requestOptions = {}) {
        console.log(`🌐 API запрос: ${endpoint}`);
        
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        };
        
        try {
            const fullUrl = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
            
            console.log(`🌐 Полный URL: ${fullUrl}`);
            
            const response = await fetch(fullUrl, {
                ...defaultOptions,
                ...options
            });
            
            console.log(`📊 Статус ответа: ${response.status} для ${fullUrl}`);
            
            // Читаем как текст ВСЕГДА
            const responseText = await response.text();
            console.log(`📄 Ответ сервера (первые 200 символов):`, responseText.substring(0, 200));
            
            // Если ответ пустой
            if (!responseText.trim()) {
                console.warn('⚠️ Пустой ответ от сервера');
                return {
                    success: false,
                    message: `Пустой ответ от сервера (статус: ${response.status})`
                };
            }
            
            // Пробуем парсить JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ Ошибка парсинга JSON:', parseError);
                
                // Если это HTML ошибка
                if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
                    return {
                        success: false,
                        message: `Ошибка сервера: получен HTML вместо JSON (статус: ${response.status})`
                    };
                }
                
                return {
                    success: false,
                    message: `Ошибка парсинка ответа (статус: ${response.status})`,
                    rawResponse: responseText.substring(0, 100)
                };
            }
            
            // Если статус ошибки
            if (!response.ok) {
                if (response.status === 401 && !requestOptions.skipAuthRedirect) {
                    this.handleSessionExpired(
                        data.message?.includes('токен')
                            ? 'Сессия истекла. Войдите снова.'
                            : (data.message || 'Требуется повторный вход')
                    );
                }

                return {
                    success: false,
                    message: data.message || `Ошибка ${response.status}: ${response.statusText}`,
                    ...data
                };
            }
            
            return data;
            
        } catch (error) {
            console.error('❌ Ошибка API запроса:', error);
            return {
                success: false,
                message: error.message || 'Ошибка сети',
                error: error.toString()
            };
        }
    }
    
    logout() {
        console.log('👋 Выход из системы');
        
        if (confirm('Вы уверены, что хотите выйти?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    }
    
    // Утилиты
    showError(message) {
        console.error('❌ Ошибка:', message);
        
        const errorEl = document.createElement('div');
        errorEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
        `;
        errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        document.body.appendChild(errorEl);
        
        setTimeout(() => {
            errorEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => errorEl.remove(), 300);
        }, 5000);
    }
    
    showSuccess(message) {
        console.log('✅ Успех:', message);
        
        const successEl = document.createElement('div');
        successEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
        `;
        successEl.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        document.body.appendChild(successEl);
        
        setTimeout(() => {
            successEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => successEl.remove(), 300);
        }, 3000);
    }
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен, запускаем Dashboard...');
    window.dashboard = new DashboardApp();
    window.dashboard.init().catch(error => {
        console.error('❌ Критическая ошибка инициализации Dashboard:', error);
        alert('Ошибка загрузки панели управления. Проверьте консоль для подробностей.');
    });
});
