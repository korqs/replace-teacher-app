// public/new-request.js
class NewRequestModule {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.container = null;
        this.prefill = null;
        this.availableTeachers = [];
        this.selectedTeacher = null;
    }

    async init() {
        console.log('➕ Инициализация модуля "Новая заявка"');
        this.container = document.getElementById('newRequestFormContainer');
        this.setupUI();
        return true;
    }

    setupUI() {
        // UI будет построен при loadData
    }

    async loadData() {
        if (!this.container) {
            this.container = document.getElementById('newRequestFormContainer');
        }

        // Подхватываем prefill из localStorage
        const stored = localStorage.getItem('prefill_lesson');
        if (stored) {
            try {
                this.prefill = JSON.parse(stored);
                if (this.prefill.date) {
                    this.prefill.date = this.fixDateForInput(this.prefill.date);
                }
            } catch (_) {
                this.prefill = null;
            }
            localStorage.removeItem('prefill_lesson');
        }

        this.renderForm();
        if (this.prefill) {
            await this.applyPrefill(this.prefill);
        }
    }

    fixDateForInput(dateValue) {
        try {
            let date;
            if (typeof dateValue === 'string' && dateValue.includes('T')) {
                date = new Date(dateValue);
            } else if (typeof dateValue === 'string') {
                date = new Date(dateValue + 'T12:00:00');
            } else if (dateValue instanceof Date) {
                date = dateValue;
            } else {
                return dateValue;
            }
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Ошибка при обработке даты:', error, dateValue);
            return dateValue;
        }
    }

    prefillFromLesson(lesson) {
        if (lesson.date) {
            lesson.date = this.fixDateForInput(lesson.date);
        }
        this.prefill = lesson;
        this.renderForm();
        this.applyPrefill(lesson);
        try {
            this.container?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (_) {}
    }

    async applyPrefill(lesson) {
        const dateInput = document.getElementById('requestDate');
        if (dateInput && lesson.date) {
            dateInput.value = lesson.date;
        }
        await this.loadClasses(lesson.classes);
        await this.loadSubjects(lesson.subject);
        await this.loadTeams(lesson.team);
        if (lesson.week_num) {
            const weekInput = document.querySelector('input[name="week_num"]');
            if (weekInput) weekInput.value = lesson.week_num;
        }
        if (lesson.num_den) {
            const numDenSelect = document.querySelector('select[name="num_den"]');
            if (numDenSelect) numDenSelect.value = lesson.num_den;
        }
    }

    async loadClasses(selectedClass) {
        const date = document.getElementById('requestDate')?.value;
        const classesSelect = document.getElementById('classes');

        if (!classesSelect) return;

        if (!date) {
            classesSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
            classesSelect.disabled = true;
            return;
        }

        classesSelect.disabled = true;
        classesSelect.innerHTML = '<option value="">Загрузка...</option>';

        try {
            const data = await this.dashboard.apiRequest(`/schedule/my-classes?date=${encodeURIComponent(date)}`);
            if (!data?.success) {
                classesSelect.innerHTML = '<option value="">Ошибка загрузки</option>';
                return;
            }

            if (data.classes.length === 0) {
                classesSelect.innerHTML = '<option value="">Нет пар в этот день</option>';
                return;
            }

            classesSelect.innerHTML = '<option value="">Выберите пару</option>';
            data.classes.forEach((cls) => {
                const option = document.createElement('option');
                option.value = cls;
                option.textContent = `${cls} пара`;
                classesSelect.appendChild(option);
            });
            classesSelect.disabled = false;

            if (selectedClass) {
                classesSelect.value = String(selectedClass);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки пар:', error);
            classesSelect.innerHTML = '<option value="">Ошибка загрузки</option>';
        }
    }

    async loadTeams(selectedTeam) {
        const date = document.getElementById('requestDate')?.value;
        const classes = document.getElementById('classes')?.value;
        const subject = document.getElementById('subject')?.value;
        const teamSelect = document.getElementById('requestTeam');

        if (!teamSelect) return;

        if (!date || !classes || !subject) {
            teamSelect.innerHTML = '<option value="">Сначала выберите дату, пару и предмет</option>';
            teamSelect.disabled = true;
            return;
        }

        teamSelect.disabled = true;
        teamSelect.innerHTML = '<option value="">Загрузка...</option>';

        try {
            const params = new URLSearchParams({
                date,
                classes,
                subject
            });
            const data = await this.dashboard.apiRequest(`/schedule/my-teams?${params}`);
            if (!data?.success) {
                teamSelect.innerHTML = '<option value="">Ошибка загрузки</option>';
                return;
            }

            if (data.teams.length === 0) {
                teamSelect.innerHTML = '<option value="">Нет групп для этого занятия</option>';
                return;
            }

            teamSelect.innerHTML = '<option value="">Выберите группу</option>';
            data.teams.forEach((row) => {
                const option = document.createElement('option');
                option.value = row.team;
                option.textContent = row.team;
                if (row.week_num != null) option.dataset.weekNum = row.week_num;
                if (row.num_den) option.dataset.numDen = row.num_den;
                teamSelect.appendChild(option);
            });
            teamSelect.disabled = false;

            const teamToSelect = selectedTeam || (data.teams.length === 1 ? data.teams[0].team : null);
            if (teamToSelect) {
                teamSelect.value = teamToSelect;
                this.applyTeamMeta(teamSelect);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки групп:', error);
            teamSelect.innerHTML = '<option value="">Ошибка загрузки</option>';
        }
    }

    applyTeamMeta(teamSelect) {
        const option = teamSelect.selectedOptions[0];
        if (!option) return;

        if (option.dataset.weekNum) {
            const weekInput = document.querySelector('input[name="week_num"]');
            if (weekInput) weekInput.value = option.dataset.weekNum;
        }
        if (option.dataset.numDen) {
            const numDenSelect = document.querySelector('select[name="num_den"]');
            if (numDenSelect) numDenSelect.value = option.dataset.numDen;
        }
    }

    async loadSubjects(selectedSubject) {
        const date = document.getElementById('requestDate')?.value;
        const classes = document.getElementById('classes')?.value;
        const subjectSelect = document.getElementById('subject');

        if (!subjectSelect) return;

        if (!date || !classes) {
            subjectSelect.innerHTML = '<option value="">Сначала выберите дату и пару</option>';
            subjectSelect.disabled = true;
            return;
        }

        subjectSelect.disabled = true;
        subjectSelect.innerHTML = '<option value="">Загрузка...</option>';

        try {
            const data = await this.dashboard.apiRequest(
                `/subjects/by-lesson?date=${encodeURIComponent(date)}&classes=${encodeURIComponent(classes)}`
            );
            if (data && data.success) {
                if (data.subjects.length === 0) {
                    subjectSelect.innerHTML = '<option value="">Нет занятий в это время</option>';
                } else {
                    subjectSelect.innerHTML = '<option value="">Выберите предмет</option>';
                    data.subjects.forEach((subject) => {
                        const option = document.createElement('option');
                        option.value = subject;
                        option.textContent = subject;
                        subjectSelect.appendChild(option);
                    });
                    subjectSelect.disabled = false;
                    if (selectedSubject) {
                        subjectSelect.value = selectedSubject;
                    }
                }
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки предметов:', error);
            subjectSelect.innerHTML = '<option value="">Ошибка загрузки</option>';
        }
    }

    async loadAvailableTeachers(date, classes, subject) {
        try {
            console.log('🔍 Поиск преподавателей:', { date, classes, subject });
            const formattedDate = this.fixDateForInput(date);
            const data = await this.dashboard.apiRequest(
                `/teachers/available?date=${encodeURIComponent(formattedDate)}&classes=${encodeURIComponent(classes)}&subject=${encodeURIComponent(subject)}`
            );
            if (data && data.success) {
                console.log('✅ Найдено преподавателей:', data.teachers.length);
                this.availableTeachers = data.teachers;
                return data.teachers;
            } else {
                console.error('❌ Ошибка при поиске преподавателей:', data?.message);
                return [];
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки преподавателей:', error);
            return [];
        }
    }

    renderForm() {
        if (!this.container) return;

        const p = this.prefill || {};
        const dateValue = p.date ? this.fixDateForInput(p.date) : '';
        const weekNumValue = p.week_num || '';
        const numDenValue = p.num_den || 'num';

        this.container.innerHTML = `
            <div class="card" style="max-width:900px;margin:0 auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px;">
                    <div>
                        <div style="font-size:24px;font-weight:800;color:#2c3e50;margin-bottom:8px;">
                            <i class="fas fa-file-alt" style="margin-right:10px;color:#4f46e5;"></i>
                            Создание заявки на замену
                        </div>
                        <div style="color:#64748b;font-size:14px;">
                            Заполните поля для поиска доступных преподавателей
                        </div>
                    </div>
                    <button class="nav-btn" style="border-color:#e2e8f0" onclick="dashboard.showSection('schedule')">
                        <i class="fas fa-arrow-left"></i> К расписанию
                    </button>
                </div>

                <form id="newRequestForm" style="margin-top:18px;">
                    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(250px, 1fr));gap:16px;margin-bottom:24px;">
                        <div style="display:flex;flex-direction:column;gap:8px;">
                            <label style="font-weight:600;color:#334155;font-size:14px;">
                                <i class="fas fa-calendar-alt" style="margin-right:8px;color:#4f46e5;"></i>
                                Дата *
                            </label>
                            <input type="date" name="request_date" required value="${this.escapeAttr(dateValue)}"
                                   style="padding:12px;border-radius:8px;border:1px solid #d1d5db;font-size:14px;"
                                   id="requestDate" class="form-input">
                            <div style="font-size:12px;color:#6b7280;margin-top:4px;">
                                <i class="fas fa-info-circle"></i> Выберите дату занятия
                            </div>
                        </div>

                        <div style="display:flex;flex-direction:column;gap:8px;">
                            <label style="font-weight:600;color:#334155;font-size:14px;">
                                <i class="fas fa-clock" style="margin-right:8px;color:#4f46e5;"></i>
                                Пара (номер) *
                            </label>
                            <select name="classes" required
                                    style="padding:12px;border-radius:8px;border:1px solid #d1d5db;font-size:14px;background:white;"
                                    id="classes" class="form-input" disabled>
                                <option value="">Сначала выберите дату</option>
                            </select>
                            <div style="font-size:12px;color:#6b7280;margin-top:4px;">
                                <i class="fas fa-info-circle"></i> Только пары из вашего расписания
                            </div>
                        </div>

                        <div style="display:flex;flex-direction:column;gap:8px;">
                            <label style="font-weight:600;color:#334155;font-size:14px;">
                                <i class="fas fa-book" style="margin-right:8px;color:#4f46e5;"></i>
                                Предмет *
                            </label>
                            <select id="subject" name="subject" required
                                    style="padding:12px;border-radius:8px;border:1px solid #d1d5db;font-size:14px;background:white;"
                                    class="form-input" disabled>
                                <option value="">Сначала выберите дату и пару</option>
                            </select>
                            <div style="font-size:12px;color:#6b7280;margin-top:4px;">
                                <i class="fas fa-info-circle"></i> Выберите предмет из списка
                            </div>
                        </div>

                        <div style="display:flex;flex-direction:column;gap:8px;">
                            <label style="font-weight:600;color:#334155;font-size:14px;">
                                <i class="fas fa-users" style="margin-right:8px;color:#4f46e5;"></i>
                                Группа *
                            </label>
                            <select name="team" required
                                    style="padding:12px;border-radius:8px;border:1px solid #d1d5db;font-size:14px;background:white;"
                                    id="requestTeam" class="form-input" disabled>
                                <option value="">Сначала выберите предмет</option>
                            </select>
                            <div style="font-size:12px;color:#6b7280;margin-top:4px;">
                                <i class="fas fa-info-circle"></i> Только группы из вашего расписания
                            </div>
                        </div>

                        <div style="display:flex;flex-direction:column;gap:8px;">
                            <label style="font-weight:600;color:#334155;font-size:14px;">
                                <i class="fas fa-calendar-week" style="margin-right:8px;color:#4f46e5;"></i>
                                Неделя (опционально)
                            </label>
                            <input type="number" name="week_num" min="1" max="17" value="${this.escapeAttr(weekNumValue)}"
                                   placeholder="Например: 10"
                                   style="padding:12px;border-radius:8px;border:1px solid #d1d5db;font-size:14px;"
                                   class="form-input">
                        </div>

                        <div style="display:flex;flex-direction:column;gap:8px;">
                            <label style="font-weight:600;color:#334155;font-size:14px;">
                                <i class="fas fa-exchange-alt" style="margin-right:8px;color:#4f46e5;"></i>
                                Числитель/Знаменатель
                            </label>
                            <select name="num_den" style="padding:12px;border-radius:8px;border:1px solid #d1d5db;font-size:14px;background:white;" class="form-input">
                                <option value="">Не указано</option>
                                <option value="num" ${numDenValue === 'num' ? 'selected' : ''}>Числитель</option>
                                <option value="den" ${numDenValue === 'den' ? 'selected' : ''}>Знаменатель</option>
                            </select>
                        </div>
                    </div>

                    <div style="margin:24px 0;text-align:center;">
                        <button type="button" class="search-teachers-btn" onclick="dashboard.modules['new-request'].searchTeachers()">
                            <i class="fas fa-search" style="margin-right:8px;"></i>
                            Найти доступных преподавателей
                        </button>
                    </div>

                    <div style="grid-column:1/-1;display:none;" id="teachersListContainer">
                        <div style="font-size:18px;font-weight:700;color:#334155;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #e2e8f0;">
                            <i class="fas fa-chart-line" style="margin-right:10px;color:#4f46e5;"></i>
                            Доступные преподаватели
                            <span id="teachersCount" style="font-size:14px;color:#64748b;margin-left:8px;"></span>
                        </div>
                        <div id="teachersList" style="display:grid;gap:12px;margin-bottom:24px;"></div>
                    </div>

                    <div style="display:none;margin:24px 0;padding:20px;background:#f0f9ff;border-radius:12px;border:2px solid #dbeafe;" id="selectedTeacherContainer">
                        <div style="display:flex;align-items:center;gap:16px;">
                            <i class="fas fa-check-circle" style="font-size:32px;color:#16a34a;"></i>
                            <div style="flex-grow:1;">
                                <div style="font-weight:700;color:#1e40af;font-size:18px;">
                                    Выбран преподаватель: <span id="selectedTeacherName"></span>
                                </div>
                                <div style="color:#4a5568;font-size:14px;margin-top:4px;">
                                    Теперь вы можете отправить заявку на замену
                                </div>
                            </div>
                            <button type="button" class="nav-btn" onclick="dashboard.modules['new-request'].clearSelection()">
                                <i class="fas fa-times"></i> Изменить выбор
                            </button>
                        </div>
                    </div>

                    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;">
                        <button type="button" class="submit-btn" style="display:none;" id="submitBtn" onclick="dashboard.modules['new-request'].submitRequest()">
                            <i class="fas fa-paper-plane" style="margin-right:8px;"></i>
                            Отправить заявку
                        </button>
                        <button type="button" class="clear-btn" onclick="dashboard.modules['new-request'].clearForm()">
                            <i class="fas fa-eraser" style="margin-right:8px;"></i>
                            Очистить форму
                        </button>
                        <div id="newRequestHint" style="color:#64748b;font-size:14px;margin-left:auto;"></div>
                    </div>
                </form>
            </div>

            <style>
                .form-input {
                    transition: all 0.2s ease;
                }
                .form-input:focus {
                    outline: none;
                    border-color: #4f46e5;
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
                }
                .search-teachers-btn {
                    background: linear-gradient(135deg, #4f46e5, #7c3aed);
                    color: white;
                    border: none;
                    padding: 14px 28px;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
                }
                .search-teachers-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(79, 70, 229, 0.3);
                }
                .search-teachers-btn:active {
                    transform: translateY(0);
                }
                .search-teachers-btn:disabled {
                    background: #94a3b8;
                    cursor: not-allowed;
                    transform: none;
                }
                .submit-btn {
                    background: linear-gradient(135deg, #059669, #10b981);
                    color: white;
                    border: none;
                    padding: 14px 28px;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 6px rgba(5, 150, 105, 0.2);
                }
                .submit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(5, 150, 105, 0.3);
                }
                .clear-btn {
                    background: #f1f5f9;
                    color: #64748b;
                    border: 1px solid #cbd5e1;
                    padding: 14px 28px;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .clear-btn:hover {
                    background: #e2e8f0;
                }
                .teacher-card {
                    padding: 16px;
                    border-radius: 10px;
                    border-left: 4px solid;
                    background: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    transition: all 0.2s ease;
                }
                .teacher-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .coefficient-badge {
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    margin-right: 8px;
                }
                .available-badge {
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                }
            </style>
        `;

        const hint = document.getElementById('newRequestHint');
        if (hint && this.prefill) {
            hint.innerHTML = `<i class="fas fa-magic" style="margin-right:6px;"></i> Данные подставлены из расписания`;
        }

        const inputs = this.container.querySelectorAll('.form-input');
        inputs.forEach((input) => {
            input.addEventListener('change', () => this.resetTeacherSearch());
            input.addEventListener('input', () => this.resetTeacherSearch());
        });

        const dateInput = document.getElementById('requestDate');
        const classesSelect = document.getElementById('classes');
        const subjectSelect = document.getElementById('subject');
        const teamSelect = document.getElementById('requestTeam');

        if (dateInput) {
            dateInput.addEventListener('change', async () => {
                await this.loadClasses();
                await this.loadSubjects();
                await this.loadTeams();
            });
        }
        if (classesSelect) {
            classesSelect.addEventListener('change', async () => {
                await this.loadSubjects();
                await this.loadTeams();
            });
        }
        if (subjectSelect) {
            subjectSelect.addEventListener('change', async () => {
                await this.loadTeams();
            });
        }
        if (teamSelect) {
            teamSelect.addEventListener('change', () => this.applyTeamMeta(teamSelect));
        }
    }

    resetTeacherSearch() {
        const container = document.getElementById('teachersListContainer');
        if (container) container.style.display = 'none';
        const selectedContainer = document.getElementById('selectedTeacherContainer');
        if (selectedContainer) selectedContainer.style.display = 'none';
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) submitBtn.style.display = 'none';
        this.selectedTeacher = null;
    }

    async searchTeachers() {
        const dateInput = document.getElementById('requestDate');
        const classesInput = document.getElementById('classes');
        const subjectSelect = document.getElementById('subject');

        const date = dateInput.value;
        const classes = classesInput.value;
        const subject = subjectSelect.value;

        const team = document.getElementById('requestTeam')?.value;

        if (!date || !classes || !subject || !team) {
            this.dashboard.showError('Заполните обязательные поля: дата, пара, предмет, группа');
            return;
        }

        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            if (!confirm('Выбранная дата уже прошла. Вы уверены, что хотите создать заявку на прошедшую дату?')) {
                return;
            }
        }

        const container = document.getElementById('teachersListContainer');
        const list = document.getElementById('teachersList');
        const countSpan = document.getElementById('teachersCount');
        
        container.style.display = 'block';
        list.innerHTML = `
            <div style="text-align:center;padding:40px;">
                <i class="fas fa-spinner fa-spin" style="font-size:32px;color:#4f46e5;margin-bottom:16px;"></i>
                <div style="color:#64748b;font-size:16px;">
                    Ищем доступных преподавателей...
                </div>
            </div>
        `;

        const fixedDate = this.fixDateForInput(date);
        const teachers = await this.loadAvailableTeachers(fixedDate, classes, subject);
        this.availableTeachers = teachers;

        if (teachers.length === 0) {
            list.innerHTML = `
                <div class="teacher-card" style="border-left-color:#ef4444;text-align:center;padding:40px;">
                    <i class="fas fa-user-slash" style="font-size:48px;color:#ef4444;margin-bottom:16px;"></i>
                    <div style="font-weight:700;color:#374151;font-size:18px;margin-bottom:8px;">
                        Нет доступных преподавателей
                    </div>
                    <div style="color:#6b7280;font-size:14px;">
                        На ${this.formatDateForDisplay(date)} (${classes} пара) по предмету "${subject}"<br>
                        не найдено свободных преподавателей
                    </div>
                    <div style="margin-top:16px;">
                        <button class="nav-btn" onclick="dashboard.modules['new-request'].clearForm()">
                            <i class="fas fa-edit" style="margin-right:6px;"></i>
                            Изменить параметры поиска
                        </button>
                    </div>
                </div>
            `;
            if (countSpan) countSpan.textContent = '(0 найдено)';
            return;
        }

        teachers.sort((a, b) => b.coefficient - a.coefficient);

        if (countSpan) countSpan.textContent = `(${teachers.length} найдено, отсортированы по коэффициенту)`;

        list.innerHTML = teachers.map((teacher, index) => {
            const isTop3 = index < 3;
            const borderColor = isTop3 ? 
                ['#f59e0b', '#10b981', '#3b82f6'][index] : '#d1d5db';
            
            const availabilityColor = teacher.is_available ? '#10b981' : '#f59e0b';
            const availabilityText = teacher.is_available ? 'Свободен' : 'Занят в это время';
            
            return `
                <div class="teacher-card" style="border-left-color:${borderColor};${isTop3 ? 'background:#f8fafc;' : ''}">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
                        <div style="flex-grow:1;">
                            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                                <div style="font-size:18px;font-weight:700;color:#1f2937;">
                                    ${teacher.name}
                                    ${isTop3 ? `<span style="background:${borderColor};color:white;padding:2px 8px;border-radius:12px;font-size:12px;margin-left:8px;">Топ-${index + 1}</span>` : ''}
                                </div>
                            </div>
                            
                            <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
                                <div style="display:flex;align-items:center;gap:6px;color:#4b5563;">
                                    <i class="fas fa-envelope" style="font-size:14px;"></i>
                                    <span style="font-size:14px;">${teacher.email}</span>
                                </div>
                                <div style="display:flex;align-items:center;gap:6px;color:#4b5563;">
                                    <i class="fas fa-phone" style="font-size:14px;"></i>
                                    <span style="font-size:14px;">${teacher.phone}</span>
                                </div>
                            </div>
                            
                            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                                <div class="coefficient-badge" style="background:${this.getCoefficientBackground(teacher.coefficient)};color:${this.getCoefficientColor(teacher.coefficient)};">
                                    <i class="fas fa-chart-line" style="margin-right:4px;"></i>
                                    Коэффициент: ${teacher.coefficient.toFixed(3)}
                                </div>
                                <div class="available-badge" style="background:${teacher.is_available ? '#d1fae5' : '#fef3c7'};color:${teacher.is_available ? '#065f46' : '#92400e'};">
                                    <i class="fas ${teacher.is_available ? 'fa-check-circle' : 'fa-exclamation-triangle'}" style="margin-right:4px;"></i>
                                    ${availabilityText}
                                </div>
                            </div>
                        </div>
                        
                        <button type="button" class="select-teacher-btn" 
                                onclick="dashboard.modules['new-request'].selectTeacher('${this.escapeAttr(teacher.name)}')"
                                ${!teacher.is_available ? 'disabled' : ''}
                                style="background:${teacher.is_available ? '#4f46e5' : '#9ca3af'};color:white;border:none;padding:10px 20px;border-radius:8px;font-weight:600;cursor:${teacher.is_available ? 'pointer' : 'not-allowed'};transition:all 0.2s ease;">
                            <i class="fas ${teacher.is_available ? 'fa-check' : 'fa-ban'}" style="margin-right:8px;"></i>
                            ${teacher.is_available ? 'Выбрать' : 'Недоступен'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getCoefficientBackground(coefficient) {
        if (coefficient > 0.7) return '#d1fae5';
        if (coefficient > 0.4) return '#fef3c7';
        return '#fee2e2';
    }

    getCoefficientColor(coefficient) {
        if (coefficient > 0.7) return '#065f46';
        if (coefficient > 0.4) return '#92400e';
        return '#991b1b';
    }

    formatDateForDisplay(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    selectTeacher(teacherName) {
        this.selectedTeacher = teacherName;
        
        const container = document.getElementById('teachersListContainer');
        const selectedContainer = document.getElementById('selectedTeacherContainer');
        const selectedName = document.getElementById('selectedTeacherName');
        const submitBtn = document.getElementById('submitBtn');
        
        if (selectedContainer && selectedName) {
            selectedName.textContent = teacherName;
            selectedContainer.style.display = 'block';
            submitBtn.style.display = 'flex';
            selectedContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        this.dashboard.showSuccess(`Выбран преподаватель: ${teacherName}`);
    }

    clearSelection() {
        this.selectedTeacher = null;
        const selectedContainer = document.getElementById('selectedTeacherContainer');
        const submitBtn = document.getElementById('submitBtn');
        
        if (selectedContainer) selectedContainer.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'none';
    }

    async submitRequest() {
        if (!this.selectedTeacher) {
            this.dashboard.showError('Выберите преподавателя для замены');
            return;
        }

        const form = document.getElementById('newRequestForm');
        const fd = new FormData(form);

        let requestDate = fd.get('request_date');
        requestDate = this.fixDateForInput(requestDate);

        const payload = {
            request_date: requestDate,
            classes: Number(fd.get('classes')),
            subject: String(fd.get('subject') || '').trim(),
            team: String(fd.get('team') || '').trim(),
            replacing_teacher: this.selectedTeacher
        };

        const weekNum = fd.get('week_num');
        const numDen = fd.get('num_den');

        if (weekNum) payload.week_num = Number(weekNum);
        if (numDen) payload.num_den = String(numDen);

        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
            submitBtn.disabled = true;
        }

        const data = await this.dashboard.apiRequest('/requests', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane" style="margin-right:8px;"></i> Отправить заявку';
            submitBtn.disabled = false;
        }

        if (data && data.success) {
            this.dashboard.showSuccess('Заявка успешно отправлена!');
            this.clearForm();
            setTimeout(() => {
                this.dashboard.showSection('requests');
            }, 1500);
        } else {
            this.dashboard.showError(data?.message || 'Не удалось создать заявку');
        }
    }

    clearForm() {
        this.prefill = null;
        this.selectedTeacher = null;
        this.availableTeachers = [];
        
        const form = document.getElementById('newRequestForm');
        if (form) form.reset();
        
        const container = document.getElementById('teachersListContainer');
        const selectedContainer = document.getElementById('selectedTeacherContainer');
        const submitBtn = document.getElementById('submitBtn');
        
        if (container) container.style.display = 'none';
        if (selectedContainer) selectedContainer.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'none';
        
        this.dashboard.showSuccess('Форма очищена');

        const classesSelect = document.getElementById('classes');
        const subjectSelect = document.getElementById('subject');
        const teamSelect = document.getElementById('requestTeam');
        if (classesSelect) {
            classesSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
            classesSelect.disabled = true;
        }
        if (subjectSelect) {
            subjectSelect.innerHTML = '<option value="">Сначала выберите дату и пару</option>';
            subjectSelect.disabled = true;
        }
        if (teamSelect) {
            teamSelect.innerHTML = '<option value="">Сначала выберите предмет</option>';
            teamSelect.disabled = true;
        }
    }

    escapeAttr(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }
}

window.NewRequestModule = NewRequestModule;
