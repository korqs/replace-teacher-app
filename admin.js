// public/admin.js — панель администратора (фаза 1.2)
class AdminModule {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.filters = { status: '', from: '', to: '', teacher: '' };
        this.requestsContainer = null;
        this.historyContainer = null;
    }

    async init() {
        console.log('👨‍💼 Инициализация модуля администратора');
        this.requestsContainer = document.getElementById('adminRequestsContainer');
        this.historyContainer = document.getElementById('adminHistoryContainer');
        this.bindFilters();
        this.bindModal();
        return true;
    }

    bindModal() {
        this.modal = document.getElementById('adminModal');
        this.modalBody = document.getElementById('adminModalBody');
        this.modalFooter = document.getElementById('adminModalFooter');
        this.modalTitle = document.getElementById('adminModalTitle');

        const closeBtn = document.getElementById('adminModalClose');
        closeBtn?.addEventListener('click', () => this.closeModal());

        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal?.classList.contains('open')) {
                this.closeModal();
            }
        });
    }

    openModal() {
        if (!this.modal) return;
        this.modal.classList.add('open');
        this.modal.setAttribute('aria-hidden', 'false');
    }

    closeModal() {
        if (!this.modal) return;
        this.modal.classList.remove('open');
        this.modal.setAttribute('aria-hidden', 'true');
        if (this.modalBody) this.modalBody.innerHTML = '';
        if (this.modalFooter) this.modalFooter.innerHTML = '';
    }

    bindFilters() {
        const form = document.getElementById('adminFiltersForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.dashboard.loadCurrentSectionData();
        });

        const resetBtn = document.getElementById('adminFiltersReset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                form.reset();
                this.filters = { status: '', from: '', to: '', teacher: '' };
                this.dashboard.loadCurrentSectionData();
            });
        }
    }

    readFiltersFromForm() {
        const form = document.getElementById('adminFiltersForm');
        if (!form) return;
        const fd = new FormData(form);
        let from = fd.get('from') || '';
        let to = fd.get('to') || '';
        if (from && to && from > to) {
            [from, to] = [to, from];
        }
        this.filters = {
            status: (fd.get('status') || '').trim(),
            from,
            to,
            teacher: (fd.get('teacher') || '').trim()
        };
    }

    buildQueryString() {
        const params = new URLSearchParams();
        if (this.filters.status) params.set('status', this.filters.status);
        if (this.filters.from) params.set('from', this.filters.from);
        if (this.filters.to) params.set('to', this.filters.to);
        if (this.filters.teacher) params.set('teacher', this.filters.teacher);
        const qs = params.toString();
        return qs ? `?${qs}` : '';
    }

    /** Всегда берём значения из формы перед запросом к API */
    syncFiltersFromForm() {
        this.readFiltersFromForm();
    }

    hasActiveFilters() {
        const { status, from, to, teacher } = this.filters;
        return Boolean(status || from || to || teacher);
    }

    renderActiveFiltersHint() {
        const { status, from, to, teacher } = this.filters;
        const parts = [];
        if (from || to) {
            const fromStr = from ? this.formatDateInput(from) : '…';
            const toStr = to ? this.formatDateInput(to) : '…';
            parts.push(`период: ${fromStr} — ${toStr}`);
        }
        if (status) parts.push(`статус: ${this.getStatusInfo(status).label}`);
        if (teacher) parts.push(`преподаватель: ${teacher}`);
        return parts.length ? parts.join(' · ') : '';
    }

    formatDateInput(isoDate) {
        try {
            const [y, m, d] = isoDate.split('-').map(Number);
            return new Date(y, m - 1, d).toLocaleDateString('ru-RU');
        } catch (_) {
            return isoDate;
        }
    }

    updateFiltersHint() {
        const hint = this.renderActiveFiltersHint();
        ['adminRequestsFiltersHint', 'adminHistoryFiltersHint'].forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (hint) {
                el.textContent = `Фильтры: ${hint}`;
                el.style.display = 'block';
            } else {
                el.textContent = '';
                el.style.display = 'none';
            }
        });
    }

    updateTabCounts(requestsCount, historyCount) {
        const formatCount = (n) => (n === null || n === undefined ? '—' : String(n));

        const requests = formatCount(requestsCount);
        const history = formatCount(historyCount);

        const summaryRequests = document.getElementById('adminSummaryRequests');
        const summaryHistory = document.getElementById('adminSummaryHistory');
        if (summaryRequests) summaryRequests.textContent = `Все заявки: ${requests}`;
        if (summaryHistory) summaryHistory.textContent = `История замен: ${history}`;

        const navRequests = document.getElementById('adminNavRequestsCount');
        const navHistory = document.getElementById('adminNavHistoryCount');
        if (navRequests) navRequests.textContent = requests;
        if (navHistory) navHistory.textContent = history;

        const headerRequests = document.getElementById('adminRequestsCount');
        const headerHistory = document.getElementById('adminHistoryCount');
        if (headerRequests && requestsCount !== null) {
            headerRequests.textContent = `Найдено: ${requests}`;
        }
        if (headerHistory && historyCount !== null) {
            headerHistory.textContent = `Найдено: ${history}`;
        }
    }

    async loadData() {
        this.syncFiltersFromForm();
        this.updateFiltersHint();

        const section = this.dashboard.currentSection;
        const qs = this.buildQueryString();

        if (section === 'admin-requests' && this.requestsContainer) {
            this.showLoading(this.requestsContainer);
        }
        if (section === 'admin-history' && this.historyContainer) {
            this.showLoading(this.historyContainer);
        }

        const [requestsData, historyData] = await Promise.all([
            this.dashboard.apiRequest(`/admin/requests${qs}`),
            this.dashboard.apiRequest(`/admin/replacements-history${qs}`)
        ]);

        const requestsCount = requestsData?.success
            ? (requestsData.count ?? requestsData.requests?.length ?? 0)
            : null;
        const historyCount = historyData?.success
            ? (historyData.count ?? historyData.history?.length ?? 0)
            : null;

        this.updateTabCounts(requestsCount, historyCount);

        if (section === 'admin-requests') {
            this.renderRequestsList(requestsData);
        } else if (section === 'admin-history') {
            this.renderHistoryList(historyData);
        }
    }

    renderRequestsList(data) {
        if (!this.requestsContainer) return;

        if (!data || !data.success) {
            this.showError(this.requestsContainer, data?.message || 'Не удалось загрузить заявки');
            return;
        }

        const requests = data.requests || [];

        if (requests.length === 0) {
            this.requestsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>${this.hasActiveFilters() ? 'Заявок по выбранным фильтрам нет' : 'Заявок пока нет'}</p>
                </div>
            `;
            return;
        }

        this.requestsContainer.innerHTML = requests
            .map((r) => this.renderRequestCard(r))
            .join('');
    }

    renderHistoryList(data) {
        if (!this.historyContainer) return;

        if (!data || !data.success) {
            this.showError(this.historyContainer, data?.message || 'Не удалось загрузить историю');
            return;
        }

        const history = data.history || [];

        if (history.length === 0) {
            this.historyContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>Записей по выбранным фильтрам нет</p>
                </div>
            `;
            return;
        }

        this.historyContainer.innerHTML = history
            .map((row) => this.renderHistoryCard(row))
            .join('');
    }

    /** @deprecated используйте loadData */
    async loadRequests() {
        await this.loadData();
    }

    /** @deprecated используйте loadData */
    async loadHistory() {
        await this.loadData();
    }

    renderRequestCard(r) {
        const statusInfo = this.getStatusInfo(r.status);
        const dateStr = this.formatDate(r.request_date);
        const numDenText = r.num_den_text || '';
        const createdStr = this.formatDateTime(r.created_at);

        return `
            <div class="admin-card" style="border-left-color: ${statusInfo.color};">
                <div class="admin-card-header">
                    <span class="admin-card-title">${this.escapeHtml(r.subject)}</span>
                    <span class="status-badge" style="background:${statusInfo.bg};color:${statusInfo.color};">
                        ${statusInfo.label}
                    </span>
                </div>
                <div class="admin-card-meta">
                    <span><i class="fas fa-calendar"></i> ${dateStr}</span>
                    <span><i class="fas fa-clock"></i> ${r.classes} пара</span>
                    <span><i class="fas fa-users"></i> ${this.escapeHtml(r.team)}</span>
                    ${numDenText ? `<span><i class="fas fa-book"></i> ${this.escapeHtml(numDenText)}</span>` : ''}
                </div>
                <div class="admin-card-row">
                    <i class="fas fa-user"></i> Заявитель: <strong>${this.escapeHtml(r.teacher_name)}</strong>
                    ${this.renderPhone(r.teacher_phone)}
                </div>
                <div class="admin-card-row">
                    <i class="fas fa-user-check"></i> Замещающий:
                    <strong>${r.replacing_teacher ? this.escapeHtml(r.replacing_teacher) : '— не назначен —'}</strong>
                    ${r.replacing_teacher ? this.renderPhone(r.replacing_teacher_phone) : ''}
                </div>
                ${r.admin_comment ? `
                    <div class="admin-comment">
                        <i class="fas fa-comment-dots"></i> ${this.escapeHtml(r.admin_comment)}
                    </div>
                ` : ''}
                <div class="admin-card-footer">
                    <i class="fas fa-clock"></i> Создана: ${createdStr}
                    ${r.updated_at ? ` · обновлена: ${this.formatDateTime(r.updated_at)}` : ''}
                </div>
                <div class="admin-card-actions">
                    <button type="button" class="admin-btn admin-btn-primary" onclick="dashboard.modules.admin.viewRequestDetails(${r.id})">
                        <i class="fas fa-eye"></i> Подробнее
                    </button>
                    ${r.status === 'pending' ? `
                        <button type="button" class="admin-btn admin-btn-success" onclick="dashboard.modules.admin.confirmRequest(${r.id}, ${JSON.stringify(r.replacing_teacher || '')})">
                            <i class="fas fa-check"></i> Подтвердить
                        </button>
                    ` : ''}
                    ${r.status === 'pending' || r.status === 'confirmed' ? `
                        <button type="button" class="admin-btn admin-btn-danger" onclick="dashboard.modules.admin.cancelRequest(${r.id}, '${r.status}')">
                            <i class="fas fa-ban"></i> Отменить
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderHistoryCard(row) {
        const statusKey = row.request_status || 'confirmed';
        const statusInfo = this.getStatusInfo(statusKey);
        const dateStr = this.formatDate(row.date);
        const statusLabel = row.request_status ? statusInfo.label : 'В расписании';

        return `
            <div class="admin-card" style="border-left-color: ${statusInfo.color};">
                <div class="admin-card-header">
                    <span class="admin-card-title">${this.escapeHtml(row.subject)}</span>
                    <span class="status-badge" style="background:${statusInfo.bg};color:${statusInfo.color};">
                        ${statusLabel}
                    </span>
                </div>
                <div class="admin-card-meta">
                    <span><i class="fas fa-calendar"></i> ${dateStr}</span>
                    <span><i class="fas fa-clock"></i> ${row.classes} пара</span>
                    <span><i class="fas fa-users"></i> ${this.escapeHtml(row.team)}</span>
                    ${row.num_den_text ? `<span><i class="fas fa-book"></i> ${this.escapeHtml(row.num_den_text)}</span>` : ''}
                </div>
                ${row.original_teacher ? `
                    <div class="admin-card-row">
                        <i class="fas fa-user"></i> Заявитель: <strong>${this.escapeHtml(row.original_teacher)}</strong>
                    </div>
                ` : ''}
                ${row.replacing_teacher ? `
                    <div class="admin-card-row">
                        <i class="fas fa-user-check"></i> Заменяет: <strong>${this.escapeHtml(row.replacing_teacher)}</strong>
                    </div>
                ` : ''}
                ${row.admin_comment ? `
                    <div class="admin-comment">
                        <i class="fas fa-comment-dots"></i> ${this.escapeHtml(row.admin_comment)}
                    </div>
                ` : ''}
                ${row.request_id ? `
                    <div class="admin-card-actions">
                        <button type="button" class="admin-btn admin-btn-primary" onclick="dashboard.modules.admin.viewRequestDetails(${row.request_id})">
                            <i class="fas fa-eye"></i> Подробнее
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    showLoading(container) {
        container.innerHTML = `
            <div class="loading-schedule">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Загрузка...</p>
            </div>
        `;
    }

    showError(container, message) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${this.escapeHtml(message)}</p>
                <button type="button" class="nav-btn" onclick="dashboard.modules.admin.loadData()">
                    <i class="fas fa-redo"></i> Повторить
                </button>
            </div>
        `;
    }

    getStatusInfo(status) {
        switch (status) {
            case 'confirmed':
                return { label: 'Подтверждена', color: '#16a34a', bg: '#dcfce7' };
            case 'rejected':
                return { label: 'Отклонена', color: '#dc2626', bg: '#fee2e2' };
            case 'cancelled':
                return { label: 'Отменена', color: '#6b7280', bg: '#f1f5f9' };
            case 'pending':
            default:
                return { label: 'На рассмотрении', color: '#2563eb', bg: '#dbeafe' };
        }
    }

    formatDate(d) {
        try {
            const dt = new Date(d);
            return dt.toLocaleDateString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' });
        } catch (_) {
            return String(d);
        }
    }

    formatDateTime(d) {
        try {
            const dt = new Date(d);
            return dt.toLocaleString('ru-RU');
        } catch (_) {
            return String(d);
        }
    }

    escapeHtml(str) {
        return String(str ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    renderPhone(phone) {
        if (!phone) return '';
        const digits = String(phone).replace(/\D/g, '');
        const href = digits ? `tel:+${digits.replace(/^8/, '7')}` : '';
        const label = this.escapeHtml(phone);
        if (!href) {
            return `<span class="admin-phone"><i class="fas fa-phone"></i> ${label}</span>`;
        }
        return `<a href="${href}" class="admin-phone"><i class="fas fa-phone"></i> ${label}</a>`;
    }

    async viewRequestDetails(id) {
        if (!id) return;

        this.openModal();
        if (this.modalTitle) this.modalTitle.textContent = `Заявка #${id}`;
        if (this.modalBody) {
            this.modalBody.innerHTML = `
                <div class="loading-schedule">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Загрузка...</p>
                </div>
            `;
        }
        if (this.modalFooter) this.modalFooter.innerHTML = '';

        const data = await this.dashboard.apiRequest(`/requests/${id}`);

        if (!data || !data.success) {
            if (this.modalBody) {
                this.modalBody.innerHTML = `<p>${this.escapeHtml(data?.message || 'Не удалось загрузить заявку')}</p>`;
            }
            return;
        }

        this.showRequestModal(data.request);
    }

    showRequestModal(r) {
        const statusInfo = this.getStatusInfo(r.status);
        if (this.modalTitle) {
            this.modalTitle.textContent = `Заявка #${r.id} — ${r.subject}`;
        }

        if (this.modalBody) {
            this.modalBody.innerHTML = `
                <div class="admin-modal-row"><strong>Статус:</strong>
                    <span class="status-badge" style="background:${statusInfo.bg};color:${statusInfo.color};">
                        ${statusInfo.label}
                    </span>
                </div>
                <div class="admin-modal-row"><strong>Дата занятия:</strong> ${this.formatDate(r.request_date)}</div>
                <div class="admin-modal-row"><strong>Пара:</strong> ${r.classes}</div>
                <div class="admin-modal-row"><strong>Предмет:</strong> ${this.escapeHtml(r.subject)}</div>
                <div class="admin-modal-row"><strong>Группа:</strong> ${this.escapeHtml(r.team)}</div>
                <div class="admin-modal-row"><strong>Неделя:</strong> ${r.week_num ?? '—'}</div>
                <div class="admin-modal-row"><strong>Числ./знам.:</strong> ${this.escapeHtml(r.num_den_text || r.num_den || '—')}</div>
                <div class="admin-modal-row"><strong>Заявитель:</strong> ${this.escapeHtml(r.teacher_name)}${this.renderPhone(r.teacher_phone)}</div>
                <div class="admin-modal-row"><strong>Замещающий:</strong> ${r.replacing_teacher ? this.escapeHtml(r.replacing_teacher) : '—'}${r.replacing_teacher ? this.renderPhone(r.replacing_teacher_phone) : ''}</div>
                <div class="admin-modal-row"><strong>Создана:</strong> ${this.formatDateTime(r.created_at)}</div>
                <div class="admin-modal-row"><strong>Обновлена:</strong> ${r.updated_at ? this.formatDateTime(r.updated_at) : '—'}</div>
                ${r.admin_comment ? `
                    <div class="admin-comment" style="margin-top:12px;">
                        <i class="fas fa-comment-dots"></i> ${this.escapeHtml(r.admin_comment)}
                    </div>
                ` : ''}
            `;
        }

        if (this.modalFooter) {
            let footerHtml = `
                <button type="button" class="admin-btn admin-btn-secondary" onclick="dashboard.modules.admin.closeModal()">
                    <i class="fas fa-times"></i> Закрыть
                </button>
            `;
            if (r.status === 'pending') {
                footerHtml += `
                    <button type="button" class="admin-btn admin-btn-success" onclick="dashboard.modules.admin.confirmRequest(${r.id}, ${JSON.stringify(r.replacing_teacher || '')})">
                        <i class="fas fa-check"></i> Подтвердить
                    </button>
                `;
            }
            if (r.status === 'pending' || r.status === 'confirmed') {
                footerHtml += `
                    <button type="button" class="admin-btn admin-btn-danger" onclick="dashboard.modules.admin.cancelRequest(${r.id}, '${r.status}')">
                        <i class="fas fa-ban"></i> Отменить заявку
                    </button>
                `;
            }
            this.modalFooter.innerHTML = footerHtml;
        }
    }

    async confirmRequest(id, assignedTeacher) {
        if (!id) return;
        if (!confirm('Подтвердить заявку? Замена будет зафиксирована в расписании.')) return;

        let replacingTeacher = (assignedTeacher || '').trim();
        if (!replacingTeacher) {
            const entered = prompt('Укажите фамилию замещающего преподавателя (как в системе):');
            if (!entered) return;
            replacingTeacher = entered.trim();
        }

        const body = replacingTeacher ? { replacing_teacher: replacingTeacher } : undefined;
        const data = await this.dashboard.apiRequest(`/admin/requests/${id}/confirm`, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined
        });

        if (data && data.success) {
            this.dashboard.showSuccess('Заявка подтверждена');
            this.closeModal();
            await this.loadData();
        } else {
            this.dashboard.showError(data?.message || 'Не удалось подтвердить заявку');
        }
    }

    async cancelRequest(id, status) {
        if (!id) return;
        const isConfirmed = status === 'confirmed';
        const message = isConfirmed
            ? 'Отменить подтверждённую заявку? Изменения в расписании будут отменены.'
            : 'Отменить эту заявку?';
        if (!confirm(message)) return;

        const data = await this.dashboard.apiRequest(`/requests/${id}/cancel`, { method: 'PUT' });

        if (data && data.success) {
            this.dashboard.showSuccess('Заявка отменена');
            this.closeModal();
            await this.loadData();
        } else {
            this.dashboard.showError(data?.message || 'Не удалось отменить заявку');
        }
    }
}

window.AdminModule = AdminModule;
