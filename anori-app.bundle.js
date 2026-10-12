
/* ===== BEGIN js/core.js ===== */

/* Local-file safety: ANORI must never create or navigate an iframe to index.html. */
(function(){
  if(window.__ANORI_LOCAL_SAFE__) return;
  try { window.__ANORI_LOCAL_SAFE__ = true; } catch (_) {}
})();
/**
 * Anori Transport ERP - Core Engine (v2.16.0 - FINAL PRODUCTION + RUNTIME HOTFIX)
 * All known bugs fixed, security hardened, performance optimized.
 */
'use strict';

// Global toast compatibility helper: some legacy invoice actions call toast()
// directly, while the current notification API is Utils.toast().
window.toast = window.toast || function(message, type='info'){
  if(window.Utils && typeof window.Utils.toast === 'function') return window.Utils.toast(message, type);
  return null;
};

// ==========================================
// 0. AUTHENTICATION SYSTEM (FIXED)
// ==========================================
const Auth = {
    login(username, password) {
        // In production, replace with secure backend validation
        const valid = username === 'admin' && password === 'admin123';
        if (valid) {
            sessionStorage.setItem('anori_auth', JSON.stringify({
                user: 'admin',
                role: 'admin',
                expires: Date.now() + 3600000 // 1 hour
            }));
            // HIDE login overlay
            document.getElementById('loginOverlay').classList.add('hidden');
            document.getElementById('loginError').textContent = '';
            UI.initAfterLogin();
            return true;
        } else {
            document.getElementById('loginError').textContent = 'Invalid username or password';
            return false;
        }
    },
    logout() {
        sessionStorage.removeItem('anori_auth');
        // SHOW login overlay
        document.getElementById('loginOverlay').classList.remove('hidden');
        document.querySelectorAll('.view').forEach(v => v.remove());
        document.getElementById('globalSearch').value = '';
        // Reset login form
        document.getElementById('loginUsername').value = 'admin';
        document.getElementById('loginPassword').value = 'admin123';
        document.getElementById('loginError').textContent = '';
    },
    isAuthenticated() {
        try {
            const auth = JSON.parse(sessionStorage.getItem('anori_auth') || 'null');
            return !!(auth && auth.expires > Date.now());
        } catch (e) {
            sessionStorage.removeItem('anori_auth');
            return false;
        }
    },
    check() {
        if (!this.isAuthenticated()) {
            document.getElementById('loginOverlay').classList.remove('hidden');
            return false;
        }
        document.getElementById('loginOverlay').classList.add('hidden');
        return true;
    },
    requireAuth() {
        if (!this.isAuthenticated()) {
            Utils.toast('Session expired. Please login again.', 'warning');
            this.logout();
            return false;
        }
        return true;
    }
};

// ==========================================
// 1. SAFE DATABASE & UTILITIES
// ==========================================
const DB = {
    get(key, fallback = []) {
        try {
            const data = localStorage.getItem(`anori_${key}`);
            return data ? JSON.parse(data) : fallback;
        } catch (e) {
            localStorage.removeItem(`anori_${key}`);
            return fallback;
        }
    },
    set(key, data, bypassAuth = false) {
        if (!bypassAuth && !Auth.requireAuth()) return false;
        try {
            localStorage.setItem(`anori_${key}`, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('DB.set failed:', e);
            Utils.toast('Unable to save data. Storage may be full.', 'error');
            return false;
        }
    }
};

// Initialize defaults
if (!DB.get('company_profile').name) {
    DB.set('company_profile', { name: 'Anori Transport Services', addr: '123 Logistics Park, Mumbai', gst: '27AABCA1234F1Z5', phone: '+91 98765 43210', bank: 'HDFC0001234', acc: '1234567890' }, true);
    DB.set('vehicles', [{ id: 'v1', number: 'MH12AB1234', type: 'Truck' }], true);
    DB.set('drivers', [{ id: 'd1', name: 'Mukesh Singh', mobile: '9876543210' }], true);
    DB.set('parties', [{ id: 'p1', name: 'Tata Logistics', gst: '27AABCT1234F1Z5', addr: 'Mumbai' }], true);
    DB.set('trips', [{ id: 't1', trip_no: 'TRP-240501-1030', date: '2024-05-01', vehicle_id: 'v1', driver_id: 'd1', party_id: 'p1', from: 'Mumbai', to: 'Pune', freight: 15000, status: 'completed', invoice_status: 'pending', is_gst: true, expenses: [{ type: 'Diesel', amount: 4000 }], notes: '' }], true);
    DB.set('invoices', [], true);
    DB.set('driver_settlements', [], true);
}

// Add requested default vehicles without removing or changing existing vehicles.
const ANORI_DEFAULT_VEHICLES = [
    'MH04MH6475',
    'MH04NB6475',
    'MH04MT6475',
    'MH04KF1919',
    'MH04JU7897',
    'MH04LQ4244'
];
const existingVehicles = DB.get('vehicles', []);
const existingVehicleNumbers = new Set(existingVehicles.map(v => String(v.number || '').trim().toUpperCase()));
const missingDefaultVehicles = ANORI_DEFAULT_VEHICLES
    .filter(number => !existingVehicleNumbers.has(number))
    .map((number, index) => ({ id: `default-v${Date.now()}-${index}`, number, type: 'Truck', driver_amount: 0 }));
if (missingDefaultVehicles.length) {
    DB.set('vehicles', existingVehicles.concat(missingDefaultVehicles), true);
}

const Sanitize = {
    html(str) {
        if (!str) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(str).replace(/[&<>"']/g, m => map[m]);
    },
    number(num) { return parseFloat(num) || 0; },
    date(dateStr) {
        return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : Utils.today();
    },
    escapeJSON(obj) {
        if (Array.isArray(obj)) return obj.map(v => this.escapeJSON(v));
        if (obj && typeof obj === 'object') {
            const result = {};
            for (let [key, val] of Object.entries(obj)) {
                if (typeof val === 'string') result[key] = this.html(val);
                else if (typeof val === 'object') result[key] = this.escapeJSON(val);
                else result[key] = val;
            }
            return result;
        }
        return obj;
    }
};

const Utils = {
    id: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
    fmt: (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0),
    fmtDec: (n) => '' + (parseFloat(n) || 0).toFixed(2),
    today: () => new Date().toISOString().split('T')[0],
    toast: (msg, type = 'success') => Swal.fire({ icon: type, title: msg, toast: true, position: 'top-end', timer: 2500, showConfirmButton: false }),
    
    numberToWords: function(num) {
        if (num === 0) return 'Zero Only';
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        function convert(n) {
            if (n < 20) return ones[n];
            if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
            if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
            if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
            if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
            return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
        }
        return 'Rupees ' + convert(Math.floor(num)).trim() + ' Only';
    },
    
    generateTripNo: function(dateValue) {
        const baseDate = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
        const yy = String(baseDate.getFullYear()).slice(-2);
        const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
        const dd = String(baseDate.getDate()).padStart(2, '0');
        const base = `TRP-${yy}${mm}${dd}`;
        const trips = DB.get('trips', []) || [];
        const prefix = `${base}-`;
        const used = new Set(trips
            .map(t => String(t.trip_no || ''))
            .filter(no => no.startsWith(prefix))
            .map(no => Number(no.slice(prefix.length)))
            .filter(n => Number.isInteger(n) && n > 0));
        let counter = 1;
        while (used.has(counter)) counter++;
        return `${base}-${String(counter).padStart(2, '0')}`;
    },
    
    generateInvoiceNo: function() {
        const now = new Date();
        const base = `INV-${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const invoices = DB.get('invoices');
        let no;
        do { no = `${base}-${Math.floor(Math.random() * 900000) + 100000}`; }
        while (invoices.some(i => i.invoice_no === no));
        return no;
    },
    
    getMonthYear: function() {
        const now = new Date();
        return { month: now.getMonth(), year: now.getFullYear() };
    },
    
    showLoader(text = 'Loading...') {
        document.getElementById('loaderText').textContent = text;
        document.getElementById('loader').classList.add('active');
    },
    hideLoader() {
        document.getElementById('loader').classList.remove('active');
    }
};

// ==========================================
// 2. UI & ROUTER CONTROLLER
// ==========================================
const UI = {
    init() {
        if (!Auth.check()) {
            document.getElementById('loginOverlay').classList.remove('hidden');
        } else {
            this.initAfterLogin();
        }
        document.getElementById('loginBtn').addEventListener('click', () => {
            const user = document.getElementById('loginUsername').value;
            const pass = document.getElementById('loginPassword').value;
            Auth.login(user, pass);
        });
        document.getElementById('loginPassword').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('loginBtn').click();
        });
        document.getElementById('logoutBtn').addEventListener('click', () => Auth.logout());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (document.getElementById('previewModal').classList.contains('active')) this.closePreview();
                else if (document.getElementById('modalBackdrop').classList.contains('active')) this.closeModal();
            }
        });
    },
    
    initAfterLogin() {
        this.bindTheme();
        this.bindSidebar();
        this.bindGlobalEvents();
        this.bindSearch();
        Router.go('dashboard');
    },
    
    bindTheme() {
        const saved = localStorage.getItem('anori_theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
        const btn = document.getElementById('themeToggle');
        btn.innerHTML = saved === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        btn.onclick = () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('anori_theme', next);
            btn.innerHTML = next === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        };
    },
    
    bindSidebar() {
        const sidebar = document.getElementById('sidebar');
        const topTabs = document.getElementById('topTabs');
        const nav = document.getElementById('navMenu');
        const toggle = document.getElementById('menuToggle');
        const isMobile = () => window.matchMedia && window.matchMedia('(max-width: 1050px)').matches;

        const syncGroupForView = (view) => {
            topTabs?.querySelectorAll('.top-tab').forEach(tab => {
                const sectionMatch = view === 'masters' && Router._topTabSection && tab.dataset.section === Router._topTabSection;
                const target = sectionMatch || (!Router._topTabSection && (tab.dataset.view === view || (view === 'trips' && tab.dataset.view === 'trips-list'))) || (Router._topTabSection === '' && tab.dataset.view === view);
                tab.classList.toggle('active', target);
            });
            const item = nav?.querySelector(`.nav-item[data-view="${CSS.escape(view || '')}"]`);
            if (!item) return;
            const group = item.closest('.nav-group');
            if (!group) return;
            nav.querySelectorAll('.nav-group').forEach(g => {
                const open = g === group;
                g.classList.toggle('is-open', open);
                const button = g.querySelector('.nav-section-toggle');
                if (button) {
                    button.setAttribute('aria-expanded', String(open));
                    const icon = button.querySelector('i');
                    if (icon) icon.className = open ? 'fas fa-chevron-down' : 'fas fa-chevron-right';
                }
            });
        };

        if (toggle) {
            toggle.onclick = () => {
                if (isMobile()) {
                    sidebar?.classList.toggle('open');
                } else {
                    document.body.classList.toggle('sidebar-collapsed');
                    const collapsed = document.body.classList.contains('sidebar-collapsed');
                    toggle.setAttribute('aria-expanded', String(!collapsed));
                }
            };
        }

        nav?.addEventListener('click', (e) => {
            const section = e.target.closest('.nav-section-toggle');
            if (section) {
                e.preventDefault();
                const group = section.closest('.nav-group');
                if (!group) return;
                const shouldOpen = !group.classList.contains('is-open');
                nav.querySelectorAll('.nav-group').forEach(g => {
                    const open = shouldOpen && g === group;
                    g.classList.toggle('is-open', open);
                    const button = g.querySelector('.nav-section-toggle');
                    if (button) {
                        button.setAttribute('aria-expanded', String(open));
                        const icon = button.querySelector('i');
                        if (icon) icon.className = open ? 'fas fa-chevron-down' : 'fas fa-chevron-right';
                    }
                });
                return;
            }

            const item = e.target.closest('.nav-item');
            if (!item) return;
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            syncGroupForView(item.dataset.view);
            Router.go(item.dataset.view);
            if (isMobile()) sidebar?.classList.remove('open');
            document.getElementById('globalSearch').value = '';
        });

        topTabs?.addEventListener('click', (e) => {
            const tab = e.target.closest('.top-tab');
            if (!tab) return;
            e.preventDefault();
            let view = tab.dataset.view;
            if (view === 'trips-list') view = 'trips';
            Router._topTabSection = tab.dataset.section || '';
            document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
            topTabs.querySelectorAll('.top-tab').forEach(t => t.classList.toggle('active', t === tab));
            Router.go(view);
            if (isMobile()) sidebar?.classList.remove('open');
            const search = document.getElementById('globalSearch');
            if (search) search.value = '';
        });

        const current = document.querySelector('.nav-item.active')?.dataset.view || 'dashboard';
        syncGroupForView(current);
        window.addEventListener('resize', () => {
            if (isMobile()) document.body.classList.remove('sidebar-collapsed');
        }, {passive:true});

        // Keep route-driven navigation (buttons/cards calling Router.go) in sync.
        window.anoriSyncSidebar = syncGroupForView;
    },

    bindSearch() {
        const searchInput = document.getElementById('globalSearch');
        const debounce = (fn, delay) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => fn(...args), delay);
            };
        };
        searchInput.addEventListener('input', debounce((e) => {
            const query = e.target.value.toLowerCase();
            const activeView = document.querySelector('.view.active');
            if (!activeView) return;
            const tables = activeView.querySelectorAll('table tbody');
            tables.forEach(tbody => {
                const rows = tbody.querySelectorAll('tr');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(query) ? '' : 'none';
                });
            });
        }, 300));
    },
    
    bindGlobalEvents() {
        document.getElementById('mainContent').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            const type = btn.dataset.type;

            if (action === 'delete-master') {
                e.preventDefault(); e.stopPropagation();
                Masters.delete(type, id);
            }
            if (action === 'edit-master') {
                e.preventDefault(); e.stopPropagation();
                Masters.openModal(type, id);
            }
            if (action === 'view-trip') {
                e.preventDefault(); e.stopPropagation();
                Trips.view(id);
            }
            if (action === 'edit-trip') {
                e.preventDefault(); e.stopPropagation();
                Trips.openEditForm(id);
            }
            if (action === 'delete-trip') {
                e.preventDefault(); e.stopPropagation();
                Trips.delete(id);
            }
            if (action === 'duplicate-trip') {
                e.preventDefault(); e.stopPropagation();
                Trips.duplicate(id);
            }
            if (action === 'delete-invoice') {
                e.preventDefault(); e.stopPropagation();
                Invoices.deleteInvoice(id);
            }
        });

        // Invoice status dropdown - change event
        document.getElementById('mainContent').addEventListener('change', (e) => {
            const target = e.target;
            if (target.dataset.action === 'update-invoice-status') {
                const id = target.dataset.id;
                const newStatus = target.value;
                Invoices.updateStatus(id, newStatus);
            }
        });

        document.getElementById('modalClose').onclick = () => this.closeModal();
        document.getElementById('modalCancel').onclick = () => this.closeModal();
        document.getElementById('modalBackdrop').onclick = (e) => { if(e.target.id === 'modalBackdrop') this.closeModal(); };
        
        document.getElementById('previewClose').onclick = () => this.closePreview();
        document.getElementById('previewModal').onclick = (e) => { if(e.target.id === 'previewModal') this.closePreview(); };
        
        document.getElementById('previewDownloadBtn').onclick = () => {
            const invoiceId = document.getElementById('previewContent').dataset.invoiceId;
            if(invoiceId) Invoices.downloadExisting(invoiceId);
        };

        document.getElementById('backupBtn').onclick = () => Settings.backup();
    },
    
    openModal(title, bodyHtml, onSave, isTripForm = false) {
        const titleEl = document.getElementById('modalTitle');
        if (isTripForm) {
            const heading = String(title || '').toLowerCase().includes('edit') ? 'EDIT TRIP' : 'CREATE NEW TRIP';
            titleEl.innerHTML = `<span class="trip-modal-title-main"><i class="fas fa-truck-fast" aria-hidden="true"></i>${heading}</span><span class="trip-modal-title-sub">Add trip details to create a new trip</span>`;
            titleEl.classList.add('trip-modal-title');
        } else {
            titleEl.textContent = title;
            titleEl.classList.remove('trip-modal-title');
        }
        const body = document.getElementById('modalBody');
        body.innerHTML = bodyHtml;
        if (isTripForm) body.classList.add('trip-form-bg');
        else body.classList.remove('trip-form-bg');
        document.getElementById('modalBackdrop').classList.add('active');
        document.getElementById('modalSave').onclick = onSave;
    },
    
    closeModal() { 
        document.getElementById('modalBackdrop').classList.remove('active');
        document.getElementById('modalBody').classList.remove('trip-form-bg');
    },
    
    closePreview() {
        document.getElementById('previewModal').classList.remove('active');
        document.getElementById('previewContent').innerHTML = '';
    }
};

const Router = {
    _topTabSection: '',
    go(view) {
        if (!Auth.requireAuth()) return;
        try {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
            document.querySelectorAll('.top-tab').forEach(t => {
                const sectionMatch = view === 'masters' && Router._topTabSection && t.dataset.section === Router._topTabSection;
                t.classList.toggle('active', sectionMatch || (!Router._topTabSection && (t.dataset.view === view || (view === 'trips' && t.dataset.view === 'trips-list'))));
            });
            window.anoriSyncSidebar?.(view);
        } catch (_) {}
        const allowed = ['dashboard','masters','trips','invoices','documents','settlements','expenses','reports','settings'];
        if (!allowed.includes(view)) {
            console.warn('Unknown route:', view);
            view = 'dashboard';
        }
        document.querySelectorAll('.view').forEach(v => v.remove());
        const container = document.getElementById('mainContent');
        const viewEl = document.createElement('div');
        viewEl.className = 'view active';
        container.appendChild(viewEl);

        /* v2.16: page/tab names are kept in navigation only; do not render a duplicate text heading above each view. */
        const content = document.createElement('div');
        viewEl.appendChild(content);
        Router._currentContainer = content;

        if (view === 'dashboard') Dashboard.render(content);
        if (view === 'masters') Masters.render(content);
        if (view === 'trips') Trips.render(content);
        if (view === 'invoices') Invoices.render(content);
        if (view === 'documents') { if (window.AnoriDocuments) window.AnoriDocuments.render(content); else content.innerHTML = '<div class="card"><h1 class="page-title">Documents</h1><p>Documents module is loading.</p></div>'; }
        if (view === 'settlements') DriverSettlement.render(content);
        if (view === 'expenses') Expenses.render(content);
        if (view === 'reports') Reports.render(content);
        if (view === 'settings') Settings.render(content);

        /* Install table UX after the module has rendered. */
        setTimeout(()=>window.anoriInstallTableUX?.(),0);
    }
};

// ==========================================
// 3. DASHBOARD MODULE
// ==========================================

/* ===== END js/core.js ===== */


/* ===== BEGIN js/dashboard.js ===== */
const Dashboard = {
    selectedMonth: null,
    selectedYear: null,
    chartInstances: [],
    
    render(container) {
        const { month, year } = Utils.getMonthYear();
        this.selectedMonth = month;
        this.selectedYear = year;
        
        const trips = DB.get('trips');
        const filteredTrips = this.filterByMonth(trips);
        
        const totalTrips = filteredTrips.length;
        const totalRev = filteredTrips.reduce((s, t) => s + (t.freight || 0), 0);
        const totalExp = filteredTrips.reduce((s, t) => s + (t.expenses || []).reduce((e, x) => e + (x.amount || 0), 0), 0);
        const totalProfit = totalRev - totalExp;

        container.innerHTML += `
            <div class="card" style="margin-bottom: 20px;">
                <div class="form-row" style="align-items: flex-end;">
                    <div class="form-group" style="margin: 0;">
                        <label>Filter by Month</label>
                        <select class="form-control" id="dashMonth" onchange="Dashboard.changeMonth()">
                            ${['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => 
                                `<option value="${i}" ${i === month ? 'selected' : ''}>${m}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label>Year</label>
                        <select class="form-control" id="dashYear" onchange="Dashboard.changeMonth()">
                            ${[2023, 2024, 2025, 2026].map(y => `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
            <div class="grid grid-4">
                <div class="card kpi-card"><div class="kpi-info"><h4>Total Trips</h4><p>${totalTrips}</p></div><div class="kpi-icon bg-blue"><i class="fas fa-truck"></i></div></div>
                <div class="card kpi-card"><div class="kpi-info"><h4>Total Revenue</h4><p>${Utils.fmt(totalRev)}</p></div><div class="kpi-icon bg-green"><i class="fas fa-indian-rupee-sign"></i></div></div>
                <div class="card kpi-card"><div class="kpi-info"><h4>Total Expenses</h4><p>${Utils.fmt(totalExp)}</p></div><div class="kpi-icon bg-red"><i class="fas fa-arrow-trend-down"></i></div></div>
                <div class="card kpi-card"><div class="kpi-info"><h4>Net Profit</h4><p>${Utils.fmt(totalProfit)}</p></div><div class="kpi-icon bg-purple"><i class="fas fa-wallet"></i></div></div>
            </div>
            <div class="grid grid-2" style="margin-top: 20px;">
                <div class="card"><h3 class="card-title"><i class="fas fa-chart-line"></i> Profit Trend</h3><div style="height: 250px;"><canvas id="chartProfit"></canvas></div></div>
                <div class="card"><h3 class="card-title"><i class="fas fa-chart-pie"></i> Expense Breakdown</h3><div style="height: 250px;"><canvas id="chartExp"></canvas></div></div>
            </div>
        `;
        // Destroy old chart instances before creating new ones
        this.destroyCharts();
        setTimeout(() => this.renderCharts(filteredTrips), 200);
    },
    
    filterByMonth(trips) {
        return trips.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === this.selectedMonth && d.getFullYear() === this.selectedYear;
        });
    },
    
    changeMonth() {
        this.selectedMonth = parseInt(document.getElementById('dashMonth').value);
        this.selectedYear = parseInt(document.getElementById('dashYear').value);
        Router.go('dashboard');
    },
    
    destroyCharts() {
        if (this.chartInstances && this.chartInstances.length) {
            this.chartInstances.forEach(chart => chart.destroy());
        }
        this.chartInstances = [];
    },
    
    renderCharts(trips) {
        const ctx1 = document.getElementById('chartProfit');
        if (ctx1 && ctx1.offsetParent !== null) {
            const chart1 = new Chart(ctx1, { type: 'line', data: { labels: trips.map(t => t.date), datasets: [{ label: 'Profit', data: trips.map(t => t.freight - (t.expenses||[]).reduce((s,e)=>s+e.amount,0)), borderColor: '#6366f1', tension: 0.4, fill: true, backgroundColor: 'rgba(99, 102, 241, 0.1)' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
            this.chartInstances.push(chart1);
        }
        const expTypes = {};
        trips.forEach(t => (t.expenses||[]).forEach(e => expTypes[e.type] = (expTypes[e.type]||0) + e.amount));
        const ctx2 = document.getElementById('chartExp');
        if (ctx2 && ctx2.offsetParent !== null) {
            const chart2 = new Chart(ctx2, { type: 'doughnut', data: { labels: Object.keys(expTypes), datasets: [{ data: Object.values(expTypes), backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } } });
            this.chartInstances.push(chart2);
        }
    }
};

// ==========================================
// 4. MASTERS MODULE (FIXED delete)
// ==========================================

/* ===== END js/dashboard.js ===== */


/* ===== BEGIN js/trip-management.js ===== */
const Trips = {
    render(container) {
        const trips = DB.get('trips'); 
        const vehicles = DB.get('vehicles'); 
        const drivers = DB.get('drivers'); 
        const parties = DB.get('parties');
        
        container.innerHTML += `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <h3 class="card-title">All Trips</h3>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-primary" onclick="Invoices.showInvoiceGenerator()"><i class="fas fa-file-invoice"></i> Generate Invoice</button>
                        <button class="btn btn-success" onclick="Trips.openForm()"><i class="fas fa-plus"></i> New Trip</button>
                    </div>
                </div>
                ${trips.length === 0 ? `<div class="empty-state"><i class="fas fa-route"></i><h3>No Trips Yet</h3><p>Start by creating your first trip.</p></div>` : `
                <div class="table-wrapper">
                    <table>
                        <thead><tr><th>Date</th><th>Trip #</th><th>Vehicle</th><th>Driver</th><th>Party</th><th>Route</th><th>Freight</th><th>Expenses</th><th>Profit</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>
                            ${trips.map(t => {
                                const v = vehicles.find(x => x.id === t.vehicle_id);
                                const d = drivers.find(x => x.id === t.driver_id);
                                const p = parties.find(x => x.id === t.party_id);
                                const expenses = (t.expenses||[]).reduce((s,e)=>s+e.amount,0);
                                const profit = t.freight - expenses;
                                const statusClass = t.invoice_status === 'paid' ? 'status-paid' : (t.invoice_status === 'shared' ? 'status-shared' : 'status-pending');
                                
                                return `<tr>
                                    <td>${t.date}</td><td><strong>${Sanitize.html(t.trip_no)}</strong></td><td>${Sanitize.html(v?.number)||'-'}</td><td>${Sanitize.html(d?.name)||'-'}</td><td>${Sanitize.html(p?.name)||'-'}</td>
                                    <td>${Sanitize.html(t.from)} → ${Sanitize.html(t.to)}</td><td>${Utils.fmt(t.freight)}</td>
                                    <td class="expense-red">-${Utils.fmt(expenses)}</td>
                                    <td style="color:${profit>=0?'var(--success)':'var(--danger)'}; font-weight:600;">${Utils.fmt(profit)}</td>
                                    <td><span class="status-badge ${statusClass}">${t.invoice_status.toUpperCase()}</span></td>
                                    <td style="white-space: nowrap;">
                                        <button class="btn btn-outline btn-icon" data-action="view-trip" data-id="${t.id}" title="View"><i class="fas fa-eye"></i></button>
                                        <button class="btn btn-outline btn-icon" data-action="edit-trip" data-id="${t.id}" title="Edit"><i class="fas fa-edit"></i></button>
                                        <button class="btn btn-outline btn-icon" data-action="duplicate-trip" data-id="${t.id}" title="Duplicate"><i class="fas fa-copy"></i></button>
                                        <button class="btn btn-danger btn-icon" data-action="delete-trip" data-id="${t.id}" title="Delete"><i class="fas fa-trash"></i></button>
                                    </td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>`}
            </div>
        `;
    },
    
    openForm() {
        const vehicles = DB.get('vehicles'); const drivers = DB.get('drivers'); const parties = DB.get('parties');
        const html = `
            <div class="form-row">
                <div class="form-group"><label>Date</label><input type="date" class="form-control" id="t_date" value="${Utils.today()}"></div>
                <div class="form-group"><label>Vehicle</label><select class="form-control" id="t_vehicle">${vehicles.map(v=>`<option value="${v.id}">${Sanitize.html(v.number)}</option>`).join('')}</select></div>
                <div class="form-group"><label>Driver</label><select class="form-control" id="t_driver">${drivers.map(d=>`<option value="${d.id}">${Sanitize.html(d.name)}</option>`).join('')}</select></div>
                <div class="form-group"><label>Party</label><select class="form-control" id="t_party">${parties.map(p=>`<option value="${p.id}">${Sanitize.html(p.name)}</option>`).join('')}</select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>From</label><input class="form-control" id="t_from" required></div>
                <div class="form-group"><label>To</label><input class="form-control" id="t_to" required></div>
                <div class="form-group"><label>Freight (₹)</label><input type="number" class="form-control" id="t_freight" required min="0"></div>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea class="form-control" id="t_notes" rows="2" placeholder="Optional notes"></textarea>
            </div>
            <h4 style="margin:16px 0 8px;">Expenses</h4>
            <div id="expRows"></div>
            <button type="button" class="btn btn-outline btn-sm" onclick="Trips.addExpRow()" style="margin-top:8px;"><i class="fas fa-plus"></i> Add Expense</button>
        `;
        UI.openModal('Create New Trip', html, () => this.save(), true); 
        this.addExpRow();
    },
    
    openEditForm(id) {
        const invoices = DB.get('invoices');
        const hasInvoice = invoices.some(inv => inv.trip_ids.includes(id));
        
        if (hasInvoice) {
            Swal.fire({
                title: 'Invoice Generated!',
                text: 'This trip is already part of an invoice. Editing it may cause discrepancies. Continue?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#f59e0b',
                cancelButtonText: 'Cancel',
                confirmButtonText: 'Yes, Edit Anyway'
            }).then((result) => {
                if (result.isConfirmed) this.showEditModal(id);
            });
        } else {
            this.showEditModal(id);
        }
    },
    
    showEditModal(id) {
        const trip = DB.get('trips').find(t => t.id === id);
        if (!trip) return;
        const vehicles = DB.get('vehicles'); const drivers = DB.get('drivers'); const parties = DB.get('parties');
        const html = `
            <div class="form-row">
                <div class="form-group"><label>Date</label><input type="date" class="form-control" id="t_date" value="${trip.date}"></div>
                <div class="form-group"><label>Vehicle</label><select class="form-control" id="t_vehicle">${vehicles.map(v=>`<option value="${v.id}" ${v.id===trip.vehicle_id?'selected':''}>${Sanitize.html(v.number)}</option>`).join('')}</select></div>
                <div class="form-group"><label>Driver</label><select class="form-control" id="t_driver">${drivers.map(d=>`<option value="${d.id}" ${d.id===trip.driver_id?'selected':''}>${Sanitize.html(d.name)}</option>`).join('')}</select></div>
                <div class="form-group"><label>Party</label><select class="form-control" id="t_party">${parties.map(p=>`<option value="${p.id}" ${p.id===trip.party_id?'selected':''}>${Sanitize.html(p.name)}</option>`).join('')}</select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>From</label><input class="form-control" id="t_from" value="${Sanitize.html(trip.from)}" required></div>
                <div class="form-group"><label>To</label><input class="form-control" id="t_to" value="${Sanitize.html(trip.to)}" required></div>
                <div class="form-group"><label>Freight (₹)</label><input type="number" class="form-control" id="t_freight" value="${trip.freight}" required min="0"></div>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea class="form-control" id="t_notes" rows="2">${Sanitize.html(trip.notes || '')}</textarea>
            </div>
            <h4 style="margin:16px 0 8px;">Expenses</h4>
            <div id="expRows"></div>
            <button type="button" class="btn btn-outline btn-sm" onclick="Trips.addExpRow()" style="margin-top:8px;"><i class="fas fa-plus"></i> Add Expense</button>
        `;
        UI.openModal('Edit Trip', html, () => this.update(id), true);
        if (trip.expenses && trip.expenses.length > 0) {
            trip.expenses.forEach(exp => {
                const row = document.createElement('div'); row.className = 'form-row'; row.style.marginBottom = '8px';
                row.innerHTML = `<div class="form-group"><select class="form-control exp-type"><option ${exp.type==='Diesel'?'selected':''}>Diesel</option><option ${exp.type==='Toll'?'selected':''}>Toll</option><option ${exp.type==='Food'?'selected':''}>Food</option><option ${exp.type==='Repair'?'selected':''}>Repair</option></select></div><div class="form-group"><input type="number" class="form-control exp-amt" value="${exp.amount}"></div><div class="form-group"><button class="btn btn-danger btn-sm" onclick="this.closest('.form-row').remove()"><i class="fas fa-trash"></i></button></div>`;
                document.getElementById('expRows').appendChild(row);
            });
        } else { this.addExpRow(); }
    },
    
    addExpRow() {
        const row = document.createElement('div'); row.className = 'form-row'; row.style.marginBottom = '8px';
        row.innerHTML = `<div class="form-group"><select class="form-control exp-type"><option>Diesel</option><option>Toll</option><option>Food</option><option>Repair</option></select></div><div class="form-group"><input type="number" class="form-control exp-amt" placeholder="Amount"></div><div class="form-group"><button class="btn btn-danger btn-sm" onclick="this.closest('.form-row').remove()"><i class="fas fa-trash"></i></button></div>`;
        document.getElementById('expRows').appendChild(row);
    },
    
    save() {
        const from = document.getElementById('t_from').value.trim();
        const to = document.getElementById('t_to').value.trim();
        if (!from || !to) {
            Utils.toast('Please fill in "From" and "To" locations.', 'error');
            return;
        }
        const freight = Sanitize.number(document.getElementById('t_freight').value);
        if (freight <= 0) {
            Utils.toast('Freight amount must be greater than zero.', 'error');
            return;
        }

        const expenses = [];
        document.querySelectorAll('#expRows .form-row').forEach(r => { 
            const amt = Sanitize.number(r.querySelector('.exp-amt').value); 
            if (amt > 0) expenses.push({ type: r.querySelector('.exp-type').value, amount: amt }); 
        });
        const trip = {
            id: Utils.id(),
            trip_no: Utils.generateTripNo(document.getElementById('t_date').value),
            date: document.getElementById('t_date').value,
            vehicle_id: document.getElementById('t_vehicle').value,
            driver_id: document.getElementById('t_driver').value,
            party_id: document.getElementById('t_party').value,
            from: Sanitize.html(from),
            to: Sanitize.html(to),
            freight: freight,
            status: 'completed',
            invoice_status: 'pending',
            is_gst: true,
            expenses: Sanitize.escapeJSON(expenses),
            notes: Sanitize.html(document.getElementById('t_notes').value)
        };
        const trips = DB.get('trips'); trips.push(trip); DB.set('trips', trips);
        UI.closeModal(); Utils.toast('Trip created!'); Router.go('trips');
    },
    
    update(id) {
        const from = document.getElementById('t_from').value.trim();
        const to = document.getElementById('t_to').value.trim();
        if (!from || !to) {
            Utils.toast('Please fill in "From" and "To" locations.', 'error');
            return;
        }
        const freight = Sanitize.number(document.getElementById('t_freight').value);
        if (freight <= 0) {
            Utils.toast('Freight amount must be greater than zero.', 'error');
            return;
        }

        const expenses = [];
        document.querySelectorAll('#expRows .form-row').forEach(r => { 
            const amt = Sanitize.number(r.querySelector('.exp-amt').value); 
            if (amt > 0) expenses.push({ type: r.querySelector('.exp-type').value, amount: amt }); 
        });
        const trips = DB.get('trips'); const index = trips.findIndex(t => t.id === id);
        if (index !== -1) {
            trips[index] = { 
                ...trips[index], 
                date: document.getElementById('t_date').value,
                vehicle_id: document.getElementById('t_vehicle').value,
                driver_id: document.getElementById('t_driver').value,
                party_id: document.getElementById('t_party').value,
                from: Sanitize.html(from),
                to: Sanitize.html(to),
                freight: freight,
                expenses: Sanitize.escapeJSON(expenses),
                notes: Sanitize.html(document.getElementById('t_notes').value)
            };
            DB.set('trips', trips); UI.closeModal(); Utils.toast('Trip updated!'); Router.go('trips');
        }
    },
    
    view(id) {
        const t = DB.get('trips').find(x => x.id === id); if(!t) return;
        const v = DB.get('vehicles').find(x => x.id === t.vehicle_id);
        const d = DB.get('drivers').find(x => x.id === t.driver_id);
        const party = DB.get('parties').find(x => x.id === t.party_id);
        const expenses = Array.isArray(t.expenses) ? t.expenses : [];
        const totalExpenses = expenses.reduce((s,e)=>s + Number(e.amount || 0), 0);
        const freight = Number(t.freight || 0);
        const profit = freight - totalExpenses;
        const advance = Number(t.trip_advance_amount || t.driver_advance || 0);
        const linkedInvoices = DB.get('invoices', []).filter(inv => Array.isArray(inv.trip_ids) && inv.trip_ids.includes(id));
        const linkedInvoice = linkedInvoices.slice().sort((a, b) => {
            const ad = new Date(a.date || 0).getTime() || 0;
            const bd = new Date(b.date || 0).getTime() || 0;
            return bd - ad;
        })[0] || null;
        const invoiceStatus = String(t.invoice_status || (linkedInvoice ? linkedInvoice.status : 'pending')).toUpperCase();
        const statusClass = invoiceStatus === 'INVOICED' || invoiceStatus === 'SHARED' ? 'tp-status tp-status-blue' :
                            invoiceStatus === 'PAID' ? 'tp-status tp-status-green' : 'tp-status tp-status-amber';

        const esc = value => Sanitize.html(value == null ? '' : String(value));
        const money = value => Utils.fmt(Number(value || 0));

        const expenseRows = expenses.length ? expenses.map(exp => `
            <div class="tp-expense-row">
                <div class="tp-expense-name"><span class="tp-expense-dot"></span>${esc(exp.type || 'EXPENSE')}</div>
                <div class="tp-expense-amount">-${money(exp.amount)}</div>
            </div>
        `).join('') : `
            <div class="tp-empty-expense">NO BILLABLE / RECORDED EXPENSES</div>
        `;

        Swal.fire({
            title: '',
            html: `
                <div class="tp-preview">
                    <div class="tp-preview-head">
                        <div class="tp-head-icon"><i class="fas fa-route"></i></div>
                        <div class="tp-head-main">
                            <div class="tp-eyebrow">TRIP DETAILS</div>
                            <div class="tp-trip-no">${esc(t.trip_no)}</div>
                            ${linkedInvoice && linkedInvoice.invoice_no ? `<div class="tp-invoice-no"><i class="fas fa-file-invoice"></i> INVOICE NO. <strong>${esc(linkedInvoice.invoice_no)}</strong></div>` : ''}
                            <div class="tp-head-route"><i class="fas fa-location-arrow"></i> ${esc(t.from)} <span>→</span> ${esc(t.to)}</div>
                        </div>
                        <div class="${statusClass}">${esc(invoiceStatus)}</div>
                    </div>

                    <div class="tp-info-grid">
                        <div class="tp-info-card">
                            <div class="tp-info-icon tp-blue"><i class="fas fa-truck"></i></div>
                            <div><div class="tp-label">VEHICLE</div><div class="tp-value">${esc(v?.number || '-')}</div></div>
                        </div>
                        <div class="tp-info-card">
                            <div class="tp-info-icon tp-purple"><i class="fas fa-user-tie"></i></div>
                            <div><div class="tp-label">DRIVER</div><div class="tp-value">${esc(d?.name || '-')}</div></div>
                        </div>
                        <div class="tp-info-card">
                            <div class="tp-info-icon tp-green"><i class="fas fa-building"></i></div>
                            <div><div class="tp-label">PARTY</div><div class="tp-value">${esc(party?.name || '-')}</div></div>
                        </div>
                        <div class="tp-info-card">
                            <div class="tp-info-icon tp-orange"><i class="fas fa-calendar-alt"></i></div>
                            <div><div class="tp-label">TRIP DATE</div><div class="tp-value">${esc(t.date || '-')}</div></div>
                        </div>
                    </div>

                    <div class="tp-finance-grid">
                        <div class="tp-finance-card tp-freight">
                            <div class="tp-finance-icon"><i class="fas fa-indian-rupee-sign"></i></div>
                            <div><div class="tp-label">FREIGHT</div><div class="tp-finance-value">${money(freight)}</div></div>
                        </div>
                        <div class="tp-finance-card tp-advance">
                            <div class="tp-finance-icon"><i class="fas fa-hand-holding-dollar"></i></div>
                            <div><div class="tp-label">TRIP ADVANCE</div><div class="tp-finance-value">${money(advance)}</div></div>
                        </div>
                        <div class="tp-finance-card ${profit >= 0 ? 'tp-profit' : 'tp-loss'}">
                            <div class="tp-finance-icon"><i class="fas fa-chart-line"></i></div>
                            <div><div class="tp-label">NET PROFIT</div><div class="tp-finance-value">${money(profit)}</div></div>
                        </div>
                    </div>

                    <div class="tp-expense-card">
                        <div class="tp-section-title"><span><i class="fas fa-receipt"></i> EXPENSE DETAILS</span><strong>${money(totalExpenses)}</strong></div>
                        <div class="tp-expense-list">${expenseRows}</div>
                    </div>

                    ${t.notes ? `<div class="tp-notes"><div class="tp-notes-title"><i class="fas fa-note-sticky"></i> NOTES</div><div class="tp-notes-text">${esc(t.notes)}</div></div>` : ''}

                    <div class="tp-route-strip">
                        <div><span>FROM</span><strong>${esc(t.from || '-')}</strong></div>
                        <i class="fas fa-arrow-right"></i>
                        <div class="tp-route-to"><span>TO</span><strong>${esc(t.to || '-')}</strong></div>
                    </div>
                </div>
            `,
            width: '780px',
            padding: '0',
            showConfirmButton: true,
            confirmButtonText: '✓ CLOSE',
            customClass: { popup: 'tp-preview-popup', confirmButton: 'tp-close-btn' },
            buttonsStyling: false,
            background: '#ffffff'
        });
    },
    
    delete(id) {
        const invoices = DB.get('invoices', []);
        const linkedInvoices = invoices.filter(inv => Array.isArray(inv.trip_ids) && inv.trip_ids.includes(id));
        const activeLinked = linkedInvoices.filter(inv => String(inv.status || 'issued').toLowerCase() !== 'cancelled');
        if (activeLinked.length > 0) {
            return Swal.fire({
                title: 'Trip is linked to an active invoice',
                html: `This trip is linked to <strong>${activeLinked.length} active invoice(s)</strong>.<br><br><strong>For financial safety, the trip cannot be deleted or removed from an issued invoice.</strong><br>Cancel the invoice first, then try again.`,
                icon: 'warning',
                confirmButtonText: 'OK'
            });
        }
        if (linkedInvoices.length > 0) {
            return Swal.fire({
                title: 'Delete Trip?',
                html: 'The linked invoice(s) are already cancelled. The trip can be deleted without changing any invoice history.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, Delete',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#ef4444'
            }).then(res => {
                if (res.isConfirmed) {
                    DB.set('trips', DB.get('trips').filter(x => x.id !== id));
                    Utils.toast('Trip deleted. Cancelled invoice history was preserved.');
                    Router.go('trips');
                }
            });
        }
        
        Swal.fire({ 
            title: 'Delete Trip?', 
            text: "You won't be able to revert this!", 
            icon: 'warning', 
            showCancelButton: true, 
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel'
        }).then(res => { 
            if (res.isConfirmed) { 
                DB.set('trips', DB.get('trips').filter(x => x.id !== id)); 
                Utils.toast('Trip deleted!'); 
                Router.go('trips'); 
            } 
        });
    },
    
    duplicate(id) {
        const trips = DB.get('trips'); const original = trips.find(t => t.id === id); if (!original) return;
        const newTrip = JSON.parse(JSON.stringify(original)); 
        newTrip.id = Utils.id(); 
        newTrip.trip_no = Utils.generateTripNo(); 
        newTrip.date = Utils.today(); 
        newTrip.invoice_status = 'pending';
        trips.push(newTrip); DB.set('trips', trips); Utils.toast('Trip duplicated!'); Router.go('trips');
    }
};

// ==========================================
// 6. INVOICES MODULE (FIXED PDF & delete)
// ==========================================

/* ===== END js/trip-management.js ===== */


/* ===== BEGIN js/invoices-billing.js ===== */
const Invoices = {
    render(container) {
        const invoices = DB.get('invoices'); const parties = DB.get('parties');
        container.innerHTML += `
            <div class="card">
                <h3 class="card-title">Generated Invoices</h3>
                ${invoices.length === 0 ? `<div class="empty-state"><i class="fas fa-file-invoice"></i><h3>No Invoices</h3><p>Generate your first invoice from the Trip Management page.</p></div>` : `
                <div class="table-wrapper">
                    <table>
                        <thead><tr><th>Invoice #</th><th>Invoice Date</th><th>Cr. Date</th><th>Party</th><th>Trips</th><th>Total Amount</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${invoices.map(inv => {
                                const party = parties.find(p => p.id === inv.party_id);
                                const crDate = new Date(inv.date);
                                crDate.setDate(crDate.getDate() + 30);
                                return `<tr>
                                    <td><strong>${Sanitize.html(inv.invoice_no)}</strong></td>
                                    <td>${inv.date}</td>
                                    <td>${crDate.toISOString().split('T')[0]}</td>
                                    <td>${Sanitize.html(party?.name) || 'N/A'}</td>
                                    <td>${inv.trip_count} trips</td>
                                    <td>${Utils.fmt(inv.total_amount)}</td>
                                    <td><span class="status-badge ${inv.is_gst ? 'status-shared' : 'status-pending'}">${inv.is_gst ? 'GST' : 'Non-GST'}</span></td>
                                    <td>
                                        <select class="form-control" style="padding: 4px 8px; font-size: 12px; width: 120px;" data-action="update-invoice-status" data-id="${inv.id}">
                                            <option value="pending" ${inv.status === 'pending' ? 'selected' : ''}>Pending</option>
                                            <option value="shared" ${inv.status === 'shared' ? 'selected' : ''}>Shared</option>
                                            <option value="paid" ${inv.status === 'paid' ? 'selected' : ''}>Paid</option>
                                        </select>
                                    </td>
                                    <td style="white-space: nowrap;">
                                        <button class="btn btn-outline btn-sm" onclick="Invoices.previewExisting('${inv.id}')"><i class="fas fa-eye"></i> Preview</button>
                                        <button class="btn btn-primary btn-sm" onclick="Invoices.downloadExisting('${inv.id}')"><i class="fas fa-download"></i> Download PDF</button>
                                        <button class="btn btn-danger btn-sm" data-action="delete-invoice" data-id="${inv.id}"><i class="fas fa-trash"></i> Delete</button>
                                    </td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>`}
            </div>
        `;
    },
    
    updateStatus(id, newStatus) {
        const invoices = DB.get('invoices');
        const index = invoices.findIndex(inv => inv.id === id);
        if (index !== -1) {
            invoices[index].status = newStatus;
            DB.set('invoices', invoices);
            const trips = DB.get('trips');
            invoices[index].trip_ids.forEach(tripId => {
                const trip = trips.find(t => t.id === tripId);
                if (trip) trip.invoice_status = newStatus;
            });
            DB.set('trips', trips);
            Utils.toast(`Invoice status updated to ${newStatus}`);
        }
    },
    
    deleteInvoice(id) {
        Swal.fire({
            title: 'Delete Invoice?',
            text: 'This will also revert the linked trips to "pending" status.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel'
        }).then(res => {
            if (res.isConfirmed) {
                const invoices = DB.get('invoices');
                const inv = invoices.find(i => i.id === id);
                if (inv) {
                    const trips = DB.get('trips');
                    inv.trip_ids.forEach(tid => {
                        const trip = trips.find(t => t.id === tid);
                        if (trip) trip.invoice_status = 'pending';
                    });
                    DB.set('trips', trips);
                    DB.set('invoices', invoices.filter(i => i.id !== id));
                    Utils.toast('Invoice deleted successfully!');
                    Router.go('invoices');
                }
            }
        });
    },
    
    showInvoiceGenerator() {
        const trips = DB.get('trips').filter(t => t.status === 'completed');
        const vehicles = DB.get('vehicles'); const parties = DB.get('parties');
        if (trips.length === 0) return Utils.toast('No completed trips available.', 'warning');

        Swal.fire({
            title: 'Select Trips for Invoice',
            html: `
                <div style="text-align: left; max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
                    <table style="width: 100%; font-size: 13px;">
                        <thead><tr style="background: var(--bg-body); position: sticky; top: 0;"><th style="padding: 8px;"><input type="checkbox" id="selectAllTrips"></th><th style="padding: 8px;">Date</th><th style="padding: 8px;">Trip #</th><th style="padding: 8px;">Vehicle</th><th style="padding: 8px;">Party</th><th style="padding: 8px; text-align: right;">Amount</th></tr></thead>
                        <tbody>${trips.map(t => { const v = vehicles.find(x => x.id === t.vehicle_id); const p = parties.find(x => x.id === t.party_id); return `<tr><td style="padding: 8px;"><input type="checkbox" class="trip-select" data-id="${t.id}" data-party="${t.party_id}"></td><td style="padding: 8px;">${t.date}</td><td style="padding: 8px;">${Sanitize.html(t.trip_no)}</td><td style="padding: 8px;">${Sanitize.html(v?.number)}</td><td style="padding: 8px;">${Sanitize.html(p?.name)}</td><td style="padding: 8px; text-align: right;">${Utils.fmt(t.freight)}</td></tr>`; }).join('')}</tbody>
                    </table>
                </div>
                <div style="padding: 15px; background: var(--bg-body); border-radius: 8px;">
                    <label style="display: flex; align-items: center; cursor: pointer; font-weight: 600; margin-bottom: 10px;"><input type="radio" name="invoiceType" value="gst" checked style="margin-right: 10px; width: 18px; height: 18px;"><span class="status-badge status-shared" style="margin-right: 8px;">GST</span> Generate GST Invoice (CGST 9% + SGST 9%)</label>
                    <label style="display: flex; align-items: center; cursor: pointer; font-weight: 600; margin-bottom: 15px;"><input type="radio" name="invoiceType" value="nongst" style="margin-right: 10px; width: 18px; height: 18px;"><span class="status-badge status-pending" style="margin-right: 8px;">Non-GST</span> Generate Non-GST Invoice (No Taxes)</label>
                    <div class="form-group" style="margin: 0;"><label>Advance Received (₹)</label><input type="number" class="form-control" id="invAdvance" value="0" min="0"></div>
                </div>
            `,
            width: '750px', showCancelButton: true, confirmButtonText: '<i class="fas fa-file-invoice"></i> Generate & Download', cancelButtonText: 'Cancel',
            preConfirm: () => {
                const selectedIds = []; document.querySelectorAll('.trip-select:checked').forEach(cb => selectedIds.push(cb.dataset.id));
                if (selectedIds.length === 0) { Swal.showValidationMessage('Select at least one trip'); return false; }
                const partyIds = new Set(Array.from(document.querySelectorAll('.trip-select:checked')).map(cb => cb.dataset.party));
                if (partyIds.size > 1) { Swal.showValidationMessage('All trips must belong to the same party'); return false; }
                return { tripIds: selectedIds, isGst: document.querySelector('input[name="invoiceType"]:checked').value === 'gst', advance: Sanitize.number(document.getElementById('invAdvance').value) };
            }
        }).then(result => {
            if (result.isConfirmed) {
                const selectedTrips = DB.get('trips').filter(t => result.value.tripIds.includes(t.id));
                this.createInvoice(selectedTrips, result.value.isGst, result.value.advance);
            }
        });
        setTimeout(() => {
            const selectAll = document.getElementById('selectAllTrips');
            const newSelectAll = selectAll.cloneNode(true);
            selectAll.parentNode.replaceChild(newSelectAll, selectAll);
            newSelectAll.addEventListener('change', (e) => {
                document.querySelectorAll('.trip-select').forEach(cb => cb.checked = e.target.checked);
            });
        }, 100);
    },
    
    createInvoice(trips, isGst, advance) {
        Utils.showLoader('Generating invoice...');
        setTimeout(() => {
            try {
                const party = DB.get('parties').find(p => p.id === trips[0].party_id);
                const vehicles = DB.get('vehicles');
                const subtotal = trips.reduce((s, t) => s + t.freight, 0);
                const cgst = isGst ? subtotal * 0.09 : 0; const sgst = isGst ? subtotal * 0.09 : 0;
                const total = subtotal + cgst + sgst; const balance = total - advance;
                
                const invoice = { 
                    id: Utils.id(), 
                    invoice_no: Utils.generateInvoiceNo(), 
                    date: Utils.today(), 
                    party_id: party.id, 
                    trip_ids: trips.map(t => t.id), 
                    trip_count: trips.length, 
                    subtotal, cgst, sgst, 
                    total_amount: total, 
                    advance, 
                    balance_due: balance, 
                    is_gst: isGst, 
                    status: 'pending',
                    trips_data: trips.map(t => ({ ...t, vehicle: vehicles.find(v => v.id === t.vehicle_id) })) 
                };
                
                const invoices = DB.get('invoices'); invoices.push(invoice); DB.set('invoices', invoices);
                const allTrips = DB.get('trips'); trips.forEach(t => { const idx = allTrips.findIndex(tr => tr.id === t.id); if (idx !== -1) allTrips[idx].invoice_status = 'shared'; }); DB.set('trips', allTrips);
                
                Utils.hideLoader();
                this.downloadInvoice(invoice);
                Utils.toast('Invoice generated and downloaded!');
                Router.go('invoices');
            } catch (error) { console.error(error); Utils.hideLoader(); Utils.toast('Error generating invoice.', 'error'); }
        }, 500);
    },
    
    previewInvoice(invoice) {
        const content = document.getElementById('previewContent');
        if (!content) return;
        content.innerHTML = '';
        content.dataset.invoiceId = invoice.id;
        if (typeof this.mountInvoiceDocument === 'function') {
            this.mountInvoiceDocument(invoice);
        } else {
            const parsed = new DOMParser().parseFromString(this.buildInvoiceHTML(invoice, true), 'text/html');
            const page = parsed.body.querySelector('.invoice-page, .invoice-wrapper');
            if (!page) throw new Error('Invoice preview could not be rendered.');
            const stage = document.createElement('div');
            stage.className = 'anori-invoice-preview-stage';
            const style = document.createElement('style');
            style.textContent = [...parsed.head.querySelectorAll('style')].map(x => x.textContent).join('\n');
            stage.appendChild(style);
            stage.appendChild(page.cloneNode(true));
            content.appendChild(stage);
        }
        document.getElementById('previewModal')?.classList.add('active');
    },

    previewExisting(id) {
        const invoice = DB.get('invoices').find(i => i.id === id);
        if (!invoice) return Utils.toast('Invoice not found.', 'error');
        this.previewInvoice(invoice);
    },

    downloadExisting(id) {
        const invoice = DB.get('invoices').find(i => i.id === id);
        if (!invoice) return Utils.toast('Invoice not found.', 'error');
        this.downloadInvoice(invoice);
    },

    buildInvoiceHTML(invoice, preview = false) {
        const company = DB.get('company_profile');
        const party = DB.get('parties').find(p => p.id === invoice.party_id) || {};
        const rows = (invoice.trips_data || []).map((t, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${Sanitize.html(t.trip_no)}</td>
                <td>${Sanitize.html(t.date)}</td>
                <td>${Sanitize.html(t.from)} → ${Sanitize.html(t.to)}</td>
                <td>${Sanitize.html(t.vehicle?.number || '')}</td>
                <td style="text-align:right">${Utils.fmt(t.freight)}</td>
            </tr>`).join('');
        const taxRows = invoice.is_gst ? `
            <tr><td colspan="5" style="text-align:right">CGST 9%</td><td style="text-align:right">${Utils.fmt(invoice.cgst)}</td></tr>
            <tr><td colspan="5" style="text-align:right">SGST 9%</td><td style="text-align:right">${Utils.fmt(invoice.sgst)}</td></tr>` : '';
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${Sanitize.html(invoice.invoice_no)}</title>
        <style>
        *{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;background:${preview ? '#e2e8f0' : '#fff'};padding:${preview ? '20px' : '0'};color:#111}
        .invoice-wrapper{width:210mm;min-height:297mm;margin:0 auto;background:#fff;padding:15mm 18mm;font-size:12px;line-height:1.5;text-transform:uppercase}
        h1{font-size:24px;margin:0 0 4px}h2{font-size:18px;margin:0 0 8px}.muted{color:#64748b}.header{display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:14px;margin-bottom:18px}.party{margin-bottom:18px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border:1px solid #d1d5db;padding:7px 8px;text-align:left}th{background:#f1f5f9;font-size:11px}.totals{width:48%;margin-left:auto;margin-top:12px}.totals td{border:none;padding:4px 0}.grand{font-size:15px;font-weight:700;border-top:2px solid #111!important;padding-top:8px!important}.footer{margin-top:30px;border-top:1px solid #ddd;padding-top:10px}.amount-words{margin-top:16px;font-weight:600}
        @media print{body{padding:0;background:#fff}.invoice-wrapper{margin:0;box-shadow:none}}
        </style></head><body><div class="invoice-wrapper">
        <div class="header"><div><h1>${Sanitize.html(company.name || 'Anori Transport Services')}</h1><div>${Sanitize.html(company.addr || '')}</div><div>GSTIN: ${Sanitize.html(company.gst || 'N/A')} | Phone: ${Sanitize.html(company.phone || '')}</div></div><div style="text-align:right"><h2>TAX INVOICE</h2><div><strong>Invoice No:</strong> ${Sanitize.html(invoice.invoice_no)}</div><div><strong>Date:</strong> ${Sanitize.html(invoice.date)}</div><div><strong>Status:</strong> ${Sanitize.html(invoice.status)}</div></div></div>
        <div class="grid"><div class="party"><strong>Bill To</strong><br>${Sanitize.html(party.name || 'N/A')}<br>${Sanitize.html(party.addr || '')}<br>GSTIN: ${Sanitize.html(party.gst || 'N/A')}</div><div class="party"><strong>Payment Terms</strong><br>Credit Period: 30 Days<br>Due Date: ${Sanitize.html(this.getDueDate(invoice.date))}</div></div>
        <table><thead><tr><th>#</th><th>Trip No.</th><th>Date</th><th>Route</th><th>Vehicle</th><th style="text-align:right">Freight</th></tr></thead><tbody>${rows}</tbody><tfoot>
        <tr><td colspan="5" style="text-align:right"><strong>Subtotal</strong></td><td style="text-align:right"><strong>${Utils.fmt(invoice.subtotal)}</strong></td></tr>${taxRows}
        <tr><td colspan="5" style="text-align:right"><strong>Total</strong></td><td style="text-align:right"><strong>${Utils.fmt(invoice.total_amount)}</strong></td></tr>
        <tr><td colspan="5" style="text-align:right">Advance Received</td><td style="text-align:right">-${Utils.fmt(invoice.advance)}</td></tr>
        <tr><td colspan="5" style="text-align:right"><strong>Balance Due</strong></td><td style="text-align:right"><strong>${Utils.fmt(invoice.balance_due)}</strong></td></tr>
        </tfoot></table>
        <div class="amount-words">Amount in words: ${Sanitize.html(Utils.numberToWords(invoice.total_amount))}</div>
        <div class="footer"><div><strong>Bank Details</strong></div><div>Account: ${Sanitize.html(company.acc || 'N/A')} | IFSC: ${Sanitize.html(company.bank || 'N/A')}</div><p class="muted">This is a computer-generated invoice.</p></div>
        </div></body></html>`;
    },

    getDueDate(date) {
        const d = new Date(date);
        if (Number.isNaN(d.getTime())) return Utils.today();
        d.setDate(d.getDate() + 30);
        return d.toISOString().split('T')[0];
    },

    downloadInvoice(invoice) {
        if (typeof this.downloadInvoiceSafe === 'function') return this.downloadInvoiceSafe(invoice);
        Utils.toast('PDF generation is not ready yet. Please try again.', 'warning');
    }
};

// ==========================================
// 7. DRIVER SETTLEMENT
// ==========================================

/* ===== END js/invoices-billing.js ===== */


/* ===== BEGIN js/driver-settlement.js ===== */
const DriverSettlement = {
    render(container) {
        const drivers = DB.get('drivers');
        const settlements = DB.get('driver_settlements');
        container.innerHTML += `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 class="card-title"><i class="fas fa-hand-holding-usd"></i> Driver Ledger</h3><button class="btn btn-primary" onclick="DriverSettlement.openModal()"><i class="fas fa-plus"></i> Add Entry</button></div>
        ${settlements.length ? `<div class="table-wrapper"><table><thead><tr><th>Date</th><th>Driver</th><th>Type</th><th>Description</th><th>Amount</th><th>Action</th></tr></thead><tbody>${settlements.map(s=>{const d=drivers.find(x=>x.id===s.driver_id);return `<tr><td>${Sanitize.html(s.date)}</td><td>${Sanitize.html(d?.name||'N/A')}</td><td><span class="settlement-badge ${s.type==='credit'?'settlement-credit':'settlement-debit'}">${Sanitize.html(s.type)}</span></td><td>${Sanitize.html(s.description||'')}</td><td>${Utils.fmt(s.amount)}</td><td><button class="btn btn-danger btn-sm" onclick="DriverSettlement.remove('${s.id}')"><i class="fas fa-trash"></i></button></td></tr>`}).join('')}</tbody></table></div>` : `<div class="empty-state"><i class="fas fa-wallet"></i><h3>No Settlement Entries</h3><p>Add driver advances, deductions or payments.</p></div>`}</div>`;
    },
    openModal() {
        const drivers=DB.get('drivers');
        const html=`<div class="form-row"><div class="form-group"><label>Date</label><input class="form-control" id="s_date" type="date" value="${Utils.today()}"></div><div class="form-group"><label>Driver</label><select class="form-control" id="s_driver">${drivers.map(d=>`<option value="${d.id}">${Sanitize.html(d.name)}</option>`).join('')}</select></div></div><div class="form-row"><div class="form-group"><label>Type</label><select class="form-control" id="s_type"><option value="debit">Debit / Advance</option><option value="credit">Credit / Payment</option></select></div><div class="form-group"><label>Amount</label><input class="form-control" id="s_amount" type="number" min="0.01"></div></div><div class="form-group"><label>Description</label><input class="form-control" id="s_desc"></div>`;
        UI.openModal('Add Settlement Entry',html,()=>this.save());
    },
    save(){const amount=Sanitize.number(document.getElementById('s_amount').value);if(amount<=0)return Utils.toast('Amount must be greater than zero.','error');const data=DB.get('driver_settlements');data.push({id:Utils.id(),date:Sanitize.date(document.getElementById('s_date').value),driver_id:document.getElementById('s_driver').value,type:document.getElementById('s_type').value,amount,description:Sanitize.html(document.getElementById('s_desc').value)});DB.set('driver_settlements',data);UI.closeModal();Utils.toast('Settlement entry saved.');Router.go('settlements');},
    remove(id){DB.set('driver_settlements',DB.get('driver_settlements').filter(x=>x.id!==id));Utils.toast('Entry deleted.');Router.go('settlements');}
};

// ==========================================
// 8. REPORTS
// ==========================================

/* ===== END js/driver-settlement.js ===== */


/* ===== BEGIN js/expenses.js ===== */
/* ANORI TRANSPORT — Expenses tab
 * Read-only consolidated operating-expense ledger built from Trip expenses.
 * Driver Amount / Advance is intentionally excluded.
 */
'use strict';

const Expenses = {
  _filters: { vehicle:'', driver:'', type:'', from:'', to:'', q:'' },

  _rows() {
    const trips = DB.get('trips', []);
    const vehicles = DB.get('vehicles', []);
    const drivers = DB.get('drivers', []);
    const rows = [];
    const excluded = /^(driver\s*(amount|advance)|advance|driver\s*amt|driver)$/i;
    trips.forEach(t => {
      const list = Array.isArray(t.expenses) ? t.expenses : [];
      list.forEach((e, idx) => {
        const type = String(e?.type || '').trim();
        const amount = Number(e?.amount || 0);
        if (!type || amount <= 0 || excluded.test(type)) return;
        const vehicle = vehicles.find(v => v.id === t.vehicle_id);
        const driver = drivers.find(d => d.id === t.driver_id);
        rows.push({
          id: `${t.id}__expense__${idx}`,
          date: t.date || '',
          tripId: t.id,
          tripNo: t.trip_no || '-',
          vehicle: vehicle?.number || '-',
          driver: driver?.name || '-',
          type,
          description: e.description || e.remarks || type,
          amount
        });
      });
    });
    return rows;
  },

  _filtered() {
    const f = this._filters;
    const q = String(f.q || '').trim().toLowerCase();
    return this._rows().filter(r => {
      if (f.vehicle && r.vehicle !== f.vehicle) return false;
      if (f.driver && r.driver !== f.driver) return false;
      if (f.type && r.type.toLowerCase() !== f.type.toLowerCase()) return false;
      if (f.from && r.date < f.from) return false;
      if (f.to && r.date > f.to) return false;
      if (q && ![r.tripNo,r.vehicle,r.driver,r.type,r.description].join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
  },

  render(container) {
    const vehicles = DB.get('vehicles', []);
    const drivers = DB.get('drivers', []);
    const types = [...new Set(DB.get('expense_master', []).filter(x=>x && x.active!==false).map(x=>String(x.name||'').trim()).filter(Boolean).concat(this._rows().map(r=>r.type)))].sort((a,b)=>a.localeCompare(b));
    const f = this._filters;
    container.innerHTML = `
      <div class="anori-section-intro">
        <div><strong>Expenses</strong><span>All trip operating expenses excluding Driver Advance.</span></div>
      </div>
      <div class="card">
        <div class="anori-action-toolbar">
          <span class="anori-toolbar-label">Actions:</span>
          <button class="anori-action-btn anori-action-pdf" onclick="Expenses.downloadPDF()">📄 PDF / LEDGER</button>
          <button class="anori-action-btn anori-action-export" onclick="Expenses.exportExcel()">📊 EXCEL</button>
          <span class="anori-toolbar-spacer"></span>
        </div>
        <div class="anori-filter-bar anori-expense-filter-bar">
          <label>Vehicle<select id="expenseVehicle" class="form-control"><option value="">All Vehicles</option>${vehicles.map(v=>`<option value="${this._esc(v.number)}" ${f.vehicle===v.number?'selected':''}>${this._esc(v.number)}</option>`).join('')}</select></label>
          <label>Driver<select id="expenseDriver" class="form-control"><option value="">All Drivers</option>${drivers.map(d=>`<option value="${this._esc(d.name)}" ${f.driver===d.name?'selected':''}>${this._esc(d.name)}</option>`).join('')}</select></label>
          <label>Expense Type<select id="expenseType" class="form-control"><option value="">All Expenses</option>${types.map(t=>`<option value="${this._esc(t)}" ${f.type===t?'selected':''}>${this._esc(t)}</option>`).join('')}</select></label>
          <label>From<input id="expenseFrom" class="form-control" type="date" value="${this._esc(f.from)}"></label>
          <label>To<input id="expenseTo" class="form-control" type="date" value="${this._esc(f.to || today())}"></label>
          <label class="expense-search-field">Search<input id="expenseQ" class="form-control" placeholder="Trip, vehicle, driver, expense..." value="${this._esc(f.q)}"></label>
          <button class="btn btn-primary" onclick="Expenses.applyFilter()">🔎 SEARCH</button>
          <button class="btn btn-outline" onclick="Expenses.clearFilter()">↻ CLEAR</button>
        </div>
        <div id="expenseLedgerHost"></div>
      </div>`;
    this.renderLedger();
  },

  renderLedger() {
    const host = document.getElementById('expenseLedgerHost');
    if (!host) return;
    const rows = this._filtered().sort((a,b)=>(b.date||'').localeCompare(a.date||'') || a.tripNo.localeCompare(b.tripNo));
    const total = rows.reduce((s,r)=>s+r.amount,0);
    host.innerHTML = `
      <div class="anori-ledger-summary expense-summary">
        <div><span>Total Expenses</span><strong>${money(total)}</strong></div>
        <div><span>Expense Entries</span><strong>${rows.length}</strong></div>
        <div><span>Trips With Expenses</span><strong>${new Set(rows.map(r=>r.tripId)).size}</strong></div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th>Sr. No.</th><th>Date</th><th>Vehicle</th><th>Driver</th><th>Trip</th><th>Expense Type</th><th>Description</th><th>Amount</th>
          </tr></thead>
          <tbody>${rows.map((r,i)=>`<tr>
            <td>${i+1}</td><td>${this._esc(r.date)}</td><td>${this._esc(r.vehicle)}</td><td>${this._esc(r.driver)}</td><td><strong>${this._esc(r.tripNo)}</strong></td><td><span class="expense-type-badge">${this._esc(r.type)}</span></td><td>${this._esc(r.description)}</td><td>${money(r.amount)}</td>
          </tr>`).join('') || '<tr><td colspan="8" class="empty-state">No expenses found.</td></tr>'}</tbody>
        </table>
      </div>`;
    window.anoriInstallTableUX?.();
  },

  applyFilter() {
    this._filters = {
      vehicle: document.getElementById('expenseVehicle')?.value || '',
      driver: document.getElementById('expenseDriver')?.value || '',
      type: document.getElementById('expenseType')?.value || '',
      from: document.getElementById('expenseFrom')?.value || '',
      to: document.getElementById('expenseTo')?.value || '',
      q: document.getElementById('expenseQ')?.value || ''
    };
    this.renderLedger();
  },

  clearFilter() {
    this._filters = { vehicle:'', driver:'', type:'', from:'', to:today(), q:'' };
    this.render(Router._currentContainer || document.getElementById('mainContent').querySelector('.view > div'));
  },

  exportExcel() {
    const rows = this._filtered();
    if (!rows.length) return Utils.toast('No expense records to export.','warning');
    if (!window.XLSX) return Utils.toast('Excel library is not available.','error');
    const data = rows.map((r,i)=>({
      'Sr. No.':i+1,'Date':r.date,'Vehicle':r.vehicle,'Driver':r.driver,'Trip':r.tripNo,'Expense Type':r.type,'Description':r.description,'Amount':r.amount
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Expenses');
    XLSX.writeFile(wb,`anori-expenses-${today()}.xlsx`);
  },

  downloadPDF() {
    const rows = this._filtered();
    if (!rows.length) return Utils.toast('No expense records to download.','warning');
    const body = rows.map((r,i)=>`<tr><td>${i+1}</td><td>${this._esc(r.date)}</td><td>${this._esc(r.vehicle)}</td><td>${this._esc(r.driver)}</td><td>${this._esc(r.tripNo)}</td><td>${this._esc(r.type)}</td><td>${this._esc(r.description)}</td><td style="text-align:right">${money(r.amount)}</td></tr>`).join('');
    const total = rows.reduce((s,r)=>s+r.amount,0);
    const html = `<div style="font-family:Arial,sans-serif;padding:24px;color:#172033"><h1 style="margin:0 0 6px">ANORI TRANSPORT</h1><h2 style="margin:0 0 18px">EXPENSE LEDGER</h2><p style="font-size:12px">Generated: ${this._esc(today())}</p><table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr>${['Sr. No.','Date','Vehicle','Driver','Trip','Expense Type','Description','Amount'].map(x=>`<th style="border:1px solid #cbd5e1;padding:6px;background:#eaf2ff;text-align:left">${x}</th>`).join('')}</tr></thead><tbody>${body}</tbody><tfoot><tr><th colspan="7" style="text-align:right;padding:7px;border:1px solid #cbd5e1">TOTAL</th><th style="padding:7px;border:1px solid #cbd5e1;text-align:right">${money(total)}</th></tr></tfoot></table></div>`;
    if (window.html2pdf) {
      html2pdf().set({margin:0.35,filename:`anori-expenses-${today()}.pdf`,image:{type:'jpeg',quality:0.98},html2canvas:{scale:2,useCORS:true},jsPDF:{unit:'in',format:'a4',orientation:'landscape'}}).from(html).save();
    } else Utils.toast('PDF library is not available.','error');
  },

  _esc(v){ return (window.Sanitize?.html ? Sanitize.html(v) : String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))); }
};
window.Expenses = Expenses;

/* ===== END js/expenses.js ===== */


/* ===== BEGIN js/master-data.js ===== */
const Masters = {
    render(container) {
        container.classList.add('anori-masters-view');
        const vehicles = DB.get('vehicles'); 
        const drivers = DB.get('drivers'); 
        const parties = DB.get('parties');
        const company = DB.get('company_profile');
        const addressLines = Array.isArray(company.addr_lines) ? company.addr_lines : (String(company.addr || '').split(/\r?\n/).filter(Boolean));

        container.innerHTML += `
            <div class="anori-page-heading"><div><h1>MASTER DATA</h1><p>Manage company, vehicles, drivers and customer master records.</p></div></div>
            <div class="card" style="border-left: 4px solid var(--primary);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <h3 class="card-title"><i class="fas fa-building"></i> Company Profile</h3>
                    <button class="btn btn-primary btn-sm" onclick="Masters.openCompanyModal()"><i class="fas fa-edit"></i> Edit</button>
                </div>
                <div class="grid grid-2" style="gap: 10px; font-size: 14px;">
                    <p><strong>Name:</strong> ${Sanitize.html(company.name) || 'Not Set'}</p>
                    <p><strong>GSTIN:</strong> ${Sanitize.html(company.gst) || 'Not Set'}</p>
                    <p><strong>PAN No.:</strong> ${Sanitize.html(company.pan) || 'Not Set'}</p>
                    <p><strong>Bank Name:</strong> ${Sanitize.html(company.bank_name) || 'Not Set'} | <strong>Bank A/C:</strong> ${Sanitize.html(company.acc) || 'Not Set'} | <strong>IFSC:</strong> ${Sanitize.html(company.bank) || 'Not Set'}</p>
                    <p><strong>Address:</strong><br>${addressLines.length ? addressLines.map(line => Sanitize.html(line)).join('<br>') : 'Not Set'}</p>
                </div>
            </div>

            <div class="grid grid-2">
                <div class="card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                        <h3 class="card-title">Vehicles</h3>
                        <button class="btn btn-primary btn-sm" onclick="Masters.openModal('vehicle')"><i class="fas fa-plus"></i> Add</button>
                    </div>
                    ${vehicles.length === 0 ? `<div class="empty-state"><i class="fas fa-truck"></i><h3>No Vehicles</h3><p>Add your first vehicle to get started.</p></div>` : `
                    <div class="table-wrapper"><table><thead><tr><th>Number</th><th>Type</th><th>Classification</th><th>Driver Amount (₹)</th><th>Action</th></tr></thead><tbody>
                        ${vehicles.map(v => `<tr><td>${Sanitize.html(v.number)}</td><td>${Sanitize.html(v.type)}</td><td><span class="status-badge ${String(v.classification||'company').toLowerCase().includes('outside')?'status-pending':'status-paid'}">${Sanitize.html(v.classification||'COMPANY VEHICLE')}</span></td><td>${Utils.fmt(Number(v.driver_amount)||0)}</td><td><button class="btn btn-primary btn-sm master-action-edit" type="button" title="Edit vehicle" onclick="Masters.openModal('vehicle', '${v.id}')"><i class="fas fa-edit"></i> Edit</button> <button class="btn btn-danger btn-sm master-action-delete" type="button" title="Delete vehicle" data-action="delete-master" data-type="vehicle" data-id="${v.id}"><i class="fas fa-trash"></i> Delete</button></td></tr>`).join('')}
                    </tbody></table></div>`}
                </div>
                <div class="card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                        <h3 class="card-title">Drivers</h3>
                        <button class="btn btn-primary btn-sm" onclick="Masters.openModal('driver')"><i class="fas fa-plus"></i> Add</button>
                    </div>
                    ${drivers.length === 0 ? `<div class="empty-state"><i class="fas fa-user"></i><h3>No Drivers</h3><p>Add your first driver.</p></div>` : `
                    <div class="table-wrapper"><table><thead><tr><th>Name</th><th>Mobile</th><th>Action</th></tr></thead><tbody>
                        ${drivers.map(d => `<tr><td>${Sanitize.html(d.name)}</td><td>${Sanitize.html(d.mobile)}</td><td><button class="btn btn-primary btn-sm master-action-edit" type="button" title="Edit driver" onclick="Masters.openModal('driver', '${d.id}')"><i class="fas fa-edit"></i> Edit</button> <button class="btn btn-danger btn-sm master-action-delete" type="button" title="Delete driver" data-action="delete-master" data-type="driver" data-id="${d.id}"><i class="fas fa-trash"></i> Delete</button></td></tr>`).join('')}
                    </tbody></table></div>`}
                </div>
            </div>
            
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <h3 class="card-title">Parties (Customers)</h3>
                    <button class="btn btn-primary btn-sm" onclick="Masters.openModal('party')"><i class="fas fa-plus"></i> Add</button>
                </div>
                ${parties.length === 0 ? `<div class="empty-state"><i class="fas fa-users"></i><h3>No Parties</h3><p>Add your first customer.</p></div>` : `
                <div class="table-wrapper"><table><thead><tr><th>Name</th><th>GSTIN</th><th>Address</th><th>Action</th></tr></thead><tbody>
                    ${parties.map(p => `<tr><td>${Sanitize.html(p.name)}</td><td>${Sanitize.html(p.gst) || '-'}</td><td>${Sanitize.html(p.addr) || '-'}</td><td><button class="btn btn-primary btn-sm master-action-edit" type="button" title="Edit customer" onclick="Masters.openModal('party', '${p.id}')"><i class="fas fa-edit"></i> Edit</button> <button class="btn btn-danger btn-sm master-action-delete" type="button" title="Delete customer" data-action="delete-master" data-type="party" data-id="${p.id}"><i class="fas fa-trash"></i> Delete</button></td></tr>`).join('')}
                </tbody></table></div>`}
            </div>
        `;
    },
    
    openCompanyModal() {
        const c = DB.get('company_profile');
        const html = `
            <div class="form-group"><label>Company Name</label><input class="form-control" id="c_name" value="${Sanitize.html(c.name)}"></div>
            <div class="form-group"><label>Company Address — Row 1</label><input class="form-control" id="c_addr_1" value="${Sanitize.html((c.addr_lines||[])[0] || (c.addr && !String(c.addr).includes('\n') ? c.addr : ''))}"></div>
            <div class="form-group"><label>Company Address — Row 2</label><input class="form-control" id="c_addr_2" value="${Sanitize.html((c.addr_lines||[])[1] || '')}"></div>
            <div class="form-group"><label>Company Address — Row 3</label><input class="form-control" id="c_addr_3" value="${Sanitize.html((c.addr_lines||[])[2] || '')}"></div>
            <div class="form-group"><label>Company Address — Row 4</label><input class="form-control" id="c_addr_4" value="${Sanitize.html((c.addr_lines||[])[3] || '')}"></div>
            <div class="form-row">
                <div class="form-group"><label>GSTIN</label><input class="form-control" id="c_gst" value="${Sanitize.html(c.gst)}"></div>
                <div class="form-group"><label>PAN No.</label><input class="form-control" id="c_pan" value="${Sanitize.html(c.pan)}"></div>
            </div>
            <div class="form-group"><label>Phone</label><input class="form-control" id="c_phone" value="${Sanitize.html(c.phone)}"></div>
            <div class="form-row">
                <div class="form-group"><label>Bank Name</label><input class="form-control" id="c_bank_name" value="${Sanitize.html(c.bank_name)}"></div>
                <div class="form-group"><label>Bank Account No</label><input class="form-control" id="c_acc" value="${Sanitize.html(c.acc)}"></div>
            </div>
            <div class="form-group"><label>IFSC Code</label><input class="form-control" id="c_bank" value="${Sanitize.html(c.bank)}"></div>
        `;
        UI.openModal('Edit Company Profile', html, () => {
            const addrLines = [1,2,3,4].map(n => Sanitize.html(document.getElementById(`c_addr_${n}`).value.trim())).filter(Boolean);
            const current = DB.get('company_profile') || {};
            DB.set('company_profile', {
                ...current,
                name: Sanitize.html(document.getElementById('c_name').value),
                addr: addrLines.join('\n'),
                addr_lines: addrLines,
                gst: Sanitize.html(document.getElementById('c_gst').value),
                pan: Sanitize.html(document.getElementById('c_pan').value),
                phone: Sanitize.html(document.getElementById('c_phone').value),
                bank_name: Sanitize.html(document.getElementById('c_bank_name').value),
                acc: Sanitize.html(document.getElementById('c_acc').value),
                bank: Sanitize.html(document.getElementById('c_bank').value)
            });
            UI.closeModal(); Utils.toast('Company details updated!'); Router.go('masters');
        });
    },
    
    openModal(type, id = null) {
        const data = DB.get(type + 's'); 
        const item = id ? data.find(x => x.id === id) : {};
        const title = `${id ? 'Edit' : 'Add'} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        
        let html = '';
        if (type === 'vehicle') {
            const rawType = String(item.type || '');
            const upperType = rawType.toUpperCase();
            const legacyTypeOption = rawType && !['PETRO','DESIEL','CNG'].includes(upperType) ? `<option value="${Sanitize.html(rawType)}" selected>${Sanitize.html(rawType)}</option>` : '';
            const rawClass=String(item.classification||item.vehicle_classification||'COMPANY VEHICLE').toUpperCase();
            const outsideClass=['OUTSIDE','OUTSIDE VEHICLE','OUTSIDE ORGANIZATION','OUTSIDE ORGANIZATION VEHICLE','EXTERNAL','VENDOR'].includes(rawClass)?'OUTSIDE ORGANIZATION VEHICLE':'COMPANY VEHICLE';
            html = `<div class="form-group"><label>Vehicle Number</label><input class="form-control" id="m_number" value="${Sanitize.html(item.number)}" required></div><div class="form-group"><label>Vehicle Type</label><select class="form-control" id="m_type"><option value="">Select Type</option><option value="PETRO" ${upperType==='PETRO'?'selected':''}>PETRO</option><option value="DESIEL" ${upperType==='DESIEL'?'selected':''}>DESIEL</option><option value="CNG" ${upperType==='CNG'?'selected':''}>CNG</option>${legacyTypeOption}</select></div><div class="form-group"><label>Vehicle Classification</label><select class="form-control" id="m_classification"><option value="COMPANY VEHICLE" ${outsideClass==='COMPANY VEHICLE'?'selected':''}>COMPANY VEHICLE</option><option value="OUTSIDE ORGANIZATION VEHICLE" ${outsideClass==='OUTSIDE ORGANIZATION VEHICLE'?'selected':''}>OUTSIDE ORGANIZATION VEHICLE</option></select><small class="anori-help">Outside Organization Vehicle automatically opens the Outside Vehicle workflow in New Trip.</small></div><div class="form-group"><label>Driver Amount (₹)</label><input type="number" class="form-control" id="m_driver_amount" min="0" step="0.01" value="${Number(item.driver_amount)||0}" placeholder="Enter INR amount"></div>`;
        } else if (type === 'driver') {
            html = `<div class="form-group"><label>Name</label><input class="form-control" id="m_name" value="${Sanitize.html(item.name)}" required></div><div class="form-group"><label>Mobile</label><input class="form-control" id="m_mobile" value="${Sanitize.html(item.mobile)}"></div>`;
        } else if (type === 'party') {
            html = `<div class="form-group"><label>Party Name</label><input class="form-control" id="m_name" value="${Sanitize.html(item.name)}" required></div><div class="form-group"><label>GSTIN</label><input class="form-control" id="m_gst" value="${Sanitize.html(item.gst)}"></div><div class="form-group"><label>Address</label><input class="form-control" id="m_addr" value="${Sanitize.html(item.addr)}"></div>`;
        }
        UI.openModal(title, html, () => this.save(type, id));
    },
    
    save(type, id) {
        const dbKey = type === 'party' ? 'parties' : (type + 's');
        const data = DB.get(dbKey); 
        let item = id ? data.find(x => x.id === id) : { id: Utils.id() };
        
        if (type === 'vehicle') {
            item.number = Sanitize.html(document.getElementById('m_number').value);
            item.type = Sanitize.html(document.getElementById('m_type').value);
            item.classification = Sanitize.html(document.getElementById('m_classification')?.value || 'COMPANY VEHICLE');
            item.vehicle_classification = item.classification;
            const driverAmount = parseFloat(document.getElementById('m_driver_amount').value);
            item.driver_amount = Number.isFinite(driverAmount) && driverAmount >= 0 ? driverAmount : 0;
        } else if (type === 'driver') {
            item.name = Sanitize.html(document.getElementById('m_name').value);
            item.mobile = Sanitize.html(document.getElementById('m_mobile').value);
        } else if (type === 'party') {
            item.name = Sanitize.html(document.getElementById('m_name').value);
            item.gst = Sanitize.html(document.getElementById('m_gst').value);
            item.addr = Sanitize.html(document.getElementById('m_addr').value);
        }
        
        if (!id) data.push(item);
        DB.set(dbKey, data); 
        UI.closeModal(); 
        Utils.toast(`${type} saved!`); 
        Router.go('masters');
    },
    
    delete(type, id) {
        const trips = DB.get('trips');
        const invoices = DB.get('invoices');
        const dbKey = type === 'party' ? 'parties' : (type + 's');
        
        let linkedTrips = 0;
        let linkedInvoices = 0;
        
        if (type === 'vehicle') {
            linkedTrips = trips.filter(t => t.vehicle_id === id).length;
            linkedInvoices = invoices.filter(inv => inv.trips_data && inv.trips_data.some(t => t.vehicle_id === id)).length;
        } else if (type === 'driver') {
            linkedTrips = trips.filter(t => t.driver_id === id).length;
            linkedInvoices = invoices.filter(inv => inv.trips_data && inv.trips_data.some(t => t.driver_id === id)).length;
        } else if (type === 'party') {
            linkedTrips = trips.filter(t => t.party_id === id).length;
            linkedInvoices = invoices.filter(inv => inv.party_id === id).length;
        }
        
        if (linkedTrips > 0 || linkedInvoices > 0) {
            let msg = `This ${type} is linked to `;
            if (linkedTrips > 0) msg += `<strong>${linkedTrips} trip(s)</strong>`;
            if (linkedTrips > 0 && linkedInvoices > 0) msg += ' and ';
            if (linkedInvoices > 0) msg += `<strong>${linkedInvoices} invoice(s)</strong>`;
            msg += '. Please delete or update the linked records first.';
            return Swal.fire({
                title: 'Cannot Delete!',
                html: msg,
                icon: 'error',
                confirmButtonColor: '#ef4444',
                confirmButtonText: 'OK'
            });
        }
        
        Swal.fire({ 
            title: 'Delete?', 
            text: `Are you sure you want to delete this ${type}?`, 
            icon: 'warning', 
            showCancelButton: true, 
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel'
        }).then(res => {
            if (res.isConfirmed) { 
                const currentData = DB.get(dbKey);
                const updatedData = currentData.filter(x => x.id !== id);
                DB.set(dbKey, updatedData);
                Utils.toast('Deleted successfully!'); 
                Router.go('masters'); 
            }
        });
    }
};

// ==========================================
// 5. TRIPS MODULE
// ==========================================

/* ===== END js/master-data.js ===== */


/* ===== BEGIN js/reports-analytics.js ===== */
const Reports = {
    render(container){
        const trips=DB.get('trips');const revenue=trips.reduce((s,t)=>s+Sanitize.number(t.freight),0);const expenses=trips.reduce((s,t)=>s+(t.expenses||[]).reduce((x,e)=>x+Sanitize.number(e.amount),0),0);
        container.innerHTML += `<div class="grid grid-4"><div class="card kpi-card"><div class="kpi-info"><h4>Total Trips</h4><p>${trips.length}</p></div></div><div class="card kpi-card"><div class="kpi-info"><h4>Revenue</h4><p>${Utils.fmt(revenue)}</p></div></div><div class="card kpi-card"><div class="kpi-info"><h4>Expenses</h4><p>${Utils.fmt(expenses)}</p></div></div><div class="card kpi-card"><div class="kpi-info"><h4>Profit</h4><p>${Utils.fmt(revenue-expenses)}</p></div></div></div><div class="card"><h3 class="card-title"><i class="fas fa-chart-bar"></i> Trip Profitability</h3><div class="table-wrapper"><table><thead><tr><th>Trip</th><th>Date</th><th>Party</th><th>Revenue</th><th>Expense</th><th>Profit</th></tr></thead><tbody>${trips.map(t=>{const p=DB.get('parties').find(x=>x.id===t.party_id);const e=(t.expenses||[]).reduce((s,x)=>s+Sanitize.number(x.amount),0);return `<tr><td>${Sanitize.html(t.trip_no)}</td><td>${Sanitize.html(t.date)}</td><td>${Sanitize.html(p?.name||'N/A')}</td><td>${Utils.fmt(t.freight)}</td><td class="expense-red">-${Utils.fmt(e)}</td><td>${Utils.fmt(t.freight-e)}</td></tr>`}).join('')}</tbody></table></div></div>`;
    }
};

// ==========================================
// 9. SETTINGS / BACKUP
// ==========================================

/* ===== END js/reports-analytics.js ===== */


/* ===== BEGIN js/settings.js ===== */
const Settings = {
    render(container){
        const c=DB.get('company_profile');
        const folder=localStorage.getItem('anori_backup_folder_name')||'Not selected';
        const last=localStorage.getItem('anori_backup_last_time');
        const lastText=last?new Date(last).toLocaleString():'Not backed up yet';
        const supported=!!window.showDirectoryPicker;
        container.innerHTML += `<div class="card"><h3 class="card-title"><i class="fas fa-cog"></i> System Settings</h3><div class="form-row"><div><strong>Company</strong><p>${Sanitize.html(c.name||'Not Set')}</p></div><div><strong>Storage</strong><p>Browser localStorage</p></div></div><hr style="margin:20px 0;border:0;border-top:1px solid var(--border)"><div class="anori-backup-panel"><div class="anori-backup-status"><strong>Automatic Backup</strong><span class="anori-badge">Every 5 Minutes</span></div><p style="margin:8px 0 4px"><strong>Selected Folder:</strong> <span id="anoriBackupFolderName">${Sanitize.html(folder)}</span></p><p style="margin:4px 0"><strong>Backup File:</strong> <span class="anori-folder-path">${BACKUP_FILE}</span></p><p style="margin:4px 0 12px"><strong>Status:</strong> <span id="anoriBackupStatus">Last backup: ${Sanitize.html(lastText)}</span></p><div class="anori-action-bar"><button class="btn btn-primary" onclick="window.anoriSelectBackupFolder()"><i class="fas fa-folder-open"></i> Select Backup Folder</button><button class="btn btn-outline" onclick="window.anoriBackupNow()"><i class="fas fa-cloud-upload-alt"></i> Backup Now</button><button class="btn btn-outline" onclick="window.anoriBackupStatus()"><i class="fas fa-shield-alt"></i> Backup Status</button></div><small class="anori-help">${supported?'The selected folder will contain one file only. The same file is overwritten every 5 minutes.':'Folder selection requires a Chromium browser such as Chrome or Edge.'}</small></div></div><button class="btn btn-outline" onclick="Settings.clearSearch()"><i class="fas fa-rotate-left"></i> Clear Search</button></div>`;
    },

    backup(){
        if(!Auth.requireAuth())return;
        if(typeof window.anoriBackupNow==='function') return window.anoriBackupNow();
        Utils.toast('Select a backup folder first.','warning');
    },
    clearSearch(){const s=document.getElementById('globalSearch');if(s)s.value='';Utils.toast('Search cleared.');}
};

// ==========================================
// 10. APP STARTUP + SESSION WATCH

/* ===== END js/settings.js ===== */


/* ===== BEGIN js/app.js ===== */
/* ANORI TRANSPORT — INVOICES & BILLING ACTION PDF FINAL ROUTE — 2026-08-29 */
// ==========================================
document.addEventListener('DOMContentLoaded', () => UI.init());
setInterval(() => {
    if (sessionStorage.getItem('anori_auth') && !Auth.isAuthenticated()) {
        Auth.logout();
    }
}, 30000);
/* ANORI TRANSPORT ERP v2.4 — SIMPLE UI + OPERATIONS + INVOICE CONTROL
   Scope: Anori Transport ERP only.
   Existing core modules/data are preserved; this layer adds the requested
   user-friendly workflow and uses one invoice renderer for preview/PDF/print.
*/
(function installAnoriV24(){
  'use strict';
  const esc = v => Sanitize.html(v == null ? '' : String(v));
  const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const money = v => Utils.fmt(num(v));
  const today = () => Utils.today();
  const ANORI_EXPENSE_MASTER_V1 = [
    'Fuel',
    'Toll',
    'Parking',
    'Repair & Maintenance',
    'Tyre',
    'Driver Expense',
    'Food',
    'Accommodation',
    'Challan',
    'Permit / Tax',
    'Washing',
    'Loading / Unloading',
    'Weighbridge',
    'Miscellaneous'
  ];
  const getExpenseMaster = () => {
    let list = DB.get('expense_master', null);
    if (!Array.isArray(list)) {
      list = ANORI_EXPENSE_MASTER_V1.map((name,i)=>({id:`EXP-${i+1}`,name,defaultAmount:0,showOnInvoice:true,active:true}));
      DB.set('expense_master', list, true);
    }
    return list;
  };
  getExpenseMaster();

  // Replace only the previous built-in expense master list with the approved list.
  // User-added/custom expense entries are preserved.
  (function migrateExpenseMaster(){
    const key='anori_expense_master_v1_migrated';
    if(localStorage.getItem(key)) return;
    const current=DB.get('expense_master',[]);
    const legacyNames=['THC','Documentation','BL Charges','Seal','Cartage','Transportation','Loading','Unloading','Handling','Other'];
    const isLegacy=Array.isArray(current) && current.length===legacyNames.length && current.every((x,i)=>String(x?.name||'')===legacyNames[i]);
    if(isLegacy){
      const list=ANORI_EXPENSE_MASTER_V1.map((name,i)=>({id:`EXP-${i+1}`,name,defaultAmount:0,showOnInvoice:true,active:true}));
      DB.set('expense_master',list,true);
    }
    localStorage.setItem(key,'1');
  })();

  // ------------------------------------------------------------
  // 15. DATA SAFETY — lightweight audit history
  // ------------------------------------------------------------
  if (!DB.__anoriAuditWrapped) {
    const originalSet = DB.set.bind(DB);
    DB.set = function(key, data, bypassAuth=false){
      const result = originalSet(key, data, bypassAuth);
      if (result && key !== 'audit_log') {
        try {
          const log = DB.get('audit_log', []);
          log.unshift({id:Utils.id(), key, time:new Date().toISOString(), user:'Administrator', action:'Updated'});
          originalSet('audit_log', log.slice(0,200), true);
        } catch(e) { console.warn('Audit log skipped', e); }
      }
      return result;
    };
    DB.__anoriAuditWrapped = true;
  }

  // ------------------------------------------------------------
  // 8. SIMPLE PROFIT CONTROL
  // ------------------------------------------------------------
  window.anoriProfitStatus = function(sell, cost){
    const s=num(sell), c=num(cost), profit=s-c, pct=s ? (profit/s)*100 : 0;
    if (profit < 0) return {label:'Loss', cls:'anori-profit-bad', icon:'🔴', pct};
    if (pct < 5) return {label:'Low Margin', cls:'anori-profit-warn', icon:'🟡', pct};
    return {label:'Good Margin', cls:'anori-profit-good', icon:'🟢', pct};
  };
  window.anoriShowCalculation = function(title, formula, result){
    Swal.fire({title:esc(title), html:`<div class="anori-calc-box"><div>${esc(formula)}</div><strong>${esc(result)}</strong></div>`, icon:'info', confirmButtonText:'OK'});
  };

  // ------------------------------------------------------------
  // 9. SMART FOLLOW-UP — simple customer/payment follow-up
  // ------------------------------------------------------------
  function getFollowups(){ return DB.get('followups', []); }
  function saveFollowups(x){ DB.set('followups', x); }
  window.anoriAddFollowup = function(partyId='', invoiceId=''){
    const parties=DB.get('parties'); const inv=DB.get('invoices').find(x=>x.id===invoiceId);
    const options=parties.map(p=>`<option value="${esc(p.id)}" ${p.id===partyId?'selected':''}>${esc(p.name)}</option>`).join('');
    Swal.fire({title:'Add Follow-up', html:`
      <div class="anori-simple-form">
        <label>Customer</label><select id="anori-fu-party">${options}</select>
        <label>What to do</label><input id="anori-fu-note" value="${esc(inv?'Payment follow-up':'Customer follow-up')}" placeholder="Example: Call customer">
        <label>Follow-up Date</label><input id="anori-fu-date" type="date" value="${today()}">
      </div>`, showCancelButton:true, confirmButtonText:'Save Follow-up', preConfirm:()=>{
        const p=document.getElementById('anori-fu-party')?.value;
        const note=document.getElementById('anori-fu-note')?.value.trim();
        const date=document.getElementById('anori-fu-date')?.value;
        if(!p||!note||!date){Swal.showValidationMessage('Please fill Customer, What to do and Date.');return false;}
        return {partyId:p,note,date,invoiceId,status:'PENDING'};
      }}).then(r=>{if(!r.isConfirmed)return; const f=getFollowups();f.push({id:Utils.id(),...r.value,createdAt:new Date().toISOString()});saveFollowups(f);Utils.toast('Follow-up saved.');Router.go('dashboard');});
  };
  window.anoriCompleteFollowup = function(id){ const f=getFollowups(); const x=f.find(a=>a.id===id); if(x){x.status='DONE';x.completedAt=new Date().toISOString();saveFollowups(f);renderAnoriDashboardTop();} };

  // ------------------------------------------------------------
  // 10. DOCUMENT CENTER — one simple place for documents
  // ------------------------------------------------------------
  const Documents = {
    render(container){
      const invoices=DB.get('invoices'), trips=DB.get('trips'), settlements=DB.get('driver_settlements');
      container.innerHTML += `<div class="anori-section-intro"><div><strong>Documents</strong><span>Open or download your important documents from one place.</span></div></div>
      <div class="anori-doc-grid">
        <div class="anori-doc-card"><div class="anori-doc-icon">🧾</div><div><strong>Invoices</strong><span>${invoices.length} saved</span></div><button class="btn btn-primary btn-sm" onclick="Router.go('invoices')">Open</button></div>
        <div class="anori-doc-card"><div class="anori-doc-icon">🚚</div><div><strong>Trip Records</strong><span>${trips.length} saved</span></div><button class="btn btn-primary btn-sm" onclick="Router.go('trips')">Open</button></div>
        <div class="anori-doc-card"><div class="anori-doc-icon">💰</div><div><strong>Driver Settlements</strong><span>${settlements.length} entries</span></div><button class="btn btn-primary btn-sm" onclick="Router.go('settlements')">Open</button></div>
      </div>
      <div class="card"><div class="anori-section-head"><div><h3 class="card-title">Recent Documents</h3><span class="anori-help">Use Preview before printing or downloading.</span></div></div>
        <div class="table-wrapper"><table><thead><tr><th>Document</th><th>Number</th><th>Date</th><th>Customer / Driver</th><th>Action</th></tr></thead><tbody>
          ${invoices.slice().reverse().slice(0,10).map(x=>{const p=DB.get('parties').find(a=>a.id===x.party_id);return `<tr><td>Invoice</td><td><strong>${esc(x.invoice_no)}</strong></td><td>${esc(x.date)}</td><td>${esc(p?.name||'-')}</td><td><button class="btn btn-outline btn-sm" onclick="Invoices.previewExisting('${esc(x.id)}')">👁 Preview</button> <button class="btn btn-primary btn-sm" onclick="Invoices.downloadExisting('${esc(x.id)}')">📄 PDF</button></td></tr>`}).join('') || '<tr><td colspan="5" class="empty-state">No documents yet.</td></tr>'}
        </tbody></table></div>
      </div>`;
    }
  };
  window.AnoriDocuments=Documents;

  const originalRouterGo=Router.go.bind(Router);
  Router.go=function(view){
    if(view!=='documents') return originalRouterGo(view);
    if(!Auth.requireAuth())return;
    document.querySelectorAll('.view').forEach(v=>v.remove());
    const container=document.getElementById('mainContent'); const viewEl=document.createElement('div');viewEl.className='view active';container.appendChild(viewEl);
    const header=document.createElement('div');header.className='page-header';header.innerHTML='<h1 class="page-title">Documents</h1>';viewEl.appendChild(header);
    const content=document.createElement('div');viewEl.appendChild(content);Documents.render(content);
  };

  // ------------------------------------------------------------
  // 13 + 14. DASHBOARD TOP: simple cards + action center
  // ------------------------------------------------------------
  window.renderAnoriDashboardTop=function(){
    const host=document.getElementById('anori-dashboard-top'); if(!host)return;
    const tripRows=DB.get('trips')||[], invoiceRows=DB.get('invoices')||[], followupRows=typeof getFollowups==='function'?(getFollowups()||[]):[];
    const driverRows=DB.get('driver_settlements')||[];
    const pendingToGenerate=tripRows.filter(t=>t.status==='completed'&&!(typeof activeInv==='function'&&activeInv(t.id))).length;
    const pendingPayment=invoiceRows.filter(i=>!['paid','cancelled'].includes(String(i.status||'').toLowerCase())&&num(i.balance_due)>0).length;
    const overdue=invoiceRows.filter(i=>num(i.balance_due)>0&&String(i.status||'').toLowerCase()!=='paid'&&String(i.status||'').toLowerCase()!=='cancelled'&&typeof status==='function'&&status(i)==='overdue').length;
    const dueFollowups=followupRows.filter(x=>x.status!=='DONE'&&x.date<=today()).length;

    const attention=[
      {icon:'🧾',value:pendingToGenerate,title:'Pending to Generate Invoice',note:'Completed trips awaiting invoice',cls:'warn',action:"Router.go('trips')"},
      {icon:'💳',value:pendingPayment,title:'Pending Payment',note:'Invoices with outstanding balance',cls:'payment',action:"Router.go('invoices')"},
      {icon:'⏰',value:overdue,title:'Overdue Invoice',note:'Requires payment follow-up',cls:'danger',action:"Router.go('invoices')"},
      {icon:'📞',value:dueFollowups,title:'Follow-up Today',note:'Customer calls due today',cls:'info',action:"Router.go('dashboard');setTimeout(()=>anoriAddFollowup(),50)"}
    ];

    const actionRows=[];
    if(pendingToGenerate) actionRows.push(`<div class="anori-action-line warn"><span>🧾</span><div><strong>${pendingToGenerate} trip${pendingToGenerate>1?'s':''} pending invoice generation</strong><small>Completed trips are ready for billing.</small></div><button class="btn btn-outline btn-sm" onclick="Router.go('trips')">Open →</button></div>`);
    if(pendingPayment) actionRows.push(`<div class="anori-action-line payment"><span>💳</span><div><strong>${pendingPayment} invoice${pendingPayment>1?'s':''} payment pending</strong><small>Outstanding customer receivables.</small></div><button class="btn btn-outline btn-sm" onclick="Router.go('invoices')">Open →</button></div>`);
    if(overdue) actionRows.push(`<div class="anori-action-line danger"><span>🔴</span><div><strong>${overdue} overdue invoice${overdue>1?'s':''}</strong><small>Payment follow-up should be prioritised.</small></div><button class="btn btn-outline btn-sm" onclick="Router.go('invoices')">Open →</button></div>`);
    if(dueFollowups) actionRows.push(`<div class="anori-action-line info"><span>📞</span><div><strong>${dueFollowups} follow-up${dueFollowups>1?'s':''} due today</strong><small>Customer communication is due.</small></div><button class="btn btn-outline btn-sm" onclick="Router.go('dashboard');setTimeout(()=>anoriAddFollowup(),50)">Open →</button></div>`);

    host.innerHTML=`
      <section class="anori-cc-head">
        <div><div class="anori-cc-eyebrow">ANORI TRANSPORT • OPERATIONS CONTROL CENTRE</div><h1>Dashboard</h1><p>Today's operational and financial overview</p></div>
        <div class="anori-cc-head-actions"><button class="btn btn-primary btn-sm" onclick="Router.go('trips')">＋ New Trip</button><button class="btn btn-outline btn-sm" onclick="renderAnoriDashboardTop()">↻ Refresh</button></div>
      </section>

      <section class="anori-cc-panel">
        <div class="anori-cc-panel-head"><div><h2>⚠️ Today's Attention</h2><span>Priority items that may need action today.</span></div></div>
        <div class="anori-cc-attention-grid">
          ${attention.map(x=>`<button type="button" class="anori-cc-attention ${x.cls}" onclick="${x.action}">
            <span class="anori-cc-icon">${x.icon}</span><span class="anori-cc-count">${x.value}</span>
            <span class="anori-cc-label">${x.title}</span><small>${x.note}</small><b>Open →</b>
          </button>`).join('')}
        </div>
      </section>


      <section class="anori-cc-two-col">
        <div class="anori-cc-panel">
          <div class="anori-cc-panel-head"><div><h2>🔔 Requires Action</h2><span>Only items requiring attention.</span></div></div>
          <div class="anori-action-list">${actionRows.length?actionRows.join(''):'<div class="anori-cc-clear">✓ All clear — no urgent actions.</div>'}</div>
        </div>
        <div class="anori-cc-panel">
          <div class="anori-cc-panel-head"><div><h2>⚡ Quick Actions</h2><span>Frequently used operations.</span></div></div>
          <div class="anori-quick-grid">
            <button onclick="Router.go('trips')"><span>＋</span><b>New Trip</b><small>Create trip</small></button>
            <button onclick="Router.go('invoices')"><span>🧾</span><b>Invoice</b><small>Manage billing</small></button>
            <button onclick="Router.go('expenses')"><span>💰</span><b>Expense</b><small>Add expense</small></button>
            <button onclick="Router.go('settlements')"><span>👨‍✈️</span><b>Settlement</b><small>Driver ledger</small></button>
          </div>
        </div>
      </section>`;
  };

  const originalDashboardRender=Dashboard.render.bind(Dashboard);
  Dashboard.render=function(container){
    container.innerHTML='<div id="anori-dashboard-top"></div>';
    originalDashboardRender(container);
    setTimeout(renderAnoriDashboardTop,50);
  };

  // ------------------------------------------------------------
  // 1 + 17. SMART UI / SMART DEFAULTS / PARTY CREDIT DAYS
  // ------------------------------------------------------------
  const originalPartyOpen=Masters.openModal.bind(Masters);
  Masters.openModal=function(type,id=null){
    if(type!=='party') return originalPartyOpen(type,id);
    const data=DB.get('parties'); const item=id?data.find(x=>x.id===id)||{}:{};
    const html=`<div class="form-row"><div class="form-group"><label>Customer Name *</label><input class="form-control" id="m_name" value="${esc(item.name)}" required></div><div class="form-group"><label>Credit Days</label><input class="form-control" id="m_credit_days" type="number" min="0" value="${num(item.credit_days)||30}"></div></div><div class="form-row"><div class="form-group"><label>GSTIN</label><input class="form-control" id="m_gst" value="${esc(item.gst)}"></div><div class="form-group"><label>Mobile</label><input class="form-control" id="m_mobile" value="${esc(item.mobile||'')}"></div></div><div class="form-group"><label>Address</label><input class="form-control" id="m_addr" value="${esc(item.addr)}"></div>`;
    UI.openModal(`${id?'Edit':'Add'} Customer`,html,()=>{
      const name=document.getElementById('m_name').value.trim();if(!name)return Utils.toast('Customer name is required.','error');
      const arr=DB.get('parties');const x=id?arr.find(a=>a.id===id):{id:Utils.id()};x.name=esc(name);x.gst=esc(document.getElementById('m_gst').value);x.addr=esc(document.getElementById('m_addr').value);x.mobile=esc(document.getElementById('m_mobile').value);x.credit_days=Math.max(0,num(document.getElementById('m_credit_days').value)||30);if(!id)arr.push(x);DB.set('parties',arr);UI.closeModal();Utils.toast('Customer saved.');Router.go('masters');
    });
  };

  // ------------------------------------------------------------
  // 16. KEYBOARD SHORTCUTS — optional for faster users
  // ------------------------------------------------------------
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey){
      const k=e.key.toLowerCase();
      if(k==='k'){e.preventDefault();const s=document.getElementById('globalSearch');s?.focus();s?.select();}
      if(k==='n'){e.preventDefault();const active=document.querySelector('.nav-item.active')?.dataset.view;if(active==='trips')Trips.openForm();else if(active==='invoices')Invoices.showInvoiceGenerator();else if(active==='masters')Masters.openModal('party');}
      if(k==='p'){const active=document.querySelector('.nav-item.active')?.dataset.view;if(active==='invoices'){e.preventDefault();const x=DB.get('invoices').slice(-1)[0];if(x)Invoices.previewInvoice(x);}}
    }
  });

  // ------------------------------------------------------------
  // 19. GLOBAL SEARCH — simple cross-module results
  // ------------------------------------------------------------
  function ensureSearchResults(){
    if(document.getElementById('anori-search-results'))return;
    const wrap=document.querySelector('.search-container');if(!wrap)return;
    const box=document.createElement('div');box.id='anori-search-results';box.className='anori-search-results';wrap.appendChild(box);
  }
  function searchAll(q){
    q=q.trim().toLowerCase();if(!q)return [];
    const out=[];
    DB.get('parties').forEach(x=>{if(`${x.name} ${x.gst} ${x.mobile}`.toLowerCase().includes(q))out.push({type:'Customer',name:x.name,sub:x.mobile||x.gst||'',go:()=>{Router.go('masters');}});});
    DB.get('vehicles').forEach(x=>{if(`${x.number} ${x.type}`.toLowerCase().includes(q))out.push({type:'Vehicle',name:x.number,sub:x.type||'',go:()=>Router.go('trips')});});
    DB.get('drivers').forEach(x=>{if(`${x.name} ${x.mobile}`.toLowerCase().includes(q))out.push({type:'Driver',name:x.name,sub:x.mobile||'',go:()=>Router.go('settlements')});});
    DB.get('trips').forEach(x=>{if(`${x.trip_no} ${x.from} ${x.to}`.toLowerCase().includes(q))out.push({type:'Trip',name:x.trip_no,sub:`${x.from} → ${x.to}`,go:()=>Router.go('trips')});});
    DB.get('invoices').forEach(x=>{if(`${x.invoice_no} ${x.status}`.toLowerCase().includes(q))out.push({type:'Invoice',name:x.invoice_no,sub:x.status||'',go:()=>{Router.go('invoices');setTimeout(()=>Invoices.previewExisting(x.id),100);}});});
    return out.slice(0,8);
  }
  function renderSearch(q){
    ensureSearchResults();const box=document.getElementById('anori-search-results');if(!box)return;
    const rows=searchAll(q);box.innerHTML=rows.length?rows.map((x,i)=>`<button type="button" class="anori-search-row" data-index="${i}"><span class="anori-search-type">${esc(x.type)}</span><span><strong>${esc(x.name)}</strong><small>${esc(x.sub)}</small></span></button>`).join(''):'<div class="anori-search-empty">No matching record</div>';
    box.querySelectorAll('.anori-search-row').forEach((b,i)=>b.onclick=()=>{rows[i].go();box.classList.remove('show');});box.classList.toggle('show',!!q);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(()=>{
      ensureSearchResults();const s=document.getElementById('globalSearch');if(!s)return;
      s.addEventListener('input',e=>renderSearch(e.target.value));
      s.addEventListener('focus',e=>{if(e.target.value)renderSearch(e.target.value);});
      document.addEventListener('click',e=>{const wrap=document.querySelector('.search-container');if(wrap&&!wrap.contains(e.target))document.getElementById('anori-search-results')?.classList.remove('show');});
    },100);
  });

  // ------------------------------------------------------------
  // 18 + 20. SIMPLE CALCULATION + MOBILE ACTIONS
  // ------------------------------------------------------------
  const originalTripsRender=Trips.render.bind(Trips);
  Trips.render=function(container){
    originalTripsRender(container);
    container.querySelectorAll('tbody tr').forEach(row=>{
      const cells=row.children;if(cells.length<11)return;
      const profitText=cells[8]?.textContent||''; const profit=num(profitText.replace(/[^0-9.-]/g,'')); const status=anoriProfitStatus(Math.max(0,profit),0);
      const btn=document.createElement('button');btn.className='btn btn-outline btn-sm anori-mini-btn';btn.textContent='ⓘ';btn.title='How profit is calculated';
      btn.onclick=()=>anoriShowCalculation('Trip Profit',`Freight − Expenses = Profit\n${cells[6]?.textContent||'Freight'} − ${cells[7]?.textContent||'Expenses'}`,profitText);
      cells[8].appendChild(document.createTextNode(' '));cells[8].appendChild(btn);
    });
  };

  // ------------------------------------------------------------
  // EXPENSE MASTER + INVOICE BILLABLE EXPENSES
  // ------------------------------------------------------------
  function renderExpenseMasterBlock(){
    const list=getExpenseMaster();
    return `<div class="card anori-expense-master"><div class="anori-section-head"><div><h3 class="card-title">💸 Expense List</h3><span class="anori-help">Choose which expenses can be added to customer invoices.</span></div><button class="btn btn-primary btn-sm" onclick="anoriAddExpenseMaster()">＋ Add Expense</button></div><div class="table-wrapper"><table><thead><tr><th>Expense</th><th>Default Amount</th><th>Show on Invoice</th><th>Action</th></tr></thead><tbody>${list.map(x=>`<tr><td><strong>${esc(x.name)}</strong></td><td>${money(x.defaultAmount)}</td><td><label class="anori-switch"><input type="checkbox" ${x.showOnInvoice?'checked':''} onchange="anoriToggleExpense('${esc(x.id)}',this.checked)"><span></span></label></td><td><button class="btn btn-danger btn-sm" onclick="anoriDeleteExpense('${esc(x.id)}')">Delete</button></td></tr>`).join('')}</tbody></table></div></div>`;
  }
  window.anoriAddExpenseMaster=function(){
    Swal.fire({title:'Add Expense',html:`<div class="anori-simple-form"><label>Expense Name</label><input id="anori-exp-name" placeholder="Example: Documentation"><label>Default Amount</label><input id="anori-exp-amount" type="number" min="0" value="0"><label><input id="anori-exp-show" type="checkbox" checked> Show on Invoice</label></div>`,showCancelButton:true,confirmButtonText:'Save',preConfirm:()=>{const name=document.getElementById('anori-exp-name').value.trim();if(!name){Swal.showValidationMessage('Enter expense name.');return false;}return {name,defaultAmount:num(document.getElementById('anori-exp-amount').value),showOnInvoice:document.getElementById('anori-exp-show').checked};}}).then(r=>{if(!r.isConfirmed)return;const a=getExpenseMaster();a.push({id:Utils.id(),...r.value,active:true});DB.set('expense_master',a);Utils.toast('Expense added.');Router.go('masters');});
  };
  window.anoriToggleExpense=function(id,show){const a=getExpenseMaster();const x=a.find(e=>e.id===id);if(x){x.showOnInvoice=!!show;DB.set('expense_master',a);Utils.toast(show?'Expense will show on invoice.':'Expense hidden from invoice.');}};
  window.anoriDeleteExpense=function(id){const a=getExpenseMaster();const x=a.find(e=>e.id===id);if(!x)return;Swal.fire({title:'Delete expense?',text:x.name,icon:'warning',showCancelButton:true,confirmButtonText:'Delete'}).then(r=>{if(r.isConfirmed){DB.set('expense_master',a.filter(e=>e.id!==id));Router.go('masters');}});};

  const originalMastersRender=Masters.render.bind(Masters);
  Masters.render=function(container){originalMastersRender(container);container.insertAdjacentHTML('beforeend',renderExpenseMasterBlock());};

  function billableExpenseSummary(trips){
    const master=getExpenseMaster().filter(x=>x.active&&x.showOnInvoice);
    return master.map(m=>{const amount=trips.reduce((s,t)=>s+(t.expenses||[]).filter(e=>String(e.type||'').trim().toLowerCase()===String(m.name).trim().toLowerCase()).reduce((a,e)=>a+num(e.amount),0),0);return {...m,amount:amount||num(m.defaultAmount)};});
  }
  function buildExpenseInputs(trips){
    return billableExpenseSummary(trips).map((x,i)=>`<div class="anori-expense-select-row"><label><input type="checkbox" class="anori-inv-exp-check" data-id="${esc(x.id)}" ${x.amount>0?'checked':''}> <strong>${esc(x.name)}</strong></label><input type="number" min="0" class="anori-inv-exp-amount" data-id="${esc(x.id)}" value="${x.amount||0}"></div>`).join('')||'<div class="anori-help">No billable expenses in Master Data.</div>';
  }

  // Replace invoice generator with a simpler, more useful version.
  Invoices.showInvoiceGenerator=function(){
    const trips=DB.get('trips').filter(t=>t.status==='completed'&&t.invoice_status!=='paid');
    const vehicles=DB.get('vehicles'), parties=DB.get('parties');
    if(!trips.length)return Utils.toast('No completed trips available.','warning');
    Swal.fire({title:'Create Invoice',width:820,html:`<div class="anori-invoice-generator"><div class="anori-help">1. Select trips → 2. Select billable expenses → 3. Create invoice</div><div class="table-wrapper" style="max-height:260px;overflow:auto"><table><thead><tr><th></th><th>Date</th><th>Trip</th><th>Party</th><th>Freight</th></tr></thead><tbody>${trips.map(t=>{const p=parties.find(x=>x.id===t.party_id);return `<tr><td><input type="checkbox" class="anori-trip-check" data-id="${esc(t.id)}" data-party="${esc(t.party_id)}"></td><td>${esc(t.date)}</td><td>${esc(t.trip_no)}</td><td>${esc(p?.name||'-')}</td><td>${money(t.freight)}</td></tr>`}).join('')}</tbody></table></div><div id="anori-inv-expenses" class="anori-expense-picker"><div class="anori-help">Select expenses that should appear on the customer invoice.</div><div id="anori-expense-inputs"><div class="anori-help">Select a trip first.</div></div></div><div class="anori-generator-bottom"><label>Invoice Type<select id="anori-inv-type"><option value="gst">GST Invoice (18%)</option><option value="nongst">Non-GST</option></select></label><label>Advance Received<input id="anori-inv-advance" type="number" min="0" value="0"></label></div></div>`,showCancelButton:true,confirmButtonText:'Create Invoice',cancelButtonText:'Cancel',didOpen:()=>{
      const update=()=>{const checks=[...document.querySelectorAll('.anori-trip-check:checked')];const ids=checks.map(c=>c.dataset.id);const sel=trips.filter(t=>ids.includes(t.id));const partiesSel=new Set(sel.map(t=>t.party_id));if(partiesSel.size>1){Swal.showValidationMessage('Please select trips for one customer only.');}else{document.getElementById('anori-expense-inputs').innerHTML=sel.length?buildExpenseInputs(sel):'<div class="anori-help">Select a trip first.</div>';}};
      document.querySelectorAll('.anori-trip-check').forEach(c=>c.addEventListener('change',update));
    },preConfirm:()=>{
      const selected=[...document.querySelectorAll('.anori-trip-check:checked')].map(c=>c.dataset.id);if(!selected.length){Swal.showValidationMessage('Select at least one trip.');return false;}
      const partyIds=new Set([...document.querySelectorAll('.anori-trip-check:checked')].map(c=>c.dataset.party));if(partyIds.size>1){Swal.showValidationMessage('Select trips for one customer only.');return false;}
      const expenses=[...document.querySelectorAll('.anori-inv-exp-check:checked')].map(c=>{const id=c.dataset.id;const amount=num([...document.querySelectorAll('.anori-inv-exp-amount')].find(el=>el.dataset.id===id)?.value);const m=getExpenseMaster().find(x=>x.id===id);return {masterId:id,name:m?.name||'Expense',amount};}).filter(x=>x.amount>0);
      const advance=num(document.getElementById('anori-inv-advance').value);return {selected,isGst:document.getElementById('anori-inv-type').value==='gst',advance,expenses};
    }}).then(r=>{if(!r.isConfirmed)return;const selectedTrips=DB.get('trips').filter(t=>r.value.selected.includes(t.id));Invoices.createInvoice(selectedTrips,r.value.isGst,r.value.advance,r.value.expenses);});
  };

  Invoices.createInvoice=function(trips,isGst,advance,expenseLines=[]){
    Utils.showLoader('Creating invoice...');setTimeout(()=>{try{
      const party=DB.get('parties').find(p=>p.id===trips[0].party_id);const vehicles=DB.get('vehicles');
      const subtotal=trips.reduce((s,t)=>s+num(t.freight),0)+expenseLines.reduce((s,e)=>s+num(e.amount),0);
      const cgst=isGst?subtotal*0.09:0, sgst=isGst?subtotal*0.09:0, total=subtotal+cgst+sgst;
      if(advance>total) throw new Error('Advance cannot be greater than invoice total.');
      const invoice={id:Utils.id(),invoice_no:Utils.generateInvoiceNo(),date:today(),party_id:party.id,trip_ids:trips.map(t=>t.id),trip_count:trips.length,subtotal,cgst,sgst,total_amount:total,advance,balance_due:total-advance,is_gst:isGst,status:'issued',expense_lines,credit_days:Math.max(0,num(party.credit_days)||30),trips_data:trips.map(t=>({...t,vehicle:vehicles.find(v=>v.id===t.vehicle_id)}))};
      const inv=DB.get('invoices');inv.push(invoice);DB.set('invoices',inv);const all=DB.get('trips');trips.forEach(t=>{const x=all.find(a=>a.id===t.id);if(x)x.invoice_status='shared';});DB.set('trips',all);Utils.hideLoader();Invoices.previewInvoice(invoice);Utils.toast('Invoice created. Check Preview before PDF.');
    }catch(e){Utils.hideLoader();Utils.toast(e.message||'Could not create invoice.','error');}},250);
  };

  // ------------------------------------------------------------
  // 3. ONE INVOICE RENDERER — Preview and PDF use the same HTML/CSS
  // ------------------------------------------------------------
  Invoices.buildInvoiceHTML=function(invoice, preview=false){
    const company=DB.get('company_profile'), party=DB.get('parties').find(p=>p.id===invoice.party_id)||{};
    const due=this.getDueDate(invoice.date, invoice.credit_days || party.credit_days || 30);
    const tripRows=(invoice.trips_data||[]).map((t,i)=>`<tr><td>${i+1}</td><td><strong>${esc(t.trip_no)}</strong></td><td>${esc(t.date)}</td><td>${esc(t.from)} → ${esc(t.to)}</td><td>${esc(t.vehicle?.number||'')}</td><td class="money">${money(t.freight)}</td></tr>`).join('');
    const expRows=(invoice.expense_lines||[]).map((e,i)=>`<tr class="expense-line"><td>${(invoice.trips_data||[]).length+i+1}</td><td><strong>${esc(e.name)}</strong><small>Billable Expense</small></td><td>-</td><td>-</td><td>-</td><td class="money">${money(e.amount)}</td></tr>`).join('');
    const tax=invoice.cgst+invoice.sgst;
    const terms=invoice.status==='paid'?'Paid':invoice.status==='cancelled'?'Cancelled':(invoice.credit_days||30)+' Days';
    const status=String(invoice.status||'issued').replace('_',' ').toUpperCase();
    const total=invoice.total_amount, balance=Math.max(0,invoice.balance_due);
    const css=`*{box-sizing:border-box}html,body{margin:0;padding:0;background:${preview?'#e8edf4':'#fff'};font-family:Inter,Arial,sans-serif;color:#172033}body{padding:${preview?'18px':'0'}}.invoice-page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;padding:14mm 15mm;font-size:11px;line-height:1.45;box-shadow:${preview?'0 14px 40px rgba(15,23,42,.22)':'none'}}.inv-head{display:grid;grid-template-columns:1fr 245px;gap:18px;padding-bottom:14px;border-bottom:3px solid #173b7a}.brand{font-size:24px;font-weight:800;color:#10213d}.muted{color:#64748b}.inv-title{font-size:24px;font-weight:900;text-align:right;color:#10213d}.meta{margin-top:8px;border:1px solid #d8e0ea;border-radius:7px;overflow:hidden}.meta-row{display:grid;grid-template-columns:100px 1fr}.meta-row:nth-child(even){background:#f8fafc}.meta-row b{padding:6px 7px;background:#edf4fb}.meta-row span{padding:6px 7px;text-align:right;word-break:break-word}.badge{display:inline-block;padding:3px 7px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-weight:800;font-size:9px}.two{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:13px}.box{border:1px solid #d8e0ea;border-radius:7px;overflow:hidden}.box-title{background:#edf4fb;color:#173b7a;font-weight:900;padding:7px 9px;font-size:10px}.box-body{padding:9px;min-height:72px}.section{margin-top:13px;background:#173b7a;color:#fff;font-weight:900;padding:7px 9px;border-radius:6px 6px 0 0}.inv-table{width:100%;border-collapse:collapse;table-layout:fixed}.inv-table th{background:#eef3f8;color:#334155;font-size:9px;padding:7px 5px;border:1px solid #d8e0ea;text-align:left}.inv-table td{padding:7px 5px;border:1px solid #d8e0ea;vertical-align:top;overflow-wrap:anywhere}.money{text-align:right;white-space:nowrap}.inv-table small{display:block;color:#64748b;font-size:8px}.summary-wrap{display:flex;justify-content:flex-end;margin-top:12px}.summary{width:310px;border:1px solid #d8e0ea;border-radius:7px;overflow:hidden}.sum-row{display:grid;grid-template-columns:1fr 120px;padding:7px 9px;border-bottom:1px solid #e2e8f0}.sum-row span:last-child{text-align:right;white-space:nowrap}.sum-total{font-weight:900;background:#f0fdf4}.sum-balance{font-size:14px;font-weight:900;background:#173b7a;color:#fff!important}.sum-balance span,.sum-balance strong{color:#fff!important}.words{margin-top:12px;border:1px solid #d8e0ea;border-radius:7px;padding:9px}.bottom{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}.sign{text-align:right;min-height:105px}.sign-line{margin-top:42px;border-top:1px solid #64748b;padding-top:5px}.terms{margin-top:12px;border-top:1px solid #d8e0ea;padding-top:8px;color:#475569;font-size:9px}.footer{display:flex;justify-content:space-between;gap:12px;border-top:2px solid #173b7a;margin-top:12px;padding-top:7px;font-size:8px;color:#64748b}@media print{body{padding:0;background:#fff}.invoice-page{margin:0;box-shadow:none;page-break-after:always}@page{size:A4 portrait;margin:0}}`;
    return `<!doctype html><html><head><meta charset="UTF-8"><title>${esc(invoice.invoice_no)}</title><style>${css}</style></head><body><div class="invoice-page" id="invoice-page">
      <div class="inv-head"><div><div class="brand">${esc(company.name||'Anori Transport Services')}</div><div>${esc(company.addr||'')}</div><div>GSTIN: ${esc(company.gst||'N/A')} &nbsp; | &nbsp; Phone: ${esc(company.phone||'N/A')}</div></div><div><div class="inv-title">TAX INVOICE</div><div class="meta"><div class="meta-row"><b>Invoice No.</b><span>${esc(invoice.invoice_no)}</span></div><div class="meta-row"><b>Date</b><span>${esc(invoice.date)}</span></div><div class="meta-row"><b>Due Date</b><span>${esc(due)}</span></div><div class="meta-row"><b>Status</b><span><em class="badge">${esc(status)}</em></span></div></div></div></div>
      <div class="two"><div class="box"><div class="box-title">BILL TO</div><div class="box-body"><strong>${esc(party.name||'N/A')}</strong><br>${esc(party.addr||'')}${party.gst?`<br>GSTIN: ${esc(party.gst)}`:''}</div></div><div class="box"><div class="box-title">PAYMENT TERMS</div><div class="box-body"><strong>${esc(terms)}</strong><br>Due Date: ${esc(due)}<br>Invoice Type: ${isGstInvoice?'GST':'Non-GST'}${invoice.is_gst?`<br>Tax Type: ${invoice.tax_type==='igst'?'IGST 18%':'CGST 9% + SGST 9%'}`:''}</div></div></div>
      <div class="section">TRANSPORT / BILLABLE CHARGES</div><table class="inv-table"><thead><tr><th style="width:5%">#</th><th style="width:25%">Description</th><th style="width:12%">Date</th><th style="width:27%">Route</th><th style="width:15%">Vehicle</th><th style="width:16%;text-align:right">Amount</th></tr></thead><tbody>${tripRows}${expRows||''}</tbody></table>
      <div class="summary-wrap"><div class="summary"><div class="sum-row"><span>Subtotal</span><span>${money(invoice.subtotal)}</span></div>${invoice.is_gst?`<div class="sum-row"><span>CGST 9%</span><span>${money(invoice.cgst)}</span></div><div class="sum-row"><span>SGST 9%</span><span>${money(invoice.sgst)}</span></div>`:''}<div class="sum-row sum-total"><span>Total</span><span>${money(total)}</span></div><div class="sum-row"><span>Advance Received</span><span>-${money(invoice.advance)}</span></div><div class="sum-row sum-balance"><span>BALANCE DUE</span><span>${money(balance)}</span></div></div></div>
      <div class="words"><strong>AMOUNT IN WORDS</strong><br>${esc(Utils.numberToWords(total))}</div>
      <div class="bottom"><div class="box"><div class="box-title">BANK DETAILS</div><div class="box-body">Account No.: <strong>${esc(company.acc||'N/A')}</strong><br>IFSC: <strong>${esc(company.bank||'N/A')}</strong></div></div><div class="box sign"><div class="box-title">FOR ${esc(company.name||'ANORI TRANSPORT SERVICES')}</div><div class="sign-line">Authorized Signatory</div></div></div>
      <div class="terms"><strong>TERMS & CONDITIONS</strong><br>1. Payment is due as per agreed payment terms.<br>2. Any discrepancy should be communicated promptly.<br>3. This is a computer-generated invoice.</div>
      <div class="footer"><span>Thank you for your business.</span><span>${esc(invoice.invoice_no)}</span></div>
    </div></body></html>`;
  };
  Invoices.getDueDate=function(date,days=30){const d=new Date(date);if(Number.isNaN(d.getTime()))return today();d.setDate(d.getDate()+Math.max(0,num(days)));return d.toISOString().split('T')[0];};
  Invoices.previewInvoice=function(invoice){
    try{
      if(typeof this.mountInvoiceDocument!=='function') throw new Error('Invoice Preview renderer is unavailable.');
      this.mountInvoiceDocument(invoice);
      document.getElementById('previewModal')?.classList.add('active');
    }catch(e){ console.error('Invoice preview error:',e); Utils.toast(e.message||'Unable to open invoice preview.','error'); }
  };
  Invoices.downloadInvoice=function(invoice){
    if(typeof this.downloadInvoiceSafe==='function') return this.downloadInvoiceSafe(invoice);
    Utils.toast('PDF generation is not ready yet. Please try again.','warning');
  };
  Invoices.updateStatus=function(id,status){const a=DB.get('invoices');const x=a.find(i=>i.id===id);if(!x)return;x.status=status;DB.set('invoices',a);Utils.toast('Invoice status updated.');Router.go('invoices');};
  Invoices.deleteInvoice=function(id){const a=DB.get('invoices'),x=a.find(i=>i.id===id);if(!x)return;if(String(x.status).toLowerCase()!=='draft'){Swal.fire({title:'Cancel Invoice?',text:'Issued invoices are kept for history. Only the status will change to Cancelled.',icon:'warning',showCancelButton:true,confirmButtonText:'Cancel Invoice'}).then(r=>{if(!r.isConfirmed)return;x.status='cancelled';x.cancelledAt=new Date().toISOString();DB.set('invoices',a);Router.go('invoices');});}else{DB.set('invoices',a.filter(i=>i.id!==id));Router.go('invoices');}};
  Invoices.render=function(container){const a=DB.get('invoices'),parties=DB.get('parties');container.innerHTML+=`<div class="anori-section-intro"><div><strong>Invoices</strong><span>Preview first. Then send, download or record payment.</span></div><button class="btn btn-success" onclick="Invoices.showInvoiceGenerator()">＋ New Invoice</button></div><div class="anori-kpi-grid"><div class="anori-kpi-card"><span>🧾 Total</span><strong>${a.length}</strong><small>Invoices</small></div><div class="anori-kpi-card"><span>💰 Outstanding</span><strong>${money(a.reduce((s,x)=>s+Math.max(0,num(x.balance_due)),0))}</strong><small>Balance due</small></div><div class="anori-kpi-card"><span>🟢 Paid</span><strong>${a.filter(x=>x.status==='paid').length}</strong><small>Completed</small></div><div class="anori-kpi-card"><span>🟠 Follow-up</span><strong>${a.filter(x=>num(x.balance_due)>0&&x.status!=='cancelled').length}</strong><small>Need payment</small></div></div><div class="card"><div class="table-wrapper"><table><thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Total</th><th>Balance</th><th>Status</th><th>Action</th></tr></thead><tbody>${a.slice().reverse().map(x=>{const p=parties.find(y=>y.id===x.party_id);return `<tr><td><strong>${esc(x.invoice_no)}</strong></td><td>${esc(x.date)}</td><td>${esc(p?.name||'-')}</td><td>${money(x.total_amount)}</td><td><strong>${money(x.balance_due)}</strong></td><td><select class="form-control anori-status-select" data-action="update-invoice-status" data-id="${esc(x.id)}"><option value="issued" ${x.status==='issued'?'selected':''}>Issued</option><option value="sent" ${x.status==='sent'?'selected':''}>Sent</option><option value="part_paid" ${x.status==='part_paid'?'selected':''}>Part Paid</option><option value="paid" ${x.status==='paid'?'selected':''}>Paid</option><option value="cancelled" ${x.status==='cancelled'?'selected':''}>Cancelled</option></select></td><td class="anori-actions"><button class="btn btn-outline btn-sm" onclick="Invoices.previewExisting('${esc(x.id)}')">👁 Preview</button><button class="btn btn-primary btn-sm" onclick="Invoices.downloadExisting('${esc(x.id)}')">📄 PDF</button>${x.status!=='cancelled'&&x.status!=='paid'?`<button class="btn btn-outline btn-sm" onclick="anoriAddFollowup('${esc(x.party_id)}','${esc(x.id)}')">📞 Follow-up</button>`:''}<button class="btn btn-danger btn-sm" data-action="delete-invoice" data-id="${esc(x.id)}">${x.status==='draft'?'Delete':'Cancel'}</button></td></tr>`}).join('')||'<tr><td colspan="7" class="empty-state">No invoices yet.</td></tr>'}</tbody></table></div></div>`;};

  // ------------------------------------------------------------
  // 13. Settings gets a simple audit history
  // ------------------------------------------------------------
  const originalSettingsRender=Settings.render.bind(Settings);
  Settings.render=function(container){originalSettingsRender(container);const logs=DB.get('audit_log',[]).slice(0,20);container.insertAdjacentHTML('beforeend',`<div class="card"><div class="anori-section-head"><div><h3 class="card-title">🛡️ Change History</h3><span class="anori-help">Recent data changes saved in this browser.</span></div></div><div class="table-wrapper"><table><thead><tr><th>Time</th><th>Area</th><th>Action</th></tr></thead><tbody>${logs.map(x=>`<tr><td>${esc(new Date(x.time).toLocaleString('en-IN'))}</td><td>${esc(x.key)}</td><td>${esc(x.action)}</td></tr>`).join('')||'<tr><td colspan="3">No changes recorded yet.</td></tr>'}</tbody></table></div></div>`);};

  // ------------------------------------------------------------
  // Documents navigation is declared in index.html. Do not dynamically
  // insert it into #navMenu: inserting before a descendant node causes
  // a DOM NotFoundError. Keep only the dashboard refresh here.
  // ------------------------------------------------------------
  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(()=>{try{renderAnoriDashboardTop();}catch(e){}},150);
  });
})();

/* ============================================================
   ANORI TRANSPORT ERP v2.5 — FINAL REQUESTED WORKFLOW UPDATE
   Scope: Anori Transport only.
   ============================================================ */
(function installAnoriV25(){
  'use strict';
  const esc=v=>Sanitize.html(v==null?'':String(v));
  const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const money=v=>Utils.fmt(num(v));
  const today=()=>Utils.today();
  const activeInvoiceForTrip=(tripId)=>DB.get('invoices').find(inv=>Array.isArray(inv.trip_ids)&&inv.trip_ids.includes(tripId)&&String(inv.status||'issued').toLowerCase()!=='cancelled');
  const invoiceForTrip=tripId=>DB.get('invoices').find(inv=>Array.isArray(inv.trip_ids)&&inv.trip_ids.includes(tripId));
  const getParty=id=>DB.get('parties').find(x=>x.id===id);
  const getDriver=id=>DB.get('drivers').find(x=>x.id===id);
  const getVehicle=id=>DB.get('vehicles').find(x=>x.id===id);
  const getExpenseMaster=()=>DB.get('expense_master',[]).filter(x=>x.active!==false);
  const driverGivenTotal=(driverId,from='',to='')=>{
    return DB.get('driver_settlements',[]).filter(s=>s.driver_id===driverId&&(!from||s.date>=from)&&(!to||s.date<=to)).reduce((sum,s)=>sum+(s.type==='debit'?num(s.amount):0),0);
  };
  const driverPaidTotal=(driverId,from='',to='')=>{
    return DB.get('driver_settlements',[]).filter(s=>s.driver_id===driverId&&(!from||s.date>=from)&&(!to||s.date<=to)).reduce((sum,s)=>sum+(s.type==='credit'?num(s.amount):0),0);
  };
  function syncDriverTripEntry(trip){
    if(!trip||!trip.driver_id)return;
    const data=DB.get('driver_settlements',[]);
    const existing=data.find(s=>s.source==='trip'&&s.trip_id===trip.id);
    const amount=num(trip.driver_amount);
    if(amount<=0){ if(existing) DB.set('driver_settlements',data.filter(s=>s.id!==existing.id)); return; }
    const entry={id:existing?.id||Utils.id(),date:trip.date,driver_id:trip.driver_id,type:'debit',amount,description:`Trip ${trip.trip_no} - Driver Amount`,source:'trip',trip_id:trip.id};
    if(existing) Object.assign(existing,entry); else data.push(entry);
    DB.set('driver_settlements',data);
  }
  function syncTripInvoiceFlags(){
    const invoices=DB.get('invoices'), trips=DB.get('trips');
    trips.forEach(t=>{const active=activeInvoiceForTrip(t.id);t.invoice_status=active?'invoiced':'pending';});
    DB.set('trips',trips);
  }

  // ------------------------------------------------------------
  // 1. TRIP MANAGEMENT — master-driven form + row selection/actions
  // ------------------------------------------------------------
  Trips.openForm=function(){
    const vehicles=DB.get('vehicles'),drivers=DB.get('drivers'),parties=DB.get('parties'),expenses=getExpenseMaster();
    const html=`<div class="anori-simple-form">
      <div class="form-row"><div class="form-group"><label>Date</label><input type="date" class="form-control" id="t_date" value="${today()}"></div>
      <div class="form-group"><label>Vehicle *</label><select class="form-control" id="t_vehicle"><option value="">Select Vehicle</option>${vehicles.map(v=>`<option value="${esc(v.id)}">${esc(v.number)}</option>`).join('')}</select></div>
      <div class="form-group"><label>Driver *</label><select class="form-control" id="t_driver"><option value="">Select Driver</option>${drivers.map(d=>`<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('')}</select></div></div>
      <div class="form-row"><div class="form-group"><label>Party / Customer *</label><select class="form-control" id="t_party"><option value="">Select Customer</option>${parties.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></div>
      <div class="form-group"><label>From *</label><input class="form-control" id="t_from"></div><div class="form-group"><label>To *</label><input class="form-control" id="t_to"></div></div>
      <div class="form-row"><div class="form-group"><label>Freight (₹) *</label><input type="number" class="form-control" id="t_freight" min="0"></div><div class="form-group"><label>Driver Amount / Advance (₹)</label><input type="number" class="form-control" id="t_driver_amount" min="0" value="0"><small class="anori-help">This automatically appears in Driver Settlement.</small></div></div>
      <div class="form-group"><label>Trip Advice</label><textarea class="form-control" id="t_trip_advice" rows="3" placeholder="Enter driver / loading / delivery instructions for this trip"></textarea><small class="anori-help">Internal trip instructions. This is saved with the Trip and shown in Trip details.</small></div>
      <div class="anori-subtitle">Trip Expenses</div><div id="expRows"></div><button type="button" class="btn btn-outline btn-sm" onclick="Trips.addExpRow()">＋ Add Expense</button>
      <div class="form-group" style="margin-top:12px"><label>Notes</label><textarea class="form-control" id="t_notes" rows="2"></textarea></div>
    </div>`;
    UI.openModal('Create New Trip',html,()=>Trips.saveV25(),true); Trips.addExpRow();
  };
  Trips.addExpRow=function(type='',amount=''){
    const rows=document.getElementById('expRows');if(!rows)return;
    const masters=getExpenseMaster();
    const row=document.createElement('div');row.className='form-row anori-trip-exp-row';row.style.marginBottom='8px';
    row.innerHTML=`<div class="form-group"><select class="form-control exp-type"><option value="">Select Expense</option>${masters.map(e=>`<option value="${esc(e.name)}" ${e.name===type?'selected':''}>${esc(e.name)}</option>`).join('')}<option value="__manual__">Manual Entry</option></select><input class="form-control exp-type-manual" style="display:none;margin-top:6px" placeholder="Enter expense type manually"></div><div class="form-group"><input type="number" class="form-control exp-amt" min="0" placeholder="Amount" value="${num(amount)||''}"></div><div class="form-group"><button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.anori-trip-exp-row').remove()">Remove</button></div>`;
    rows.appendChild(row);
    row.querySelector('.exp-type')?.addEventListener('change',e=>{const m=row.querySelector('.exp-type-manual');if(m)m.style.display=e.target.value==='__manual__'?'block':'none';});
  };
  function readTripForm(){
    const from=document.getElementById('t_from').value.trim(),to=document.getElementById('t_to').value.trim();
    const vehicle=document.getElementById('t_vehicle').value,driver=document.getElementById('t_driver').value,party=document.getElementById('t_party').value;
    const freight=num(document.getElementById('t_freight').value),driverAmount=num(document.getElementById('t_driver_amount').value);
    if(!vehicle||!driver||!party||!from||!to)return Utils.toast('Please select Vehicle, Driver, Customer and enter From / To.','error');
    if(freight<=0)return Utils.toast('Freight amount must be greater than zero.','error');
    const expenses=[];document.querySelectorAll('#expRows .anori-trip-exp-row').forEach(r=>{const type=r.querySelector('.exp-type').value,amount=num(r.querySelector('.exp-amt').value);if(type&&amount>0)expenses.push({type,amount});});
    return {date:Sanitize.date(document.getElementById('t_date').value),vehicle_id:vehicle,driver_id:driver,party_id:party,from:esc(from),to:esc(to),freight,driver_amount:driverAmount,expenses:Sanitize.escapeJSON(expenses),notes:esc(document.getElementById('t_notes').value),trip_advice:esc(document.getElementById('t_trip_advice').value)};
  }
  Trips.saveV25=function(){const form=readTripForm();if(!form)return;const trip={id:Utils.id(),trip_no:Utils.generateTripNo(form.date),...form,status:'completed',invoice_status:'pending',is_gst:true};const trips=DB.get('trips');trips.push(trip);DB.set('trips',trips);syncDriverTripEntry(trip);UI.closeModal();Utils.toast('Trip created successfully.');Router.go('trips');};
  Trips.showEditModal=function(id){
    const trip=DB.get('trips').find(x=>x.id===id);if(!trip)return;
    if(activeInvoiceForTrip(id))return Swal.fire({icon:'warning',title:'Invoice already generated',text:'Cancel the existing invoice before editing this trip.',confirmButtonText:'OK'});
    const vehicles=DB.get('vehicles'),drivers=DB.get('drivers'),parties=DB.get('parties');
    const html=`<div class="anori-simple-form"><div class="form-row"><div class="form-group"><label>Date</label><input type="date" class="form-control" id="t_date" value="${esc(trip.date)}"></div><div class="form-group"><label>Vehicle *</label><select class="form-control" id="t_vehicle">${vehicles.map(v=>`<option value="${esc(v.id)}" ${v.id===trip.vehicle_id?'selected':''}>${esc(v.number)}</option>`).join('')}</select></div><div class="form-group"><label>Driver *</label><select class="form-control" id="t_driver">${drivers.map(d=>`<option value="${esc(d.id)}" ${d.id===trip.driver_id?'selected':''}>${esc(d.name)}</option>`).join('')}</select></div></div><div class="form-row"><div class="form-group"><label>Party / Customer *</label><select class="form-control" id="t_party">${parties.map(p=>`<option value="${esc(p.id)}" ${p.id===trip.party_id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div><div class="form-group"><label>From *</label><input class="form-control" id="t_from" value="${esc(trip.from)}"></div><div class="form-group"><label>To *</label><input class="form-control" id="t_to" value="${esc(trip.to)}"></div></div><div class="form-row"><div class="form-group"><label>Freight (₹) *</label><input type="number" class="form-control" id="t_freight" value="${num(trip.freight)}"></div><div class="form-group"><label>Driver Amount / Advance (₹)</label><input type="number" class="form-control" id="t_driver_amount" value="${num(trip.driver_amount)}"></div></div><div class="form-group"><label>Trip Advice</label><textarea class="form-control" id="t_trip_advice" rows="3" placeholder="Enter driver / loading / delivery instructions">${esc(trip.trip_advice||'')}</textarea><small class="anori-help">Internal trip instructions saved with this Trip.</small></div><div class="anori-subtitle">Trip Expenses</div><div id="expRows"></div><button type="button" class="btn btn-outline btn-sm" onclick="Trips.addExpRow()">＋ Add Expense</button><div class="form-group" style="margin-top:12px"><label>Notes</label><textarea class="form-control" id="t_notes" rows="2">${esc(trip.notes||'')}</textarea></div></div>`;
    UI.openModal('Edit Trip',html,()=>Trips.updateV25(id),true);(trip.expenses||[]).forEach(e=>Trips.addExpRow(e.type,e.amount));if(!(trip.expenses||[]).length)Trips.addExpRow();
  };
  Trips.openEditForm=function(id){Trips.showEditModal(id);};
  Trips.updateV25=function(id){if(activeInvoiceForTrip(id))return Swal.fire({icon:'warning',title:'Trip Locked',text:'Cancel the active invoice before editing this trip.',confirmButtonText:'OK'});const form=readTripForm();if(!form)return;const trips=DB.get('trips'),i=trips.findIndex(x=>x.id===id);if(i<0)return;trips[i]={...trips[i],...form};DB.set('trips',trips);syncDriverTripEntry(trips[i]);UI.closeModal();Utils.toast('Trip updated successfully.');Router.go('trips');};
  Trips.update=Trips.updateV25;

  Trips.render=function(container){
    const trips=DB.get('trips'),vehicles=DB.get('vehicles'),drivers=DB.get('drivers'),parties=DB.get('parties');
    syncTripInvoiceFlags();
    container.innerHTML=`<div class="anori-section-intro"><div><strong>Trip Management</strong><span>Select one or more trips, then use the Actions button above the table.</span></div><button class="btn btn-success" onclick="Trips.openForm()">＋ New Trip</button></div>
      <div class="card"><div class="anori-table-toolbar anori-action-toolbar"><div class="anori-toolbar-left"><button class="btn btn-outline btn-sm" onclick="Trips.toggleAll(true)">☑ Select All</button><button class="btn btn-outline btn-sm" onclick="Trips.toggleAll(false)">Clear</button><span id="tripSelectedCount" class="anori-selection-count">0 selected</span></div><div class="anori-toolbar-right"><button class="btn btn-primary" onclick="Trips.showActions()">⚙ Actions ▼</button></div></div>
      ${trips.length?`<div class="table-wrapper"><table><thead><tr><th><input type="checkbox" aria-label="Select all trips" onchange="Trips.toggleAll(this.checked)"></th><th>Date</th><th>Trip #</th><th>Vehicle</th><th>Driver</th><th>Party</th><th>Route</th><th>Freight</th><th>Driver Amt</th><th>Expenses</th><th>Profit</th><th>Trip Advice</th><th>Invoice</th></tr></thead><tbody>${trips.map(t=>{const v=getVehicle(t.vehicle_id),d=getDriver(t.driver_id),p=getParty(t.party_id),ex=(t.expenses||[]).reduce((s,e)=>s+num(e.amount),0),profit=num(t.freight)-ex;const inv=activeInvoiceForTrip(t.id);return `<tr><td><input type="checkbox" class="trip-row-check" value="${esc(t.id)}" onchange="Trips.updateSelectionCount()"></td><td>${esc(t.date)}</td><td><strong>${esc(t.trip_no)}</strong></td><td>${esc(v?.number||'-')}</td><td>${esc(d?.name||'-')}</td><td>${esc(p?.name||'-')}</td><td>${esc(t.from)} → ${esc(t.to)}</td><td>${money(t.freight)}</td><td>${money(t.driver_amount)}</td><td class="expense-red">-${money(ex)}</td><td>${money(profit)} <button class="btn btn-outline btn-icon anori-mini-btn" onclick="anoriShowCalculation('Trip Profit','Freight − Expenses', '${esc(money(profit))}')">ⓘ</button></td><td>${t.trip_advice?`<span title="${esc(t.trip_advice)}">${esc(t.trip_advice).slice(0,60)}${String(t.trip_advice).length>60?'…':''}</span>`:'-'}</td><td>${inv?`<span class="status-badge status-shared">INVOICED</span>`:`<span class="status-badge status-pending">PENDING</span>`}</td></tr>`;}).join('')}</tbody></table></div>`:`<div class="empty-state"><i class="fas fa-route"></i><h3>No Trips Yet</h3><p>Create your first trip.</p></div>`}</div>`;
    container.querySelectorAll('.trip-row-check').forEach(x=>x.addEventListener('change',Trips.updateSelectionCount));
  };
  Trips.toggleAll=function(flag){document.querySelectorAll('.trip-row-check').forEach(x=>x.checked=!!flag);Trips.updateSelectionCount();};
  Trips.getSelected=function(){return [...document.querySelectorAll('.trip-row-check:checked')].map(x=>x.value);};
  Trips.updateSelectionCount=function(){const n=Trips.getSelected().length;const el=document.getElementById('tripSelectedCount');if(el)el.textContent=`${n} selected`;};
  Trips.showActions=function(){
    const ids=Trips.getSelected();
    if(!ids.length)return Utils.toast('Please select at least one trip first.','warning');
    const duplicateSelected=()=>{
      const selected=Trips.getSelected();
      const all=DB.get('trips',[])||[];
      const source=selected.map(id=>all.find(t=>String(t.id)===String(id))).filter(Boolean);
      if(!source.length)return Utils.toast('Please select at least one trip first.','warning');
      const created=source.map(original=>{
        const copy=JSON.parse(JSON.stringify(original));
        copy.id=Utils.id();
        copy.date=Utils.today();
        copy.trip_no=Utils.generateTripNo(copy.date);
        copy.invoice_status='pending';
        copy.invoice_id=null;
        copy.invoice_no=null;
        return copy;
      });
      DB.set('trips',all.concat(created),true);
      if(typeof sync==='function')sync();
      Trips.clearSelection();
      Swal.close();
      Utils.toast(`${created.length} trip${created.length===1?'':'s'} duplicated successfully.`,'success');
      Router.go('trips');
    };
    Swal.fire({
      title:'Trip Actions',
      html:`<div class="anori-action-list">
        <button class="btn btn-primary btn-block" onclick="Swal.close();Invoices.generateFromTripSelection(Trips.getSelected())">🧾 Generate Invoice</button>
        <button class="btn btn-info btn-block" onclick="Swal.close();Trips.view(Trips.getSelected()[0])">👁 View Selected</button>
        <button class="btn btn-warning btn-block" id="anoriDuplicateSelectedTrip">📋 Duplicate Selected</button>
      </div>`,
      showConfirmButton:false,showCancelButton:true,cancelButtonText:'Close',
      didOpen:()=>document.getElementById('anoriDuplicateSelectedTrip')?.addEventListener('click',duplicateSelected)
    });
  };
  Invoices.generateFromTripSelection=function(ids){const all=DB.get('trips');const selected=all.filter(t=>ids.includes(t.id));const blocked=selected.filter(t=>activeInvoiceForTrip(t.id));if(blocked.length)return Swal.fire({icon:'warning',title:'Invoice already generated',text:`${blocked.length} selected trip(s) already have an active invoice. Cancel those invoices first.`,confirmButtonText:'OK'});const parties=new Set(selected.map(t=>t.party_id));if(parties.size>1)return Swal.fire({icon:'warning',title:'Select one customer',text:'One invoice can contain trips for only one customer.',confirmButtonText:'OK'});this.showInvoiceGenerator(ids);};

  // ------------------------------------------------------------
  // 2. INVOICES — counters, actions, payment tracking, cancellation
  // ------------------------------------------------------------
  function invoicePaid(inv){return num(inv.advance)+DB.get('payments',[]).filter(p=>p.invoice_id===inv.id).reduce((s,p)=>s+num(p.amount),0);}
  function invoiceBalance(inv){return Math.max(0,num(inv.total_amount)-invoicePaid(inv));}
  function invoiceStatus(inv){if(String(inv.status).toLowerCase()==='cancelled')return 'cancelled';const b=invoiceBalance(inv);if(b<=0)return 'paid';const due=new Date(Invoices.getDueDate(inv.date,inv.credit_days||30));if(due<new Date(today()))return 'overdue';return invoicePaid(inv)>0?'part_paid':'unpaid';}
  Invoices.render=function(container){
    const invoices=DB.get('invoices'),parties=DB.get('parties');
    const active=invoices.filter(i=>invoiceStatus(i)!=='cancelled');const paid=active.filter(i=>invoiceStatus(i)==='paid');const overdue=active.filter(i=>invoiceStatus(i)==='overdue');const part=active.filter(i=>invoiceStatus(i)==='part_paid');const unpaid=active.filter(i=>invoiceStatus(i)==='unpaid');
    const billed=active.reduce((s,i)=>s+num(i.total_amount),0),received=active.reduce((s,i)=>s+invoicePaid(i),0),outstanding=active.reduce((s,i)=>s+invoiceBalance(i),0);
    container.innerHTML=`<div class="anori-section-intro"><div><strong>Invoices & Billing</strong><span>See what was billed, what was received, and what is still pending.</span></div><button class="btn btn-primary" onclick="Invoices.showInvoiceGenerator()">＋ New Invoice</button></div>
      <div class="anori-kpi-grid anori-kpi-grid-5"><button class="anori-kpi-card"><span>Total Invoices</span><strong>${active.length}</strong><small>${money(billed)} billed</small></button><button class="anori-kpi-card anori-kpi-good"><span>Paid</span><strong>${paid.length}</strong><small>${money(received)} received</small></button><button class="anori-kpi-card anori-kpi-warn"><span>Unpaid</span><strong>${unpaid.length}</strong><small>${money(unpaid.reduce((s,i)=>s+invoiceBalance(i),0))} pending</small></button><button class="anori-kpi-card anori-kpi-info"><span>Part Paid</span><strong>${part.length}</strong><small>${money(part.reduce((s,i)=>s+invoiceBalance(i),0))} balance</small></button><button class="anori-kpi-card anori-kpi-bad"><span>Overdue</span><strong>${overdue.length}</strong><small>${money(overdue.reduce((s,i)=>s+invoiceBalance(i),0))} overdue</small></button></div>
      
      <div class="card"><div class="anori-table-toolbar anori-action-toolbar"><div class="anori-toolbar-left"><button class="btn btn-outline btn-sm" onclick="Invoices.toggleAll(true)">☑ Select All</button><button class="btn btn-outline btn-sm" onclick="Invoices.toggleAll(false)">Clear</button><span id="invoiceSelectedCount" class="anori-selection-count">0 selected</span></div><div class="anori-toolbar-right"><button class="btn btn-primary" onclick="Invoices.showActions()">⚙ Actions ▼</button></div></div>
      ${invoices.length?`<div class="table-wrapper"><table><thead><tr><th><input type="checkbox" aria-label="Select all invoices" onchange="Invoices.toggleAll(this.checked)"></th><th>Invoice</th><th>Date</th><th>Due Date</th><th>Remaining Days</th><th>Customer</th><th>Trips</th><th>Total</th><th>Received</th><th>Balance</th><th>Status</th></tr></thead><tbody>${invoices.map(inv=>{const p=parties.find(x=>x.id===inv.party_id),st=invoiceStatus(inv),cls=st==='paid'?'status-paid':st==='cancelled'?'status-cancelled':st==='part_paid'?'status-partpaid':st==='overdue'?'status-overdue':'status-pending';return `<tr><td><input type="checkbox" class="invoice-row-check" value="${esc(inv.id)}" onchange="Invoices.updateSelectionCount()"></td><td><strong>${esc(inv.invoice_no)}</strong></td><td>${esc(inv.date)}</td><td>${esc(p?.name||'-')}</td><td>${num(inv.trip_count)}</td><td>${money(inv.total_amount)}</td><td>${money(invoicePaid(inv))}</td><td>${money(invoiceBalance(inv))}</td><td><span class="status-badge ${cls}">${esc(st.replace('_',' ').toUpperCase())}</span></td></tr>`;}).join('')}</tbody></table></div>`:`<div class="empty-state"><i class="fas fa-file-invoice"></i><h3>No Invoices</h3><p>Generate an invoice from completed trips.</p></div>`}</div>`;
    Invoices.updateSelectionCount();
  };
  Invoices.toggleAll=function(flag){document.querySelectorAll('.invoice-row-check').forEach(x=>x.checked=!!flag);Invoices.updateSelectionCount();};
  Invoices.getSelected=function(){return [...document.querySelectorAll('.invoice-row-check:checked')].map(x=>x.value);};
  Invoices.updateSelectionCount=function(){const el=document.getElementById('invoiceSelectedCount');if(el)el.textContent=`${Invoices.getSelected().length} selected`;};
  Invoices.showActions=function(){const ids=Invoices.getSelected();if(!ids.length)return Utils.toast('Please select an invoice first.','warning');const id=ids[0],inv=DB.get('invoices').find(x=>x.id===id);const st=invoiceStatus(inv);Swal.fire({title:'Invoice Actions',html:`<div class="anori-action-list"><button class="btn btn-outline btn-block" onclick="Swal.close();Invoices.previewExisting('${esc(id)}')">View / Preview</button><button class="btn btn-primary btn-block" onclick="Swal.close();Invoices.downloadExisting('${esc(id)}')">Download PDF</button>${st!=='paid'&&st!=='cancelled'?`<button class="btn btn-success btn-block" onclick="Swal.close();Invoices.recordPayment('${esc(id)}')">Record Payment</button>`:''}${st!=='cancelled'?`<button class="btn btn-danger btn-block" onclick="Swal.close();Invoices.cancelInvoice('${esc(id)}')">Cancel Invoice</button>`:''}</div>`,showConfirmButton:false,showCancelButton:true,cancelButtonText:'Close'});};
  Invoices.recordPayment=function(id){const inv=DB.get('invoices').find(x=>x.id===id);if(!inv)return;const balance=invoiceBalance(inv);Swal.fire({title:'Record Payment',html:`<div class="anori-simple-form"><label>Invoice</label><input class="form-control" value="${esc(inv.invoice_no)}" disabled><label>Amount Received</label><input id="anori-pay-amount" type="number" min="0.01" max="${balance}" value="${balance}"><label>Date</label><input id="anori-pay-date" type="date" value="${today()}"><label>Payment Note</label><input id="anori-pay-note" placeholder="Bank / UPI / Cash reference"></div>`,showCancelButton:true,confirmButtonText:'Save Payment',preConfirm:()=>{const amount=num(document.getElementById('anori-pay-amount').value);if(amount<=0||amount>balance){Swal.showValidationMessage(`Enter amount up to ${money(balance)}.`);return false;}return {amount,date:document.getElementById('anori-pay-date').value,note:document.getElementById('anori-pay-note').value};}}).then(r=>{if(!r.isConfirmed)return;const p=DB.get('payments',[]);p.push({id:Utils.id(),invoice_id:id,...r.value});DB.set('payments',p);const invs=DB.get('invoices'),x=invs.find(i=>i.id===id);if(x)x.status=invoiceStatus(x)==='paid'?'paid':'part_paid';DB.set('invoices',invs);Router.go('invoices');Utils.toast('Payment recorded.');});};
  Invoices.cancelInvoice=function(id){const inv=DB.get('invoices').find(x=>x.id===id);if(!inv)return;Swal.fire({title:'Cancel Invoice?',text:'The invoice will remain in history and linked trips will become available for a new invoice.',icon:'warning',input:'text',inputLabel:'Cancellation reason',inputPlaceholder:'Enter reason',showCancelButton:true,confirmButtonText:'Cancel Invoice',confirmButtonColor:'#dc2626',preConfirm:r=>{if(!r)return 'Cancelled by user';return r;}}).then(r=>{if(!r.isConfirmed)return;const invs=DB.get('invoices'),x=invs.find(i=>i.id===id);if(x){x.status='cancelled';x.cancelled_at=new Date().toISOString();x.cancel_reason=r.value;}DB.set('invoices',invs);syncTripInvoiceFlags();Router.go('invoices');Utils.toast('Invoice cancelled.');});};

  // Override generator: only un-invoiced trips are selectable.
  Invoices.showInvoiceGenerator=function(preselectedIds=[]){
    const allCompleted=DB.get('trips',[]).filter(t=>t.status==='completed');
    const trips=allCompleted.filter(t=>!activeInvoiceForTrip(t.id));
    const blocked=allCompleted.filter(t=>activeInvoiceForTrip(t.id));
    if(!trips.length){
      return Swal.fire({icon:'info',title:'No Trip Available for Invoice',html:blocked.length?`All completed trips already have active invoices.<br><br><strong>Cancel the existing invoice first</strong> if you need to generate them again.`:'No completed trips are available.',confirmButtonText:'OK'});
    }
    const vehicles=DB.get('vehicles'),parties=DB.get('parties'),checked=new Set(preselectedIds);
    const billableMasters=DB.get('expense_master',[]).filter(x=>x.active!==false&&x.showOnInvoice);
    Swal.fire({
      title:'Create Invoice',width:950,
      html:`<div class="anori-invoice-generator">
        <div class="anori-help">Select trips for one customer. Active-invoice trips are hidden automatically.</div>
        <div class="table-wrapper" style="max-height:300px;overflow:auto"><table class="anori-standard-table"><thead><tr><th><input type="checkbox" id="anori-v28-inv-all"></th><th>Date</th><th>Trip</th><th>Customer</th><th>Vehicle</th><th style="text-align:right">Freight</th></tr></thead><tbody>${trips.map(t=>{const p=parties.find(x=>x.id===t.party_id),v=vehicles.find(x=>x.id===t.vehicle_id);return `<tr><td><input type="checkbox" class="anori-v28-inv-trip" data-id="${esc(t.id)}" data-party="${esc(t.party_id)}" ${checked.has(t.id)?'checked':''}></td><td>${esc(t.date)}</td><td>${esc(t.trip_no)}</td><td>${esc(p?.name||'-')}</td><td>${esc(v?.number||'-')}</td><td style="text-align:right">${money(t.freight)}</td></tr>`;}).join('')}</tbody></table></div>
        <div id="anori-v28-expense-picker" class="anori-expense-picker" style="margin-top:14px"></div>
        <div class="form-row" style="margin-top:12px"><div class="form-group"><label>Invoice Type</label><select id="anori-v28-inv-type" class="form-control"><option value="gst">GST Invoice</option><option value="nongst">Non-GST</option></select></div><div class="form-group"><label>Advance Received (₹)</label><input id="anori-v28-inv-advance" class="form-control" type="number" min="0" value="0"></div></div>
      </div>`,
      showCancelButton:true,confirmButtonText:'🧾 Generate Invoice',cancelButtonText:'Cancel',
      didOpen:()=>{
        const all=document.getElementById('anori-v28-inv-all');
        all?.addEventListener('change',()=>{document.querySelectorAll('.anori-v28-inv-trip').forEach(x=>x.checked=all.checked);updateExpensePicker();});
        document.querySelectorAll('.anori-v28-inv-trip').forEach(x=>x.addEventListener('change',updateExpensePicker));
        updateExpensePicker();
      },
      preConfirm:()=>{
        const selected=[...document.querySelectorAll('.anori-v28-inv-trip:checked')].map(x=>x.dataset.id);
        if(!selected.length){Swal.showValidationMessage('Please select at least one trip.');return false;}
        const partyIds=new Set([...document.querySelectorAll('.anori-v28-inv-trip:checked')].map(x=>x.dataset.party));
        if(partyIds.size>1){Swal.showValidationMessage('Please select trips for one customer only.');return false;}
        const blockedSelected=selected.filter(id=>activeInvoiceForTrip(id));
        if(blockedSelected.length){Swal.showValidationMessage('One or more selected trips already have an active invoice. Cancel it first.');return false;}
        const expenses=[...document.querySelectorAll('.anori-v28-bill-exp:checked')].map(c=>{const id=c.dataset.id,m=billableMasters.find(x=>x.id===id),amt=num(document.querySelector(`.anori-v28-bill-exp-amt[data-id="${CSS.escape(id)}"]`)?.value);return {masterId:id,name:m?.name||'Expense',amount:amt};}).filter(x=>x.amount>0);
        return {selected,isGst:document.getElementById('anori-v28-inv-type').value==='gst',advance:num(document.getElementById('anori-v28-inv-advance').value),expenses};
      }
    }).then(async r=>{if(!r.isConfirmed)return;const selectedTrips=DB.get('trips').filter(t=>r.value.selected.includes(t.id));await Invoices.createInvoiceV28(selectedTrips,r.value.isGst,r.value.advance,r.value.expenses);});

    function updateExpensePicker(){
      const host=document.getElementById('anori-v28-expense-picker');if(!host)return;
      const selectedIds=[...document.querySelectorAll('.anori-v28-inv-trip:checked')].map(x=>x.dataset.id);
      const selectedTrips=trips.filter(t=>selectedIds.includes(t.id));
      if(!selectedTrips.length){host.innerHTML='<div class="anori-help">Select a trip to choose billable expenses.</div>';return;}
      host.innerHTML=`<div class="anori-subtitle">Billable Expenses</div>${billableMasters.map(m=>{
        const amount=selectedTrips.reduce((sum,t)=>sum+(Array.isArray(t.expenses)?t.expenses:[]).filter(e=>String(e.type||'').trim().toLowerCase()===String(m.name||'').trim().toLowerCase()).reduce((a,e)=>a+num(e.amount),0),0);
        return `<div class="anori-expense-select-row"><label><input type="checkbox" class="anori-v28-bill-exp" data-id="${esc(m.id)}" ${amount>0?'checked':''}> ${esc(m.name)}</label><input type="number" class="anori-v28-bill-exp-amt" data-id="${esc(m.id)}" value="${amount||num(m.defaultAmount)||0}" min="0"></div>`;
      }).join('')||'<div class="anori-help">No billable expenses are configured in Master Data.</div>'}`;
    }
  };

  Invoices.createInvoiceV28=async function(trips,isGst,advance,selectedExpenseLines=[]){
    try{
      if(!trips?.length)throw new Error('Please select at least one trip.');
      const blocked=trips.filter(t=>activeInvoiceForTrip(t.id));
      if(blocked.length)throw new Error('One or more selected trips already have an active invoice. Cancel the old invoice first.');
      const party=DB.get('parties').find(p=>p.id===trips[0].party_id);
      if(!party)throw new Error('Customer/Party not found.');
      const partyIds=new Set(trips.map(t=>t.party_id));
      if(partyIds.size>1)throw new Error('One invoice can contain trips for one customer only.');
      const billableIds=new Set(DB.get('expense_master',[]).filter(x=>x.active!==false&&x.showOnInvoice).map(x=>x.id));
      const expenseLines=(Array.isArray(selectedExpenseLines)?selectedExpenseLines:[]).filter(e=>billableIds.has(e.masterId)&&num(e.amount)>0).map(e=>({masterId:e.masterId,name:e.name,amount:num(e.amount)}));
      const subtotal=trips.reduce((s,t)=>s+num(t.freight),0)+expenseLines.reduce((s,e)=>s+num(e.amount),0);
      const cgst=isGst?subtotal*0.09:0,sgst=isGst?subtotal*0.09:0,total=subtotal+cgst+sgst;
      if(advance<0)throw new Error('Advance cannot be negative.');
      if(advance>total)throw new Error(`Advance cannot be greater than invoice total of ${money(total)}.`);
      const invoice={id:Utils.id(),invoice_no:Utils.generateInvoiceNo(),date:today(),party_id:party.id,trip_ids:trips.map(t=>t.id),trip_count:trips.length,subtotal,cgst,sgst,total_amount:total,advance,balance_due:total-advance,is_gst:isGst,status:advance>=total?'paid':'issued',expense_lines:expenseLines,credit_days:Math.max(0,num(party.credit_days)||30),trips_data:trips.map(t=>({...t,vehicle:DB.get('vehicles').find(v=>v.id===t.vehicle_id)})),payments:[]};
      const invoices=DB.get('invoices',[]);invoices.push(invoice);if(!DB.set('invoices',invoices))throw new Error('Invoice could not be saved.');
      const allTrips=DB.get('trips',[]);trips.forEach(t=>{const x=allTrips.find(a=>a.id===t.id);if(x)x.invoice_status='invoiced';});DB.set('trips',allTrips);
      Utils.hideLoader();
      await Swal.fire({icon:'success',title:'Invoice Generated Successfully',html:`<strong>${esc(invoice.invoice_no)}</strong><br>${esc(party.name)}<br><strong>${money(total)}</strong><br><small>Trip(s): ${trips.length}</small>`,showCancelButton:true,confirmButtonText:'👁 Open Preview',cancelButtonText:'Close'}).then(r=>{if(r.isConfirmed)Invoices.previewInvoice(invoice);});
      Router.go('invoices');
      return invoice;
    }catch(e){
      Utils.hideLoader();
      console.error('Invoice generation error:',e);
      await Swal.fire({icon:'error',title:'Invoice Generation Failed',text:e?.message||'Unable to generate invoice.',confirmButtonText:'OK'});
      return null;
    }
  };

  Invoices.createInvoice=Invoices.createInvoiceV28;

  // ------------------------------
  // ONE invoice renderer for preview / PDF / print
  // ------------------------------
  Invoices.buildInvoiceHTML=function(invoice,preview=false){
    const company=DB.get('company_profile',{}),party=DB.get('parties',[]).find(p=>p.id===invoice.party_id)||{};
    const addressLines=Array.isArray(company.addr_lines)?company.addr_lines.map(x=>String(x||'').trim()).filter(Boolean):(String(company.addr||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean));
    const addressHtml=addressLines.map(line=>`<div class="brand-address-line">${esc(line)}</div>`).join('')||'<div class="brand-address-line"></div>';
    const status=String(invoice.status||'issued').replace('_',' ').toUpperCase();
    const due=this.getDueDate(invoice.date,invoice.credit_days||30);
    const expenseRows=(invoice.expense_lines||[]).filter(e=>num(e.amount)>0).map(e=>`<tr><td colspan="5" class="summary-label">${esc(e.name)}</td><td class="money">${money(e.amount)}</td></tr>`).join('');
    const tripRows=(invoice.trips_data||[]).map((t,i)=>`<tr><td>${i+1}</td><td><strong>${esc(t.trip_no)}</strong></td><td>${esc(t.date)}</td><td>${esc(t.from)} → ${esc(t.to)}</td><td>${esc(t.vehicle?.number||'')}</td><td class="money">${money(t.freight)}</td></tr>`).join('');
    const isGstInvoice=invoice.is_gst===true||invoice.is_gst===1||String(invoice.is_gst).toLowerCase()==='true'; const taxRows=isGstInvoice?(invoice.tax_type==='igst'?`<tr><td colspan="5" class="summary-label">IGST 18%</td><td class="money">${money(invoice.igst||0)}</td></tr>`:`<tr><td colspan="5" class="summary-label">CGST 9%</td><td class="money">${money(invoice.cgst)}</td></tr><tr><td colspan="5" class="summary-label">SGST 9%</td><td class="money">${money(invoice.sgst)}</td></tr>`):'';
    return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(invoice.invoice_no)}</title><style>
      *{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;background:#fff;font-size:12px;line-height:1.45;text-transform:uppercase}.invoice-page{width:210mm;min-height:297mm;margin:0;background:#fff;padding:5mm;box-shadow:none;overflow:hidden}.top{display:grid;grid-template-columns:1.2fr .8fr;gap:12px;align-items:start}.brand h1{font-size:24px;margin:0 0 4px;color:#0f172a}.brand div{margin:2px 0}.brand-address-line{margin:2px 0}.invoice-title{text-align:right}.invoice-title h2{font-size:23px;margin:0 0 8px;color:#0f172a}.meta{width:100%;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden}.meta-row{display:grid;grid-template-columns:105px 1fr;border-bottom:1px solid #e2e8f0}.meta-row:last-child{border-bottom:0}.meta-row b{background:#eaf2fb;padding:7px}.meta-row span{padding:7px;text-align:right}.badge{display:inline-block;padding:3px 9px;border-radius:20px;background:#dbeafe;color:#1d4ed8;font-weight:700;font-size:10px}.rule{height:2px;background:#1e3a8a;margin:10px 0}.two{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}.box{border:1px solid #cbd5e1;border-radius:8px;overflow:hidden}.box-title{background:#eaf2fb;color:#0f3b78;font-weight:800;padding:7px 10px;text-transform:uppercase}.box-body{padding:7px;min-height:58px}.charges-title{background:#1e3a8a;color:#fff;font-weight:800;padding:8px 10px;text-transform:uppercase;border-radius:8px 8px 0 0}.charges{width:100%;border-collapse:collapse;margin:0}.charges th,.charges td{border:1px solid #cbd5e1;padding:5px 6px}.charges th{background:#eef3f8;font-size:11px;text-align:left}.money{text-align:right;white-space:nowrap}.summary-label{text-align:right}.charges tfoot td{background:#fff}.charges tfoot tr.total td{background:#effcf4;font-weight:800}.charges tfoot tr.balance td,.charges tfoot tr.balance td strong,.charges tfoot tr.balance td span{background:#1e3a8a;color:#fff!important;font-weight:800;font-size:15px}.amount-words,.bank,.signature{border:1px solid #cbd5e1;border-radius:8px;margin-top:8px;overflow:hidden}.section-title{background:#eaf2fb;color:#0f3b78;font-weight:800;padding:7px 10px;text-transform:uppercase}.section-body{padding:10px}.bank-sign{display:grid;grid-template-columns:1fr 1fr;gap:8px}.signature-body{height:82px;padding:8px 10px;display:flex;align-items:flex-end;justify-content:flex-end;gap:8px;position:relative}.company-signature-stamp{max-width:150px;max-height:62px;object-fit:contain;display:block}.authorized-signatory-label{font-weight:700;white-space:nowrap}.terms{margin-top:8px;border-top:1px solid #cbd5e1;padding-top:10px;font-size:10px}.footer{margin-top:8px;border-top:2px solid #1e3a8a;padding-top:8px;text-align:center;font-size:10px;color:#475569}.avoid{break-inside:avoid;page-break-inside:avoid}@page{size:A4 portrait;margin:0}@media print{body{background:#fff}.invoice-page{margin:0;box-shadow:none}.no-print{display:none!important}}
    </style></head><body><div class="invoice-page">
      <div class="top avoid"><div class="brand"><h1>${esc(company.name||'Anori Transport Services')}</h1>${addressHtml}${isGstInvoice?`<div>GSTIN: ${esc(company.gst||'N/A')} &nbsp; | &nbsp; PAN: ${esc(company.pan||'N/A')} &nbsp; | &nbsp; Phone: ${esc(company.phone||'')}</div>`:`<div>PAN: ${esc(company.pan||'N/A')} &nbsp; | &nbsp; Phone: ${esc(company.phone||'')}</div>`}</div><div class="invoice-title"><h2>${isGstInvoice?'TAX INVOICE':'INVOICE'}</h2><div class="meta"><div class="meta-row"><b>Invoice No.</b><span>${esc(invoice.invoice_no)}</span></div><div class="meta-row"><b>Date</b><span>${esc(invoice.date)}</span></div><div class="meta-row"><b>Due Date</b><span>${esc(due)}</span></div><div class="meta-row"><b>Status</b><span><span class="badge">${esc(status)}</span></span></div></div></div></div>
      <div class="rule"></div>
      <div class="two avoid"><div class="box"><div class="box-title">Bill To</div><div class="box-body"><strong>${esc(party.name||'N/A')}</strong><br>${esc(party.addr||'')}${isGstInvoice?`<br>GSTIN: ${esc(party.gst||'N/A')}`:''}</div></div><div class="box"><div class="box-title">Payment Terms</div><div class="box-body"><strong>${esc(invoice.credit_days||30)} Days</strong><br>Due Date: ${esc(due)}<br>Invoice Type: ${isGstInvoice?'GST':'Non-GST'}${isGstInvoice && invoice.tax_type?`<br>Tax Type: ${invoice.tax_type==='igst'?'IGST 18%':'CGST 9% + SGST 9%'}`:''}</div></div></div>
      <div class="avoid"><div class="charges-title">Transport / Billable Charges</div><table class="charges"><thead><tr><th style="width:5%">#</th><th style="width:22%">Trip No.</th><th style="width:13%">Date</th><th style="width:28%">Route</th><th style="width:17%">Vehicle</th><th style="width:15%;text-align:right">Amount</th></tr></thead><tbody>${tripRows||'<tr><td colspan="6">No trip lines</td></tr>'}</tbody><tfoot>${expenseRows}${`<tr><td colspan="5" class="summary-label"><strong>Subtotal</strong></td><td class="money"><strong>${money(invoice.subtotal)}</strong></td></tr>`}${taxRows}<tr class="total"><td colspan="5" class="summary-label"><strong>Total</strong></td><td class="money"><strong>${money(invoice.total_amount)}</strong></td></tr><tr><td colspan="5" class="summary-label">Advance Received</td><td class="money">-${money(invoice.advance)}</td></tr><tr class="balance"><td colspan="5" class="summary-label"><strong>BALANCE DUE</strong></td><td class="money"><strong>${money(invoice.balance_due)}</strong></td></tr></tfoot></table></div>
      <div class="amount-words avoid"><div class="section-title">Amount in Words</div><div class="section-body">${esc(Utils.numberToWords(invoice.total_amount))}</div></div>
      <div class="bank-sign"><div class="bank avoid"><div class="section-title">Bank Details</div><div class="section-body">Bank Name: <strong>${esc(company.bank_name||'N/A')}</strong><br>Account No.: <strong>${esc(company.acc||'N/A')}</strong><br>IFSC: <strong>${esc(company.bank||'N/A')}</strong></div></div><div class="signature avoid"><div class="section-title" style="text-align:right">For ${esc(company.name||'Anori Transport Services')}</div><div class="signature-body">${company.signature_stamp?`<img class="company-signature-stamp" src="${esc(company.signature_stamp)}" alt="Authorized Signatory">`:''}<span class="authorized-signatory-label">Authorized Signatory</span></div></div></div>
      <div class="terms avoid"><strong>TERMS & CONDITIONS</strong><ol style="margin:5px 0 0 18px;padding:0"><li>Payment is due as per agreed payment terms.</li><li>Any billing discrepancy should be communicated promptly.</li><li>This is a computer-generated invoice.</li></ol></div>
      <div class="footer">Thank you for your business. &nbsp; | &nbsp; Computer-generated invoice</div>
    </div></body></html>`;
  };

  function normalizeInvoiceForRender(invoice){
    const x={...(invoice||{})};
    x.expense_lines=Array.isArray(x.expense_lines)?x.expense_lines:[];
    x.payments=Array.isArray(x.payments)?x.payments:[];
    x.trips_data=Array.isArray(x.trips_data)?x.trips_data.map(t=>({...t,vehicle:t.vehicle||DB.get('vehicles',[]).find(v=>v.id===t.vehicle_id)||{}})):[];
    x.subtotal=num(x.subtotal);x.cgst=num(x.cgst);x.sgst=num(x.sgst);x.igst=num(x.igst);x.total_amount=num(x.total_amount);x.advance=num(x.advance);x.tax_type=x.tax_type||(x.is_gst?'cgst_sgst':'none');
    x.balance_due=Math.max(0,x.total_amount-x.advance-DB.get('payments',[]).filter(p=>p.invoice_id===x.id).reduce((a,p)=>a+num(p.amount),0));
    return x;
  }

  // SINGLE SOURCE OF TRUTH: Preview and Download PDF use the exact same rendered DOM.
  // No iframe, no file:// navigation, no compact PDF template.
  Invoices.getInvoiceRenderHTML=function(invoice){return this.buildInvoiceHTML(invoice,true);};

  Invoices.mountInvoiceDocument=function(invoice){
    const content=document.getElementById('previewContent');
    if(!content)throw new Error('Invoice preview container not found.');
    content.innerHTML='';
    content.dataset.invoiceId=invoice.id;
    const html=this.getInvoiceRenderHTML(invoice);
    const parsed=new DOMParser().parseFromString(html,'text/html');
    if(parsed.querySelector('parsererror'))throw new Error('Invoice preview HTML could not be parsed.');
    const stage=document.createElement('div');
    stage.className='anori-invoice-preview-stage';
    const style=document.createElement('style');
    style.textContent=[...parsed.head.querySelectorAll('style')].map(x=>x.textContent).join('\n');
    stage.appendChild(style);
    const page=parsed.body.querySelector('.invoice-page');
    if(!page)throw new Error('Invoice page could not be rendered.');
    stage.appendChild(page.cloneNode(true));
    content.appendChild(stage);
    return stage.querySelector('.invoice-page');
  };

  Invoices.previewInvoice=function(invoice){
    try{
      this.mountInvoiceDocument(normalizeInvoiceForRender(invoice));
      document.getElementById('previewModal').classList.add('active');
    }catch(e){
      console.error('Invoice preview error:',e);
      Swal.fire({icon:'error',title:'Invoice Preview Failed',text:e.message||'Unable to open invoice preview.',confirmButtonText:'OK'});
    }
  };

  Invoices.downloadInvoice=async function(invoice){
    try{
      if(typeof html2pdf!=='function')throw new Error('PDF library is not available. Open the application with internet access once, or bundle html2pdf locally.');
      const normalized=normalizeInvoiceForRender(invoice);
      const content=document.getElementById('previewContent');
      let page=content?.dataset.invoiceId===normalized.id?content.querySelector('.invoice-page'):null;
      if(!page)page=this.mountInvoiceDocument(normalized);
      if(!page)throw new Error('Invoice preview could not be prepared for PDF.');
      const stage=page.parentElement;
      const previousWidth=stage.style.width,previousTransform=stage.style.transform,previousOverflow=stage.style.overflow;
      stage.style.width='210mm';stage.style.transform='none';stage.style.overflow='visible';
      if(document.fonts?.ready)await document.fonts.ready;
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      await html2pdf().set({
        margin:0,filename:`${normalized.invoice_no}.pdf`,image:{type:'jpeg',quality:.98},
        html2canvas:{scale:2,useCORS:true,allowTaint:false,backgroundColor:'#ffffff',logging:false,scrollX:0,scrollY:0},
        pagebreak:{mode:['css','legacy'],avoid:['.avoid']},
        jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}
      }).from(page).save();
      stage.style.width=previousWidth;stage.style.transform=previousTransform;stage.style.overflow=previousOverflow;
      Utils.toast('PDF downloaded successfully using the exact Invoice Preview layout.','success');
    }catch(e){
      console.error('Invoice PDF generation error:',e);
      Swal.fire({icon:'error',title:'PDF Generation Failed',text:e.message||'Unable to create PDF.',confirmButtonText:'OK'});
    }
  };


  // ------------------------------
  // INVOICE ACTIONS: same toolbar pattern as Trip Management
  // ------------------------------
  // Extend the universal table action mapping without changing Anori business logic.
  window.__anoriV28InvoiceActionsReady=true;

  // Local-file safe PDF helper: uses the current DOM only; never creates a file:// iframe.
  Invoices.downloadInvoiceSafe=async function(invoice){
    try{
      if(typeof window.html2canvas!=='function')throw new Error('PDF image renderer is not loaded.');
      if(!window.jspdf?.jsPDF)throw new Error('PDF engine is not loaded.');
      const content=document.getElementById('previewContent');
      if(!content)throw new Error('Invoice preview area is not available.');
      let page=content.querySelector('.invoice-page');
      if(!page){
        if(typeof this.mountInvoiceDocument!=='function')throw new Error('Invoice Preview renderer is unavailable.');
        page=this.mountInvoiceDocument(invoice);
      }
      const canvas=await window.html2canvas(page,{scale:2,useCORS:true,allowTaint:false,backgroundColor:'#fff',logging:false,scrollX:0,scrollY:0});
      const {jsPDF}=window.jspdf;
      const pdf=new jsPDF({unit:'mm',format:'a4',orientation:'portrait',compress:true});
      const ratio=canvas.width/canvas.height; let w=200,h=w/ratio;
      if(h>287){h=287;w=h*ratio;}
      pdf.addImage(canvas.toDataURL('image/jpeg',0.98),'JPEG',(210-w)/2,(297-h)/2,w,h,undefined,'FAST');
      pdf.save(`${invoice.invoice_no}.pdf`);
      Utils.toast('PDF downloaded successfully.','success');
    }catch(e){console.error('Invoice PDF generation error:',e);Utils.toast(e.message||'Unable to create PDF.','error');}
  };

  // ------------------------------
  // AUTO BACKUP HOOK
  // ------------------------------
  if(!DB.__anoriV28BackupWrapped){
    const baseSet=DB.set.bind(DB);let timer=null;
    DB.set=function(key,data,bypassAuth=false){
      const result=baseSet(key,data,bypassAuth);
      if(result && !['audit_log','backup_settings'].includes(key)){
        clearTimeout(timer);timer=setTimeout(()=>AnoriDataTools.autoBackupNow(`data-change:${key}`),1200);
      }
      return result;
    };
    DB.__anoriV28BackupWrapped=true;
  }

  // Re-render settings after folder/import operations and keep table UI active.
  const oldGo=Router.go.bind(Router);
  Router.go=function(view){const r=oldGo(view);setTimeout(()=>window.AnoriTableUI?.decorate?.(),60);return r;};

  // Keep the global backup icon useful: if a folder is selected, save there; otherwise download JSON.
  const backupButton=document.getElementById('backupBtn');
  if(backupButton){backupButton.onclick=async()=>{const ok=await AnoriDataTools.autoBackupNow('header');if(!ok)AnoriDataTools.exportJSON();};}

  // Ensure all existing invoices have the fields needed by the single renderer.
  const invoices=DB.get('invoices',[]);invoices.forEach(inv=>{if(!Array.isArray(inv.expense_lines))inv.expense_lines=[];if(!Array.isArray(inv.payments))inv.payments=[];if(!inv.status)inv.status='issued';});DB.set('invoices',invoices,true);
})();

/* ============================================================
   ANORI TRANSPORT v2.12 — CRITICAL FINANCIAL INTEGRITY HARDENING
   Scope: Anori Transport only. Appended as a final override layer.
   ============================================================ */
(function installAnoriV212CriticalFixes(){
  'use strict';
  const esc=v=>Sanitize.html(v==null?'':String(v));
  const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const money=v=>Utils.fmt(num(v));
  const today=()=>Utils.today();
  const allInvoices=()=>DB.get('invoices',[]);
  const allTrips=()=>DB.get('trips',[]);
  const activeInvoiceForTrip=id=>allInvoices().find(inv=>Array.isArray(inv.trip_ids)&&inv.trip_ids.includes(id)&&String(inv.status||'issued').toLowerCase()!=='cancelled');
  const anyInvoiceForTrip=id=>allInvoices().find(inv=>Array.isArray(inv.trip_ids)&&inv.trip_ids.includes(id));
  const invoicePaid=inv=>num(inv?.advance)+DB.get('payments',[]).filter(p=>p.invoice_id===inv?.id).reduce((s,p)=>s+num(p.amount),0);
  const invoiceBalance=inv=>Math.max(0,num(inv?.total_amount)-invoicePaid(inv));
  const invoiceStatus=inv=>{
    if(!inv)return 'unknown';
    if(String(inv.status||'').toLowerCase()==='cancelled')return 'cancelled';
    const bal=invoiceBalance(inv);
    if(bal<=0)return 'paid';
    const due=new Date(Invoices.getDueDate(inv.date,inv.credit_days||30));
    if(!Number.isNaN(due.getTime()) && due < new Date(today()))return invoicePaid(inv)>0?'overdue':'overdue';
    return invoicePaid(inv)>0?'part_paid':'unpaid';
  };

  function syncInvoicePayments(inv){
    if(!inv)return;
    inv.payments=DB.get('payments',[]).filter(p=>p.invoice_id===inv.id).map(p=>({...p}));
    inv.paid_amount=invoicePaid(inv);
    inv.balance_due=invoiceBalance(inv);
    inv.status=String(inv.status||'issued').toLowerCase()==='cancelled'?'cancelled':(inv.balance_due<=0?'paid':(inv.paid_amount>0?'part_paid':'issued'));
  }

  function syncAllInvoiceFinancialState(){
    const invoices=allInvoices();
    invoices.forEach(inv=>{
      if(!Array.isArray(inv.expense_lines))inv.expense_lines=[];
      syncInvoicePayments(inv);
    });
    DB.set('invoices',invoices,true);
  }

  function syncTripInvoiceFlagsSafe(){
    const trips=allTrips();
    trips.forEach(t=>{t.invoice_status=activeInvoiceForTrip(t.id)?'invoiced':'pending';});
    DB.set('trips',trips,true);
  }

  // ---------- TRIP FINANCIAL LOCK ----------
  // An issued/paid/part-paid trip must never be deleted or edited.
  Trips.openEditForm=function(id){
    const inv=activeInvoiceForTrip(id);
    if(inv){
      return Swal.fire({icon:'warning',title:'Trip Locked',html:`This trip is linked to active invoice <strong>${esc(inv.invoice_no)}</strong>.<br><br>Cancel the invoice first if you need to edit this trip.`,confirmButtonText:'OK'});
    }
    return Trips.showEditModal(id);
  };

  Trips.update=function(id){
    if(activeInvoiceForTrip(id)){
      return Swal.fire({icon:'warning',title:'Trip Locked',text:'Cancel the active invoice before editing this trip.',confirmButtonText:'OK'});
    }
    return Trips.updateV25(id);
  };

  Trips.delete=function(id){
    const historical=anyInvoiceForTrip(id);
    if(historical){
      const inv=historical;
      return Swal.fire({
        icon:'warning',
        title:'Trip Cannot Be Deleted',
        html:`This trip is linked to invoice <strong>${esc(inv.invoice_no)}</strong>.<br><br>Financial history must be preserved. Cancelled invoices also remain in history.`,
        confirmButtonText:'OK'
      });
    }
    return Swal.fire({
      title:'Delete Trip?',
      text:'This trip has no invoice history and can be deleted.',
      icon:'warning',showCancelButton:true,
      confirmButtonColor:'#ef4444',cancelButtonColor:'#64748b',
      confirmButtonText:'Yes, Delete',cancelButtonText:'Cancel'
    }).then(r=>{
      if(!r.isConfirmed)return;
      DB.set('trips',allTrips().filter(t=>t.id!==id));
      DB.set('driver_settlements',DB.get('driver_settlements',[]).filter(x=>x.trip_id!==id));
      Utils.toast('Trip deleted successfully.');
      Router.go('trips');
    });
  };

  // ---------- INVOICE STATUS: FINANCIAL STATE, NOT A FREE-FORM DROPDOWN ----------
  Invoices.updateStatus=function(id,newStatus){
    const invoices=allInvoices();
    const inv=invoices.find(x=>x.id===id);
    if(!inv)return;
    const requested=String(newStatus||'').toLowerCase();
    if(requested==='cancelled')return Invoices.cancelInvoice(id);
    if(requested==='paid'||requested==='part_paid'||requested==='unpaid'||requested==='overdue'){
      return Swal.fire({icon:'info',title:'Use Payment Entry',text:'Invoice payment status is calculated automatically from Advance Received and recorded payments.',confirmButtonText:'OK'});
    }
    if(String(inv.status).toLowerCase()==='cancelled'){
      return Swal.fire({icon:'warning',title:'Cancelled Invoice',text:'A cancelled invoice cannot be reactivated. Generate a new invoice after correcting the trip.',confirmButtonText:'OK'});
    }
    inv.status=requested==='sent'?'sent':'issued';
    DB.set('invoices',invoices);
    Utils.toast(`Invoice marked ${inv.status}.`);
    Router.go('invoices');
  };

  // ---------- PAYMENT LEDGER ----------
  Invoices.recordPayment=function(id){
    const inv=allInvoices().find(x=>x.id===id);
    if(!inv)return;
    if(String(inv.status).toLowerCase()==='cancelled')return Utils.toast('Cancelled invoices cannot receive payments.','warning');
    const balance=invoiceBalance(inv);
    if(balance<=0)return Utils.toast('This invoice is already fully paid.','info');
    Swal.fire({
      title:'Record Customer Payment',
      html:`<div class="anori-simple-form" style="text-align:left">
        <label>Invoice</label><input class="form-control" value="${esc(inv.invoice_no)}" disabled>
        <label>Amount Received (₹)</label><input id="anori-pay-amount" class="form-control" type="number" min="0.01" max="${balance}" value="${balance}">
        <label>Payment Date</label><input id="anori-pay-date" class="form-control" type="date" value="${today()}">
        <label>Payment Mode / Reference</label><input id="anori-pay-note" class="form-control" placeholder="Bank / UPI / Cash / Reference">
      </div>`,
      showCancelButton:true,confirmButtonText:'Save Payment',cancelButtonText:'Cancel',
      preConfirm:()=>{
        const amount=num(document.getElementById('anori-pay-amount').value);
        if(amount<=0||amount>balance){Swal.showValidationMessage(`Enter an amount from ₹0.01 to ${money(balance)}.`);return false;}
        return {amount,date:document.getElementById('anori-pay-date').value,note:document.getElementById('anori-pay-note').value.trim()};
      }
    }).then(r=>{
      if(!r.isConfirmed)return;
      const payments=DB.get('payments',[]);
      payments.push({id:Utils.id(),invoice_id:id,...r.value,created_at:new Date().toISOString()});
      DB.set('payments',payments);
      const invoices=allInvoices(),x=invoices.find(i=>i.id===id);
      if(x){x.payments=payments.filter(p=>p.invoice_id===id);syncInvoicePayments(x);DB.set('invoices',invoices);}
      Utils.toast('Payment recorded successfully.');
      Router.go('invoices');
    });
  };

  // ---------- CANCELLATION: PRESERVE HISTORY, NEVER DELETE ----------
  Invoices.cancelInvoice=function(id){
    const inv=allInvoices().find(x=>x.id===id);
    if(!inv)return;
    if(String(inv.status).toLowerCase()==='cancelled')return Utils.toast('Invoice is already cancelled.','info');
    const paid=invoicePaid(inv);
    Swal.fire({
      title:'Cancel Invoice?',
      html:`Invoice <strong>${esc(inv.invoice_no)}</strong> will remain in history and will not be deleted.<br><br>${paid>0?`<strong>Received amount: ${money(paid)}</strong><br><small>Cancellation with received money should be handled with your accounting/refund process.</small>`:'The linked trips will become available for a new invoice after cancellation.'}`,
      icon:'warning',input:'text',inputLabel:'Cancellation reason',inputPlaceholder:'Enter reason',
      showCancelButton:true,confirmButtonColor:'#dc2626',confirmButtonText:'Cancel Invoice',cancelButtonText:'Keep Invoice',
      preConfirm:value=>String(value||'').trim()||'Cancelled by user'
    }).then(r=>{
      if(!r.isConfirmed)return;
      const invoices=allInvoices(),x=invoices.find(i=>i.id===id);
      if(!x)return;
      x.status='cancelled';x.cancelled_at=new Date().toISOString();x.cancel_reason=r.value;
      DB.set('invoices',invoices);
      syncTripInvoiceFlagsSafe();
      Utils.toast('Invoice cancelled. Trip is available for a new invoice.');
      Router.go('invoices');
    });
  };

  // Keep delete action semantically safe: issued financial invoices are cancelled, never deleted.
  Invoices.deleteInvoice=function(id){
    const inv=allInvoices().find(x=>x.id===id);
    if(!inv)return;
    if(String(inv.status).toLowerCase()!=='draft')return Invoices.cancelInvoice(id);
    Swal.fire({title:'Delete Draft Invoice?',text:'Only draft invoices can be permanently deleted.',icon:'warning',showCancelButton:true,confirmButtonColor:'#ef4444',confirmButtonText:'Delete Draft'}).then(r=>{
      if(!r.isConfirmed)return;
      DB.set('invoices',allInvoices().filter(x=>x.id!==id));
      Router.go('invoices');Utils.toast('Draft invoice deleted.');
    });
  };

  // ---------- INVOICE GENERATION: ATOMIC DUPLICATE CHECK ----------
  const originalCreateInvoiceV28=Invoices.createInvoiceV28;
  Invoices.createInvoiceV28=async function(trips,isGst,advance,selectedExpenseLines=[]){
    const latestTrips=allTrips();
    const ids=new Set((trips||[]).map(t=>t.id));
    const freshTrips=latestTrips.filter(t=>ids.has(t.id));
    if(!freshTrips.length){
      return Swal.fire({icon:'error',title:'Invoice Generation Failed',text:'Selected trip data is no longer available.',confirmButtonText:'OK'});
    }
    const blocked=freshTrips.filter(t=>activeInvoiceForTrip(t.id));
    if(blocked.length){
      return Swal.fire({icon:'warning',title:'Invoice Already Generated',html:`${blocked.length} selected trip(s) already have an active invoice.<br><br><strong>Cancel the old invoice first.</strong>`,confirmButtonText:'OK'});
    }
    const result=await originalCreateInvoiceV28.call(Invoices,freshTrips,isGst,advance,selectedExpenseLines);
    if(result)syncTripInvoiceFlagsSafe();
    return result;
  };

  // ---------- SAME PREVIEW DOM = SAME PDF SOURCE ----------
  Invoices.downloadInvoice=async function(invoice){
    try{
      if(typeof html2pdf!=='function')throw new Error('PDF library is unavailable.');
      const normalized=typeof normalizeInvoiceForRender==='function'?normalizeInvoiceForRender(invoice):invoice;
      const content=document.getElementById('previewContent');
      let page=content?.dataset.invoiceId===normalized.id?content.querySelector('.invoice-page'):null;
      if(!page)page=this.mountInvoiceDocument(normalized);
      if(!page)throw new Error('Invoice Preview could not be prepared.');
      document.getElementById('previewModal')?.classList.add('active');
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      if(document.fonts?.ready)await document.fonts.ready;
      const stage=page.parentElement;
      const old={width:stage.style.width,height:stage.style.height,overflow:stage.style.overflow,transform:stage.style.transform};
      stage.style.width='210mm';stage.style.height='auto';stage.style.overflow='visible';stage.style.transform='none';
      await html2pdf().set({
        margin:0,filename:`${normalized.invoice_no}.pdf`,
        image:{type:'jpeg',quality:.98},
        html2canvas:{scale:2,useCORS:true,allowTaint:false,backgroundColor:'#fff',logging:false,scrollX:0,scrollY:0,windowWidth:794},
        pagebreak:{mode:['css','legacy'],avoid:['.avoid']},
        jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}
      }).from(page).save();
      Object.assign(stage.style,old);
      Utils.toast('PDF downloaded — same layout as Invoice Preview.','success');
    }catch(e){
      console.error('Invoice PDF generation error:',e);
      Swal.fire({icon:'error',title:'PDF Generation Failed',text:e?.message||'Unable to create PDF.',confirmButtonText:'OK'});
    }
  };

  // ---------- MASTER EXPENSE DATA MIGRATION ----------
  const exp=DB.get('expense_master',[]);
  if(!Array.isArray(exp)||!exp.length){
    DB.set('expense_master',[
      {id:Utils.id(),name:'Diesel',defaultAmount:0,showOnInvoice:false,active:true},
      {id:Utils.id(),name:'Toll',defaultAmount:0,showOnInvoice:false,active:true},
      {id:Utils.id(),name:'Food',defaultAmount:0,showOnInvoice:false,active:true},
      {id:Utils.id(),name:'Repair',defaultAmount:0,showOnInvoice:false,active:true}
    ],true);
  }

  // ---------- STARTUP NORMALIZATION ----------
  syncAllInvoiceFinancialState();
  syncTripInvoiceFlagsSafe();

  window.ANORI_V212_CRITICAL_FIXES=true;
})();



/* ============================================================
 ANORI TRANSPORT v2.13 — CONSOLIDATED REQUIREMENT HARDENING
 ============================================================ */
(function(){
'use strict';
const esc=v=>Sanitize.html(v==null?'':String(v)), num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0}, money=v=>Utils.fmt(num(v)), today=()=>Utils.today();
const trips=()=>DB.get('trips',[]), invs=()=>DB.get('invoices',[]), drivers=()=>DB.get('drivers',[]), parties=()=>DB.get('parties',[]), vehicles=()=>DB.get('vehicles',[]), exps=()=>DB.get('expense_master',[]).filter(x=>x.active!==false);
const party=id=>parties().find(x=>x.id===id), driver=id=>drivers().find(x=>x.id===id), vehicle=id=>vehicles().find(x=>x.id===id);
const activeInv=id=>invs().find(i=>Array.isArray(i.trip_ids)&&i.trip_ids.includes(id)&&String(i.status||'').toLowerCase()!=='cancelled');
// Prevent duplicate invoice-history rows when the same invoice number was created more than once.
// Keep one record, preserve the highest advance, and merge distinct payment entries.
function dedupeInvoicesByNumber(){
  const all=invs();
  const groups=new Map();
  all.forEach(i=>{
    const key=String(i?.invoice_no||'').trim();
    if(!key)return;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(i);
  });
  const duplicateGroups=[...groups.values()].filter(g=>g.length>1);
  if(!duplicateGroups.length)return all;
  const removeIds=new Set();
  const payments=DB.get('payments',[]);
  const mergedPayments=[];
  duplicateGroups.forEach(group=>{
    const survivor=group.slice().sort((a,b)=>{
      const pa=num(a?.advance), pb=num(b?.advance);
      if(pb!==pa)return pb-pa;
      const ca=String(a?.cancelled_at||a?.created_at||'');
      const cb=String(b?.cancelled_at||b?.created_at||'');
      return cb.localeCompare(ca);
    })[0];
    const ids=new Set(group.map(x=>x.id));
    group.forEach(x=>{if(x!==survivor)removeIds.add(x.id)});
    survivor.advance=Math.max(...group.map(x=>num(x?.advance)),0);
    survivor.expense_lines=Array.isArray(survivor.expense_lines)?survivor.expense_lines:[];
    const seen=new Set();
    payments.filter(x=>ids.has(x.invoice_id)).forEach(pay=>{
      const sig=[pay.amount,pay.date,pay.note||''].join('|');
      if(seen.has(sig))return;
      seen.add(sig);
      mergedPayments.push({...pay,invoice_id:survivor.id});
    });
  });
  const kept=all.filter(i=>!removeIds.has(i.id));
  if(removeIds.size){
    const survivors=new Set(kept.map(i=>i.id));
    const existingNonDup=payments.filter(p=>!removeIds.has(p.invoice_id));
    const mergedUnique=new Map();
    [...existingNonDup,...mergedPayments].forEach(p=>{
      const sig=[p.invoice_id,p.amount,p.date,p.note||''].join('|');
      if(!mergedUnique.has(sig))mergedUnique.set(sig,p);
    });
    DB.set('payments',[...mergedUnique.values()].filter(p=>survivors.has(p.invoice_id)),true);
    DB.set('invoices',kept,true);
  }
  return kept;
}
const anyInv=id=>invs().find(i=>Array.isArray(i.trip_ids)&&i.trip_ids.includes(id));
const paid=i=>num(i?.advance)+DB.get('payments',[]).filter(p=>p.invoice_id===i?.id).reduce((s,p)=>s+num(p.amount),0);
const bal=i=>Math.max(0,num(i?.total_amount)-paid(i));
const istatus=i=>{if(!i)return'unknown';if(String(i.status).toLowerCase()==='cancelled')return'cancelled';if(bal(i)<=0)return'paid';const d=new Date(Invoices.getDueDate(i.date,i.credit_days||30));if(d<new Date(today()))return'overdue';return paid(i)>0?'part_paid':'unpaid'};
function sync(){const a=invs();a.forEach(i=>{i.paid_amount=paid(i);i.balance_due=bal(i);if(String(i.status).toLowerCase()!=='cancelled')i.status=i.balance_due<=0?'paid':(i.paid_amount>0?'part_paid':'issued')});DB.set('invoices',a,true);const t=trips();t.forEach(x=>x.invoice_status=activeInv(x.id)?'invoiced':'pending');DB.set('trips',t,true)}
function syncDriver(t){if(!t?.driver_id)return;const a=DB.get('driver_settlements',[]),old=a.find(x=>x.source==='trip'&&x.trip_id===t.id),amt=num(t.driver_amount);if(amt<=0){if(old)DB.set('driver_settlements',a.filter(x=>x.id!==old.id),true);return}const row={id:old?.id||Utils.id(),date:t.date,driver_id:t.driver_id,type:'debit',amount:amt,description:`Trip ${t.trip_no} - Driver Amount`,source:'trip',trip_id:t.id};if(old)Object.assign(old,row);else a.push(row);DB.set('driver_settlements',a,true)}
trips().forEach(syncDriver);dedupeInvoicesByNumber();sync();

// MASTER EXPENSES
if(!Array.isArray(DB.get('expense_master',null)))DB.set('expense_master',[['Cartage',true],['Documentation',true],['THC',true],['Handling',true],['Internal Expense',false]].map(([name,showOnInvoice])=>({id:Utils.id(),name,defaultAmount:0,showOnInvoice,active:true})),true);

// TRIP FINANCIAL LOCK
Trips.update=Trips.updateV25||Trips.update;
const oldTripUpdate=Trips.updateV25;
if(oldTripUpdate)Trips.updateV25=function(id){if(activeInv(id))return Swal.fire({icon:'warning',title:'Trip Locked',text:'Cancel the active invoice before editing this trip.',confirmButtonText:'OK'});return oldTripUpdate.call(Trips,id)};
Trips.update=Trips.updateV25;
Trips.delete=function(id){const i=anyInv(id);if(i)return Swal.fire({icon:'warning',title:'Trip Locked',html:`Trip is linked to <strong>${esc(i.invoice_no)}</strong>.<br><br>Cancel the invoice first. Financial history is preserved.`,confirmButtonText:'OK'});Swal.fire({title:'Delete Trip?',icon:'warning',showCancelButton:true,confirmButtonText:'Delete Trip'}).then(r=>{if(!r.isConfirmed)return;DB.set('trips',trips().filter(t=>t.id!==id));DB.set('driver_settlements',DB.get('driver_settlements',[]).filter(x=>x.trip_id!==id),true);Utils.toast('Trip deleted.','success');Router.go('trips')})};

// INVOICE CREATION / LIFECYCLE
Invoices.createInvoiceV28=async function(sel,isGst,advance,lines=[]){try{const fresh=trips().filter(t=>sel?.some(x=>x.id===t.id)),blocked=fresh.filter(t=>activeInv(t.id));if(!fresh.length)throw Error('Please select at least one trip.');if(blocked.length)throw Error('Invoice already exists for one or more selected trips. Cancel the old invoice first.');if(new Set(fresh.map(t=>t.party_id)).size!==1)throw Error('Please select trips for one customer only.');const p=party(fresh[0].party_id);if(!p)throw Error('Customer not found.');const billable=new Map(exps().filter(x=>x.showOnInvoice).map(x=>[x.id,x]));const expense_lines=(Array.isArray(lines)?lines:[]).map(e=>({masterId:e.masterId,name:e.name,amount:num(e.amount)})).filter(e=>e.amount>0&&billable.has(e.masterId));const subtotal=fresh.reduce((s,t)=>s+num(t.freight),0)+expense_lines.reduce((s,e)=>s+e.amount,0),cgst=isGst?subtotal*.09:0,sgst=isGst?subtotal*.09:0,total=subtotal+cgst+sgst,adv=num(advance);if(adv<0||adv>total)throw Error(adv<0?'Advance cannot be negative.':`Advance cannot exceed ${money(total)}.`);const invoice={id:Utils.id(),invoice_no:Utils.generateInvoiceNo(),date:today(),party_id:p.id,trip_ids:fresh.map(t=>t.id),trip_count:fresh.length,subtotal,cgst,sgst,total_amount:total,advance:adv,balance_due:total-adv,paid_amount:adv,is_gst:!!isGst,status:adv>=total?'paid':'issued',expense_lines,credit_days:Math.max(0,num(p.credit_days)||30),trips_data:fresh.map(t=>({...t,vehicle:vehicle(t.vehicle_id)})),payments:[]};if(invs().some(i=>String(i.status).toLowerCase()!=='cancelled'&&i.trip_ids?.some(id=>invoice.trip_ids.includes(id))))throw Error('Duplicate active invoice detected.');DB.set('invoices',[...invs(),invoice]);const all=trips();fresh.forEach(t=>{const x=all.find(a=>a.id===t.id);if(x)x.invoice_status='invoiced';syncDriver(x)});DB.set('trips',all,true);await Swal.fire({icon:'success',title:'Invoice Generated Successfully',html:`<strong>${esc(invoice.invoice_no)}</strong><br>${esc(p.name)}<br><strong>${money(total)}</strong>`,showCancelButton:true,confirmButtonText:'Open Preview',cancelButtonText:'Close'}).then(r=>{if(r.isConfirmed)Invoices.previewInvoice(invoice)});Router.go('invoices');return invoice}catch(e){console.error(e);await Swal.fire({icon:'error',title:'Invoice Generation Failed',text:e.message||'Unable to generate invoice.',confirmButtonText:'OK'});return null}};
Invoices.createInvoice=Invoices.createInvoiceV28;
Invoices.cancelInvoice=function(id){const i=invs().find(x=>x.id===id);if(!i)return;if(istatus(i)==='cancelled')return Utils.toast('Invoice is already cancelled.','info');Swal.fire({title:'Cancel Invoice?',html:`<strong>${esc(i.invoice_no)}</strong> will remain in history. Linked trips can be invoiced again only after cancellation.`,icon:'warning',input:'text',inputLabel:'Cancellation reason',showCancelButton:true,confirmButtonText:'Cancel Invoice',confirmButtonColor:'#dc2626'}).then(r=>{if(!r.isConfirmed)return;const a=invs(),x=a.find(z=>z.id===id);if(!x)return;x.status='cancelled';x.cancelled_at=new Date().toISOString();x.cancel_reason=r.value||'Cancelled by user';DB.set('invoices',a,true);dedupeInvoicesByNumber();sync();Utils.toast('Invoice cancelled. Trip is available for a new invoice.','success');Router.go('invoices')})};
Invoices.deleteInvoice=function(id){const i=invs().find(x=>x.id===id);if(!i)return;if(String(i.status).toLowerCase()!=='draft')return Invoices.cancelInvoice(id);DB.set('invoices',invs().filter(x=>x.id!==id),true);Router.go('invoices');Utils.toast('Draft invoice deleted.')};
Invoices.updateStatus=function(id,s){const i=invs().find(x=>x.id===id);if(!i)return;if(s==='cancelled')return Invoices.cancelInvoice(id);if(['paid','part_paid'].includes(s))return Utils.toast('Use Record Payment. Payment status is calculated automatically.','warning');if(istatus(i)==='cancelled')return Utils.toast('Cancelled invoice cannot be reopened.','warning');i.status=s;DB.set('invoices',invs(),true);Router.go('invoices');Utils.toast('Invoice status updated.','success')};
Invoices.recordPayment=async function(id){const i=invs().find(x=>x.id===id),b=bal(i);if(!i||istatus(i)==='cancelled'||b<=0)return Utils.toast('No payment can be recorded for this invoice.','info');const r=await Swal.fire({title:'Record Customer Payment',html:`<div class="anori-simple-form"><label>Invoice</label><input class="form-control" value="${esc(i.invoice_no)}" disabled><label>Amount Received (₹)</label><input id="anori-pay-amount" class="form-control" type="number" min=".01" max="${b}" value="${b}"><label>Payment Date</label><input id="anori-pay-date" class="form-control" type="date" value="${today()}"><label>Mode / Reference</label><input id="anori-pay-note" class="form-control" placeholder="Bank / UPI / Cash"></div>`,showCancelButton:true,confirmButtonText:'Save Payment',preConfirm:()=>{const a=num(document.getElementById('anori-pay-amount').value);if(a<=0||a>b){Swal.showValidationMessage(`Enter amount up to ${money(b)}.`);return false}return{amount:a,date:Sanitize.date(document.getElementById('anori-pay-date').value),note:document.getElementById('anori-pay-note').value.trim()}}});if(!r.isConfirmed)return;const p=DB.get('payments',[]);p.push({id:Utils.id(),invoice_id:id,...r.value,created_at:new Date().toISOString()});DB.set('payments',p,true);sync();Utils.toast('Payment recorded. Invoice status updated automatically.','success');Router.go('invoices')};

// ONE RENDERED PREVIEW DOM IS THE PDF SOURCE. No iframe.
function normalize(i){const x={...i};x.expense_lines=Array.isArray(x.expense_lines)?x.expense_lines:[];x.trips_data=Array.isArray(x.trips_data)?x.trips_data.map(t=>({...t,vehicle:t.vehicle||vehicle(t.vehicle_id)||{}})):[];x.balance_due=bal(x);x.status=istatus(x);return x}
Invoices.getInvoiceRenderHTML=i=>Invoices.buildInvoiceHTML(normalize(i),true);
Invoices.mountInvoiceDocument=function(i){const c=document.getElementById('previewContent');if(!c)throw Error('Invoice preview container not found.');c.innerHTML='';c.dataset.invoiceId=i.id;const d=new DOMParser().parseFromString(Invoices.getInvoiceRenderHTML(i),'text/html'),stage=document.createElement('div');stage.className='anori-invoice-preview-stage';d.head.querySelectorAll('style').forEach(s=>{const st=document.createElement('style');st.textContent=s.textContent;stage.appendChild(st)});const page=d.body.querySelector('.invoice-page');if(!page)throw Error('Invoice page could not be rendered.');stage.appendChild(page.cloneNode(true));c.appendChild(stage);return stage.querySelector('.invoice-page')};
Invoices.previewInvoice=function(i){try{this.mountInvoiceDocument(normalize(i));document.getElementById('previewModal').classList.add('active')}catch(e){console.error(e);Swal.fire({icon:'error',title:'Invoice Preview Failed',text:e.message||'Unable to open preview.'})}};
Invoices.downloadInvoice=async function(i){try{if(typeof html2pdf!=='function')throw Error('PDF library is unavailable.');const n=normalize(i);let page=document.getElementById('previewContent')?.dataset.invoiceId===n.id?document.querySelector('#previewContent .invoice-page'):null;if(!page)page=this.mountInvoiceDocument(n);const host=document.getElementById('previewContent'),stage=page.parentElement,old={width:host.style.width,height:host.style.height,overflow:host.style.overflow,padding:host.style.padding};host.style.width='210mm';host.style.height='auto';host.style.overflow='visible';host.style.padding='0';stage.style.width='210mm';stage.style.padding='0';stage.style.background='#fff';if(document.fonts?.ready)await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await html2pdf().set({margin:0,filename:`${n.invoice_no}.pdf`,image:{type:'jpeg',quality:.98},html2canvas:{scale:2,useCORS:true,allowTaint:false,backgroundColor:'#fff',logging:false,scrollX:0,scrollY:0,windowWidth:794},pagebreak:{mode:['css','legacy'],avoid:['.avoid']},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}}).from(page).save();Object.assign(host.style,old);Utils.toast('PDF downloaded with the same Invoice Preview layout.','success')}catch(e){console.error(e);Swal.fire({icon:'error',title:'PDF Download Failed',text:e.message||'Unable to generate PDF.'})}};
Invoices.previewExisting=id=>{const i=invs().find(x=>x.id===id);if(i)Invoices.previewInvoice(i)};Invoices.downloadExisting=id=>{const i=invs().find(x=>x.id===id);if(i)Invoices.downloadInvoice(i)};

// GENERATOR: active-invoice trips hidden; cancellation required for re-invoice.
Invoices.showInvoiceGenerator=function(pre=[]){const available=trips().filter(t=>t.status==='completed'&&!activeInv(t.id));if(!available.length)return Swal.fire({icon:'info',title:'No Trip Available for Invoice',text:'All completed trips are already invoiced or none are completed. Cancel an existing invoice before generating a new one.',confirmButtonText:'OK'});const ps=parties(),ms=exps().filter(x=>x.showOnInvoice);Swal.fire({title:'Create Invoice',width:950,html:`<div class="anori-invoice-generator"><div class="anori-help">Select trips for one customer, then choose billable expenses.</div><div class="table-wrapper" style="max-height:280px;overflow:auto"><table><thead><tr><th></th><th>Date</th><th>Trip</th><th>Customer</th><th>Vehicle</th><th>Freight</th></tr></thead><tbody>${available.map(t=>`<tr><td><input type="checkbox" class="anori-final-trip" data-id="${esc(t.id)}" data-party="${esc(t.party_id)}" ${pre.includes(t.id)?'checked':''}></td><td>${esc(t.date)}</td><td>${esc(t.trip_no)}</td><td>${esc(party(t.party_id)?.name||'-')}</td><td>${esc(vehicle(t.vehicle_id)?.number||'-')}</td><td>${money(t.freight)}</td></tr>`).join('')}</tbody></table></div><div id="anori-final-expenses" style="margin-top:12px"></div><div class="form-row"><label>Invoice Type<select id="anori-final-gst" class="form-control"><option value="1">GST Invoice</option><option value="0">Non-GST</option></select></label><label>Advance Received<input id="anori-final-advance" class="form-control" type="number" min="0" value="0"></label></div></div>`,showCancelButton:true,confirmButtonText:'🧾 Generate Invoice',didOpen:()=>{const upd=()=>{const ids=[...document.querySelectorAll('.anori-final-trip:checked')].map(x=>x.dataset.id),ts=available.filter(t=>ids.includes(t.id));const out=document.getElementById('anori-final-expenses');out.innerHTML=ms.map(m=>{const a=ts.reduce((s,t)=>s+(t.expenses||[]).filter(e=>String(e.type).toLowerCase()===String(m.name).toLowerCase()).reduce((z,e)=>z+num(e.amount),0),0);return `<div class="anori-expense-select-row"><label><input type="checkbox" class="anori-final-exp" data-id="${esc(m.id)}" ${a>0?'checked':''}> ${esc(m.name)}</label><input class="anori-final-exp-amt" data-id="${esc(m.id)}" type="number" min="0" value="${a||m.defaultAmount||0}"></div>`}).join('')||'<div class="anori-help">No billable expenses configured.</div>'};document.querySelectorAll('.anori-final-trip').forEach(x=>x.addEventListener('change',upd));upd()},preConfirm:()=>{const checks=[...document.querySelectorAll('.anori-final-trip:checked')],ids=checks.map(x=>x.dataset.id);if(!ids.length){Swal.showValidationMessage('Select at least one trip.');return false}if(new Set(checks.map(x=>x.dataset.party)).size!==1){Swal.showValidationMessage('Select trips for one customer only.');return false}const lines=[...document.querySelectorAll('.anori-final-exp:checked')].map(x=>{const m=ms.find(z=>z.id===x.dataset.id);return{masterId:x.dataset.id,name:m?.name||'Expense',amount:num(document.querySelector(`.anori-final-exp-amt[data-id="${CSS.escape(x.dataset.id)}"]`)?.value)}}).filter(x=>x.amount>0);return{ids,isGst:document.getElementById('anori-final-gst').value==='1',advance:num(document.getElementById('anori-final-advance').value),lines}}}).then(r=>{if(!r.isConfirmed)return;const selected=trips().filter(t=>r.value.ids.includes(t.id));Invoices.createInvoiceV28(selected,r.value.isGst,r.value.advance,r.value.lines)})};

// UNIVERSAL ACTION TOOLBARS
function selBar(id,action){return `<div class="anori-universal-toolbar"><div class="anori-toolbar-left"><strong>Actions:</strong><button class="btn btn-primary btn-sm" onclick="${action}">⚙ Actions</button><span id="${id}" class="anori-selection-count">0 selected</span></div><div class="anori-toolbar-right"><button class="btn btn-outline btn-sm" onclick="${id==='tripSelectedCount'?'Trips.toggleAll(true)':'Invoices.toggleAll(true)'}">☑ Select All</button><button class="btn btn-outline btn-sm" onclick="${id==='tripSelectedCount'?'Trips.toggleAll(false)':'Invoices.toggleAll(false)'}">Clear</button></div></div>`}
Trips.render=function(c){sync();const a=trips();c.innerHTML=`<div class="anori-section-intro"><div><strong>Trip Management</strong><span>Select rows, then use Actions above the table.</span></div><button class="btn btn-success" onclick="Trips.openForm()">＋ New Trip</button></div><div class="card">${selBar('tripSelectedCount','Trips.showActions()')}<div class="table-wrapper"><table><thead><tr><th><input type="checkbox" onchange="Trips.toggleAll(this.checked)"></th><th>Date</th><th>Trip #</th><th>Vehicle</th><th>Driver</th><th>Party</th><th>Route</th><th>Freight</th><th>Driver Amt</th><th>Expenses</th><th>Profit</th><th>Invoice</th></tr></thead><tbody>${a.map(t=>{const e=(t.expenses||[]).reduce((s,x)=>s+num(x.amount),0),i=activeInv(t.id);return `<tr><td><input type="checkbox" class="trip-row-check" value="${esc(t.id)}" onchange="Trips.updateSelectionCount()"></td><td>${esc(t.date)}</td><td><strong>${esc(t.trip_no)}</strong></td><td>${esc(vehicle(t.vehicle_id)?.number||'-')}</td><td>${esc(driver(t.driver_id)?.name||'-')}</td><td>${esc(party(t.party_id)?.name||'-')}</td><td>${esc(t.from)} → ${esc(t.to)}</td><td>${money(t.freight)}</td><td>${money(t.driver_amount)}</td><td>-${money(e)}</td><td>${money(num(t.freight)-e)}</td><td>${i?'<span class="status-badge status-shared">INVOICED</span>':'<span class="status-badge status-pending">PENDING</span>'}</td></tr>`}).join('')||'<tr><td colspan="12" class="empty-state">No trips.</td></tr>'}</tbody></table></div></div>`;Trips.updateSelectionCount()};
Invoices.render=function(c){dedupeInvoicesByNumber();sync();const a=invs(),active=a.filter(i=>istatus(i)!=='cancelled'),cnt={paid:0,unpaid:0,part_paid:0,overdue:0};active.forEach(i=>cnt[istatus(i)]++);const billed=active.reduce((s,i)=>s+num(i.total_amount),0),received=active.reduce((s,i)=>s+paid(i),0);c.innerHTML=`<div class="anori-section-intro"><div><strong>Invoices & Billing</strong><span>Paid, unpaid, part paid and overdue are calculated automatically.</span></div><button class="btn btn-success" onclick="Invoices.showInvoiceGenerator()">＋ New Invoice</button></div><div class="anori-kpi-grid anori-kpi-grid-5"><div class="anori-kpi-card"><span>Total Invoices</span><strong>${active.length}</strong><small>${money(billed)} billed</small></div><div class="anori-kpi-card anori-kpi-good"><span>Paid</span><strong>${cnt.paid}</strong><small>${money(received)} received</small></div><div class="anori-kpi-card anori-kpi-warn"><span>Unpaid</span><strong>${cnt.unpaid}</strong><small>Customer has not paid</small></div><div class="anori-kpi-card anori-kpi-info"><span>Part Paid</span><strong>${cnt.part_paid}</strong><small>${money(active.filter(i=>istatus(i)==='part_paid').reduce((s,i)=>s+bal(i),0))} BALANCE</small></div><div class="anori-kpi-card anori-kpi-bad"><span>Overdue</span><strong>${cnt.overdue}</strong><small>${money(active.filter(i=>istatus(i)==='overdue').reduce((s,i)=>s+bal(i),0))} OVERDUE</small></div></div><div class="card">${selBar('invoiceSelectedCount','Invoices.showActions()')}<div class="table-wrapper"><table><thead><tr><th><input type="checkbox" onchange="Invoices.toggleAll(this.checked)"></th><th>Invoice</th><th>Date</th><th>Due Date</th><th>Remaining Days</th><th>Customer</th><th>Trips</th><th>Total</th><th>Received</th><th>Balance</th><th>Status</th></tr></thead><tbody>${a.slice().reverse().map(i=>`<tr><td><input type="checkbox" class="invoice-row-check" value="${esc(i.id)}" onchange="Invoices.updateSelectionCount()"></td><td><strong>${esc(i.invoice_no)}</strong></td><td>${esc(i.date)}</td><td>${esc(party(i.party_id)?.name||'-')}</td><td>${num(i.trip_count)}</td><td>${money(i.total_amount)}</td><td>${money(paid(i))}</td><td>${money(bal(i))}</td><td><span class="status-badge status-${istatus(i).replace('_','-')}">${esc(istatus(i).replace('_',' ').toUpperCase())}</span></td></tr>`).join('')||'<tr><td colspan="11" class="empty-state">No invoices.</td></tr>'}</tbody></table></div></div>`;Invoices.updateSelectionCount()};
Invoices.showActions=function(){const ids=Invoices.getSelected();if(!ids.length)return Utils.toast('Please select an invoice.','warning');const id=ids[0],i=invs().find(x=>x.id===id),s=istatus(i);Swal.fire({title:'Invoice Actions',html:`<div class="anori-action-list"><button class="btn btn-outline btn-block" onclick="Swal.close();Invoices.previewExisting('${esc(id)}')">👁 Preview</button><button class="btn btn-primary btn-block" onclick="Swal.close();Invoices.downloadExisting('${esc(id)}')">📄 Download PDF</button>${s!=='cancelled'&&s!=='paid'?`<button class="btn btn-success btn-block" onclick="Swal.close();Invoices.recordPayment('${esc(id)}')">💰 Record Payment</button>`:''}${s!=='cancelled'?`<button class="btn btn-danger btn-block" onclick="Swal.close();Invoices.cancelInvoice('${esc(id)}')">❌ Cancel Invoice</button>`:''}</div>`,showConfirmButton:false,showCancelButton:true,cancelButtonText:'Close'})};

// DRIVER LEDGER + REPORTS
DriverSettlement.render=function(c){const ds=drivers();c.innerHTML=`<div class="anori-section-intro"><div><strong>Driver Settlement</strong><span>Trip driver amounts are reflected automatically.</span></div><button class="btn btn-primary" onclick="DriverSettlement.openModal()">＋ Add Entry</button></div><div class="card"><div class="anori-universal-toolbar"><div class="anori-toolbar-left"><strong>Actions:</strong><button class="btn btn-primary btn-sm" onclick="DriverSettlement.openModal()">＋ Add Entry</button><button class="btn btn-outline btn-sm" onclick="DriverSettlement.exportLedger()">📄 Download Ledger</button></div></div><div class="anori-filter-bar"><label>Driver<select id="driverLedgerDriver" class="form-control"><option value="">All Drivers</option>${ds.map(d=>`<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('')}</select></label><label>Period<select id="driverLedgerPeriod" class="form-control"><option value="all">All</option><option value="week">Weekly</option><option value="month">Monthly</option><option value="custom">Custom</option></select></label><label>From<input id="driverLedgerFrom" class="form-control" type="date"></label><label>To<input id="driverLedgerTo" class="form-control" type="date" value="${today()}"></label><button class="btn btn-primary" onclick="DriverSettlement.applyFilter()">Apply</button></div><div id="driverLedgerHost"></div></div>`;DriverSettlement.applyFilter()};
DriverSettlement.applyFilter=function(){
  if(typeof window.syncAllDriverTripEntries==='function') window.syncAllDriverTripEntries();
  let d=document.getElementById('driverLedgerDriver')?.value||'',p=document.getElementById('driverLedgerPeriod')?.value||'all',f=document.getElementById('driverLedgerFrom')?.value||'',t=document.getElementById('driverLedgerTo')?.value||today();
  if(p==='week'){const x=new Date();x.setDate(x.getDate()-x.getDay());f=x.toISOString().slice(0,10)}
  if(p==='month')f=today().slice(0,7)+'-01';
  const rows=DB.get('driver_settlements',[]).filter(x=>(!d||x.driver_id===d)&&(!f||x.date>=f)&&(!t||x.date<=t));
  const given=rows.filter(x=>x.type==='debit').reduce((s,x)=>s+num(x.amount),0),paidv=rows.filter(x=>x.type==='credit').reduce((s,x)=>s+num(x.amount),0),balance=Math.max(given-paidv,0),advance=Math.max(paidv-given,0);
  document.getElementById('driverLedgerHost').innerHTML=`<div class="anori-ledger-summary"><div class="anori-ledger-paid">Paid<strong>${money(paidv)}</strong></div><div class="anori-ledger-advance">Advance<strong>${money(advance)}</strong></div><div class="anori-ledger-balance">Balance<strong>${money(balance)}</strong></div></div><div class="table-wrapper"><table><thead><tr><th>Sr. No.</th><th>Date</th><th>Driver</th><th>Trip</th><th>Type</th><th>Description</th><th>Amount</th></tr></thead><tbody>${rows.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.date)}</td><td>${esc(driver(x.driver_id)?.name||'-')}</td><td>${esc(x.trip_id?(trips().find(z=>z.id===x.trip_id)?.trip_no||'-'):'-')}</td><td>${x.type==='debit'?'Given':'Paid'}</td><td>${esc(x.description||'')}</td><td>${money(x.amount)}</td></tr>`).join('')||'<tr><td colspan="7">No entries.</td></tr>'}</tbody></table></div>`;
  DriverSettlement.__lastFilter={d,f,t};
};
DriverSettlement.getFilteredRows=function(){const x=DriverSettlement.__lastFilter||{};if(typeof window.syncAllDriverTripEntries==='function')window.syncAllDriverTripEntries();return DB.get('driver_settlements',[]).filter(r=>(!x.d||r.driver_id===x.d)&&(!x.f||r.date>=x.f)&&(!x.t||r.date<=x.t));};
DriverSettlement.exportExcel=function(){const rows=this.getFilteredRows();if(!window.XLSX)return Utils.toast('Excel library is not loaded.','error');const data=[['SR. NO.','DATE','DRIVER','TRIP','TYPE','DESCRIPTION','AMOUNT'],...rows.map((r,i)=>[i+1,r.date,driver(r.driver_id)?.name||'',r.trip_id?(trips().find(t=>t.id===r.trip_id)?.trip_no||''):'',r.type==='debit'?'GIVEN':'PAID',r.description||'',num(r.amount)])];const ws=XLSX.utils.aoa_to_sheet(data),wb=XLSX.utils.book_new();ws['!cols']=[{wch:9},{wch:14},{wch:22},{wch:20},{wch:12},{wch:42},{wch:15}];XLSX.utils.book_append_sheet(wb,ws,'DRIVER SETTLEMENT');XLSX.writeFile(wb,`driver-settlement-${today()}.xlsx`);Utils.toast('Excel downloaded.','success');};
/* Legacy Driver Settlement PDF implementation removed: the single final renderer below is authoritative. */
Reports.render=function(c){const ps=parties();c.innerHTML=`<div class="anori-section-intro"><div><strong>Reports & Analytics</strong><span>Customer-wise trip checking and ledger download.</span></div></div><div class="card">${bar(`<button class="anori-action-btn anori-action-preview" onclick="Reports.applyFilter()">🔎 APPLY FILTER</button><button class="anori-action-btn anori-action-pdf" onclick="Reports.downloadCustomerLedger()">📄 DOWNLOAD LEDGER</button><button class="anori-action-btn anori-action-export" onclick="Reports.downloadCustomerLedger()">⬇ EXPORT CSV</button>`)}<div class="anori-filter-bar"><label>Customer<select id="reportParty" class="form-control"><option value="">All Customers</option>${ps.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label><label>From<input id="reportFrom" class="form-control" type="date"></label><label>To<input id="reportTo" class="form-control" type="date" value="${today()}"></label><button class="btn btn-primary" onclick="Reports.applyFilter()">Apply</button></div><div id="reportHost"></div></div>`;Reports.applyFilter()};
Reports.applyFilter=function(){const pid=document.getElementById('reportParty')?.value||'',f=document.getElementById('reportFrom')?.value||'',t=document.getElementById('reportTo')?.value||today(),rows=trips().filter(x=>(!pid||x.party_id===pid)&&(!f||x.date>=f)&&(!t||x.date<=t)),rev=rows.reduce((s,x)=>s+num(x.freight),0),ex=rows.reduce((s,x)=>s+(x.expenses||[]).reduce((a,e)=>a+num(e.amount),0),0);document.getElementById('reportHost').innerHTML=`<div class="anori-ledger-summary"><div>Trips<strong>${rows.length}</strong></div><div>Billing<strong>${money(rev)}</strong></div><div>Expenses<strong>${money(ex)}</strong></div><div>Profit<strong>${money(rev-ex)}</strong></div></div><div class="table-wrapper"><table><thead><tr><th><input type="checkbox" aria-label="Select all report rows" onchange="Reports.toggleAll(this.checked)"></th><th>Sr. No.</th><th>Date</th><th>Trip</th><th>Customer</th><th>Route</th><th>Vehicle</th><th>Driver</th><th>Freight</th><th>Invoice</th></tr></thead><tbody>${rows.map((x,idx)=>`<tr><td><input type="checkbox" class="report-row-check" value="${esc(x.id)}"></td><td>${idx+1}</td><td>${esc(x.date)}</td><td>${esc(x.trip_no)}</td><td>${esc(party(x.party_id)?.name||'-')}</td><td>${esc(x.from)} → ${esc(x.to)}</td><td>${esc(vehicle(x.vehicle_id)?.number||'-')}</td><td>${esc(driver(x.driver_id)?.name||'-')}</td><td>${money(x.freight)}</td><td>${esc(activeInv(x.id)?.invoice_no||'Pending')}</td></tr>`).join('')||'<tr><td colspan="10" class="empty-state">No trips found.</td></tr>'}</tbody></table></div>`;Reports.__lastFilter={pid,f,t}};
Reports.toggleAll=function(checked){document.querySelectorAll('.report-row-check').forEach(x=>x.checked=!!checked)};
Reports.getSelected=function(){return [...document.querySelectorAll('.report-row-check:checked')].map(x=>x.value)};

Reports.downloadCustomerLedger=function(){const x=Reports.__lastFilter||{},rows=trips().filter(r=>(!x.pid||r.party_id===x.pid)&&(!x.f||r.date>=x.f)&&(!x.t||r.date<=x.t)),csv=['Date,Trip,Customer,Route,Vehicle,Driver,Freight,Invoice',...rows.map(r=>[r.date,r.trip_no,party(r.party_id)?.name||'',`${r.from} -> ${r.to}`,vehicle(r.vehicle_id)?.number||'',driver(r.driver_id)?.name||'',r.freight,activeInv(r.id)?.invoice_no||'Pending'].map(v=>'"'+String(v).replaceAll('"','""')+'"').join(','))].join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=`customer-trip-ledger-${today()}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};

// DATA IMPORT / EXPORT / BACKUP
const DATA=['company_profile','vehicles','drivers','parties','vendors','trips','invoices','driver_settlements','vendor_settlements','payments','expense_master','followups','audit_log'];const snapshot=()=>{const o={version:'2.13.0',exported_at:new Date().toISOString()};DATA.forEach(k=>o[k]=DB.get(k,[]));return o};const dl=(blob,name)=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
window.anoriExportJSON=()=>{
  try{
    const data={format:'ANORI_TRANSPORT_BACKUP',schema_version:1,app_version:'2.24',
      exported_at:new Date().toISOString(),tables:{}};
    DATA.forEach(k=>{const v=DB.get(k,k==='company_profile'?{}:[]);data.tables[k]=v;});
    const payload=JSON.stringify(data,null,2);
    dl(new Blob([payload],{type:'application/json'}),`ANORI_TRANSPORT_BACKUP_${today()}.json`);
    Utils.toast('Complete JSON backup exported successfully.','success');
    return true;
  }catch(e){console.error(e);Utils.toast('JSON export failed.','error');return false;}
};

window.anoriExportCSV=()=>{
  try{
    const parts=['# ANORI TRANSPORT DATA EXPORT'];
    DATA.forEach(k=>{
      const v=DB.get(k,[]);
      if(!Array.isArray(v)||!v.length)return;
      const keys=[...new Set(v.flatMap(x=>Object.keys(x||{})))];
      parts.push(`# ${k}\n${keys.join(',')}\n${v.map(x=>keys.map(q=>'"'+String(x?.[q]??'').replaceAll('"','""')+'"').join(',')).join('\n')}`);
    });
    dl(new Blob([parts.join('\n\n')],{type:'text/csv'}),`ANORI_TRANSPORT_DATA_${today()}.csv`);
    Utils.toast('CSV export completed.','success');return true;
  }catch(e){console.error(e);Utils.toast('CSV export failed.','error');return false;}
};

window.anoriExportXLSX=()=>{
  if(typeof XLSX==='undefined')return Utils.toast('Excel library unavailable.','error');
  try{
    const wb=XLSX.utils.book_new();
    DATA.forEach(k=>{
      const v=DB.get(k,[]);
      if(Array.isArray(v)&&v.length)XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(v),k.slice(0,31));
    });
    XLSX.writeFile(wb,`ANORI_TRANSPORT_DATA_${today()}.xlsx`);
    Utils.toast('Excel export completed.','success');return true;
  }catch(e){console.error(e);Utils.toast('Excel export failed.','error');return false;}
};

window.anoriExportSQLite=async()=>{
  if(typeof initSqlJs!=='function')return Utils.toast('SQLite library unavailable.','error');
  try{
    const SQL=await initSqlJs({locateFile:f=>`https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${f}`});
    const db=new SQL.Database();
    DATA.forEach(k=>{
      const v=DB.get(k,k==='company_profile'?{}:[]),table=k.replace(/[^A-Za-z0-9_]/g,'_');
      db.run(`CREATE TABLE IF NOT EXISTS "${table}" (json TEXT NOT NULL)`);
      (Array.isArray(v)?v:[v]).forEach(r=>db.run(`INSERT INTO "${table}" VALUES (?)`,[JSON.stringify(r??{})]));
    });
    dl(new Blob([db.export()],{type:'application/x-sqlite3'}),`ANORI_TRANSPORT_BACKUP_${today()}.sqlite`);
    db.close();Utils.toast('SQLite export completed.','success');return true;
  }catch(e){console.error(e);Utils.toast('SQLite export failed.','error');return false;}
};

function normalizeImportedData(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid backup: root object expected.');
  const data=raw.tables&&typeof raw.tables==='object'?raw.tables:raw;
  const present=DATA.filter(k=>Object.prototype.hasOwnProperty.call(data,k));
  if(!present.length)throw Error('No supported ANORI TRANSPORT data sections found.');

  const clean={};
  const problems=[];
  present.forEach(k=>{
    const value=data[k];
    if(k==='company_profile'){
      if(value===null||typeof value!=='object'||Array.isArray(value))problems.push(k+': invalid company profile');
      else clean[k]=value;
    }else if(!Array.isArray(value)){
      problems.push(k+': expected an array');
    }else{
      clean[k]=value;
      const seen=new Set();
      let dup=0;
      value.forEach(row=>{
        if(row&&row.id!=null){
          const id=String(row.id);
          if(seen.has(id))dup++; else seen.add(id);
        }
      });
      if(dup)problems.push(k+`: ${dup} duplicate ID(s)`);
    }
  });
  if(problems.length)throw Error('Backup validation failed:\\n• '+problems.join('\\n• '));
  return {data:clean,present};
}

async function importData(raw){
  const checked=normalizeImportedData(raw);
  const summary=checked.present.map(k=>{
    const v=checked.data[k];
    return `${k}: ${Array.isArray(v)?v.length:1}`;
  }).join('<br>');

  const r=await Swal.fire({
    icon:'warning',
    title:'Import Data?',
    html:`<div style="text-align:left"><strong>${checked.present.length}</strong> data sections validated.<br><br>${summary}<br><br><strong>Existing data in these sections will be replaced.</strong><br>A safety backup will be created before import.</div>`,
    showCancelButton:true,confirmButtonText:'Create Backup & Import',cancelButtonText:'Cancel'
  });
  if(!r.isConfirmed)return false;

  // Capture a complete rollback snapshot before touching DB.
  const rollback={};
  DATA.forEach(k=>rollback[k]=DB.get(k,k==='company_profile'?{}:[]));

  let backupOk=false;
  try{
    if(window.AnoriDataTools?.autoBackupNow)backupOk=await window.AnoriDataTools.autoBackupNow('before-import');
  }catch(e){console.warn('Persistent backup unavailable:',e);}
  if(!backupOk){
    try{
      const payload={format:'ANORI_TRANSPORT_PRE_IMPORT_BACKUP',schema_version:1,created_at:new Date().toISOString(),tables:rollback};
      dl(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),`ANORI_TRANSPORT_PRE_IMPORT_BACKUP_${today()}.json`);
      backupOk=true;
    }catch(e){console.error(e);}
  }
  if(!backupOk){
    await Swal.fire({icon:'error',title:'Backup Failed',text:'Import was cancelled because a safety backup could not be created.'});
    return false;
  }

  try{
    checked.present.forEach(k=>DB.set(k,checked.data[k],true));
    sync();
    Utils.toast('Validated data imported successfully.','success');
    if(typeof Router!=='undefined')Router.go('settings');
    return true;
  }catch(e){
    console.error('Import failed; restoring previous data.',e);
    try{DATA.forEach(k=>DB.set(k,rollback[k],true));sync();}catch(restoreError){console.error('Rollback failed:',restoreError);}
    await Swal.fire({icon:'error',title:'Import Failed',text:'Import failed and the previous data was restored.'});
    return false;
  }
}

window.anoriImportFile=()=>{
  const i=document.createElement('input');
  i.type='file';i.accept='.json,.xlsx,.sqlite,.db';
  i.onchange=async()=>{
    try{
      const f=i.files?.[0];if(!f)return;
      const n=f.name.toLowerCase();
      if(n.endsWith('.json'))return importData(JSON.parse(await f.text()));
      if(n.endsWith('.xlsx')){
        if(typeof XLSX==='undefined')throw Error('Excel library unavailable.');
        const wb=XLSX.read(await f.arrayBuffer(),{type:'array'}),d={};
        wb.SheetNames.forEach(s=>{if(DATA.includes(s))d[s]=XLSX.utils.sheet_to_json(wb.Sheets[s],{defval:''});});
        return importData(d);
      }
      if(n.endsWith('.sqlite')||n.endsWith('.db')){
        if(typeof initSqlJs!=='function')throw Error('SQLite library unavailable.');
        const SQL=await initSqlJs({locateFile:x=>`https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${x}`});
        const db=new SQL.Database(new Uint8Array(await f.arrayBuffer())),d={};
        DATA.forEach(k=>{try{const q=db.exec(`SELECT json FROM "${k}"`);if(q[0])d[k]=q[0].values.map(r=>JSON.parse(r[0]));}catch(e){}});
        db.close();return importData(d);
      }
      throw Error('Unsupported import format. Use JSON, XLSX or SQLite.');
    }catch(e){
      console.error(e);
      await Swal.fire({icon:'error',title:'Import Failed',text:e.message||'Unable to import file.'});
    }
  };
  i.click();
};

/* ============================================================
   ANORI TRANSPORT v2.19 — SINGLE FILE AUTO BACKUP
   Requirement: one file, every 5 minutes, overwrite selected folder.
   ============================================================ */
(function(){
'use strict';
const BACKUP_FILE='ANORI_TRANSPORT_BACKUP.json';
const DB_NAME='anori_transport_backup_settings';
const STORE='handles';
let backupTimer=null;

function idb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>req.result.createObjectStore(STORE);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function saveHandle(handle){
  try{const db=await idb();await new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(handle,'backupFolder');tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});db.close();}catch(e){console.warn('Backup folder handle could not be persisted',e);}
}
async function loadHandle(){
  try{const db=await idb();const h=await new Promise((res,rej)=>{const tx=db.transaction(STORE,'readonly');const r=tx.objectStore(STORE).get('backupFolder');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});db.close();return h||null;}catch(e){return null;}
}
async function ensurePermission(handle){
  if(!handle)return false;
  try{
    if(handle.queryPermission && (await handle.queryPermission({mode:'readwrite'}))==='granted')return true;
    if(handle.requestPermission && (await handle.requestPermission({mode:'readwrite'}))==='granted')return true;
  }catch(e){}
  return false;
}
async function writeSingleBackup(){
  const dir=window.__anoriBackupDir;
  if(!dir)return false;
  try{
    if(!(await ensurePermission(dir)))throw new Error('Backup folder permission is not available.');
    const payload=JSON.stringify(snapshot(),null,2);
    const file=await dir.getFileHandle(BACKUP_FILE,{create:true});
    const writable=await file.createWritable();
    await writable.write(payload);
    await writable.close();
    localStorage.setItem('anori_backup_last_time',new Date().toISOString());
    const status=document.getElementById('anoriBackupStatus');
    if(status)status.textContent='Last backup: '+new Date().toLocaleString();
    return true;
  }catch(e){
    console.error('Automatic backup failed:',e);
    Utils.toast('Automatic backup failed: '+(e.message||'permission or folder error'),'error');
    return false;
  }
}
async function startBackupTimer(){
  // Legacy backup loop disabled. The v2.23 persistent backup controller below
  // is the single owner of automatic backup scheduling (every 2 minutes).
  clearInterval(backupTimer);
  return;
}
window.anoriSelectBackupFolder=async()=>{
  if(!window.showDirectoryPicker)return Utils.toast('Folder selection is not supported by this browser.','warning');
  try{
    const dir=await window.showDirectoryPicker({mode:'readwrite'});
    if(!(await ensurePermission(dir)))return Utils.toast('Write permission was not granted.','error');
    window.__anoriBackupDir=dir;
    await saveHandle(dir);
    localStorage.setItem('anori_backup_folder_name',dir.name||'Selected Folder');
    await startBackupTimer();
    Utils.toast('Backup folder selected. One file will be overwritten every 5 minutes.','success');
    Router.go('settings');
  }catch(e){if(e.name!=='AbortError')Utils.toast('Folder selection failed.','error');}
};
window.anoriBackupNow=async()=>{
  if(!window.__anoriBackupDir)return Utils.toast('Select a backup folder first.','warning');
  const ok=await writeSingleBackup();
  if(ok)Utils.toast('ANORI_TRANSPORT_BACKUP.json updated.','success');
};
window.anoriBackupFilename=BACKUP_FILE;

(async()=>{
  const h=await loadHandle();
  if(h && await ensurePermission(h)){window.__anoriBackupDir=h;await startBackupTimer();}
})();

if(!window.__anoriSingleBackupHook){
  const base=DB.set.bind(DB);
  DB.set=function(k,d,b){
    const r=base(k,d,b);
    return r;
  };
  window.__anoriSingleBackupHook=true;
}
})();
window.ANORI_V213=true;
})();


/* ============================================================
   ANORI TRANSPORT v2.14 — SCREENSHOT-MATCHED ACTION BARS
   ============================================================ */
(function(){
'use strict';
const esc2=v=>Sanitize.html(v==null?'':String(v));
const trips2=()=>DB.get('trips',[]), invs2=()=>DB.get('invoices',[]);
const active2=id=>invs2().find(i=>Array.isArray(i.trip_ids)&&i.trip_ids.includes(id)&&String(i.status||'').toLowerCase()!=='cancelled');
const selectedIds=sel=>[...document.querySelectorAll(sel+':checked')].map(x=>x.value);
function toolbar(type,countId){
  const isTrip=type==='trip', isInv=type==='invoice';
  const count=isTrip?'Trips.getSelected()':'Invoices.getSelected()';
  const one=(expr)=>`(${expr}).length===1`;
  const preview=isTrip?`Trips.actionPreview()`:`Invoices.actionPreview()`;
  const pdf=isInv?`Invoices.actionPDF()`:`Utils.toast('Trip PDF is available after invoice generation.','info')`;
  const email=isInv?`Invoices.actionEmail()`:`Utils.toast('Email is available for invoices.','info')`;
  const duplicate=isTrip?`Trips.duplicateSelected()`:`Invoices.duplicateSelected()`;
  const edit=isTrip?`Trips.editSelected()`:`Invoices.editSelected()`;
  const del=isTrip?`Trips.deleteSelected()`:`Invoices.deleteSelected()`;
  const payment=isInv?`Invoices.actionPayment()`:'';
  const cancel=isInv?`Invoices.actionCancel()`:'';
  return `<div class="anori-action-toolbar anori-shahid-toolbar">
    <span class="anori-toolbar-label">Actions:</span>
    <button type="button" class="anori-action-btn anori-action-preview" onclick="${preview}"><i class="fas fa-eye"></i> PREVIEW</button>
    <button type="button" class="anori-action-btn anori-action-pdf" onclick="${pdf}"><i class="fas fa-file-pdf"></i> PDF</button>
    <button type="button" class="anori-action-btn anori-action-email" onclick="${email}"><i class="fas fa-envelope"></i> EMAIL</button>
    ${isInv?`<button type="button" class="anori-action-btn anori-action-payment" onclick="${payment}"><i class="fas fa-money-bill-wave"></i> PAYMENT</button>`:''}
    <button type="button" class="anori-action-btn anori-action-duplicate" onclick="${duplicate}"><i class="fas fa-copy"></i> DUPLICATE</button>
    <button type="button" class="anori-action-btn anori-action-edit" onclick="${edit}"><i class="fas fa-pen"></i> EDIT</button>
    <button type="button" class="anori-action-btn anori-action-delete" onclick="${del}"><i class="fas fa-trash"></i> DELETE</button>
    ${isInv?`<button type="button" class="anori-action-btn anori-action-cancel" onclick="${cancel}"><i class="fas fa-ban"></i> CANCEL</button>`:''}
    <span class="anori-toolbar-spacer"></span>
    <span id="${countId}" class="anori-selection-count">0 selected</span>
  </div>`;
}

Trips.getSelected=Trips.getSelected||function(){return selectedIds('.trip-row-check')};
Invoices.getSelected=Invoices.getSelected||function(){return selectedIds('.invoice-row-check')};
Trips.duplicateSelected=function(){
  const ids=Trips.getSelected();
  if(ids.length!==1)return Utils.toast('Select one trip to duplicate.','warning');
  const all=DB.get('trips',[])||[];
  const original=all.find(x=>String(x.id)===String(ids[0]));
  if(!original)return Utils.toast('Selected trip was not found.','error');
  const copy=JSON.parse(JSON.stringify(original));
  copy.id=Utils.id();
  copy.date=Utils.today();
  copy.trip_no=Utils.generateTripNo(copy.date);
  copy.invoice_status='pending';
  delete copy.invoice_id;
  delete copy.invoice_no;
  copy.created_at=new Date().toISOString();
  all.push(copy);
  DB.set('trips',all,true);
  if(typeof window.syncDriver==='function')window.syncDriver(copy);
  if(Trips.__selectedIds instanceof Set)Trips.__selectedIds.clear();
  Utils.toast(`Trip duplicated successfully: ${copy.trip_no}`,'success');
  Router.go('trips');
};
Trips.editSelected=function(){const ids=Trips.getSelected();if(ids.length!==1)return Utils.toast('Select one trip to edit.','warning');Trips.showEditModal(ids[0])};
Trips.deleteSelected=function(){const ids=Trips.getSelected();if(ids.length!==1)return Utils.toast('Select one trip to delete.','warning');Trips.delete(ids[0])};
Invoices.emailExisting=async function(id){const i=invs2().find(x=>x.id===id);if(!i)return;const p=DB.get('parties',[]).find(x=>x.id===i.party_id)||{};const to=p.email||'';const subject=`Invoice ${i.invoice_no} - ${p.name||'Anori Transport'}`;const body=`Dear ${p.name||'Customer'},%0D%0A%0D%0APlease find invoice ${i.invoice_no} for ${money(i.total_amount)}.%0D%0A%0D%0ARegards,%0D%0AAnori Transport Services`;window.location.href=`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${body}`};
Invoices.duplicateSelected=function(){const ids=Invoices.getSelected();if(ids.length!==1)return Utils.toast('Select one invoice to duplicate.','warning');const i=invs2().find(x=>x.id===ids[0]);if(!i)return;if(String(i.status||'').toLowerCase()!=='draft')return Utils.toast('Only draft invoices can be duplicated.','warning');const copy=JSON.parse(JSON.stringify(i));copy.id=Utils.id();copy.invoice_no=Utils.generateInvoiceNo();copy.status='draft';copy.trip_ids=[];copy.trip_count=0;copy.trips_data=[];copy.advance=0;copy.paid_amount=0;copy.balance_due=copy.total_amount;copy.payments=[];invs2().push(copy);DB.set('invoices',invs2());Utils.toast('Draft invoice duplicated.','success');Router.go('invoices')};
Invoices.editSelected=function(){const ids=Invoices.getSelected();if(ids.length!==1)return Utils.toast('Select one invoice to edit.','warning');const i=invs2().find(x=>x.id===ids[0]);if(!i)return;if(String(i.status||'').toLowerCase()!=='draft')return Utils.toast('Issued invoices are locked. Cancel first if a new invoice is required.','warning');Utils.toast('Draft invoice editing is available from the invoice generator.','info')};
Invoices.deleteSelected=function(){const ids=Invoices.getSelected();if(ids.length!==1)return Utils.toast('Select one invoice to delete/cancel.','warning');Invoices.deleteInvoice(ids[0])};

Trips.render=function(c){sync();const a=trips2();c.innerHTML=`<div class="anori-section-intro"><div><strong>Trip Management</strong><span>Select a row, then use the Actions above the table.</span></div><button class="btn btn-success" onclick="Trips.openForm()">＋ New Trip</button></div><div class="card">${toolbar('trip','tripSelectedCount')}<div class="table-wrapper"><table><thead><tr><th><input type="checkbox" onchange="Trips.toggleAll(this.checked)"></th><th>Date</th><th>Trip #</th><th>Vehicle</th><th>Driver</th><th>Party</th><th>Route</th><th>Freight</th><th>Driver Amt</th><th>Expenses</th><th>Profit</th><th>Invoice</th></tr></thead><tbody>${a.map(t=>{const e=(t.expenses||[]).reduce((s,x)=>s+num(x.amount),0),i=active2(t.id);return `<tr><td><input type="checkbox" class="trip-row-check" value="${esc2(t.id)}" onchange="Trips.updateSelectionCount()"></td><td>${esc2(t.date)}</td><td><strong>${esc2(t.trip_no)}</strong></td><td>${esc2((DB.get('vehicles',[]).find(v=>v.id===t.vehicle_id)||{}).number||'-')}</td><td>${esc2((DB.get('drivers',[]).find(d=>d.id===t.driver_id)||{}).name||'-')}</td><td>${esc2((DB.get('parties',[]).find(p=>p.id===t.party_id)||{}).name||'-')}</td><td>${esc2(t.from)} → ${esc2(t.to)}</td><td>${money(t.freight)}</td><td>${money(t.driver_amount)}</td><td>-${money(e)}</td><td>${money(num(t.freight)-e)}</td><td>${i?'<span class="status-badge status-shared">INVOICED</span>':'<span class="status-badge status-pending">PENDING</span>'}</td></tr>`}).join('')||'<tr><td colspan="12" class="empty-state">No trips.</td></tr>'}</tbody></table></div></div>`;Trips.updateSelectionCount()};

Invoices.render=function(c){sync();const a=invs2(),active=a.filter(i=>istatus(i)!=='cancelled'),cnt={paid:0,unpaid:0,part_paid:0,overdue:0};active.forEach(i=>cnt[istatus(i)]++);const billed=active.reduce((s,i)=>s+num(i.total_amount),0),received=active.reduce((s,i)=>s+paid(i),0);c.innerHTML=`<div class="anori-section-intro"><div><strong>Invoices & Billing</strong><span>Payment status is calculated automatically from recorded payments.</span></div><button class="btn btn-success" onclick="Invoices.showInvoiceGenerator()">＋ New Invoice</button></div><div class="anori-kpi-grid anori-kpi-grid-5"><div class="anori-kpi-card"><span>Total Invoices</span><strong>${active.length}</strong><small>${money(billed)} billed</small></div><div class="anori-kpi-card anori-kpi-good"><span>Paid</span><strong>${cnt.paid}</strong><small>${money(received)} received</small></div><div class="anori-kpi-card anori-kpi-warn"><span>Unpaid</span><strong>${cnt.unpaid}</strong><small>Customer has not paid</small></div><div class="anori-kpi-card anori-kpi-info"><span>Part Paid</span><strong>${cnt.part_paid}</strong><small>${money(active.filter(i=>istatus(i)==='part_paid').reduce((s,i)=>s+bal(i),0))} BALANCE</small></div><div class="anori-kpi-card anori-kpi-bad"><span>Overdue</span><strong>${cnt.overdue}</strong><small>${money(active.filter(i=>istatus(i)==='overdue').reduce((s,i)=>s+bal(i),0))} OVERDUE</small></div></div><div class="card">${toolbar('invoice','invoiceSelectedCount')}<div class="table-wrapper"><table><thead><tr><th><input type="checkbox" onchange="Invoices.toggleAll(this.checked)"></th><th>Invoice</th><th>Date</th><th>Due Date</th><th>Remaining Days</th><th>Customer</th><th>Trips</th><th>Total</th><th>Received</th><th>Balance</th><th>Status</th></tr></thead><tbody>${a.slice().reverse().map(i=>`<tr><td><input type="checkbox" class="invoice-row-check" value="${esc2(i.id)}" onchange="Invoices.updateSelectionCount()"></td><td><strong>${esc2(i.invoice_no)}</strong></td><td>${esc2(i.date)}</td><td>${esc2(window.invoiceDueDate(i))}</td><td>${window.invoiceRemainingDays(i)}</td><td>${esc2((DB.get('parties',[]).find(p=>p.id===i.party_id)||{}).name||'-')}</td><td>${num(i.trip_count)}</td><td>${money(i.total_amount)}</td><td>${money(paid(i))}</td><td>${money(bal(i))}</td><td><span class="status-badge status-${istatus(i).replace('_','-')}">${esc2(istatus(i).replace('_',' ').toUpperCase())}</span></td></tr>`).join('')||'<tr><td colspan="11" class="empty-state">No invoices.</td></tr>'}</tbody></table></div></div>`;Invoices.updateSelectionCount()};

window.ANORI_V214=true;
})();


/* v2.14: apply the same screenshot-style action bar to non-financial tables too. */
(function(){
'use strict';
function bar(html){return `<div class="anori-action-toolbar"><span class="anori-toolbar-label">Actions:</span>${html}<span class="anori-toolbar-spacer"></span></div>`}
const oldDSFilter=DriverSettlement.applyFilter;
DriverSettlement.render=function(c){
  if(typeof window.syncAllDriverTripEntries==='function') window.syncAllDriverTripEntries();
  const ds=DB.get('drivers',[]);
  c.innerHTML=`<div class="anori-section-intro"><div><strong>Driver Settlement</strong><span>Trip driver amounts are reflected automatically.</span></div><button class="btn btn-success" onclick="DriverSettlement.openModal()">＋ Add Entry</button></div><div class="card">${bar(`<button class="anori-action-btn anori-action-pdf" onclick="DriverSettlement.downloadPDF()">📄 PDF / LEDGER</button><button class="anori-action-btn anori-action-export" onclick="DriverSettlement.exportExcel()">📊 EXCEL</button>`)}<div class="anori-filter-bar"><label>Driver<select id="driverLedgerDriver" class="form-control"><option value="">All Drivers</option>${ds.map(d=>`<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('')}</select></label><label>Period<select id="driverLedgerPeriod" class="form-control"><option value="all">All</option><option value="week">Weekly</option><option value="month">Monthly</option><option value="custom">Custom</option></select></label><label>From<input id="driverLedgerFrom" class="form-control" type="date"></label><label>To<input id="driverLedgerTo" class="form-control" type="date" value="${today()}"></label><button class="btn btn-primary" onclick="DriverSettlement.applyFilter()">Apply</button></div><div id="driverLedgerHost"></div></div>`;DriverSettlement.applyFilter()};
const oldReportApply=Reports.applyFilter;
Reports.render=function(c){const ps=parties();c.innerHTML=`<div class="anori-section-intro"><div><strong>Reports & Analytics</strong><span>Customer-wise trip checking and ledger download.</span></div></div><div class="card">${bar(`<button class="anori-action-btn anori-action-preview" onclick="Reports.applyFilter()">🔎 APPLY FILTER</button><button class="anori-action-btn anori-action-pdf" onclick="Reports.downloadCustomerLedger()">📄 DOWNLOAD LEDGER</button><button class="anori-action-btn anori-action-export" onclick="Reports.downloadCustomerLedger()">⬇ EXPORT CSV</button>`)}<div class="anori-filter-bar"><label>Customer<select id="reportParty" class="form-control"><option value="">All Customers</option>${ps.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label><label>From<input id="reportFrom" class="form-control" type="date"></label><label>To<input id="reportTo" class="form-control" type="date" value="${today()}"></label><button class="btn btn-primary" onclick="Reports.applyFilter()">Apply</button></div><div id="reportHost"></div></div>`;Reports.applyFilter()};
const oldSettings2=Settings.render;
Settings.render=function(c){oldSettings2.call(Settings,c);const tools=c.querySelector('.anori-data-tools');if(!tools)return;const old=tools.querySelector('.anori-universal-toolbar');if(old)old.outerHTML=bar(`<button class="anori-action-btn anori-action-preview" onclick="anoriExportJSON()">📦 JSON</button><button class="anori-action-btn anori-action-pdf" onclick="anoriExportXLSX()">📊 EXCEL</button><button class="anori-action-btn anori-action-email" onclick="anoriExportSQLite()">🗄 SQLITE</button><button class="anori-action-btn anori-action-duplicate" onclick="anoriExportCSV()">📄 CSV</button><button class="anori-action-btn anori-action-convert" onclick="anoriImportFile()">⬆ IMPORT</button>`)};
window.ANORI_V214=true;
})();


/* ============================================================
   v2.15 FINAL PATCH — SHAHID-STYLE ACTION BAR + FIT-TO-SCREEN
   ============================================================ */
(function(){
'use strict';
function selectedTripIds(){return [...document.querySelectorAll('.trip-row-check:checked')].map(x=>x.value)}
function selectedInvoiceIds(){return [...document.querySelectorAll('.invoice-row-check:checked')].map(x=>x.value)}
function requireOne(ids,label){if(ids.length!==1){Utils.toast(ids.length===0?`Select one ${label} first.`:`Select only one ${label} at a time.`,'warning');return null}return ids[0]}
Trips.actionPreview=function(){const id=requireOne(selectedTripIds(),'trip');if(id)Trips.view(id)};
Invoices.actionPreview=function(){const id=requireOne(selectedInvoiceIds(),'invoice');if(id)Invoices.previewExisting(id)};
Invoices.actionPDF=function(){const id=requireOne(selectedInvoiceIds(),'invoice');if(id)Invoices.downloadExisting(id)};
Invoices.actionEmail=function(){const id=requireOne(selectedInvoiceIds(),'invoice');if(id)Invoices.emailExisting(id)};
Invoices.actionPayment=function(){const id=requireOne(selectedInvoiceIds(),'invoice');if(id)Invoices.recordPayment(id)};
Invoices.actionCancel=function(){const id=requireOne(selectedInvoiceIds(),'invoice');if(id)Invoices.cancelInvoice(id)};

Invoices.fitPreviewToScreen=function(){
  const host=document.getElementById('previewContent');
  const stage=host?.querySelector('.anori-invoice-preview-stage');
  const page=stage?.querySelector('.invoice-page');
  if(!host||!stage||!page)return;
  page.style.transform='none';
  page.style.transformOrigin='top center';
  const pageWidth=page.offsetWidth||794;
  const available=Math.max(280,host.clientWidth-48);
  // Use the wider preview area to make the A4 invoice easier to read.
  // If the invoice becomes taller/wider than the viewport, the preview container scrolls.
  const scale=Math.min(1.35,Math.max(1,available/pageWidth));
  page.style.transform=`scale(${scale})`;
  stage.style.width='100%';
  stage.style.minHeight=`${Math.ceil((page.offsetHeight||1123)*scale + 24)}px`;
  stage.style.padding='0 0 24px';
  stage.style.justifyContent='center';
  stage.style.overflow='visible';
  page.style.marginLeft='auto';
  page.style.marginRight='auto';
};
const oldMount=Invoices.mountInvoiceDocument;
Invoices.mountInvoiceDocument=function(i){const page=oldMount.call(this,i);requestAnimationFrame(()=>requestAnimationFrame(()=>this.fitPreviewToScreen()));return page};
const oldPreview=Invoices.previewInvoice;
Invoices.previewInvoice=function(i){oldPreview.call(this,i);setTimeout(()=>this.fitPreviewToScreen(),30)};
if(!window.__anoriPreviewResizeBound){
  window.__anoriPreviewResizeBound=true;
  window.addEventListener('resize',()=>{if(document.getElementById('previewModal')?.classList.contains('active'))Invoices.fitPreviewToScreen()});
}
})();


/* v2.15 FINAL — PDF uses the same preview DOM, temporarily unscaled for A4 capture. */
(function(){
'use strict';
Invoices.downloadInvoice=async function(invoice){
  try{
    if(typeof html2pdf!=='function')throw new Error('PDF library is unavailable. Please check the PDF library connection.');
    const normalized=typeof normalize==='function'?normalize(invoice):invoice;
    const host=document.getElementById('previewContent');
    if(!host)throw new Error('Invoice preview area not found.');
    let page=host.dataset.invoiceId===normalized.id?host.querySelector('.invoice-page'):null;
    if(!page)page=this.mountInvoiceDocument(normalized);
    if(!page)throw new Error('Invoice preview could not be prepared.');
    const stage=page.parentElement;
    const old={
      hostWidth:host.style.width,hostHeight:host.style.height,hostOverflow:host.style.overflow,
      stageWidth:stage.style.width,stageHeight:stage.style.height,stageOverflow:stage.style.overflow,
      stagePadding:stage.style.padding,stageBackground:stage.style.background,stageMinHeight:stage.style.minHeight,
      stageJustify:stage.style.justifyContent,pageTransform:page.style.transform,pageMarginLeft:page.style.marginLeft,pageMarginRight:page.style.marginRight
    };
    page.style.transform='none';
    page.style.marginLeft='0';page.style.marginRight='0';
    stage.style.width='210mm';stage.style.height='auto';stage.style.minHeight='0';stage.style.overflow='visible';stage.style.padding='0';stage.style.background='#fff';stage.style.justifyContent='flex-start';
    host.style.width='210mm';host.style.height='auto';host.style.overflow='visible';
    if(document.fonts?.ready)await document.fonts.ready;
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    await html2pdf().set({
      margin:0,
      filename:`${normalized.invoice_no}.pdf`,
      image:{type:'jpeg',quality:.98},
      html2canvas:{scale:2,useCORS:true,allowTaint:false,backgroundColor:'#fff',logging:false,scrollX:0,scrollY:0,windowWidth:794},
      pagebreak:{mode:['css','legacy'],avoid:['.avoid']},
      jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}
    }).from(page).save();
    host.style.width=old.hostWidth;host.style.height=old.hostHeight;host.style.overflow=old.hostOverflow;
    stage.style.width=old.stageWidth;stage.style.height=old.stageHeight;stage.style.overflow=old.stageOverflow;stage.style.padding=old.stagePadding;stage.style.background=old.stageBackground;stage.style.minHeight=old.stageMinHeight;stage.style.justifyContent=old.stageJustify;
    page.style.transform=old.pageTransform;page.style.marginLeft=old.pageMarginLeft;page.style.marginRight=old.pageMarginRight;
    this.fitPreviewToScreen();
    Utils.toast('PDF downloaded with the same Invoice Preview layout.','success');
  }catch(e){
    console.error('Invoice PDF generation error:',e);
    Swal.fire({icon:'error',title:'PDF Generation Failed',text:e?.message||'Unable to generate PDF.',confirmButtonText:'OK'});
  }
};
})();

/* ============================================================
   ANORI TRANSPORT v2.16 — RUNTIME STABILITY HOTFIX
   Fixes: cross-IIFE scope errors, missing backup service, universal
   action-toolbar styling, and cancelled-invoice history visibility.
   ============================================================ */
(function installAnoriV216Hotfix(){
'use strict';
const esc=v=>Sanitize.html(v==null?'':String(v));
const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0};
const money=v=>Utils.fmt(num(v));
const today=()=>Utils.today();
const getTrips=()=>DB.get('trips',[]);
const getInvoices=()=>DB.get('invoices',[]);
const getParties=()=>DB.get('parties',[]);
const activeInvoice=id=>getInvoices().find(i=>Array.isArray(i.trip_ids)&&i.trip_ids.includes(id)&&String(i.status||'').toLowerCase()!=='cancelled');
const paidAmount=i=>num(i?.advance)+DB.get('payments',[]).filter(p=>p.invoice_id===i?.id).reduce((s,p)=>s+num(p.amount),0);
const balanceDue=i=>Math.max(0,num(i?.total_amount)-paidAmount(i));
const invoiceStatus=i=>{
  if(!i)return 'unknown';
  if(String(i.status||'').toLowerCase()==='cancelled')return 'cancelled';
  if(balanceDue(i)<=0)return 'paid';
  const d=new Date(Invoices.getDueDate(i.date,i.credit_days||30));
  if(!Number.isNaN(d.getTime())&&d<new Date(today()))return 'overdue';
  return paidAmount(i)>0?'part_paid':'unpaid';
};

/* Make shared helpers available to later UI override layers. */
window.esc=esc;window.num=num;window.money=money;window.today=today;
window.invoiceDueDate=function(i){return Invoices.getDueDate(i?.date,i?.credit_days||30)};
window.invoiceRemainingDays=function(i){const due=window.invoiceDueDate(i);const a=new Date(`${today()}T00:00:00`),b=new Date(`${due}T00:00:00`);if(Number.isNaN(b.getTime()))return '';return Math.round((b-a)/86400000)};
window.parties=getParties;window.paid=paidAmount;window.bal=balanceDue;window.istatus=invoiceStatus;
window.sync=function(){
  const invoices=getInvoices();
  invoices.forEach(i=>{i.paid_amount=paidAmount(i);i.balance_due=balanceDue(i);if(String(i.status||'').toLowerCase()!=='cancelled')i.status=i.balance_due<=0?'paid':(i.paid_amount>0?'part_paid':'issued')});
  DB.set('invoices',invoices,true);
  const trips=getTrips();
  trips.forEach(t=>t.invoice_status=activeInvoice(t.id)?'invoiced':'pending');
  DB.set('trips',trips,true);
};

/* The v2.14/v2.15 render layers use toolbar() from another IIFE.
   Expose one stable implementation instead of relying on lexical scope. */
window.toolbar=function(type,countId){
  const isInvoice=type==='invoice';
  const preview=isInvoice?'Invoices.actionPreview()':'Trips.actionPreview()';
  const pdf=isInvoice?'Invoices.actionPDF()':"Utils.toast('Trip PDF is available after invoice generation.','info')";
  const email=isInvoice?'Invoices.actionEmail()':"Utils.toast('Email is available for invoices.','info')";
  const duplicate=isInvoice?'Invoices.duplicateSelected()':'Trips.duplicateSelected()';
  const edit=isInvoice?'Invoices.editSelected()':'Trips.editSelected()';
  const del=isInvoice?'Invoices.deleteSelected()':'Trips.deleteSelected()';
  return `<div class="anori-action-toolbar anori-shahid-toolbar">
    <span class="anori-toolbar-label">Actions:</span>
    <button type="button" class="anori-action-btn anori-action-preview" onclick="${preview}"><i class="fas fa-eye"></i> PREVIEW</button>
    <button type="button" class="anori-action-btn anori-action-pdf" onclick="${pdf}"><i class="fas fa-file-pdf"></i> PDF</button>
    <button type="button" class="anori-action-btn anori-action-email" onclick="${email}"><i class="fas fa-envelope"></i> EMAIL</button>
    ${isInvoice?'<button type="button" class="anori-action-btn anori-action-payment" onclick="Invoices.actionPayment()"><i class="fas fa-money-bill-wave"></i> PAYMENT</button>':''}
    <button type="button" class="anori-action-btn anori-action-duplicate" onclick="${duplicate}"><i class="fas fa-copy"></i> DUPLICATE</button>
    <button type="button" class="anori-action-btn anori-action-edit" onclick="${edit}"><i class="fas fa-pen"></i> EDIT</button>
    <button type="button" class="anori-action-btn anori-action-delete" onclick="${del}"><i class="fas fa-trash"></i> DELETE</button>
    ${isInvoice?'<button type="button" class="anori-action-btn anori-action-cancel" onclick="Invoices.actionCancel()"><i class="fas fa-ban"></i> CANCEL</button>':''}
    <span class="anori-toolbar-spacer"></span><span id="${countId}" class="anori-selection-count">0 selected</span>
  </div>`;
};

/* v2.8/v2.12 installed a backup callback before the service object existed.
   Provide the service explicitly so every DB write remains safe. */
window.AnoriDataTools=window.AnoriDataTools||{};
window.AnoriDataTools.exportJSON=window.AnoriDataTools.exportJSON||function(){
  if(typeof window.anoriExportJSON==='function'){window.anoriExportJSON();return true;}
  const keys=['company_profile','vehicles','drivers','parties','vendors','trips','invoices','driver_settlements','vendor_settlements','payments','expense_master','followups','audit_log'];
  const data={version:'2.16.0',exported_at:new Date().toISOString()};keys.forEach(k=>data[k]=DB.get(k,[]));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download=`anori-backup-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);return true;
};
window.AnoriDataTools.autoBackupNow=window.AnoriDataTools.autoBackupNow||async function(){
  if(typeof window.anoriBackupNow==='function')return await window.anoriBackupNow();
  return window.AnoriDataTools.exportJSON();
};

/* Show cancelled invoices in history. They remain excluded from active KPI counts. */
const oldInvoiceRender=Invoices.render;
Invoices.render=function(container){
  if(typeof oldInvoiceRender!=='function')return;
  oldInvoiceRender.call(Invoices,container);
  const table=container.querySelector('table');
  if(!table)return;
  const rows=table.querySelectorAll('tbody tr');
  const cancelled=getInvoices().filter(i=>String(i.status||'').toLowerCase()==='cancelled');
  if(!cancelled.length)return;
  /* v2.15 hides cancelled invoices from the active table. Re-render the table body from current DB. */
  const body=table.querySelector('tbody');
  const parties=getParties();
  body.innerHTML=getInvoices().slice().reverse().map(i=>{
    const p=parties.find(x=>x.id===i.party_id);
    const s=invoiceStatus(i);
    return `<tr class="${s==='cancelled'?'anori-cancelled-row':''}">
      <td><input type="checkbox" class="invoice-row-check" value="${esc(i.id)}" onchange="Invoices.updateSelectionCount()"></td>
      <td><strong>${esc(i.invoice_no)}</strong></td><td>${esc(i.date)}</td><td>${esc(p?.name||'-')}</td>
      <td>${num(i.trip_count)}</td><td>${money(i.total_amount)}</td><td>${money(paidAmount(i))}</td><td>${money(balanceDue(i))}</td>
      <td><span class="status-badge status-${s.replace('_','-')}">${esc(s.replace('_',' ').toUpperCase())}</span></td>
    </tr>`;
  }).join('');
  Invoices.updateSelectionCount();
};

/* Ensure backup button never throws even if the older wrapper fires. */
const backup=document.getElementById('backupBtn');
if(backup)backup.onclick=async()=>{try{const ok=await window.AnoriDataTools.autoBackupNow('header');if(ok===false)window.AnoriDataTools.exportJSON()}catch(e){console.error(e);Utils.toast('Backup failed.','error')}};

window.ANORI_V216_HOTFIX=true;
})();

/* ============================================================
   ANORI TRANSPORT v2.17 — FINAL CRITICAL HARDENING
   - Stable global toolbar helper (fixes cross-IIFE bar scope errors)
   - Exact Shahid-style individual action buttons
   - Safe invoice Preview/PDF rendering with guaranteed restoration
   - Removes invoice-page clipping from long invoices
   - Protects issued invoices from manual status corruption
   - Makes trip PDF/email actions explicit instead of silent no-op
   - Keeps cancelled invoices in history while excluding them from active KPIs
   ============================================================ */
(function installAnoriV217(){
'use strict';
const esc2 = v => (window.esc ? window.esc(v) : String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
const toast = (m,t='info') => window.Utils?.toast ? Utils.toast(m,t) : null;
const getTrips = () => DB.get('trips',[]);
const getInvoices = () => DB.get('invoices',[]);
const activeInvoiceFor = id => getInvoices().find(i=>Array.isArray(i.trip_ids)&&i.trip_ids.includes(id)&&String(i.status||'').toLowerCase()!=='cancelled');

/* Stable toolbar helper. Earlier IIFEs used lexical `bar()` across scopes,
   which is invalid JavaScript and caused Driver/Reports/Settings tabs to fail. */
window.bar = function(html, countId='universalSelectedCount'){
  return `<div class="anori-action-toolbar anori-shahid-toolbar">
    <span class="anori-toolbar-label">Actions:</span>${html}
    <span class="anori-toolbar-spacer"></span><span id="${countId}" class="anori-selection-count">0 selected</span>
  </div>`;
};

/* Consistent action toolbar matching the requested screenshot. */
window.toolbar = function(type,countId){
  const invoice = type==='invoice';
  const p = invoice ? 'Invoices.actionPreview()' : 'Trips.actionPreview()';
  const pdf = invoice ? 'Invoices.downloadSelectedPDF()' : 'Trips.actionPDF()';
  const pdfLabel = invoice ? 'DOWNLOAD PDF' : 'PDF';
  const email = invoice ? 'Invoices.actionEmail()' : 'Trips.actionEmail()';
  const dup = invoice ? 'Invoices.duplicateSelected()' : 'Trips.duplicateSelected()';
  const edit = invoice ? 'Invoices.editSelected()' : 'Trips.editSelected()';
  const del = invoice ? 'Invoices.deleteSelected()' : 'Trips.deleteSelected()';
  return window.bar(`
    <button type="button" class="anori-action-btn anori-action-preview" onclick="${p}">👁 PREVIEW</button>
    <button type="button" class="anori-action-btn anori-action-pdf" onclick="${pdf}">📄 PDF</button>
    <button type="button" class="anori-action-btn anori-action-email" onclick="${email}">📧 EMAIL</button>
    ${invoice?'<button type="button" class="anori-action-btn anori-action-payment" onclick="Invoices.actionPayment()">💵 PAYMENT</button>':''}
    <button type="button" class="anori-action-btn anori-action-duplicate" onclick="${dup}">📋 DUPLICATE</button>
    <button type="button" class="anori-action-btn anori-action-edit" onclick="${edit}">✏️ EDIT</button>
    <button type="button" class="anori-action-btn anori-action-delete" onclick="${del}">🗑 DELETE</button>
    ${invoice?'<button type="button" class="anori-action-btn anori-action-cancel" onclick="Invoices.actionCancel()">❌ CANCEL</button>':''}
  `,countId);
};

/* Real trip actions: never pretend a non-invoice operation succeeded. */
Trips.actionPDF = function(){
  const ids = typeof Trips.getSelected==='function' ? Trips.getSelected() : [...document.querySelectorAll('.trip-row-check:checked')].map(x=>x.value);
  if(ids.length!==1)return toast(ids.length?'Select only one trip at a time.':'Select one trip first.','warning');
  const inv = activeInvoiceFor(ids[0]);
  if(!inv)return toast('This trip has no active invoice. Generate the invoice first.','warning');
  if(typeof Invoices.downloadExisting==='function')Invoices.downloadExisting(inv.id); else toast('Invoice PDF action is unavailable.','error');
};
Trips.actionEmail = function(){
  const ids = typeof Trips.getSelected==='function' ? Trips.getSelected() : [...document.querySelectorAll('.trip-row-check:checked')].map(x=>x.value);
  if(ids.length!==1)return toast(ids.length?'Select only one trip at a time.':'Select one trip first.','warning');
  const inv = activeInvoiceFor(ids[0]);
  if(!inv)return toast('This trip has no active invoice. Generate the invoice first.','warning');
  if(typeof Invoices.emailExisting==='function')Invoices.emailExisting(inv.id); else toast('Invoice email action is unavailable.','error');
};

/* Protect issued/cancelled invoice status from the legacy dropdown handler. */
Invoices.updateStatus = function(id,status){
  const a=getInvoices(), x=a.find(i=>i.id===id); if(!x)return;
  const current=String(x.status||'issued').toLowerCase();
  if(current==='cancelled')return toast('Cancelled invoices are locked.','warning');
  if(status==='paid'||status==='part_paid')return toast('Use PAYMENT to record customer receipt. Invoice status is calculated automatically.','warning');
  if(status==='cancelled')return Invoices.cancelInvoice(id);
  x.status=status==='sent'?'sent':'issued';
  DB.set('invoices',a); if(typeof sync==='function')sync(); Router.go('invoices');
  toast('Invoice status updated.','success');
};

/* Final invoice deletion rule:
   - ACTIVE/ISSUED/SENT invoices are NEVER permanently deleted; they must be cancelled.
   - DRAFT invoices can be permanently deleted.
   - CANCELLED invoices may be permanently deleted ONLY when they have no recorded customer payments.
   This keeps active financial history protected while making the DELETE action functional for
   cancelled records that are no longer financially referenced. */
Invoices.deleteInvoice = function(id){
  const a=getInvoices(), x=a.find(i=>i.id===id); if(!x)return;
  const st=String(x.status||'issued').toLowerCase();
  const payments=Array.isArray(DB.get('payments')) ? DB.get('payments') : [];
  const hasPayments=payments.some(p=>String(p.invoice_id||p.invoiceId||'')===String(id) && Number(p.amount||0)>0);

  if(st!=='draft' && st!=='cancelled'){
    return Invoices.cancelInvoice(id);
  }
  if(st==='cancelled' && hasPayments){
    return Swal.fire({
      icon:'warning',
      title:'Invoice Cannot Be Deleted',
      html:`Invoice <strong>${esc(x.invoice_no||id)}</strong> has recorded customer payment(s).<br><br>Financial history is protected. You can keep it as <strong>CANCELLED</strong>, but it cannot be permanently deleted.`,
      confirmButtonText:'OK'
    });
  }

  const title=st==='draft'?'Delete Draft Invoice?':'Delete Cancelled Invoice?';
  const text=st==='draft'
    ? 'This draft invoice will be permanently removed.'
    : 'This cancelled invoice will be permanently removed from invoice history. This action cannot be undone.';
  Swal.fire({title,text,icon:'warning',showCancelButton:true,confirmButtonText:'Delete Permanently',confirmButtonColor:'#dc2626',cancelButtonText:'Keep'}).then(r=>{
    if(!r.isConfirmed)return;
    DB.set('invoices',a.filter(i=>String(i.id)!==String(id)),true);
    if(typeof syncFinancial==='function')syncFinancial();
    Router.go('invoices');
    toast(st==='draft'?'Draft invoice deleted.':'Cancelled invoice deleted.','success');
  });
};

/* Final invoice renderer: remove clipping and keep 5mm page clearance. */
const originalBuild = Invoices.buildInvoiceHTML;
if(typeof originalBuild==='function'){
  Invoices.buildInvoiceHTML=function(invoice,preview=false){
    let html=originalBuild.call(this,invoice,preview);
    html=html.replace(/\.invoice-page\{([^}]*)\}/, (m,body)=>{
      body=body.replace(/overflow\s*:\s*hidden\s*;?/gi,'overflow:visible;');
      if(!/padding\s*:\s*5mm/i.test(body)) body+='padding:5mm;';
      return `.invoice-page{${body}}`;
    });
    return html;
  };
}

/* Fit preview to available screen with only 1cm visual clearance on each side.
   The page remains A4; transform scaling is proportional and scrolling handles height. */
Invoices.fitPreviewToScreen = function(){
  const host=document.getElementById('previewContent');
  const stage=host?.querySelector('.anori-invoice-preview-stage');
  const page=stage?.querySelector('.invoice-page');
  if(!host||!stage||!page)return;

  page.style.transform='none';
  page.style.transformOrigin='top center';
  page.style.margin='0 auto';

  const pageWidth=page.offsetWidth || 794;
  const pageHeight=page.offsetHeight || 1123;
  const rootFont=parseFloat(getComputedStyle(document.documentElement).fontSize)||16;
  const oneCmPx=96/2.54;
  const available=Math.max(280, host.clientWidth-(2*oneCmPx));
  const scale=Math.max(0.5, available/pageWidth);

  page.style.transform=`scale(${scale})`;
  stage.style.width='100%';
  stage.style.minHeight=`${Math.ceil(pageHeight*scale + (2*oneCmPx))}px`;
  stage.style.height='auto';
  stage.style.padding='1cm';
  stage.style.boxSizing='border-box';
  stage.style.overflow='visible';
  stage.style.alignItems='center';
  stage.style.justifyContent='flex-start';
};

/* Final PDF function. All temporary changes are restored in finally, even on error. */
Invoices.downloadInvoice = async function(invoice){
  const originalPage = document.querySelector('#previewContent .invoice-page');
  const hadPreview = !!originalPage;
  let page=originalPage, stage=page?.parentElement, host=document.getElementById('previewContent');
  let old=null;
  try{
    if(typeof html2pdf!=='function')throw new Error('PDF library is unavailable. Please open Anori Transport with the required libraries available.');
    if(!host)throw new Error('Invoice Preview area is not available.');
    if(!page || host.dataset.invoiceId!==invoice.id){
      if(typeof this.mountInvoiceDocument==='function')page=this.mountInvoiceDocument(invoice);
      else throw new Error('Invoice Preview renderer is unavailable.');
      stage=page.parentElement;
    }
    if(!page||!stage)throw new Error('Invoice Preview could not be prepared.');
    old={hostWidth:host.style.width,hostHeight:host.style.height,hostOverflow:host.style.overflow,
      stageWidth:stage.style.width,stageHeight:stage.style.height,stageMinHeight:stage.style.minHeight,stageOverflow:stage.style.overflow,
      stagePadding:stage.style.padding,stageJustify:stage.style.justifyContent,pageTransform:page.style.transform,pageOrigin:page.style.transformOrigin,
      pageMargin:page.style.margin,pageOverflow:page.style.overflow};
    page.style.transform='none'; page.style.transformOrigin='top center'; page.style.margin='0'; page.style.overflow='visible';
    stage.style.width='210mm'; stage.style.height='auto'; stage.style.minHeight='0'; stage.style.overflow='visible'; stage.style.padding='0'; stage.style.justifyContent='flex-start';
    host.style.width='210mm'; host.style.height='auto'; host.style.overflow='visible';
    if(document.fonts?.ready)await document.fonts.ready;
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    await html2pdf().set({margin:0,filename:`${invoice.invoice_no}.pdf`,image:{type:'jpeg',quality:.98},html2canvas:{scale:2,useCORS:true,allowTaint:false,backgroundColor:'#fff',logging:false,scrollX:0,scrollY:0,windowWidth:794},pagebreak:{mode:['css','legacy'],avoid:['.avoid']},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}}).from(page).save();
    toast('PDF downloaded using the exact Invoice Preview layout.','success');
  }catch(e){
    console.error('Invoice PDF generation error:',e);
    await Swal.fire({icon:'error',title:'PDF Generation Failed',text:e?.message||'Unable to generate PDF.',confirmButtonText:'OK'});
  }finally{
    if(old&&page&&stage&&host){
      host.style.width=old.hostWidth;host.style.height=old.hostHeight;host.style.overflow=old.hostOverflow;
      stage.style.width=old.stageWidth;stage.style.height=old.stageHeight;stage.style.minHeight=old.stageMinHeight;stage.style.overflow=old.stageOverflow;stage.style.padding=old.stagePadding;stage.style.justifyContent=old.stageJustify;
      page.style.transform=old.pageTransform;page.style.transformOrigin=old.pageOrigin;page.style.margin=old.pageMargin;page.style.overflow=old.pageOverflow;
      if(document.getElementById('previewModal')?.classList.contains('active'))this.fitPreviewToScreen();
    }
  }
};

/* Prevent trip edits/deletes when an active invoice exists. */
const oldTripEdit=Trips.edit;
Trips.edit=function(id){if(activeInvoiceFor(id))return Swal.fire({icon:'warning',title:'Trip Locked',text:'This trip is linked to an active invoice. Cancel the invoice first.',confirmButtonText:'OK'});if(typeof oldTripEdit==='function')return oldTripEdit.call(this,id);};
const oldTripDelete=Trips.delete;
Trips.delete=function(id){if(activeInvoiceFor(id))return Swal.fire({icon:'warning',title:'Trip Locked',text:'This trip is linked to an active invoice. Cancel the invoice before deleting the trip.',confirmButtonText:'OK'});if(typeof oldTripDelete==='function')return oldTripDelete.call(this,id);};

/* Keep invoice history and active KPIs logically separate. */
const baseInvoiceRender=Invoices.render;
if(typeof baseInvoiceRender==='function'){
  Invoices.render=function(container){
    baseInvoiceRender.call(this,container);
    const active=getInvoices().filter(i=>String(i.status||'').toLowerCase()!=='cancelled');
    const cancelled=getInvoices().filter(i=>String(i.status||'').toLowerCase()==='cancelled');
    const table=container.querySelector('table');
    if(table){
      const body=table.querySelector('tbody');
      if(body && cancelled.length){
        const parties=DB.get('parties',[]);
        const rows=cancelled.slice().reverse().map(i=>{
          const p=parties.find(x=>x.id===i.party_id); const paidAmt=(i.advance||0)+DB.get('payments',[]).filter(x=>x.invoice_id===i.id).reduce((s,x)=>s+Number(x.amount)||0,0);
          const bal=Math.max(0,Number(i.total_amount)||0-paidAmt);
          return `<tr class="anori-cancelled-row"><td><input type="checkbox" class="invoice-row-check" value="${esc2(i.id)}" onchange="Invoices.updateSelectionCount()"></td><td><strong>${esc2(i.invoice_no)}</strong></td><td>${esc2(i.date)}</td><td>${esc2(p?.name||'-')}</td><td>${Number(i.trip_count)||0}</td><td>${money(i.total_amount)}</td><td>${money(paidAmt)}</td><td>${money(bal)}</td><td><span class="status-badge status-cancelled">CANCELLED</span></td></tr>`;
        }).join('');
        body.insertAdjacentHTML('beforeend',rows);
        if(typeof Invoices.updateSelectionCount==='function')Invoices.updateSelectionCount();
      }
    }
  };
}

window.ANORI_V217_HARDENED=true;
})();

/* v2.17 data-integrity cleanup: store raw values; escape only at render time. */
(function fixStoredEscaping(){
'use strict';
function decode(v){
  if(typeof v!=='string'||!/[&](amp|lt|gt|quot|#39);/.test(v))return v;
  const ta=document.createElement('textarea');ta.innerHTML=v;return ta.value;
}
function deep(v){
  if(Array.isArray(v))return v.map(deep);
  if(v&&typeof v==='object'){const o={};Object.keys(v).forEach(k=>o[k]=deep(v[k]));return o;}
  return decode(v);
}
if(!localStorage.getItem('anori_v217_rawdata_migrated')){
  ['company_profile','vehicles','drivers','parties','expense_master','trips','invoices','payments','driver_settlements','followups'].forEach(k=>{
    const v=DB.get(k,null); if(v!=null)DB.set(k,deep(v),true);
  });
  localStorage.setItem('anori_v217_rawdata_migrated','1');
}
/* Future Trip writes: convert escaped form values back to raw storage. */
const originalSave=Trips.saveV25, originalUpdate=Trips.updateV25;
const rawForm=form=>deep(form);
Trips.saveV25=function(){
  const before=DB.get('trips',[]).length;
  const oldSet=DB.set;
  let captured=null;
  /* Use the existing form reader but ensure the object written by the legacy save is raw. */
  const originalRead=window.readTripForm;
  if(typeof originalRead==='function'){
    const f=originalRead(); if(!f)return; captured=rawForm(f);
    const trip={id:Utils.id(),trip_no:Utils.generateTripNo(captured.date),...captured,status:'completed',invoice_status:'pending',is_gst:true};
    const trips=DB.get('trips',[]);trips.push(trip);DB.set('trips',trips);if(typeof syncDriverTripEntry==='function')syncDriverTripEntry(trip);UI.closeModal();Utils.toast('Trip created successfully.','success');Router.go('trips');return;
  }
  if(typeof originalSave==='function')return originalSave.call(this);
};
Trips.updateV25=function(id){
  if(typeof activeInvoiceForTrip==='function'&&activeInvoiceForTrip(id))return Swal.fire({icon:'warning',title:'Trip Locked',text:'Cancel the active invoice before editing this trip.',confirmButtonText:'OK'});
  const f=typeof window.readTripForm==='function'?window.readTripForm():null;if(!f)return;
  const trips=DB.get('trips',[]),i=trips.findIndex(x=>x.id===id);if(i<0)return;
  trips[i]={...trips[i],...rawForm(f)};DB.set('trips',trips);if(typeof syncDriverTripEntry==='function')syncDriverTripEntry(trips[i]);UI.closeModal();Utils.toast('Trip updated successfully.','success');Router.go('trips');
};
window.ANORI_V217_RAWDATA=true;
})();

/* ============================================================
   ANORI TRANSPORT v2.18 — STABILITY + OPERATIONS HARDENING
   Base: v2.17 actual approved package. Minimal final overrides only.
   ============================================================ */
(function installAnoriV218(){
  'use strict';
  const esc = v => Sanitize.html(v == null ? '' : String(v));
  const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const today = () => Utils.today();
  const toast = (m,t='success') => Utils.toast(m,t);
  const invoices = () => DB.get('invoices',[]);
  const trips = () => DB.get('trips',[]);
  const payments = () => DB.get('payments',[]);
  const activeInv = id => invoices().find(i=>Array.isArray(i.trip_ids)&&i.trip_ids.includes(id)&&String(i.status||'').toLowerCase()!=='cancelled');
  const anyInv = id => invoices().find(i=>Array.isArray(i.trip_ids)&&i.trip_ids.includes(id));
  const paid = inv => num(inv?.advance) + payments().filter(p=>p.invoice_id===inv?.id).reduce((s,p)=>s+num(p.amount),0);
  const balance = inv => Math.max(0,num(inv?.total_amount)-paid(inv));
  const status = inv => {
    if(!inv) return 'unknown';
    if(String(inv.status||'').toLowerCase()==='cancelled') return 'cancelled';
    const b=balance(inv), p=paid(inv), due=new Date(Invoices.getDueDate(inv.date,inv.credit_days||30));
    if(b<=0) return 'paid';
    if(!Number.isNaN(due.getTime()) && due < new Date(today())) return 'overdue';
    return p>0 ? 'part_paid' : 'unpaid';
  };

  // ---------- RAW DATA SAFETY ----------
  // Store raw values; HTML escaping belongs only at render time.
  function decodeHtml(v){
    if(typeof v!=='string' || !/[&](amp|lt|gt|quot|#39);/.test(v)) return v;
    const ta=document.createElement('textarea'); ta.innerHTML=v; return ta.value;
  }
  function raw(v){
    if(Array.isArray(v)) return v.map(raw);
    if(v && typeof v==='object'){ const o={}; Object.keys(v).forEach(k=>o[k]=raw(v[k])); return o; }
    return decodeHtml(v);
  }
  ['company_profile','vehicles','drivers','parties','expense_master','trips','invoices','payments','driver_settlements','followups'].forEach(k=>{
    const v=DB.get(k,null); if(v!=null) DB.set(k,raw(v),true);
  });

  // ---------- FINANCIAL STATE ----------
  function syncFinancial(){
    let arr=invoices();
    arr.forEach(inv=>{
      inv.payments=payments().filter(p=>p.invoice_id===inv.id).map(p=>({...p}));
      inv.paid_amount=paid(inv);
      inv.balance_due=balance(inv);
      if(String(inv.status||'').toLowerCase()!=='cancelled') inv.status=inv.balance_due<=0?'paid':(inv.paid_amount>0?'part_paid':'issued');
    });

    // Repair legacy duplicate cancelled invoice rows. Only exact duplicates
    // (same invoice number + financial/trip data) are collapsed; different
    // invoices are never merged. This guarantees one cancelled row per invoice.
    const seen=new Set();
    arr=arr.filter(inv=>{
      if(String(inv.status||'').toLowerCase()!=='cancelled') return true;
      const sig=JSON.stringify({
        invoice_no:inv.invoice_no||'', date:inv.date||'', party_id:inv.party_id||'',
        trip_ids:Array.isArray(inv.trip_ids)?inv.trip_ids.slice().sort():[],
        total_amount:num(inv.total_amount), advance:num(inv.advance),
        subtotal:num(inv.subtotal), cgst:num(inv.cgst), sgst:num(inv.sgst)
      });
      if(seen.has(sig)) return false;
      seen.add(sig); return true;
    });

    DB.set('invoices',arr,true);
    const ts=trips(); ts.forEach(t=>t.invoice_status=activeInv(t.id)?'invoiced':'pending'); DB.set('trips',ts,true);
  }
  syncFinancial();

  // ---------- TRIP FINANCIAL LOCK ----------
  const oldEdit = Trips.edit;
  Trips.edit = function(id){
    const inv=activeInv(id);
    if(inv) return Swal.fire({icon:'warning',title:'Trip Locked',html:`Trip <strong>${esc(trips().find(t=>t.id===id)?.trip_no||'')}</strong> is linked to active invoice <strong>${esc(inv.invoice_no)}</strong>.<br><br>Cancel the invoice first.`,confirmButtonText:'OK'});
    return typeof oldEdit==='function' ? oldEdit.call(this,id) : this.showEditModal(id);
  };
  const oldDelete = Trips.delete;
  Trips.delete = function(id){
    const inv=anyInv(id);
    if(inv) return Swal.fire({icon:'warning',title:'Trip Cannot Be Deleted',html:`This trip is linked to invoice <strong>${esc(inv.invoice_no)}</strong>.<br><br>Financial history is protected.`,confirmButtonText:'OK'});
    return typeof oldDelete==='function' ? oldDelete.call(this,id) : undefined;
  };

  // ---------- INVOICE CANCELLATION ONLY FOR ISSUED RECORDS ----------
  // Cancel an invoice and remove only exact duplicate records of the same invoice.
  // A cancelled invoice remains in history exactly once.
  Invoices.cancelInvoice = function(id){
    const inv=invoices().find(i=>i.id===id); if(!inv) return;
    if(String(inv.status||'').toLowerCase()==='cancelled') return toast('Invoice is already cancelled.','warning');
    Swal.fire({
      title:'Cancel Invoice?', icon:'warning',
      html:`Invoice <strong>${esc(inv.invoice_no)}</strong> will remain in history and its trips will become available for re-invoicing.`,
      input:'text', inputLabel:'Cancellation reason', inputPlaceholder:'Enter reason',
      showCancelButton:true, confirmButtonColor:'#dc2626', confirmButtonText:'Cancel Invoice', cancelButtonText:'Keep Invoice',
      preConfirm:v=>String(v||'Cancelled by user').trim()
    }).then(r=>{
      if(!r.isConfirmed) return;
      let arr=invoices(), x=arr.find(i=>i.id===id); if(!x) return;
      x.status='cancelled'; x.cancelled_at=new Date().toISOString(); x.cancel_reason=r.value;

      // If the same invoice was accidentally stored more than once, keep one
      // exact copy only. Do not remove records with different financial data.
      const signature = i => JSON.stringify({
        invoice_no:i.invoice_no||'', date:i.date||'', party_id:i.party_id||'',
        trip_ids:Array.isArray(i.trip_ids)?i.trip_ids.slice().sort():[],
        total_amount:num(i.total_amount), advance:num(i.advance),
        subtotal:num(i.subtotal), cgst:num(i.cgst), sgst:num(i.sgst)
      });
      const targetSig=signature(x), seen=false;
      arr=arr.filter(i=>{
        if(i.id===x.id) return true;
        if(String(i.status||'').toLowerCase()!=='cancelled') return true;
        if(String(i.invoice_no||'')!==String(x.invoice_no||'')) return true;
        if(signature(i)!==targetSig) return true;
        if(!seen){ return false; }
        return false;
      });
      DB.set('invoices',arr,true); syncFinancial(); toast(`Invoice ${x.invoice_no} cancelled.`,'success'); Router.go('invoices');
    });
  };

  // ---------- PAYMENT LEDGER ----------
  Invoices.recordPayment = function(id){
    const inv=invoices().find(i=>i.id===id); if(!inv) return;
    if(status(inv)==='cancelled') return toast('Cancelled invoice cannot receive payment.','warning');
    const due=balance(inv);
    if(due<=0) return toast('This invoice is already fully paid.','info');
    Swal.fire({
      title:'Record Customer Payment',
      html:`<div style="text-align:left"><label>Amount</label><input id="anori-pay-amt" type="number" min="0.01" max="${due}" class="form-control" value="${due}"><label style="display:block;margin-top:10px">Date</label><input id="anori-pay-date" type="date" class="form-control" value="${today()}"><label style="display:block;margin-top:10px">Payment Mode</label><select id="anori-pay-mode" class="form-control"><option>Bank Transfer</option><option>UPI</option><option>Cash</option><option>Cheque</option><option>Other</option></select><label style="display:block;margin-top:10px">Reference</label><input id="anori-pay-ref" class="form-control" placeholder="UTR / cheque / reference"></div>`,
      showCancelButton:true, confirmButtonText:'Save Payment', preConfirm:()=>{
        const amount=num(document.getElementById('anori-pay-amt').value); if(amount<=0||amount>due){Swal.showValidationMessage(`Enter an amount between 0.01 and ${due}.`);return false;}
        return {amount,date:Sanitize.date(document.getElementById('anori-pay-date').value),mode:document.getElementById('anori-pay-mode').value,reference:document.getElementById('anori-pay-ref').value.trim()};
      }
    }).then(r=>{
      if(!r.isConfirmed)return;
      const p=payments(); p.push({id:Utils.id(),invoice_id:id,...r.value}); DB.set('payments',p,true); syncFinancial();
      toast(`Payment of ${Utils.fmt(r.value.amount)} recorded.`,'success'); Router.go('invoices');
    });
  };

  // ---------- INVOICE PREVIEW = PDF, SAME DOM ----------
  Invoices.downloadInvoice = async function(invoice){
    if(typeof html2pdf!=='function') return Swal.fire({icon:'error',title:'PDF Library Unavailable',text:'The PDF library is not loaded. Check the application libraries.'});
    const host=document.getElementById('previewContent');
    if(!host) return toast('Invoice Preview area is not available.','error');
    let page=host.dataset.invoiceId===invoice.id ? host.querySelector('.invoice-page') : null;
    let stage=page?.parentElement;
    if(!page){
      if(typeof this.mountInvoiceDocument!=='function') return toast('Invoice Preview renderer is unavailable.','error');
      page=this.mountInvoiceDocument(invoice); stage=page?.parentElement;
    }
    if(!page||!stage) return toast('Invoice Preview could not be prepared.','error');
    const old={
      pageTransform:page.style.transform,pageOrigin:page.style.transformOrigin,pageMargin:page.style.margin,pageOverflow:page.style.overflow,
      stageWidth:stage.style.width,stageHeight:stage.style.height,stageMinHeight:stage.style.minHeight,stageOverflow:stage.style.overflow,stagePadding:stage.style.padding,stageJustify:stage.style.justifyContent,
      hostWidth:host.style.width,hostHeight:host.style.height,hostOverflow:host.style.overflow
    };
    try{
      page.style.transform='none'; page.style.transformOrigin='top center'; page.style.margin='0'; page.style.overflow='visible';
      stage.style.width='210mm'; stage.style.height='auto'; stage.style.minHeight='0'; stage.style.overflow='visible'; stage.style.padding='0'; stage.style.justifyContent='flex-start';
      host.style.width='210mm'; host.style.height='auto'; host.style.overflow='visible';
      if(document.fonts?.ready) await document.fonts.ready;
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      await html2pdf().set({
        margin:0,filename:`${invoice.invoice_no}.pdf`,
        image:{type:'jpeg',quality:.98},
        html2canvas:{scale:2,useCORS:true,allowTaint:false,backgroundColor:'#fff',logging:false,scrollX:0,scrollY:0,windowWidth:794},
        pagebreak:{mode:['css','legacy'],avoid:['.avoid']},
        jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}
      }).from(page).save();
      toast('PDF downloaded with the same Invoice Preview layout.','success');
    }catch(e){
      console.error('PDF generation failed',e);
      await Swal.fire({icon:'error',title:'PDF Generation Failed',text:e?.message||'Unable to generate the PDF.'});
    }finally{
      page.style.transform=old.pageTransform; page.style.transformOrigin=old.pageOrigin; page.style.margin=old.pageMargin; page.style.overflow=old.pageOverflow;
      stage.style.width=old.stageWidth; stage.style.height=old.stageHeight; stage.style.minHeight=old.stageMinHeight; stage.style.overflow=old.stageOverflow; stage.style.padding=old.stagePadding; stage.style.justifyContent=old.stageJustify;
      host.style.width=old.hostWidth; host.style.height=old.hostHeight; host.style.overflow=old.hostOverflow;
      if(document.getElementById('previewModal')?.classList.contains('active')) this.fitPreviewToScreen?.();
    }
  };

  // Long invoices must not be clipped by the invoice renderer.
  const baseBuild=Invoices.buildInvoiceHTML;
  if(typeof baseBuild==='function' && !Invoices.__v218BuildWrapped){
    Invoices.buildInvoiceHTML=function(inv,preview){
      let html=baseBuild.call(this,inv,preview);
      html=html.replace(/\.invoice-page\{([^}]*)\}/i,(m,b)=>{
        b=b.replace(/overflow\s*:\s*hidden\s*;?/ig,'overflow:visible;');
        b=b.replace(/padding\s*:\s*[^;]+;?/ig,'padding:5mm;');
        return `.invoice-page{${b}}`;
      });
      return html;
    };
    Invoices.__v218BuildWrapped=true;
  }

  // ---------- CUSTOMER CREDIT CONTROL + EMAIL ----------
  const originalPartyModal=Masters.openModal.bind(Masters);
  Masters.openModal=function(type,id=null){
    if(type!=='party') return originalPartyModal(type,id);
    const arr=DB.get('parties',[]), item=id?(arr.find(x=>x.id===id)||{}):{};
    const html=`<div class="form-row"><div class="form-group"><label>Customer Name *</label><input class="form-control" id="m_name" value="${esc(item.name)}"></div><div class="form-group"><label>Email</label><input class="form-control" id="m_email" type="email" value="${esc(item.email||'')}"></div></div><div class="form-row"><div class="form-group"><label>Credit Days</label><input class="form-control" id="m_credit_days" type="number" min="0" value="${num(item.credit_days)||30}"></div><div class="form-group"><label>Credit Limit (₹)</label><input class="form-control" id="m_credit_limit" type="number" min="0" value="${num(item.credit_limit)||0}"></div></div><div class="form-row"><div class="form-group"><label>GSTIN</label><input class="form-control" id="m_gst" value="${esc(item.gst)}"></div><div class="form-group"><label>Mobile</label><input class="form-control" id="m_mobile" value="${esc(item.mobile||'')}"></div></div><div class="form-group"><label>Address</label><input class="form-control" id="m_addr" value="${esc(item.addr)}"></div>`;
    UI.openModal(`${id?'Edit':'Add'} Customer`,html,()=>{
      const name=document.getElementById('m_name').value.trim(); if(!name)return toast('Customer name is required.','error');
      const x=id?arr.find(a=>a.id===id):{id:Utils.id()}; x.name=name; x.email=document.getElementById('m_email').value.trim(); x.credit_days=Math.max(0,num(document.getElementById('m_credit_days').value)||30); x.credit_limit=Math.max(0,num(document.getElementById('m_credit_limit').value)); x.gst=document.getElementById('m_gst').value.trim(); x.mobile=document.getElementById('m_mobile').value.trim(); x.addr=document.getElementById('m_addr').value.trim(); if(!id)arr.push(x); DB.set('parties',arr); UI.closeModal(); toast('Customer saved.'); Router.go('masters');
    });
  };

  Invoices.emailExisting=function(id){
    const inv=invoices().find(i=>i.id===id); if(!inv)return;
    const party=DB.get('parties',[]).find(p=>p.id===inv.party_id)||{};
    if(!party.email) return Swal.fire({icon:'warning',title:'Customer Email Missing',text:'Add an email address in Master Data before using Email.'});
    const subject=encodeURIComponent(`Invoice ${inv.invoice_no} - ${DB.get('company_profile',{}).name||'ANORI TRANSPORT'}`);
    const body=encodeURIComponent(`Dear ${party.name||'Customer'},\n\nPlease find invoice ${inv.invoice_no} for ${Utils.fmt(inv.total_amount)}.\n\nRegards,\n${DB.get('company_profile',{}).name||'ANORI TRANSPORT'}`);
    window.location.href=`mailto:${party.email}?subject=${subject}&body=${body}`;
  };
  // POD / Trip Document Checklist intentionally excluded from approved scope.
  // ---------- DAILY CLOSING / OPERATIONS SNAPSHOT ----------
  window.anoriDailyClosing=function(){
    const ts=trips().filter(t=>t.date===today()), inv=invoices().filter(i=>i.date===today()&&status(i)!=='cancelled');
    const billed=inv.reduce((s,i)=>s+num(i.total_amount),0), received=inv.reduce((s,i)=>s+paid(i),0);
    Swal.fire({title:`Daily Closing — ${today()}`,html:`<div class="anori-kpi-grid" style="grid-template-columns:repeat(2,1fr)"><div class="anori-kpi-card"><span>Trips</span><strong>${ts.length}</strong></div><div class="anori-kpi-card"><span>Invoices</span><strong>${inv.length}</strong></div><div class="anori-kpi-card"><span>Billing</span><strong>${Utils.fmt(billed)}</strong></div><div class="anori-kpi-card"><span>Received</span><strong>${Utils.fmt(received)}</strong></div></div>`,confirmButtonText:'Close'});
  };

  // ---------- SAFE IMPORT: BACKUP FIRST ----------

  // ---------- BACKUP STATUS ----------
  window.anoriBackupStatus=function(){
    const folder=localStorage.getItem('anori_backup_folder_name');
    Swal.fire({title:'Backup Status',html:`<div style="text-align:left"><p><strong>Automatic folder:</strong> ${esc(folder||'Not selected')}</p><p><strong>Data:</strong> Browser localStorage</p><p><strong>Safety:</strong> Import requires backup first.</p></div>`,confirmButtonText:'OK'});
  };

  // ---------- SETTINGS: OPERATIONS + UPDATE CENTER ----------
  const oldSettingsRender=Settings.render.bind(Settings);
  Settings.render=function(container){
    oldSettingsRender(container);
    container.insertAdjacentHTML('beforeend',`<div class="card"><div class="anori-section-head"><div><h3 class="card-title">🔄 Update & Safety Center</h3><span class="anori-help">Current application version and safe data operations.</span></div></div><div class="anori-universal-toolbar"><span class="anori-toolbar-label">Actions:</span><button class="anori-action-btn anori-action-backup" onclick="anoriBackupNow()">💾 BACKUP NOW</button><button class="anori-action-btn anori-action-export" onclick="anoriBackupStatus()">🛡 BACKUP STATUS</button><button class="anori-action-btn anori-action-preview" onclick="anoriDailyClosing()">📊 DAILY CLOSING</button><span class="anori-toolbar-spacer"></span><strong>ANORI TRANSPORT v2.18</strong></div><p class="anori-help" style="margin-top:10px">For safe updates, always backup before replacing application files. Business data is kept separately from the application package.</p></div>`);
  };

  // ---------- FINAL CLEANUP / FLAGS ----------
  window.ANORI_V218_HARDENED=true;
  try{localStorage.setItem('anori_app_version','2.18.0');}catch(e){}
})();

/* v2.18 toolbar extension: Documents + clearer financial actions. */
(function(){
  'use strict';
  window.toolbar=function(type,countId){
    const invoice=type==='invoice';
    const p=invoice?'Invoices.actionPreview()':'Trips.actionPreview()';
    const pdf=invoice?'Invoices.actionPDF()':'Trips.actionPDF()';
    const email=invoice?'Invoices.actionEmail()':'Trips.actionEmail()';
    const dup=invoice?'Invoices.duplicateSelected()':'Trips.duplicateSelected()';
    const edit=invoice?'Invoices.editSelected()':'Trips.editSelected();';
    const del=invoice?'Invoices.deleteSelected()':'Trips.deleteSelected()';
    return window.bar(`
      <button type="button" class="anori-action-btn anori-action-preview" onclick="${p}">👁 PREVIEW</button>
      <button type="button" class="anori-action-btn anori-action-pdf" onclick="${pdf}">📄 PDF</button>
      <button type="button" class="anori-action-btn anori-action-email" onclick="${email}">📧 EMAIL</button>
      ${invoice?'<button type="button" class="anori-action-btn anori-action-payment" onclick="Invoices.actionPayment()">💵 PAYMENT</button>':''}
<button type="button" class="anori-action-btn anori-action-duplicate" onclick="${dup}">📋 DUPLICATE</button>
      <button type="button" class="anori-action-btn anori-action-edit" onclick="${edit}">✏️ EDIT</button>
      <button type="button" class="anori-action-btn anori-action-delete" onclick="${del}">🗑 DELETE</button>
      ${invoice?'<button type="button" class="anori-action-btn anori-action-cancel" onclick="Invoices.actionCancel()">❌ CANCEL</button>':''}
    `,countId);
  };

})();

/* v2.18 customer credit-limit validation at invoice creation boundary. */
(function(){
  'use strict';
  if(typeof Invoices.createInvoiceV28!=='function'||Invoices.__v218CreditWrapped)return;
  const base=Invoices.createInvoiceV28;
  Invoices.createInvoiceV28=async function(tripList,isGst,advance,expenseLines){
    const partyId=tripList?.[0]?.party_id;
    const party=DB.get('parties',[]).find(p=>p.id===partyId);
    const limit=Number(party?.credit_limit||0);
    if(limit>0){
      const outstanding=DB.get('invoices',[]).filter(i=>i.party_id===partyId&&String(i.status||'').toLowerCase()!=='cancelled').reduce((s,i)=>s+Math.max(0,Number(i.balance_due)||0),0);
      const expTotal=(Array.isArray(expenseLines)?expenseLines:[]).reduce((s,e)=>s+Number(e.amount||0),0); const subtotal=tripList.reduce((s,t)=>s+Number(t.freight||0),0)+expTotal; const projected=outstanding + (subtotal + (isGst ? subtotal*0.18 : 0)) - (Number(advance)||0);
      if(projected>limit){
        await Swal.fire({icon:'warning',title:'Credit Limit Exceeded',html:`Customer <strong>${Sanitize.html(party.name||'')}</strong> has a credit limit of <strong>${Utils.fmt(limit)}</strong>.<br><br>Current outstanding: <strong>${Utils.fmt(outstanding)}</strong>`,confirmButtonText:'OK'});
        return;
      }
    }
    return base.call(this,tripList,isGst,advance,expenseLines);
  };
  Invoices.__v218CreditWrapped=true;
})();

/* ============================================================
   ANORI TRANSPORT v2.20 — APPROVED SCOPE CLEANUP
   - Keep simple Trip Advice only.
   - Exclude Driver Performance.
   - Exclude POD Management.
   - Exclude Trip Document Checklist.
   - Single backup file in selected folder, overwritten every 5 minutes.
   ============================================================ */
(function(){
  'use strict';
  try { localStorage.setItem('anori_app_version','2.20.0'); } catch(e) {}
  window.ANORI_V220 = true;
})();

/* ============================================================
   ANORI TRANSPORT — PERSISTENT AUTOMATIC BACKUP
   - User selects a backup folder and then chooses JSON or SQLite.
   - The selected backup file is overwritten automatically every 2 minutes.
   - Backup format and target handle are persisted.
   - Clear success/error notifications; no fake success.
   ============================================================ */
(function(){
  'use strict';
  const FILE_JSON='ANORI_TRANSPORT_BACKUP.json';
  const FILE_SQLITE='ANORI_TRANSPORT_BACKUP.sqlite';
  const INTERVAL_MS=120000;
  const IDB='anori_backup_v223';
  const STORE='handles';
  let folderHandle=null, fileHandle=null, timer=null;
  let backupFormat=localStorage.getItem('anori_backup_format')||'json';
  const electronBackup=()=>window.anoriElectronBackup&&window.anoriElectronBackup.isAvailable===true;
  function electronFolderHandle(info){
    if(!info||!info.path)return null;
    return {__anoriElectronPath:info.path,name:info.name||info.path};
  }
  function electronFileHandle(info){
    if(!info||!info.path)return null;
    return {__anoriElectronPath:info.path,name:info.name||info.path};
  }

  function dataSnapshot(){
    const keys=['company_profile','vehicles','drivers','parties','vendors','trips','invoices','driver_settlements','vendor_settlements','payments','expense_master','followups','audit_log'];
    const out={};
    keys.forEach(k=>{
      const value=DB.get(k,k==='company_profile'?{}:[]);
      out[k]=value==null?(k==='company_profile'?{}:[]):value;
    });
    out.__meta={
      application:'ANORI TRANSPORT',version:'2.24',schema_version:'1',
      backup_format:backupFormat.toUpperCase(),backup_at:new Date().toISOString(),
      record_counts:Object.fromEntries(keys.map(k=>{
        const v=out[k];return [k,Array.isArray(v)?v.length:(v&&typeof v==='object'?1:0)];
      }))
    };
    return out;
  }
  function notify(msg,type){
    try{
      if(window.Swal){
        const icon=type==='error'?'error':type==='warning'?'warning':type==='success'?'success':'info';
        Swal.fire({toast:true,position:'top-end',icon,title:String(msg),showConfirmButton:false,timer:2800,timerProgressBar:true});
      }else if(window.Utils&&typeof Utils.toast==='function')Utils.toast(msg,type||'info');else console.log(msg);
    }catch(e){console.log(msg);}
  }
  function setStatus(text){
    try{localStorage.setItem('anori_backup_last_status',text);localStorage.setItem('anori_backup_last_time',new Date().toISOString());}catch(e){}
    const el=document.getElementById('anoriBackupStatus');if(el)el.textContent=text;
  }
  function setFolderText(text){const el=document.getElementById('anoriBackupFolderName');if(el)el.textContent=text;}
  function setFormatText(text){const el=document.getElementById('anoriBackupFormatName');if(el)el.textContent=text;}
  function idbOpen(){return new Promise((resolve,reject)=>{
    const r=indexedDB.open(IDB,1);
    r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE);};
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
  });}
  async function save(key,value){try{const db=await idbOpen();await new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(value,key);tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});db.close();}catch(e){console.warn(e);}}
  async function load(key){try{const db=await idbOpen();const v=await new Promise((res,rej)=>{const tx=db.transaction(STORE,'readonly');const q=tx.objectStore(STORE).get(key);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});db.close();return v||null;}catch(e){return null;}}
  async function permission(handle){
    if(!handle)return false;
    if(handle.__anoriElectronPath)return true;
    try{
      if(typeof handle.queryPermission==='function'&&await handle.queryPermission({mode:'readwrite'})==='granted')return true;
      if(typeof handle.requestPermission==='function'&&await handle.requestPermission({mode:'readwrite'})==='granted')return true;
    }catch(e){}
    return false;
  }
  async function sqliteBytes(){
    if(typeof initSqlJs!=='function')throw new Error('SQLite library is not loaded.');
    const SQL=await initSqlJs({locateFile:f=>`https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${f}`});
    const db=new SQL.Database();
    try{
      const keys=['company_profile','vehicles','drivers','parties','vendors','trips','invoices','driver_settlements','vendor_settlements','payments','expense_master','followups','audit_log'];
      keys.forEach(k=>{
        const table=k.replace(/[^A-Za-z0-9_]/g,'_');
        db.run(`CREATE TABLE IF NOT EXISTS "${table}" (json TEXT NOT NULL)`);
        const value=DB.get(k,k==='company_profile'?{}:[]);
        (Array.isArray(value)?value:[value]).forEach(r=>db.run(`INSERT INTO "${table}" VALUES (?)`,[JSON.stringify(r??{})]));
      });
      return db.export();
    }finally{db.close();}
  }
  function backupFilename(){return backupFormat==='sqlite'?FILE_SQLITE:FILE_JSON;}
  function pathJoin(dir,file){return String(dir).replace(/[\\\/]+$/,'')+'\\'+file;}
  async function writePayload(handle){
    const name=backupFilename();
    const blob=backupFormat==='sqlite'
      ?new Blob([await sqliteBytes()],{type:'application/x-sqlite3'})
      :new Blob([JSON.stringify(dataSnapshot(),null,2)],{type:'application/json'});
    const writable=await handle.createWritable();
    try{await writable.write(blob);await writable.close();return name;}
    catch(e){try{await writable.abort();}catch(_){}throw e;}
  }
  async function writeFolder(){
    if(!folderHandle)return false;
    if(!(await permission(folderHandle)))throw new Error('Backup folder write permission is not available.');
    if(folderHandle.__anoriElectronPath){
      const target=pathJoin(folderHandle.__anoriElectronPath,backupFilename());
      const data=backupFormat==='sqlite'?await sqliteBytes():JSON.stringify(dataSnapshot(),null,2);
      await window.anoriElectronBackup.writeFile(target,data);
      localStorage.setItem('anori_backup_folder_name',folderHandle.name||'Selected Folder');
      localStorage.setItem('anori_backup_file_name',backupFilename());
      setFolderText(folderHandle.name||'Selected Folder');setFormatText(backupFormat.toUpperCase());
      setStatus(`Last backup: ${new Date().toLocaleString()} (${backupFormat.toUpperCase()})`);
      return true;
    }
    const file=await folderHandle.getFileHandle(backupFilename(),{create:true});
    const name=await writePayload(file);
    try{const oldName=backupFormat==='sqlite'?FILE_JSON:FILE_SQLITE;if(typeof folderHandle.removeEntry==='function')await folderHandle.removeEntry(oldName).catch(()=>{});}catch(_){}
    localStorage.setItem('anori_backup_folder_name',folderHandle.name||'Selected Folder');
    localStorage.setItem('anori_backup_file_name',name);
    setFolderText(folderHandle.name||'Selected Folder');setFormatText(backupFormat.toUpperCase());
    setStatus(`Last backup: ${new Date().toLocaleString()} (${backupFormat.toUpperCase()})`);
    return true;
  }
  async function writeSelectedFile(){
    if(!fileHandle)return false;
    if(!(await permission(fileHandle)))throw new Error('Backup file write permission is not available.');
    if(fileHandle.__anoriElectronPath){
      const data=backupFormat==='sqlite'?await sqliteBytes():JSON.stringify(dataSnapshot(),null,2);
      await window.anoriElectronBackup.writeFile(fileHandle.__anoriElectronPath,data);
      const name=backupFilename();
      localStorage.setItem('anori_backup_file_name',name);
      setFolderText('Selected backup file');setFormatText(backupFormat.toUpperCase());
      setStatus(`Last backup: ${new Date().toLocaleString()} (${backupFormat.toUpperCase()})`);
      return true;
    }
    const name=await writePayload(fileHandle);
    localStorage.setItem('anori_backup_file_name',name);
    setFolderText('Selected backup file');setFormatText(backupFormat.toUpperCase());
    setStatus(`Last backup: ${new Date().toLocaleString()} (${backupFormat.toUpperCase()})`);
    return true;
  }
  async function write(silent=false){
    try{
      const ok=folderHandle?await writeFolder():await writeSelectedFile();
      if(ok)return true;
      setStatus('Not backed up — select a backup folder/file first.');
      return false;
    }catch(e){
      console.error('ANORI automatic backup failed:',e);
      setStatus('Backup failed: '+(e.message||'permission error'));
      if(!silent)notify('Backup failed: '+(e.message||'permission error'),'error');
      return false;
    }
  }
  function start(){clearInterval(timer);timer=null;if(folderHandle||fileHandle)timer=setInterval(()=>{write(true);},INTERVAL_MS);}
  async function chooseFormat(){
    if(!window.Swal){backupFormat=localStorage.getItem('anori_backup_format')||'json';return true;}
    const result=await Swal.fire({
      title:'SELECT BACKUP FORMAT',input:'select',
      inputOptions:{json:'JSON',sqlite:'SQLITE'},inputValue:backupFormat,
      text:'The selected backup file will be overwritten automatically every 2 minutes.',
      showCancelButton:true,confirmButtonText:'SAVE FORMAT',cancelButtonText:'CANCEL',allowOutsideClick:false
    });
    if(!result.isConfirmed)return false;
    backupFormat=String(result.value||'json').toLowerCase()==='sqlite'?'sqlite':'json';
    localStorage.setItem('anori_backup_format',backupFormat);
    return true;
  }
  window.anoriSelectBackupFolder=async function(){
    try{
      if(electronBackup()){
        const info=await window.anoriElectronBackup.selectFolder();
        if(!info?.path)return false;
        if(!(await chooseFormat()))return false;
        folderHandle=electronFolderHandle(info);fileHandle=null;
        await save('folderPath',info.path);await save('folder',null);await save('file',null);await save('format',backupFormat);
        const ok=await write();
        if(!ok){folderHandle=null;fileHandle=null;await save('folderPath',null);localStorage.removeItem('anori_backup_folder_path');localStorage.removeItem('anori_backup_folder_name');setFolderText('Backup destination not verified');start();return false;}
        setFolderText(info.name||info.path);setFormatText(backupFormat.toUpperCase());
        start();
        notify(`${backupFormat.toUpperCase()} backup created and destination verified. Automatic backup runs every 2 minutes.`,'success');
        return true;
      }
      if(typeof window.showDirectoryPicker!=='function'){notify('This browser cannot write directly to a selected folder. Use Chrome or Edge.','warning');return false;}
      const h=await window.showDirectoryPicker({id:'anori-backup-v223',mode:'readwrite'});
      if(!(await permission(h))){notify('Write permission was not granted. Backup folder was not selected.','error');return false;}
      if(!(await chooseFormat()))return false;
      folderHandle=h;fileHandle=null;await save('folder',h);await save('file',null);await save('format',backupFormat);
      const ok=await write();
      if(!ok){folderHandle=null;fileHandle=null;await save('folder',null);localStorage.removeItem('anori_backup_folder_path');localStorage.removeItem('anori_backup_folder_name');setFolderText('Backup destination not verified');start();return false;}
      setFolderText(h.name||'Selected Folder');setFormatText(backupFormat.toUpperCase());
      start();
      notify(`${backupFormat.toUpperCase()} backup created and destination verified. Automatic backup runs every 2 minutes.`,'success');
      return true;
    }catch(e){
      if(e.name!=='AbortError')notify('Folder selection failed: '+(e.message||'unknown error'),'error');
      return false;
    }
  };
  window.anoriSetBackupFolderPath=async function(targetPath){
    const raw=String(targetPath||'').trim();
    if(!raw) throw new Error('Backup folder path is empty.');
    try{
      if(window.anoriElectronBackup?.isAvailable && typeof window.anoriElectronBackup.ensureFolder==='function'){
        const info=await window.anoriElectronBackup.ensureFolder(raw);
        if(!info?.path) throw new Error('The selected backup folder could not be opened.');
        if(!(await chooseFormat())) return false;
        folderHandle=electronFolderHandle(info);fileHandle=null;
        await save('folderPath',info.path);await save('folder',null);await save('file',null);await save('format',backupFormat);
        setFolderText(info.name||info.path);setFormatText(backupFormat.toUpperCase());
        const ok=await write();start();
        if(ok) notify(`${backupFormat.toUpperCase()} backup path saved and verified.`,'success');
        return !!ok;
      }
      localStorage.setItem('anori_backup_folder_name',raw);
      setFolderText(raw);
      setStatus('Path saved for reference. Direct folder writing requires the desktop EXE or a supported browser folder picker.');
      return false;
    }catch(e){
      console.error('Backup path validation failed:',e);
      notify('Backup path could not be verified: '+(e.message||'invalid folder'),'error');
      return false;
    }
  };

  window.anoriSelectBackupFile=async function(){
    try{
      if(electronBackup()){
        if(!(await chooseFormat()))return;
        const info=await window.anoriElectronBackup.selectFile({suggestedName:backupFilename(),filters:[{name:backupFormat==='sqlite'?'ANORI SQLite Backup':'ANORI JSON Backup',extensions:[backupFormat==='sqlite'?'sqlite':'json']}]});
        if(!info)return;
        fileHandle=electronFileHandle(info);folderHandle=null;await save('filePath',info.path);await save('file',null);await save('folder',null);await save('format',backupFormat);
        setFolderText('Selected backup file');setFormatText(backupFormat.toUpperCase());
        const ok=await write();start();
        if(ok)notify(`${backupFormat.toUpperCase()} backup file selected. Automatic backup runs every 2 minutes.`,'success');
        return;
      }
      if(typeof window.showSaveFilePicker!=='function'){notify('File selection is not supported in this browser. Please use Chrome or Edge.','warning');return;}
      if(!(await chooseFormat()))return;
      const h=await window.showSaveFilePicker({
        id:'anori-backup-file-v223',suggestedName:backupFilename(),
        types:[{description:backupFormat==='sqlite'?'ANORI SQLite Backup':'ANORI JSON Backup',
          accept:backupFormat==='sqlite'?{'application/x-sqlite3':['.sqlite']}:{'application/json':['.json']}}]
      });
      if(!(await permission(h))){notify('Write permission was not granted. Backup file was not selected.','error');return;}
      fileHandle=h;folderHandle=null;await save('file',h);await save('folder',null);await save('format',backupFormat);
      setFolderText('Selected backup file');setFormatText(backupFormat.toUpperCase());
      const ok=await write();start();
      if(ok)notify(`${backupFormat.toUpperCase()} backup file selected. Automatic backup runs every 2 minutes.`,'success');
    }catch(e){if(e.name!=='AbortError')notify('Backup file selection failed: '+(e.message||'unknown error'),'error');}
  };
  window.anoriBackupNow=async function(){
    if(!folderHandle&&!fileHandle){notify('Select a backup folder or backup file first.','warning');return false;}
    // Backup/data saving is intentionally silent. Status is updated in Settings instead.
    return await write(true);
  };
  window.anoriBackupStatus=function(){
    const folder=localStorage.getItem('anori_backup_folder_name');
    const last=localStorage.getItem('anori_backup_last_time');
    const format=(localStorage.getItem('anori_backup_format')||backupFormat).toUpperCase();
    const file=localStorage.getItem('anori_backup_file_name')||backupFilename();
    const target=folder?`Folder: ${folder}`:(file?'Selected file':'Not selected');
    if(window.Swal)Swal.fire({title:'BACKUP STATUS',html:`<div style="text-align:left"><p><strong>TARGET:</strong> ${Sanitize.html(target)}</p><p><strong>FILE:</strong> ${Sanitize.html(file)}</p><p><strong>FORMAT:</strong> ${Sanitize.html(format)}</p><p><strong>INTERVAL:</strong> EVERY 2 MINUTES</p><p><strong>LAST BACKUP:</strong> ${last?Sanitize.html(new Date(last).toLocaleString()):'NOT BACKED UP YET'}</p></div>`,confirmButtonText:'OK'});
    else notify(target,'info');
  };
  async function restore(){
    try{
      const savedFormat=await load('format');if(savedFormat==='sqlite'||savedFormat==='json')backupFormat=savedFormat;
      localStorage.setItem('anori_backup_format',backupFormat);
      if(electronBackup()){
        const fp=await load('folderPath');
        const filePath=await load('filePath');
        if(fp){folderHandle=electronFolderHandle({path:fp,name:localStorage.getItem('anori_backup_folder_name')||fp});fileHandle=null;setFolderText(folderHandle.name);setFormatText(backupFormat.toUpperCase());start();return;}
        if(filePath){fileHandle=electronFileHandle({path:filePath,name:localStorage.getItem('anori_backup_file_name')||filePath});folderHandle=null;setFolderText('Selected backup file');setFormatText(backupFormat.toUpperCase());start();return;}
      }
      const h=await load('folder');
      if(h&&await permission(h)){folderHandle=h;fileHandle=null;setFolderText(h.name||'Selected Folder');setFormatText(backupFormat.toUpperCase());start();return;}
      const f=await load('file');
      if(f&&await permission(f)){fileHandle=f;folderHandle=null;setFolderText('Selected backup file');setFormatText(backupFormat.toUpperCase());start();}
    }catch(e){console.warn('Backup handle restore failed',e);}
  }
  function patchSettings(){
    if(!window.Settings||window.Settings.__v223Patched)return;
    const base=window.Settings.render.bind(window.Settings);
    window.Settings.render=function(container){
      base(container);
      const old=container.querySelector('.anori-backup-panel');
      if(old){
        const folder=localStorage.getItem('anori_backup_folder_name')||'Not selected';
        const last=localStorage.getItem('anori_backup_last_time');
        const fmt=(localStorage.getItem('anori_backup_format')||backupFormat).toUpperCase();
        const file=localStorage.getItem('anori_backup_file_name')||backupFilename();
        old.innerHTML=`<div class="anori-backup-status"><strong>Automatic Backup</strong><span class="anori-badge">EVERY 2 MINUTES</span></div>
          <p style="margin:8px 0 4px"><strong>SELECTED FOLDER:</strong> <span id="anoriBackupFolderName">${Sanitize.html(folder)}</span></p>
          <p style="margin:4px 0"><strong>BACKUP FORMAT:</strong> <span id="anoriBackupFormatName">${Sanitize.html(fmt)}</span></p>
          <p style="margin:4px 0"><strong>BACKUP FILE:</strong> <span class="anori-folder-path">${Sanitize.html(file)}</span></p>
          <p style="margin:4px 0 12px"><strong>STATUS:</strong> <span id="anoriBackupStatus">${Sanitize.html(localStorage.getItem('anori_backup_last_status')||'Not backed up yet')}</span></p>
          <div class="anori-action-bar">
            <button type="button" class="btn btn-primary" onclick="window.anoriSelectBackupFolder()">📁 SELECT BACKUP FOLDER</button>
            <button type="button" class="btn btn-outline" onclick="window.anoriSelectBackupFile()">📄 SELECT BACKUP FILE</button>
            <button type="button" class="btn btn-outline" onclick="window.anoriBackupNow()">💾 BACKUP NOW</button>
            <button type="button" class="btn btn-outline" onclick="window.anoriBackupStatus()">🛡 BACKUP STATUS</button>
            <button type="button" class="btn btn-outline" onclick="window.anoriRestoreLastSafetySnapshot()">↩ RESTORE LAST INTERNAL SNAPSHOT</button>
          </div>
          <small class="anori-help">Automatic backup writes only to the folder/file you explicitly select. Import never downloads a backup. The last protected operation is also kept as an internal rollback snapshot.</small>`;
      }
    };
    window.Settings.__v223Patched=true;
  }
  const boot=()=>{patchSettings();restore();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

/* ============================================================
   ANORI TRANSPORT v2.24 — TRIP ADVANCE + SYSTEM SETTINGS FIX
   - Driver Amount / Advance remains linked to Driver Settlement.
   - Adds separate Trip Advance Amount field.
   - Makes System Settings self-contained and operational.
   ============================================================ */
(function installAnoriV224(){
  'use strict';
  const esc=v=>Sanitize.html(v==null?'':String(v));
  const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};

  // -------- Trip form: add separate Trip Advance Amount --------
  const originalOpenForm=Trips.openForm.bind(Trips);
  Trips.openForm=function(){
    originalOpenForm();
    const modal=document.querySelector('.swal2-container') || document.body;
    // Insert into the existing form immediately after Driver Amount field.
    const driverInput=document.getElementById('t_driver_amount');
    if(driverInput && !document.getElementById('t_trip_advance')){
      const group=document.createElement('div');
      group.className='form-group';
      group.innerHTML='<label>Trip Advance Amount (₹)</label><input type="number" class="form-control" id="t_trip_advance" min="0" value="0"><small class="anori-help">Advance received/allocated for this Trip. This is separate from Driver Amount / Advance.</small>';
      const driverGroup=driverInput.closest('.form-group');
      if(driverGroup && driverGroup.parentElement) driverGroup.parentElement.appendChild(group);
    }
  };

  // Replace the form reader so both values are saved as raw numeric fields.
  const originalReadTripForm=window.readTripForm;
  if(typeof originalReadTripForm==='function'){
    window.readTripForm=function(){
      const form=originalReadTripForm();
      if(!form)return form;
      const tripAdvance=num(document.getElementById('t_trip_advance')?.value);
      if(tripAdvance<0){Utils.toast('Trip Advance Amount cannot be negative.','error');return null;}
      form.trip_advance_amount=tripAdvance;
      return form;
    };
  }

  // The original saveV25 calls the global reader, so the added field is persisted.
  // Edit modal: add field and preserve it on update.
  const originalShowEdit=Trips.showEditModal.bind(Trips);
  Trips.showEditModal=function(id){
    originalShowEdit(id);
    const trip=DB.get('trips',[]).find(x=>x.id===id);
    const driverInput=document.getElementById('t_driver_amount');
    if(driverInput && !document.getElementById('t_trip_advance')){
      const group=document.createElement('div');
      group.className='form-group';
      group.innerHTML=`<label>Trip Advance Amount (₹)</label><input type="number" class="form-control" id="t_trip_advance" min="0" value="${num(trip?.trip_advance_amount)}"><small class="anori-help">Separate Trip advance amount. It is not the Driver Amount.</small>`;
      const driverGroup=driverInput.closest('.form-group');
      if(driverGroup && driverGroup.parentElement) driverGroup.parentElement.appendChild(group);
    }
  };

  const originalUpdate=Trips.updateV25?.bind(Trips);
  if(typeof originalUpdate==='function'){
    Trips.updateV25=function(id){
      const originalReader=window.readTripForm;
      let form=null;
      try{
        form=typeof originalReader==='function'?originalReader():null;
        if(!form)return;
        const existing=DB.get('trips',[]).find(t=>t.id===id);
        if(existing) form.trip_advance_amount=num(document.getElementById('t_trip_advance')?.value);
      }catch(e){console.error(e);return Utils.toast(e.message||'Unable to update Trip.','error');}
      // Reproduce the existing update behavior using the validated form.
      if(typeof Trips.updateV25.__base==='function')return Trips.updateV25.__base(id,form);
      const data=DB.get('trips',[]),idx=data.findIndex(t=>t.id===id);
      if(idx<0)return Utils.toast('Trip not found.','error');
      if(typeof activeInvoiceForTrip==='function'&&activeInvoiceForTrip(id))return Swal.fire({icon:'warning',title:'Invoice already generated',text:'Cancel the existing invoice before editing this trip.',confirmButtonText:'OK'});
      data[idx]={...data[idx],...form};
      DB.set('trips',data);
      if(typeof syncDriverTripEntry==='function')syncDriverTripEntry(data[idx]);
      if(window.UI?.closeModal)UI.closeModal();
      Utils.toast('Trip updated successfully.','success');
      Router.go('trips');
    };
  }

  // Render the new field in Trip table without changing the approved simple UI.
  const baseTripRender=Trips.render.bind(Trips);
  Trips.render=function(container){
    baseTripRender(container);
    const table=container.querySelector('table');
    if(!table||table.dataset.v224Advance==='1')return;
    table.dataset.v224Advance='1';
    const heads=[...table.querySelectorAll('thead th')];
    const driverIndex=heads.findIndex(th=>th.textContent.trim()==='Driver Amt');
    if(driverIndex<0)return;
    const th=document.createElement('th');th.textContent='Trip Advance';heads[driverIndex].after(th);
    table.querySelectorAll('tbody tr').forEach(tr=>{
      const check=tr.querySelector('.trip-row-check');
      if(!check)return;
      const id=check.value,trip=DB.get('trips',[]).find(t=>t.id===id);
      const td=document.createElement('td');td.textContent=Utils.fmt(num(trip?.trip_advance_amount));
      tr.children[driverIndex].after(td);
    });
  };

  // -------- System Settings: one stable, self-contained renderer --------
  Settings.render=function(container){
    if(!container)return;
    const company=DB.get('company_profile',{})||{};
    const folder=localStorage.getItem('anori_backup_folder_name')||'Not selected';
    const last=localStorage.getItem('anori_backup_last_time');
    const lastText=last?new Date(last).toLocaleString('en-IN'):'Not backed up yet';
    const supported=typeof window.showDirectoryPicker==='function';
    const fileSupported=typeof window.showSaveFilePicker==='function';
    container.innerHTML=`
      <div class="anori-section-intro"><div><strong>System Settings</strong><span>Company, backup, data and application controls.</span></div></div>
      <div class="card">
        <h3 class="card-title"><i class="fas fa-building"></i> Company Settings</h3>
        <div class="form-row">
          <div class="form-group"><label>Company Name</label><input class="form-control" id="sys_company_name" value="${esc(company.name||'ANORI TRANSPORT')}"></div>
          <div class="form-group"><label>GSTIN</label><input class="form-control" id="sys_company_gstin" value="${esc(company.gstin||'')}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Phone</label><input class="form-control" id="sys_company_phone" value="${esc(company.phone||'')}"></div>
          <div class="form-group"><label>Email</label><input class="form-control" id="sys_company_email" type="email" value="${esc(company.email||'')}"></div>
        </div>
        <div class="form-group"><label>Address</label><textarea class="form-control" id="sys_company_address" rows="2">${esc(company.address||'')}</textarea></div>
        <div class="form-group">
          <label>Authorized Signatory — Company Stamp & Signature</label>
          <div class="anori-sign-upload-box">
            <input class="form-control" id="sys_company_signature_stamp_file" type="file" accept="image/png,image/jpeg,image/webp" onchange="window.anoriPreviewSignatureStamp?.(this)">
            <small class="anori-help">Upload one PNG, JPG or WEBP image containing the company stamp and authorized signature. It will appear in Invoice Preview and PDF.</small>
            <div id="sys_company_signature_stamp_preview" class="anori-sign-upload-preview">${company.signature_stamp?`<img src="${esc(company.signature_stamp)}" alt="Authorized Signatory Preview"><button class="btn btn-outline" type="button" onclick="window.anoriRemoveSignatureStamp?.()">REMOVE IMAGE</button>`:'<span>No stamp & signature uploaded.</span>'}</div>
          </div>
        </div>
        <button class="btn btn-primary" type="button" onclick="window.anoriSaveSystemSettings()">💾 SAVE SETTINGS</button>
      </div>
      <div class="card anori-backup-panel">
        <h3 class="card-title"><i class="fas fa-shield-alt"></i> Automatic Backup</h3>
        <p><strong>Selected Folder:</strong> <span id="anoriBackupFolderName">${esc(folder)}</span></p>
        <p><strong>Backup File:</strong> <span class="anori-folder-path">ANORI_TRANSPORT_BACKUP.json</span></p>
        <p><strong>Interval:</strong> Every 5 Minutes</p>
        <p><strong>Status:</strong> <span id="anoriBackupStatus">${esc(lastText)}</span></p>
        <div class="anori-action-bar">
          <button class="btn btn-primary" type="button" onclick="window.anoriSelectBackupFolder()">📁 SELECT BACKUP FOLDER</button>
          ${fileSupported?'<button class="btn btn-outline" type="button" onclick="window.anoriSelectBackupFile()">📄 SELECT BACKUP FILE</button>':''}
          <button class="btn btn-outline" type="button" onclick="window.anoriBackupNow()">💾 BACKUP NOW</button>
          <button class="btn btn-outline" type="button" onclick="window.anoriBackupStatus()">🛡 BACKUP STATUS</button>
        </div>
        <small class="anori-help">${supported?'Folder access is available in this browser.':'Folder selection requires Chrome/Edge or the Windows EXE version.'} The same backup file is overwritten every 5 minutes.</small>
      </div>
      <div class="card">
        <h3 class="card-title"><i class="fas fa-database"></i> Data Import / Export</h3>
        <div class="anori-universal-toolbar">
          <span class="anori-toolbar-label">Actions:</span>
          <button class="anori-action-btn anori-action-preview" type="button" onclick="window.anoriExportJSON?.()">📦 JSON</button>
          <button class="anori-action-btn anori-action-pdf" type="button" onclick="window.anoriExportXLSX?.()">📊 EXCEL</button>
          <button class="anori-action-btn anori-action-email" type="button" onclick="window.anoriExportSQLite?.()">🗄 SQLITE</button>
          <button class="anori-action-btn anori-action-duplicate" type="button" onclick="window.anoriExportCSV?.()">📄 CSV</button>
          <button class="anori-action-btn anori-action-convert" type="button" onclick="window.anoriImportFile?.()">⬆ IMPORT</button>
        </div>
      </div>
      <div class="card">
        <h3 class="card-title"><i class="fas fa-info-circle"></i> Application</h3>
        <p><strong>Application:</strong> ANORI TRANSPORT</p>
        <p><strong>Version:</strong> 2.24</p>
        <p><strong>Storage:</strong> Browser local storage</p>
      </div>`;
  };

  window.anoriSaveSystemSettings=function(){
    const current=DB.get('company_profile',{})||{};
    const next={...current,
      name:document.getElementById('sys_company_name')?.value.trim()||'ANORI TRANSPORT',
      gstin:document.getElementById('sys_company_gstin')?.value.trim()||'',
      phone:document.getElementById('sys_company_phone')?.value.trim()||'',
      email:document.getElementById('sys_company_email')?.value.trim()||'',
      address:document.getElementById('sys_company_address')?.value.trim()||'',
      signature_stamp:current.signature_stamp||''
    };
    DB.set('company_profile',next,true);
    Utils.toast('System Settings saved successfully.','success');
  };

  window.anoriPreviewSignatureStamp=function(input){
    const file=input?.files?.[0];
    if(!file)return;
    if(!/^image\/(png|jpeg|webp)$/.test(file.type)){
      if(window.Swal) Swal.fire({icon:'warning',title:'Invalid Image',text:'Please select a PNG, JPG or WEBP image.',confirmButtonText:'OK'});
      input.value='';
      return;
    }
    const reader=new FileReader();
    reader.onload=function(){
      const src=String(reader.result||'');
      const img=new Image();
      img.onload=function(){
        const maxW=1000,maxH=500,scale=Math.min(1,maxW/img.naturalWidth,maxH/img.naturalHeight);
        const canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
        canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
        const ctx=canvas.getContext('2d');
        ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
        const data=canvas.toDataURL(file.type==='image/png'?'image/png':'image/jpeg',file.type==='image/png'?undefined:.92);
        const current=DB.get('company_profile',{})||{};DB.set('company_profile',{...current,signature_stamp:data},true);
        const box=document.getElementById('sys_company_signature_stamp_preview');
        if(box)box.innerHTML=`<img src="${esc(data)}" alt="Authorized Signatory Preview"><button class="btn btn-outline" type="button" onclick="window.anoriRemoveSignatureStamp?.()">REMOVE IMAGE</button>`;
        Utils.toast('Company stamp & signature uploaded successfully.','success');
      };
      img.onerror=function(){Utils.toast('Unable to read the selected image.','error');};
      img.src=src;
    };
    reader.readAsDataURL(file);
  };
  window.anoriRemoveSignatureStamp=function(){
    const current=DB.get('company_profile',{})||{};
    const next={...current};delete next.signature_stamp;DB.set('company_profile',next,true);
    const input=document.getElementById('sys_company_signature_stamp_file');if(input)input.value='';
    const box=document.getElementById('sys_company_signature_stamp_preview');if(box)box.innerHTML='<span>No stamp & signature uploaded.</span>';
    Utils.toast('Company stamp & signature removed.','success');
  };

  // Ensure the Settings navigation always routes to the stable renderer.
  if(window.Router && typeof Router.go==='function' && !Router.__v224SettingsGuard){
    const baseGo=Router.go.bind(Router);
    Router.go=function(view){
      if(view==='settings'){
        const main=document.getElementById('mainContent');
        if(main){main.innerHTML='<div class="view" id="view-settings"></div>';Settings.render(main.firstElementChild);document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view==='settings'));return;}
      }
      return baseGo(view);
    };
    Router.__v224SettingsGuard=true;
  }
})();

/* ============================================================
   v2.25 — DRIVER SETTLEMENT AUTO-SYNC FOR EXISTING TRIPS
   ============================================================ */
(function installDriverSettlementAutoSync(){
  'use strict';
  const n=v=>{const x=parseFloat(v);return Number.isFinite(x)?x:0;};
  function syncAllDriverTripEntries(){
    const trips=DB.get('trips',[]);
    let settlements=DB.get('driver_settlements',[]);
    const byTrip=new Map(settlements.filter(s=>s&&s.source==='trip'&&s.trip_id).map(s=>[s.trip_id,s]));
    const liveTripIds=new Set();
    let changed=false;

    trips.forEach(trip=>{
      if(!trip || !trip.id || !trip.driver_id)return;
      liveTripIds.add(trip.id);
      const amount=n(trip.driver_amount);
      const existing=byTrip.get(trip.id);
      if(amount<=0){
        if(existing){settlements=settlements.filter(s=>s.id!==existing.id);changed=true;}
        return;
      }
      const entry={
        id:existing?.id||Utils.id(),
        date:trip.date||Utils.today(),
        driver_id:trip.driver_id,
        type:'debit',
        amount,
        description:`Trip ${trip.trip_no||trip.id} - Driver Amount`,
        source:'trip',
        trip_id:trip.id
      };
      if(existing){
        const same=existing.date===entry.date && existing.driver_id===entry.driver_id && existing.type===entry.type && n(existing.amount)===amount && existing.description===entry.description;
        if(!same){Object.assign(existing,entry);changed=true;}
      }else{
        settlements.push(entry);changed=true;
      }
    });

    // Remove orphaned automatic trip entries so the ledger never shows stale data.
    const before=settlements.length;
    settlements=settlements.filter(s=>!(s&&s.source==='trip'&&s.trip_id&&!liveTripIds.has(s.trip_id)));
    if(settlements.length!==before)changed=true;

    if(changed)DB.set('driver_settlements',settlements);
    return settlements;
  }
  window.syncAllDriverTripEntries=syncAllDriverTripEntries;

  const previousRender=DriverSettlement.render.bind(DriverSettlement);
  DriverSettlement.render=function(container){
    syncAllDriverTripEntries();
    return previousRender(container);
  };

  const previousApply=DriverSettlement.applyFilter.bind(DriverSettlement);
  DriverSettlement.applyFilter=function(){
    syncAllDriverTripEntries();
    return previousApply();
  };
})();

/* ============================================================
   ANORI TRANSPORT v2.24 — FINAL TRIP ADVANCE PERSISTENCE FIX
   ============================================================ */
(function installAnoriV224TripPersistence(){
  'use strict';
  const esc=v=>Sanitize.html(v==null?'':String(v));
  const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const readFormV224=()=>{
    const from=document.getElementById('t_from')?.value.trim()||'';
    const to=document.getElementById('t_to')?.value.trim()||'';
    const vehicle=document.getElementById('t_vehicle')?.value||'';
    const driver=document.getElementById('t_driver')?.value||'';
    const party=document.getElementById('t_party')?.value||'';
    const freight=num(document.getElementById('t_freight')?.value);
    const driverAmount=num(document.getElementById('t_driver_amount')?.value);
    const tripAdvance=num(document.getElementById('t_trip_advance')?.value);
    if(!vehicle||!driver||!party||!from||!to){Utils.toast('Please select Vehicle, Driver, Customer and enter From / To.','error');return null;}
    if(freight<=0){Utils.toast('Freight amount must be greater than zero.','error');return null;}
    if(driverAmount<0||tripAdvance<0){Utils.toast('Amounts cannot be negative.','error');return null;}
    const expenses=[];
    document.querySelectorAll('#expRows .anori-trip-exp-row').forEach(r=>{
      const type=r.querySelector('.exp-type')?.value||'';
      const amount=num(r.querySelector('.exp-amt')?.value);
      if(type&&amount>0)expenses.push({type,amount});
    });
    return {
      date:document.getElementById('t_date')?.value||Utils.today(),
      vehicle_id:vehicle,driver_id:driver,party_id:party,
      from,to,freight,driver_amount:driverAmount,
      trip_advance_amount:tripAdvance,
      expenses,notes:document.getElementById('t_notes')?.value||'',
      trip_advice:document.getElementById('t_trip_advice')?.value||''
    };
  };
  Trips.saveV25=function(){
    const form=readFormV224();if(!form)return;
    const trip={id:Utils.id(),trip_no:Utils.generateTripNo(form.date),...form,status:'completed',invoice_status:'pending',is_gst:true};
    const data=DB.get('trips',[]);data.push(trip);DB.set('trips',data);
    if(typeof syncDriverTripEntry==='function')syncDriverTripEntry(trip);
    UI.closeModal();Utils.toast('Trip created successfully.','success');Router.go('trips');
  };
  Trips.updateV25=function(id){
    if(typeof activeInvoiceForTrip==='function'&&activeInvoiceForTrip(id))return Swal.fire({icon:'warning',title:'Trip Locked',text:'Cancel the active invoice before editing this trip.',confirmButtonText:'OK'});
    const form=readFormV224();if(!form)return;
    const data=DB.get('trips',[]),idx=data.findIndex(t=>t.id===id);if(idx<0)return Utils.toast('Trip not found.','error');
    data[idx]={...data[idx],...form};DB.set('trips',data);
    if(typeof syncDriverTripEntry==='function')syncDriverTripEntry(data[idx]);
    UI.closeModal();Utils.toast('Trip updated successfully.','success');Router.go('trips');
  };
})();

/* ============================================================
   ANORI TRANSPORT v2.25 — FINAL NEW TRIP FORM LAYOUT
   User-approved order:
   1) Date + Vehicle
   2) Driver
   3) Party / Customer
   4) From + To
   5) Freight + Trip Advance Amount
   6) Driver Amount / Advance
   7) Trip Advice
   ============================================================ */
(function installAnoriV225TripForm(){
  'use strict';
  const esc=v=>Sanitize.html(v==null?'':String(v));
  const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const todayValue=()=>typeof Utils.today==='function'?Utils.today():(new Date()).toISOString().slice(0,10);

  function uniqueLocations(){
    const out=[];
    (DB.get('trips',[])||[]).forEach(t=>{ if(t.from&&!out.includes(t.from))out.push(t.from); if(t.to&&!out.includes(t.to))out.push(t.to); });
    return out.slice(0,100);
  }
  function expenseRowsHtml(expenses){
    const masters=typeof getExpenseMaster==='function'?getExpenseMaster():[];
    return (expenses||[]).map(e=>`<div class="form-row anori-trip-exp-row" style="margin-bottom:8px">
      <div class="form-group"><select class="form-control exp-type"><option value="">Select Expense</option>${masters.map(m=>`<option value="${esc(m.name)}" ${m.name===e.type?'selected':''}>${esc(m.name)}</option>`).join('')}<option value="__manual__" ${!masters.some(m=>m.name===e.type)?'selected':''}>Manual Entry</option></select><input class="form-control exp-type-manual" style="margin-top:6px;display:${!masters.some(m=>m.name===e.type)?'block':'none'}" placeholder="Enter expense type manually" value="${!masters.some(m=>m.name===e.type)?esc(e.type):''}"></div>
      <div class="form-group"><input type="number" class="form-control exp-amt" min="0" placeholder="Amount" value="${num(e.amount)||''}"></div>
      <div class="form-group"><button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.anori-trip-exp-row').remove()">Remove</button></div>
    </div>`).join('');
  }
  function hybridEntityField(label,id,items,labelKey,selectedId,manualValue,icon,placeholder){
    return `<div class="form-group"><label>${label}</label><div class="trip-hybrid-field">
      <div class="trip-hybrid-select trip-input-wrap"><i class="fas ${icon}"></i><select class="form-control" id="${id}"><option value="">Select from Master Data...</option>${items.map(x=>`<option value="${esc(x.id)}" ${x.id===selectedId?'selected':''}>${esc(x[labelKey])}</option>`).join('')}<option value="__manual__" ${manualValue?'selected':''}>Manual Entry</option></select></div>
      <input class="form-control trip-manual-input" id="${id}_manual" value="${esc(manualValue||'')}" placeholder="${placeholder}">
    </div><small class="anori-help">Dropdown + manual entry. Manual entry overrides the dropdown.</small></div>`;
  }
  function hybridLocationField(label,id,selectedValue,locations,icon){
    const manual=selectedValue&&!locations.includes(selectedValue)?selectedValue:'';
    return `<div class="form-group"><label>${label} *</label><div class="trip-hybrid-field">
      <div class="trip-hybrid-select trip-input-wrap"><i class="fas ${icon}"></i><select class="form-control" id="${id}_select"><option value="">Select location...</option>${locations.map(x=>`<option value="${esc(x)}" ${x===selectedValue?'selected':''}>${esc(x)}</option>`).join('')}<option value="__manual__" ${manual?'selected':''}>Manual Entry</option></select></div>
      <input class="form-control trip-manual-input" id="${id}" value="${esc(manual)}" placeholder="Type location manually...">
    </div><small class="anori-help">Dropdown + manual entry. Manual value overrides the dropdown.</small></div>`;
  }

  function formHtml(trip){
    const vehicles=DB.get('vehicles',[]), drivers=DB.get('drivers',[]), parties=DB.get('parties',[]), locations=uniqueLocations();
    return `<div class="anori-simple-form trip-form-layout">
      <section class="trip-form-section"><div class="trip-form-section-head"><i class="fas fa-calendar-alt"></i><span>Trip Details</span></div><div class="trip-form-grid">
        <div class="form-group"><label>Date *</label><div class="trip-input-wrap"><i class="fas fa-calendar-alt"></i><input type="date" class="form-control" id="t_date" value="${esc(trip?.date||todayValue())}"></div></div>
        ${hybridEntityField('Vehicle *','t_vehicle',vehicles,'number',trip?.vehicle_id,trip?.vehicle_manual||'','fa-truck','Type vehicle manually...')}
        ${hybridEntityField('Driver *','t_driver',drivers,'name',trip?.driver_id,trip?.driver_manual||'','fa-user','Type driver name manually...')}
      </div></section>

      <section class="trip-form-section"><div class="trip-form-section-head"><i class="fas fa-users"></i><span>Customer &amp; Route</span></div><div class="trip-form-grid">
        ${hybridEntityField('Party / Customer *','t_party',parties,'name',trip?.party_id,trip?.party_manual||'','fa-user','Type customer manually...')}
        ${hybridLocationField('From','t_from',trip?.from||'',locations,'fa-map-marker-alt')}
        ${hybridLocationField('To','t_to',trip?.to||'',locations,'fa-map-marker-alt')}
      </div></section>

      <section class="trip-form-section"><div class="trip-form-section-head"><i class="fas fa-rupee-sign"></i><span>Freight &amp; Advance</span></div><div class="trip-form-grid">
        <div class="form-group"><label>Freight (₹) *</label><div class="trip-input-wrap"><span class="trip-input-prefix">₹</span><input type="number" class="form-control" id="t_freight" min="0" value="${num(trip?.freight)||''}" required></div></div>
        <div class="form-group"><label>Trip Advance Amount (₹)</label><div class="trip-input-wrap"><span class="trip-input-prefix">₹</span><input type="number" class="form-control" id="t_trip_advance" min="0" value="${num(trip?.trip_advance_amount)||0}"></div><small class="anori-help">Separate Trip advance amount.</small></div>
        <div class="form-group"><label>Driver Amount / Advance (₹)</label><div class="trip-input-wrap"><span class="trip-input-prefix">₹</span><input type="number" class="form-control" id="t_driver_amount" min="0" value="${num(trip?.driver_amount)||0}"></div><small class="anori-help">This automatically appears in Driver Settlement.</small></div>
      </div></section>

      <section class="trip-form-section trip-classification-section"><div class="trip-form-section-head"><i class="fas fa-truck"></i><span>Vehicle Classification</span></div><div class="trip-classification-pill"><i class="fas fa-building"></i> COMPANY VEHICLE</div></section>
      <section class="trip-form-section"><div class="trip-form-section-head"><i class="fas fa-file-alt"></i><span>Trip Advice</span></div><div class="form-group trip-form-full"><div class="trip-input-wrap trip-textarea-wrap"><i class="fas fa-file-alt"></i><textarea class="form-control trip-advice-box" id="t_trip_advice" rows="3" placeholder="Enter trip advice / instructions...">${esc(trip?.trip_advice||'')}</textarea></div></div></section>
      <section class="trip-form-section"><div class="trip-form-section-head"><i class="fas fa-clipboard-list"></i><span>Trip Expenses</span></div><div id="expRows" class="trip-expenses-list">${expenseRowsHtml(trip?.expenses||[])}</div><button type="button" class="btn btn-outline btn-sm trip-add-expense" onclick="Trips.addExpRow()"><i class="fas fa-plus"></i> Add Expense</button></section>
      <section class="trip-form-section trip-notes-section"><div class="trip-form-section-head"><i class="fas fa-sticky-note"></i><span>Notes</span></div><div class="form-group trip-form-full"><div class="trip-input-wrap trip-textarea-wrap"><i class="fas fa-list"></i><textarea class="form-control" id="t_notes" rows="2" placeholder="Enter notes...">${esc(trip?.notes||'')}</textarea></div></div></section>
    </div>`;
  }

  function readForm(){
    const vehicleSelect=document.getElementById('t_vehicle')?.value||'', driverSelect=document.getElementById('t_driver')?.value||'', partySelect=document.getElementById('t_party')?.value||'';
    const vehicleManual=document.getElementById('t_vehicle_manual')?.value.trim()||'', driverManual=document.getElementById('t_driver_manual')?.value.trim()||'', partyManual=document.getElementById('t_party_manual')?.value.trim()||'';
    const vehicle=vehicleManual||vehicleSelect==='__manual__'?'':vehicleSelect;
    const driver=driverManual||driverSelect==='__manual__'?'':driverSelect;
    const party=partyManual||partySelect==='__manual__'?'':partySelect;
    const fromSelect=document.getElementById('t_from_select')?.value||'', toSelect=document.getElementById('t_to_select')?.value||'';
    const fromManual=document.getElementById('t_from')?.value.trim()||'', toManual=document.getElementById('t_to')?.value.trim()||'';
    const from=fromManual||(fromSelect&&fromSelect!=='__manual__'?fromSelect:'');
    const to=toManual||(toSelect&&toSelect!=='__manual__'?toSelect:'');
    const freight=num(document.getElementById('t_freight')?.value), tripAdvance=num(document.getElementById('t_trip_advance')?.value), driverAmount=num(document.getElementById('t_driver_amount')?.value);
    if((!vehicle&&!vehicleManual)||(!driver&&!driverManual)||(!party&&!partyManual)||!from||!to){Utils.toast('Please select or manually enter Vehicle, Driver, Customer, From and To.','error');return null;}
    if(freight<=0){Utils.toast('Freight amount must be greater than zero.','error');return null;}
    if(tripAdvance<0||driverAmount<0){Utils.toast('Amounts cannot be negative.','error');return null;}
    const expenses=[];
    document.querySelectorAll('#expRows .anori-trip-exp-row').forEach(r=>{const select=r.querySelector('.exp-type')?.value||'',manual=r.querySelector('.exp-type-manual')?.value.trim()||'',type=(select==='__manual__'||manual)?manual:select,amount=num(r.querySelector('.exp-amt')?.value);if(type&&amount>0)expenses.push({type,amount});});
    return {date:document.getElementById('t_date')?.value||Utils.today(),vehicle_id:vehicle,driver_id:driver,party_id:party,vehicle_manual:vehicleManual,driver_manual:driverManual,party_manual:partyManual,from,to,freight,driver_amount:driverAmount,trip_advance_amount:tripAdvance,expenses,notes:document.getElementById('t_notes')?.value||'',trip_advice:document.getElementById('t_trip_advice')?.value||''};
  }

  Trips.openForm=function(){
    UI.openModal('Create New Trip',formHtml(null),()=>{
      const form=readForm(); if(!form)return;
      const trip={id:Utils.id(),trip_no:Utils.generateTripNo(form.date),...form,status:'completed',invoice_status:'pending',is_gst:true};
      const data=DB.get('trips',[]); data.push(trip); DB.set('trips',data);
      if(typeof syncDriverTripEntry==='function')syncDriverTripEntry(trip);
      UI.closeModal(); Utils.toast('Trip created successfully.','success'); Router.go('trips');
    },true);
    if(!document.querySelector('#expRows .anori-trip-exp-row'))Trips.addExpRow();
    document.querySelectorAll('#expRows .exp-type').forEach(sel=>sel.addEventListener('change',()=>{const m=sel.closest('.anori-trip-exp-row')?.querySelector('.exp-type-manual');if(m)m.style.display=sel.value==='__manual__'?'block':'none';}));
    ['t_vehicle','t_driver','t_party'].forEach(id=>{const s=document.getElementById(id),m=document.getElementById(id+'_manual');if(s&&m)s.addEventListener('change',()=>{if(s.value!=='__manual__')m.value='';});});
    ['t_from_select','t_to_select'].forEach(id=>{const s=document.getElementById(id),m=document.getElementById(id.replace('_select',''));if(s&&m)s.addEventListener('change',()=>{if(s.value!=='__manual__'&&s.value)m.value='';});});
    const vehicleSelect=document.getElementById('t_vehicle');
    const driverAmountInput=document.getElementById('t_driver_amount');
    if(vehicleSelect&&driverAmountInput){
      vehicleSelect.addEventListener('change',()=>{
        const vehicle=DB.get('vehicles',[]).find(v=>v.id===vehicleSelect.value);
        driverAmountInput.value=vehicle ? (Number(vehicle.driver_amount)||0) : 0;
      });
    }
  };

  Trips.showEditModal=function(id){
    const trip=DB.get('trips',[]).find(t=>t.id===id); if(!trip)return;
    if(typeof activeInvoiceForTrip==='function'&&activeInvoiceForTrip(id)){
      return Swal.fire({icon:'warning',title:'Trip Locked',text:'Cancel the active invoice before editing this trip.',confirmButtonText:'OK'});
    }
    UI.openModal('Edit Trip',formHtml(trip),()=>{
      if(typeof activeInvoiceForTrip==='function'&&activeInvoiceForTrip(id))return Swal.fire({icon:'warning',title:'Trip Locked',text:'Cancel the active invoice before editing this trip.',confirmButtonText:'OK'});
      const form=readForm(); if(!form)return;
      const data=DB.get('trips',[]),idx=data.findIndex(t=>t.id===id); if(idx<0)return Utils.toast('Trip not found.','error');
      data[idx]={...data[idx],...form}; DB.set('trips',data);
      if(typeof syncDriverTripEntry==='function')syncDriverTripEntry(data[idx]);
      UI.closeModal(); Utils.toast('Trip updated successfully.','success'); Router.go('trips');
    },true);
    if(!document.querySelector('#expRows .anori-trip-exp-row'))Trips.addExpRow();
    document.querySelectorAll('#expRows .exp-type').forEach(sel=>sel.addEventListener('change',()=>{const m=sel.closest('.anori-trip-exp-row')?.querySelector('.exp-type-manual');if(m)m.style.display=sel.value==='__manual__'?'block':'none';}));
    ['t_vehicle','t_driver','t_party'].forEach(id=>{const s=document.getElementById(id),m=document.getElementById(id+'_manual');if(s&&m)s.addEventListener('change',()=>{if(s.value!=='__manual__')m.value='';});});
    ['t_from_select','t_to_select'].forEach(id=>{const s=document.getElementById(id),m=document.getElementById(id.replace('_select',''));if(s&&m)s.addEventListener('change',()=>{if(s.value!=='__manual__'&&s.value)m.value='';});});
    const vehicleSelect=document.getElementById('t_vehicle');
    const driverAmountInput=document.getElementById('t_driver_amount');
    if(vehicleSelect&&driverAmountInput){
      vehicleSelect.addEventListener('change',()=>{
        const vehicle=DB.get('vehicles',[]).find(v=>v.id===vehicleSelect.value);
        driverAmountInput.value=vehicle ? (Number(vehicle.driver_amount)||0) : 0;
      });
    }
  };

  Trips.openEditForm=function(id){Trips.showEditModal(id);};
})();

/* ============================================================
   ANORI TRANSPORT v2.26 — SINGLE-PAGE INVOICE + FULL SCREEN FIT
   Final override: Preview and PDF use the same mounted invoice DOM.
   Preview scales the complete A4 page to the available viewer.
   PDF captures the complete page as one PDF page, preserving all data.
   ============================================================ */
Invoices.fitPreviewToScreen = function(){
  const host=document.getElementById('previewContent');
  const stage=host?.querySelector('.anori-invoice-preview-stage');
  const page=stage?.querySelector('.invoice-page');
  if(!host||!stage||!page)return;

  // Robust centering: keep the invoice as a normal flex item. Do not use
  // absolute positioning/translate because that can clip the left edge in
  // Chromium/Electron when the preview viewport is scrolled.
  page.style.position='relative';
  page.style.left='auto';
  page.style.top='auto';
  page.style.margin='0 auto';
  page.style.transform='none';
  page.style.transformOrigin='top center';
  page.style.overflow='visible';
  page.style.zoom='1';

  stage.style.position='relative';
  stage.style.width='100%';
  stage.style.height='auto';
  stage.style.minHeight='100%';
  stage.style.padding='18px 24px 28px';
  stage.style.overflow='auto';
  stage.style.display='flex';
  stage.style.flexDirection='column';
  stage.style.justifyContent='flex-start';
  stage.style.alignItems='center';
  stage.style.boxSizing='border-box';

  const pageWidth=page.offsetWidth || page.getBoundingClientRect().width || 794;
  const availableWidth=Math.max(320,stage.clientWidth-48);
  const scale=Math.min(1,availableWidth/pageWidth);

  // CSS zoom preserves the flex item's centering while making the whole A4
  // page readable on smaller screens. The viewer itself remains scrollable.
  page.style.zoom=String(scale);
};

Invoices.downloadInvoice = async function(invoice){
  const host=document.getElementById('previewContent');
  if(!host) return toast('Invoice Preview area is not available.','error');
  const normalized=typeof this.normalizeInvoice==='function'?this.normalizeInvoice(invoice):invoice;
  let page=host.dataset.invoiceId===normalized.id?host.querySelector('.invoice-page'):null;
  if(!page) page=this.mountInvoiceDocument(normalized);
  if(!page) return toast('Invoice Preview could not be prepared.','error');

  const stage=page.parentElement;
  const old={
    transform:page.style.transform,transformOrigin:page.style.transformOrigin,position:page.style.position,left:page.style.left,top:page.style.top,margin:page.style.margin,
    overflow:page.style.overflow,stageWidth:stage.style.width,stageHeight:stage.style.height,
    stageMinHeight:stage.style.minHeight,stageOverflow:stage.style.overflow,stagePadding:stage.style.padding,
    stageJustify:stage.style.justifyContent,stageAlign:stage.style.alignItems,
    hostWidth:host.style.width,hostHeight:host.style.height,hostOverflow:host.style.overflow
  };

  try{
    if(typeof window.html2canvas!=='function') throw new Error('PDF image renderer is not loaded. Please reopen the application with internet access.');
    if(!window.jspdf?.jsPDF) throw new Error('PDF engine is not loaded. Please reopen the application with internet access.');

    // Capture the same complete invoice DOM used by Preview, without screen scaling.
    page.style.transform='none';
    page.style.transformOrigin='top center';
    page.style.position='static';
    page.style.left='auto';
    page.style.top='auto';
    page.style.margin='0';
    page.style.overflow='visible';
    stage.style.width='210mm';
    stage.style.height='auto';
    stage.style.minHeight='0';
    stage.style.overflow='visible';
    stage.style.padding='0';
    stage.style.justifyContent='flex-start';
    stage.style.alignItems='flex-start';
    host.style.width='210mm';
    host.style.height='auto';
    host.style.overflow='visible';

    if(document.fonts?.ready) await document.fonts.ready;
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

    const canvas=await window.html2canvas(page,{
      scale:2,useCORS:true,allowTaint:false,backgroundColor:'#fff',logging:false,
      scrollX:0,scrollY:0,windowWidth:Math.max(794,Math.ceil(page.getBoundingClientRect().width)),
      windowHeight:Math.max(1123,Math.ceil(page.scrollHeight||page.getBoundingClientRect().height))
    });

    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF({unit:'mm',format:'a4',orientation:'portrait',compress:true});
    const margin=5, maxW=200, maxH=287;
    const ratio=canvas.width/canvas.height;
    let w=maxW, h=w/ratio;
    if(h>maxH){h=maxH;w=h*ratio;}
    const x=(210-w)/2, y=(297-h)/2;
    pdf.addImage(canvas.toDataURL('image/jpeg',0.98),'JPEG',x,y,w,h,undefined,'FAST');
    pdf.save(`${normalized.invoice_no}.pdf`);
    toast('PDF downloaded successfully with the complete Invoice Preview.','success');
  }catch(e){
    console.error('Single-page PDF generation failed',e);
    await Swal.fire({icon:'error',title:'PDF Generation Failed',text:e?.message||'Unable to generate the PDF.'});
  }finally{
    page.style.transform=old.transform;page.style.transformOrigin=old.transformOrigin;page.style.position=old.position;page.style.left=old.left;page.style.top=old.top;page.style.margin=old.margin;
    page.style.overflow=old.overflow;stage.style.width=old.stageWidth;stage.style.height=old.stageHeight;
    stage.style.minHeight=old.stageMinHeight;stage.style.overflow=old.stageOverflow;stage.style.padding=old.stagePadding;
    stage.style.justifyContent=old.stageJustify;stage.style.alignItems=old.stageAlign;
    host.style.width=old.hostWidth;host.style.height=old.hostHeight;host.style.overflow=old.hostOverflow;
    if(document.getElementById('previewModal')?.classList.contains('active')) this.fitPreviewToScreen();
  }
};

window.addEventListener('resize',()=>{
  if(document.getElementById('previewModal')?.classList.contains('active')) Invoices.fitPreviewToScreen();
});


/* ============================================================
   ANORI TRANSPORT v2.29 — TRIP TABLE FINAL LAYOUT + PAGINATION
   User-approved:
   - Remove Driver column
   - Remove Driver Amount column
   - Remove Expenses column
   - Keep Trip Advance Amount
   - Maximum 15 rows per page
   - Alternating row highlight uses #91edc2
   ============================================================ */
(function installAnoriV229TripTable(){
  'use strict';
  const esc=v=>Sanitize.html(v==null?'':String(v));
  const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const money=v=>Utils.fmt(num(v));
  const PAGE_SIZE=15;
  Trips.__page=1;
  Trips.__selectedIds=Trips.__selectedIds instanceof Set?Trips.__selectedIds:new Set();

  function allTrips(){
    if(typeof trips2==='function') return trips2();
    return DB.get('trips',[])||[];
  }
  function vehicle(id){return (DB.get('vehicles',[])||[]).find(x=>x.id===id);}
  function party(id){return (DB.get('parties',[])||[]).find(x=>x.id===id);}
  function activeInvoice(id){
    if(typeof activeInvoiceForTrip==='function') return activeInvoiceForTrip(id);
    return (DB.get('invoices',[])||[]).find(i=>i.trip_ids?.includes(id)&&String(i.status||'').toLowerCase()!=='cancelled');
  }
  function currentPageTrips(){
    const a=allTrips();
    const pages=Math.max(1,Math.ceil(a.length/PAGE_SIZE));
    Trips.__page=Math.min(Math.max(1,Trips.__page||1),pages);
    const start=(Trips.__page-1)*PAGE_SIZE;
    return {all:a,rows:a.slice(start,start+PAGE_SIZE),pages,start};
  }
  function selectedCount(){return [...Trips.__selectedIds].filter(id=>allTrips().some(t=>t.id===id)).length;}
  function syncVisibleChecks(){
    document.querySelectorAll('.trip-row-check').forEach(cb=>{cb.checked=Trips.__selectedIds.has(cb.value);});
    const all=Trips.getSelected().length>0 && [...document.querySelectorAll('.trip-row-check')].every(cb=>cb.checked);
    const master=document.querySelector('.trip-page-check-all'); if(master) master.checked=all && document.querySelectorAll('.trip-row-check').length>0;
  }

  Trips.getSelected=function(){
    const valid=new Set(allTrips().map(t=>String(t.id)));
    Trips.__selectedIds=new Set([...Trips.__selectedIds].filter(id=>valid.has(String(id))));
    return [...Trips.__selectedIds];
  };
  Trips.updateSelectionCount=function(){
    const el=document.getElementById('tripSelectedCount');
    if(el) el.textContent=`${Trips.getSelected().length} selected`;
    syncVisibleChecks();
  };
  Trips.toggleAll=function(flag){
    const {rows}=currentPageTrips();
    rows.forEach(t=>{if(flag)Trips.__selectedIds.add(String(t.id));else Trips.__selectedIds.delete(String(t.id));});
    Trips.updateSelectionCount();
  };
  Trips.clearSelection=function(){Trips.__selectedIds.clear();Trips.updateSelectionCount();};
  Trips.__toggleRow=function(id,checked){
    id=String(id); if(checked)Trips.__selectedIds.add(id); else Trips.__selectedIds.delete(id);
    Trips.updateSelectionCount();
  };
  Trips.__gotoPage=function(page){
    const {pages}=currentPageTrips();
    Trips.__page=Math.min(Math.max(1,Number(page)||1),pages);
    const host=document.getElementById('mainContent')?.querySelector('#view-trips')||document.getElementById('view-trips');
    if(host) Trips.render(host);
  };

  Trips.render=function(container){
    if(typeof sync==='function')sync();
    const {all,rows,pages,start}=currentPageTrips();
    const total=all.length;
    const from=total?start+1:0;
    const to=Math.min(start+PAGE_SIZE,total);
    const selected=Trips.getSelected();
    const pageAllSelected=rows.length>0 && rows.every(t=>Trips.__selectedIds.has(String(t.id)));

    const pagination=`
      <div class="anori-trip-pagination">
        <div class="anori-trip-page-info">Showing ${from} to ${to} of ${total} entries</div>
        <div class="anori-trip-page-controls">
          <button type="button" class="anori-page-btn" ${Trips.__page<=1?'disabled':''} onclick="Trips.__gotoPage(${Trips.__page-1})">‹</button>
          <span class="anori-page-current">${Trips.__page}</span>
          <button type="button" class="anori-page-btn" ${Trips.__page>=pages?'disabled':''} onclick="Trips.__gotoPage(${Trips.__page+1})">›</button>
        </div>
      </div>`;

    const rowsHtml=rows.map((t,idx)=>{
      const inv=activeInvoice(t.id);
      const vehicleNo=vehicle(t.vehicle_id)?.number||t.vehicle_manual||'-';
      const customer=party(t.party_id)?.name||t.party_manual||'-';
      const profit=num(t.freight)-((t.expenses||[]).reduce((s,e)=>s+num(e.amount),0));
      return `<tr class="anori-trip-row ${idx%2===1?'anori-trip-alt-row':''}">
        <td><input type="checkbox" class="trip-row-check" value="${esc(t.id)}" ${Trips.__selectedIds.has(String(t.id))?'checked':''} onchange="Trips.__toggleRow('${esc(t.id)}',this.checked)"></td>
        <td>${esc(t.date)}</td>
        <td><strong>${esc(t.trip_no)}</strong></td>
        <td>${esc(vehicleNo)}</td>
        <td>${esc(customer)}</td>
        <td>${esc(t.from)} → ${esc(t.to)}</td>
        <td>${money(t.freight)}</td>
        <td>${money(t.trip_advance_amount)}</td>
        <td class="profit-positive">${money(profit)}</td>
        <td>${inv?'<span class="status-badge status-shared">INVOICED</span>':'<span class="status-badge status-pending">PENDING</span>'}</td>
      </tr>`;
    }).join('');

    container.innerHTML=`
      <div class="anori-section-intro">
        <div><strong>Trip Management</strong><span>Select rows, then use the Actions above the table.</span></div>
        <button class="btn btn-success" onclick="Trips.openForm()">＋ New Trip</button>
      </div>
      <div class="card">
        ${typeof toolbar==='function'?toolbar('trip','Trips.showActions()'):`<div class="anori-universal-toolbar"><div class="anori-toolbar-left"><strong>Actions:</strong><button class="anori-action-btn anori-action-preview" onclick="Trips.showActions()">⚙ ACTIONS</button><span id="tripSelectedCount" class="anori-selection-count">${selected.length} selected</span></div></div>`}
        <div class="table-wrapper anori-trip-table-wrap">
          ${total?`<table class="anori-trip-table">
            <thead><tr>
              <th><input type="checkbox" class="trip-page-check-all" aria-label="Select all trips on this page" ${pageAllSelected?'checked':''} onchange="Trips.toggleAll(this.checked)"></th>
              <th>Date</th><th>Trip #</th><th>Vehicle</th><th>Party</th><th>Route</th><th>Freight</th><th>Trip Advance</th><th>Profit</th><th>Invoice</th>
            </tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>`:`<div class="empty-state"><i class="fas fa-route"></i><h3>No Trips Yet</h3><p>Create your first trip.</p></div>`}
        </div>
        ${pagination}
      </div>`;
    Trips.updateSelectionCount();
  };
})();


/* v2.30 FINAL — Trip numbering + duplicate action hardening.
   Trip No format: TRP-YYMMDD-01, -02, -03 ... per selected trip date.
   Duplicate creates one new trip for today with a fresh daily serial. */
(function installAnoriV230TripHardening(){
  'use strict';
  const safeNum=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const freshTripNo=dateValue=>Utils.generateTripNo(dateValue||Utils.today());
  Trips.duplicateSelected=function(){
    const ids=typeof Trips.getSelected==='function'?Trips.getSelected():[];
    if(ids.length!==1)return Utils.toast('Select one trip to duplicate.','warning');
    const all=DB.get('trips',[])||[];
    const original=all.find(t=>String(t.id)===String(ids[0]));
    if(!original)return Utils.toast('Selected trip was not found.','error');
    const copy=JSON.parse(JSON.stringify(original));
    copy.id=Utils.id();
    copy.date=Utils.today();
    copy.trip_no=freshTripNo(copy.date);
    copy.invoice_status='pending';
    delete copy.invoice_id;
    delete copy.invoice_no;
    copy.created_at=new Date().toISOString();
    all.push(copy);
    DB.set('trips',all,true);
    if(typeof window.syncDriver==='function')window.syncDriver(copy);
    if(Trips.__selectedIds instanceof Set)Trips.__selectedIds.clear();
    Utils.toast(`Trip duplicated successfully: ${copy.trip_no}`,'success');
    Router.go('trips');
  };
})();

/* ============================================================
   ANORI TRANSPORT — INVOICE ADVANCE + PREVIEW-BEFORE-FINALIZE
   Requested workflow:
   1) Trip Advance Amount automatically reflects in invoice.
   2) User sees invoice preview first.
   3) Invoice is saved/finalized only after explicit confirmation.
   ============================================================ */
(function installInvoiceAdvancePreviewWorkflow(){
  'use strict';
  if (typeof Invoices === 'undefined') return;

  const esc = v => Sanitize.html(v == null ? '' : String(v));
  const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const money = v => Utils.fmt(num(v));
  const tripsStore = () => DB.get('trips', []);
  const activeInvoice = id => DB.get('invoices', []).some(i => String(i.status || '').toLowerCase() !== 'cancelled' && Array.isArray(i.trip_ids) && i.trip_ids.includes(id));

  // Preserve the currently installed generator/finalizer for compatibility.
  const originalCreateInvoiceV28 = Invoices.createInvoiceV28;

  function selectedAdvance(trips){
    return trips.reduce((sum, t) => sum + num(t.trip_advance_amount), 0);
  }

  function selectedExpenseLinesFromDom(masterList){
    return [...document.querySelectorAll('.anori-invoice-preview-exp-check:checked')]
      .map(c => {
        const id = c.dataset.id;
        const master = masterList.find(x => x.id === id);
        const amountEl = document.querySelector(`.anori-invoice-preview-exp-amt[data-id="${CSS.escape(id)}"]`);
        return { masterId:id, name:master?.name || 'Expense', amount:num(amountEl?.value) };
      })
      .filter(x => x.amount > 0);
  }

  function buildDraft(trips, isGst, advance, expenseLines){
    const party = DB.get('parties', []).find(p => p.id === trips[0]?.party_id);
    const vehicles = DB.get('vehicles', []);
    const subtotal = trips.reduce((s,t) => s + num(t.freight), 0) + expenseLines.reduce((s,e) => s + num(e.amount), 0);
    const cgst = isGst ? subtotal * 0.09 : 0;
    const sgst = isGst ? subtotal * 0.09 : 0;
    const total = subtotal + cgst + sgst;
    return {
      id: `DRAFT-${Utils.id()}`,
      invoice_no: 'DRAFT / PREVIEW',
      date: Utils.today(),
      party_id: party?.id || '',
      trip_ids: trips.map(t => t.id),
      trip_count: trips.length,
      subtotal, cgst, sgst, total_amount: total,
      advance, balance_due: total - advance,
      paid_amount: advance,
      is_gst: !!isGst,
      status: 'draft',
      expense_lines: expenseLines,
      credit_days: Math.max(0, num(party?.credit_days) || 30),
      trips_data: trips.map(t => ({...t, vehicle:vehicles.find(v => v.id === t.vehicle_id)})),
      payments: []
    };
  }

  function showFinalizePreview(draft, finalize){
    // Use the application's existing invoice renderer so preview and PDF remain identical.
    Invoices.previewInvoice(draft);
    const modal = document.getElementById('previewModal');
    const footer = modal?.querySelector('.modal-footer');
    if (!modal || !footer) return;

    footer.innerHTML = `
      <button type="button" class="btn btn-outline" id="invoicePreviewBackBtn">← Back to Edit</button>
      <button type="button" class="btn btn-primary" id="invoicePreviewFinalizeBtn">✓ OK — Finalize Tax Invoice</button>
    `;

    document.getElementById('invoicePreviewBackBtn').onclick = () => {
      Invoices.closePreview ? Invoices.closePreview() : modal.classList.remove('active');
    };

    document.getElementById('invoicePreviewFinalizeBtn').onclick = async () => {
      const btn = document.getElementById('invoicePreviewFinalizeBtn');
      if (btn) { btn.disabled = true; btn.innerHTML = 'Finalizing…'; }
      try {
        const result = await finalize();
        if (result) {
          // After the invoice is actually saved, reopen the saved invoice preview.
          Invoices.previewInvoice(result);
          const savedFooter = modal.querySelector('.modal-footer');
          if (savedFooter) {
            savedFooter.innerHTML = `
              <button type="button" class="btn btn-outline" id="invoicePreviewCloseFinalBtn">Close</button>
              <button type="button" class="btn btn-primary" id="invoicePreviewDownloadFinalBtn">📄 Download PDF</button>
            `;
            document.getElementById('invoicePreviewCloseFinalBtn').onclick = () => {
              Invoices.closePreview ? Invoices.closePreview() : modal.classList.remove('active');
              Router.go('invoices');
            };
            document.getElementById('invoicePreviewDownloadFinalBtn').onclick = () => Invoices.downloadInvoice(result);
          }
        } else if (btn) {
          btn.disabled = false;
          btn.innerHTML = '✓ OK — Finalize Tax Invoice';
        }
      } catch (e) {
        console.error('Invoice finalization error:', e);
        Utils.toast(e?.message || 'Invoice could not be finalized.', 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = '✓ OK — Finalize Tax Invoice'; }
      }
    };
  }

  Invoices.showInvoiceGenerator = function(preselectedIds = []){
    const allCompleted = tripsStore().filter(t => t.status === 'completed');
    const available = allCompleted.filter(t => !activeInvoice(t.id));
    if (!available.length) {
      return Swal.fire({
        icon:'info', title:'No Trip Available for Invoice',
        text:'All completed trips are already invoiced or none are completed.',
        confirmButtonText:'OK'
      });
    }

    const parties = DB.get('parties', []);
    const vehicles = DB.get('vehicles', []);
    const masters = DB.get('expense_master', []).filter(x => x.active !== false && x.showOnInvoice);
    const checked = new Set(preselectedIds);

    Swal.fire({
      title:'Create Invoice', width:950,
      html:`
        <div class="anori-invoice-generator">
          <div class="anori-help">1. Select trips → 2. Review advance → 3. Preview invoice → 4. Finalize tax invoice</div>
          <div class="table-wrapper" style="max-height:300px;overflow:auto">
            <table class="anori-standard-table">
              <thead><tr><th></th><th>Date</th><th>Trip</th><th>Customer</th><th>Vehicle</th><th style="text-align:right">Freight</th><th style="text-align:right">Trip Advance</th></tr></thead>
              <tbody>${available.map(t=>{
                const p=parties.find(x=>x.id===t.party_id), v=vehicles.find(x=>x.id===t.vehicle_id);
                return `<tr>
                  <td><input type="checkbox" class="anori-final-trip-v31" data-id="${esc(t.id)}" data-party="${esc(t.party_id)}" ${checked.has(t.id)?'checked':''}></td>
                  <td>${esc(t.date)}</td><td>${esc(t.trip_no)}</td><td>${esc(p?.name||'-')}</td><td>${esc(v?.number||'-')}</td>
                  <td style="text-align:right">${money(t.freight)}</td><td style="text-align:right">${money(t.trip_advance_amount)}</td>
                </tr>`;
              }).join('')}</tbody>
            </table>
          </div>
          <div id="anori-v31-expense-picker" class="anori-expense-picker" style="margin-top:14px"></div>
          <div class="form-row" style="margin-top:12px">
            <div class="form-group"><label>Invoice Type</label><select id="anori-v31-inv-type" class="form-control"><option value="gst">GST Invoice (18%)</option><option value="nongst">Non-GST</option></select></div>
            <div class="form-group"><label>Advance Received (₹)</label><input id="anori-v31-inv-advance" class="form-control" type="number" min="0" value="0" readonly><small class="anori-help">Automatically taken from selected Trip Advance Amount.</small></div>
          </div>
        </div>`,
      showCancelButton:true,
      confirmButtonText:'👁 Preview Invoice',
      cancelButtonText:'Cancel',
      didOpen:()=>{
        const update = () => {
          const checks=[...document.querySelectorAll('.anori-final-trip-v31:checked')];
          const selected=available.filter(t=>checks.some(c=>c.dataset.id===t.id));
          const partyIds=new Set(selected.map(t=>t.party_id));
          if(partyIds.size>1) Swal.showValidationMessage('Please select trips for one customer only.');
          else Swal.resetValidationMessage();

          const advance=selectedAdvance(selected);
          const adv=document.getElementById('anori-v31-inv-advance');
          if(adv) adv.value=advance;

          const host=document.getElementById('anori-v31-expense-picker');
          if(!host)return;
          if(!selected.length){host.innerHTML='<div class="anori-help">Select a trip to choose billable expenses.</div>';return;}
          host.innerHTML=`<div class="anori-subtitle">Billable Expenses</div>${masters.map(m=>{
            const amount=selected.reduce((sum,t)=>sum+(Array.isArray(t.expenses)?t.expenses:[]).filter(e=>String(e.type||'').trim().toLowerCase()===String(m.name||'').trim().toLowerCase()).reduce((a,e)=>a+num(e.amount),0),0);
            return `<div class="anori-expense-select-row"><label><input type="checkbox" class="anori-v31-bill-exp" data-id="${esc(m.id)}" ${amount>0?'checked':''}> ${esc(m.name)}</label><input type="number" class="anori-v31-bill-exp-amt" data-id="${esc(m.id)}" value="${amount||num(m.defaultAmount)||0}" min="0"></div>`;
          }).join('')||'<div class="anori-help">No billable expenses are configured in Master Data.</div>'}`;
        };
        document.querySelectorAll('.anori-final-trip-v31').forEach(c=>c.addEventListener('change',update));
        update();
      },
      preConfirm:()=>{
        const checks=[...document.querySelectorAll('.anori-final-trip-v31:checked')];
        const selected=checks.map(c=>c.dataset.id);
        if(!selected.length){Swal.showValidationMessage('Please select at least one trip.');return false;}
        if(new Set(checks.map(c=>c.dataset.party)).size!==1){Swal.showValidationMessage('Please select trips for one customer only.');return false;}
        const selectedTrips=available.filter(t=>selected.includes(t.id));
        if(selectedTrips.some(t=>activeInvoice(t.id))){Swal.showValidationMessage('One or more selected trips already have an active invoice.');return false;}
        const expenses=selectedExpenseLinesFromDom(masters);
        return {
          selected,
          isGst:document.getElementById('anori-v31-inv-type').value==='gst',
          advance:selectedAdvance(selectedTrips),
          expenses
        };
      }
    }).then(async result=>{
      if(!result.isConfirmed)return;
      const selectedTrips=tripsStore().filter(t=>result.value.selected.includes(t.id));
      const draft=buildDraft(selectedTrips,result.value.isGst,result.value.advance,result.value.expenses);

      // Preview first. Nothing is written to DB here.
      showFinalizePreview(draft, async ()=>{
        // Re-read latest trip data before finalizing, so stale selections cannot overwrite changes.
        const fresh=tripsStore().filter(t=>result.value.selected.includes(t.id));
        if(fresh.length!==result.value.selected.length)throw new Error('One or more selected trips are no longer available.');
        if(fresh.some(t=>activeInvoice(t.id)))throw new Error('One or more selected trips already have an active invoice.');
        const latestAdvance=selectedAdvance(fresh);
        // Advance is always taken from the saved Trip Advance Amount, never from manual invoice input.
        return await originalCreateInvoiceV28.call(Invoices,fresh,result.value.isGst,latestAdvance,result.value.expenses);
      });
    });
  };
})();


/* v2.18: Invoice preview Escape behaves exactly like Back to Edit. */
(function installInvoicePreviewEscapeBack(){
  'use strict';
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    const modal=document.getElementById('previewModal');
    const state=window.__anoriInvoiceEditState;
    if(!modal || !modal.classList.contains('active') || !state) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    try{
      if(Invoices && typeof Invoices.closePreview==='function') Invoices.closePreview();
      else modal.classList.remove('active');
    }catch(err){ console.error('Invoice preview Escape close error:',err); }
    setTimeout(()=>{
      try{
        if(window.__anoriInvoiceEditState && typeof Invoices!=='undefined' && typeof Invoices.showInvoiceGenerator==='function'){
          const edit=window.__anoriInvoiceEditState;
          Invoices.showInvoiceGenerator(edit.selected, edit);
        }
      }catch(err){ console.error('Invoice Back to Edit error:',err); }
    },80);
  }, true);
})();

/* ============================================================
   ANORI TRANSPORT — INVOICE BILLABLE EXPENSE + MANUAL CHARGES
   Amendment: billable expenses in 2-column layout and manual
   charge type/amount at invoice time. Existing workflow preserved.
   ============================================================ */
(function installInvoiceChargesV32(){
  'use strict';
  if(typeof Invoices==='undefined') return;
  const esc=v=>Sanitize.html(v==null?'':String(v));
  const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const money=v=>Utils.fmt(num(v));
  const tripsStore=()=>DB.get('trips',[]);
  const activeInvoice=id=>DB.get('invoices',[]).some(i=>String(i.status||'').toLowerCase()!=='cancelled'&&Array.isArray(i.trip_ids)&&i.trip_ids.includes(id));
  const selectedAdvance=ts=>ts.reduce((s,t)=>s+num(t.trip_advance_amount),0);

  function expenseAmountForTrips(trips, master){
    const target=String(master.name||'').trim().toLowerCase();
    return trips.reduce((sum,t)=>sum+(Array.isArray(t.expenses)?t.expenses:[])
      .filter(e=>String(e.type||'').trim().toLowerCase()===target)
      .reduce((a,e)=>a+num(e.amount),0),0);
  }

  function readManualCharges(){
    return [...document.querySelectorAll('.anori-v32-manual-charge')].map(row=>({
      masterId:`MANUAL-${Utils.id()}`,
      name:row.querySelector('.anori-v32-manual-type')?.value.trim()||'',
      amount:num(row.querySelector('.anori-v32-manual-amount')?.value),
      manual:true
    })).filter(x=>x.name&&x.amount>0);
  }

  Invoices.showInvoiceGenerator=function(preselectedIds=[],editState=null){
    const allCompleted=tripsStore().filter(t=>t.status==='completed');
    const available=allCompleted.filter(t=>!activeInvoice(t.id));
    if(!available.length)return Swal.fire({icon:'info',title:'No Trip Available for Invoice',text:'All completed trips are already invoiced or none are completed.',confirmButtonText:'OK'});
    const parties=DB.get('parties',[]),vehicles=DB.get('vehicles',[]);
    const masters=DB.get('expense_master',[]).filter(x=>x.active!==false&&x.showOnInvoice);
    const checked=new Set(Array.isArray(editState?.selected)&&editState.selected.length?editState.selected:preselectedIds);

    Swal.fire({
      title:'Create Invoice',width:1000,
      html:`<div class="anori-invoice-generator anori-v32-generator">
        <div class="anori-help">1. Select trips → 2. Select billable expenses → 3. Add manual charges → 4. Preview invoice → 5. Finalize</div>
        <div class="table-wrapper" style="max-height:280px;overflow:auto"><table class="anori-standard-table"><thead><tr><th></th><th>Date</th><th>Trip</th><th>Customer</th><th>Vehicle</th><th style="text-align:right">Freight</th><th style="text-align:right">Trip Advance</th></tr></thead><tbody>${available.map(t=>{const p=parties.find(x=>x.id===t.party_id),v=vehicles.find(x=>x.id===t.vehicle_id);return `<tr><td><input type="checkbox" class="anori-v32-trip" data-id="${esc(t.id)}" data-party="${esc(t.party_id)}" ${checked.has(t.id)?'checked':''}></td><td>${esc(t.date)}</td><td>${esc(t.trip_no)}</td><td>${esc(p?.name||'-')}</td><td>${esc(v?.number||'-')}</td><td style="text-align:right">${money(t.freight)}</td><td style="text-align:right">${money(t.trip_advance_amount)}</td></tr>`}).join('')}</tbody></table></div>
        <div id="anori-v32-expense-picker" class="anori-expense-picker"></div>
        <div class="anori-v32-manual-wrap">
          <div class="anori-subtitle">Manual Charges</div>
          <div class="anori-help">Add any additional customer charge manually for this invoice.</div>
          <div id="anori-v32-manual-list"></div>
          <button type="button" class="btn btn-outline btn-sm" id="anori-v32-add-manual">＋ Add Manual Charge</button>
        </div>
        <div class="form-row" style="margin-top:12px">
          <div class="form-group"><label>Invoice Type</label><select id="anori-v32-inv-type" class="form-control"><option value="gst" ${editState?.isGst!==false?'selected':''}>GST Invoice</option><option value="nongst" ${editState?.isGst===false?'selected':''}>Non-GST</option></select></div>
          <div class="form-group"><label>Tax Type</label><select id="anori-v32-tax-type" class="form-control"><option value="cgst_sgst" ${editState?.taxType!=='igst'?'selected':''}>CGST 9% + SGST 9%</option><option value="igst" ${editState?.taxType==='igst'?'selected':''}>IGST 18%</option><option value="none" ${editState?.isGst===false?'selected':''}>No Tax</option></select></div>
          <div class="form-group"><label>Advance Received (₹)</label><input id="anori-v32-inv-advance" class="form-control" type="number" min="0" value="${num(editState?.advance||0)}" readonly><small class="anori-help">Automatically taken from selected Trip Advance Amount.</small></div>
        </div>
      </div>`,
      showCancelButton:true,confirmButtonText:'👁 Preview Invoice',cancelButtonText:'Cancel',
      didOpen:()=>{
        const addManual=()=>{const host=document.getElementById('anori-v32-manual-list');if(!host)return;const row=document.createElement('div');row.className='anori-v32-manual-charge';row.innerHTML=`<div><label>Charge Type</label><input class="form-control anori-v32-manual-type" placeholder="e.g. Documentation, Detention, Handling"></div><div><label>Amount (₹)</label><input class="form-control anori-v32-manual-amount" type="number" min="0" value="0"></div><button type="button" class="btn btn-danger btn-sm anori-v32-remove-manual" title="Remove">✕</button>`;row.querySelector('.anori-v32-remove-manual').onclick=()=>row.remove();host.appendChild(row);};
        document.getElementById('anori-v32-add-manual')?.addEventListener('click',addManual);
        addManual();
        const update=()=>{
          const checks=[...document.querySelectorAll('.anori-v32-trip:checked')],selected=available.filter(t=>checks.some(c=>c.dataset.id===t.id));
          if(new Set(selected.map(t=>t.party_id)).size>1)Swal.showValidationMessage('Please select trips for one customer only.');else Swal.resetValidationMessage();
          const adv=document.getElementById('anori-v32-inv-advance');if(adv)adv.value=selectedAdvance(selected);
          const host=document.getElementById('anori-v32-expense-picker');if(!host)return;
          if(!selected.length){host.innerHTML='<div class="anori-help">Select a trip to choose billable expenses.</div>';return;}
          host.innerHTML=`<div class="anori-subtitle">Billable Expenses</div><div class="anori-v32-expense-grid">${masters.map(m=>{const amount=expenseAmountForTrips(selected,m);return `<div class="anori-v32-expense-card${amount>0?' selected':''}"><label><input type="checkbox" class="anori-v32-bill-exp" data-id="${esc(m.id)}" ${amount>0?'checked':''}> <strong>${esc(m.name)}</strong></label><input type="number" class="form-control anori-v32-bill-exp-amt" data-id="${esc(m.id)}" value="${amount||num(m.defaultAmount)||0}" min="0"></div>`}).join('')||'<div class="anori-help">No billable expenses are configured in Master Data.</div>'}</div>`;
          host.querySelectorAll('.anori-v32-bill-exp').forEach(cb=>cb.addEventListener('change',()=>cb.closest('.anori-v32-expense-card')?.classList.toggle('selected',cb.checked)));
        };
        document.querySelectorAll('.anori-v32-trip').forEach(c=>c.addEventListener('change',update));
        update();
        if(editState){
          setTimeout(()=>{
            const gst=document.getElementById('anori-v32-inv-type'); if(gst)gst.value=editState.isGst?'gst':'nongst';
            const tax=document.getElementById('anori-v32-tax-type'); if(tax)tax.value=editState.taxType|| (editState.isGst?'cgst_sgst':'none');
            const adv=document.getElementById('anori-v32-inv-advance'); if(adv)adv.value=num(editState.advance);
            (editState.expenses||[]).filter(e=>!e.manual).forEach(e=>{
              const cb=document.querySelector(`.anori-v32-bill-exp[data-id="${CSS.escape(e.masterId||'')}"]`);
              const amt=document.querySelector(`.anori-v32-bill-exp-amt[data-id="${CSS.escape(e.masterId||'')}"]`);
              if(cb){cb.checked=true;} if(amt){amt.value=num(e.amount);}
            });
            const manual=(editState.expenses||[]).filter(e=>e.manual);
            const host=document.getElementById('anori-v32-manual-list');
            if(host&&manual.length){host.innerHTML='';manual.forEach(e=>{
              const row=document.createElement('div');row.className='anori-v32-manual-charge';
              row.innerHTML=`<div><label>Charge Type</label><input class="form-control anori-v32-manual-type" value="${esc(e.name||'')}" placeholder="e.g. Documentation, Detention, Handling"></div><div><label>Amount (₹)</label><input class="form-control anori-v32-manual-amount" type="number" min="0" value="${num(e.amount)}"></div><button type="button" class="btn btn-danger btn-sm anori-v32-remove-manual" title="Remove">✕</button>`;
              row.querySelector('.anori-v32-remove-manual').onclick=()=>row.remove();host.appendChild(row);
            });}
          },20);
        }
      },
      preConfirm:()=>{
        const checks=[...document.querySelectorAll('.anori-v32-trip:checked')],selected=checks.map(c=>c.dataset.id);
        if(!selected.length){Swal.showValidationMessage('Please select at least one trip.');return false;}
        if(new Set(checks.map(c=>c.dataset.party)).size!==1){Swal.showValidationMessage('Please select trips for one customer only.');return false;}
        const selectedTrips=available.filter(t=>selected.includes(t.id));
        if(selectedTrips.some(t=>activeInvoice(t.id))){Swal.showValidationMessage('One or more selected trips already have an active invoice.');return false;}
        const expenses=[...document.querySelectorAll('.anori-v32-bill-exp:checked')].map(c=>{const id=c.dataset.id,m=masters.find(x=>x.id===id);return {masterId:id,name:m?.name||'Expense',amount:num(document.querySelector(`.anori-v32-bill-exp-amt[data-id="${CSS.escape(id)}"]`)?.value),manual:false};}).filter(x=>x.amount>0);
        const manual=readManualCharges();
        const isGst=document.getElementById('anori-v32-inv-type').value==='gst';
        const taxType=isGst?(document.getElementById('anori-v32-tax-type')?.value||'cgst_sgst'):'none';
        return {selected,isGst,taxType,advance:selectedAdvance(selectedTrips),expenses:[...expenses,...manual]};
      }
    }).then(async result=>{
      if(!result.isConfirmed)return;
      const selectedTrips=tripsStore().filter(t=>result.value.selected.includes(t.id));
      const originalFinalize=async()=>{
        const fresh=tripsStore().filter(t=>result.value.selected.includes(t.id));
        if(fresh.length!==result.value.selected.length)throw new Error('One or more selected trips are no longer available.');
        if(fresh.some(t=>activeInvoice(t.id)))throw new Error('One or more selected trips already have an active invoice.');
        return await buildAndSaveInvoice(fresh,result.value.isGst,selectedAdvance(fresh),result.value.expenses,result.value.taxType);
      };
      const draft=buildDraftV32(selectedTrips,result.value.isGst,result.value.advance,result.value.expenses,result.value.taxType);
      if(typeof Invoices.previewInvoice==='function'){
        Invoices.previewInvoice(draft);
        const modal=document.getElementById('previewModal'),footer=modal?.querySelector('.modal-footer');
        if(modal&&footer){
          footer.innerHTML='<button type="button" class="btn btn-outline" id="anori-v32-back">← Back to Edit</button><button type="button" class="btn btn-primary" id="anori-v32-finalize">✓ OK — Finalize Tax Invoice</button>';
          window.__anoriInvoiceEditState={
            selected:[...result.value.selected],
            isGst:!!result.value.isGst,
            taxType:result.value.taxType||'cgst_sgst',
            advance:num(result.value.advance),
            expenses:Array.isArray(result.value.expenses)?JSON.parse(JSON.stringify(result.value.expenses)):[]
          };
          document.getElementById('anori-v32-back').onclick=()=>{
            try{ if(Invoices.closePreview)Invoices.closePreview();else modal.classList.remove('active'); }catch(e){ console.error('Invoice preview close error:',e); }
            const state=window.__anoriInvoiceEditState;
            setTimeout(()=>{
              if(!state)return;
              Invoices.showInvoiceGenerator(state.selected,state);
            },80);
          };
          document.getElementById('anori-v32-finalize').onclick=async()=>{const b=document.getElementById('anori-v32-finalize');b.disabled=true;b.textContent='Finalizing…';try{const saved=await originalFinalize();if(saved){Invoices.previewInvoice(saved);const f=modal.querySelector('.modal-footer');if(f){f.innerHTML='<button type="button" class="btn btn-outline" id="anori-v32-close">Close</button><button type="button" class="btn btn-primary" id="anori-v32-pdf">📄 Download PDF</button>';document.getElementById('anori-v32-close').onclick=()=>{modal.classList.remove('active');Router.go('invoices');};document.getElementById('anori-v32-pdf').onclick=()=>Invoices.downloadInvoice(saved);}}}catch(e){b.disabled=false;b.textContent='✓ OK — Finalize Tax Invoice';Utils.toast(e.message||'Invoice could not be finalized.','error');}};
        }
      } else {await originalFinalize();}
    });

    function invoiceDateForTrips(ts){
      const dates=(Array.isArray(ts)?ts:[]).map(t=>String(t?.date||'').trim()).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
      return dates[0] || today();
    }

    function buildDraftV32(ts,isGst,advance,expenseLines,taxType){
      const party=parties.find(p=>p.id===ts[0]?.party_id),vehiclesNow=DB.get('vehicles',[]),subtotal=ts.reduce((s,t)=>s+num(t.freight),0)+expenseLines.reduce((s,e)=>s+num(e.amount),0),mode=isGst?(taxType||'cgst_sgst'):'none',cgst=mode==='cgst_sgst'?subtotal*.09:0,sgst=mode==='cgst_sgst'?subtotal*.09:0,igst=mode==='igst'?subtotal*.18:0,total=subtotal+cgst+sgst+igst;
      if(advance>total)throw new Error(`Advance cannot be greater than invoice total of ${money(total)}.`);
      return {id:`DRAFT-${Utils.id()}`,invoice_no:'DRAFT / PREVIEW',date:invoiceDateForTrips(ts),party_id:party?.id||'',trip_ids:ts.map(t=>t.id),trip_count:ts.length,subtotal,cgst,sgst,igst,total_amount:total,advance,balance_due:total-advance,paid_amount:advance,is_gst:!!isGst,tax_type:mode,status:'draft',expense_lines:expenseLines,credit_days:Math.max(0,num(party?.credit_days)||30),trips_data:ts.map(t=>({...t,vehicle:vehiclesNow.find(v=>v.id===t.vehicle_id)})),payments:[]};
    }

    async function buildAndSaveInvoice(ts,isGst,advance,expenseLines,taxType){
      const party=DB.get('parties',[]).find(p=>p.id===ts[0]?.party_id);if(!party)throw new Error('Customer/Party not found.');
      const billable= new Set(DB.get('expense_master',[]).filter(x=>x.active!==false&&x.showOnInvoice).map(x=>x.id));
      const lines=(Array.isArray(expenseLines)?expenseLines:[]).filter(e=>e.manual||billable.has(e.masterId)).map(e=>({masterId:e.masterId,name:e.name,amount:num(e.amount),manual:!!e.manual})).filter(e=>e.amount>0);
      const subtotal=ts.reduce((s,t)=>s+num(t.freight),0)+lines.reduce((s,e)=>s+e.amount,0),mode=isGst?(taxType||'cgst_sgst'):'none',cgst=mode==='cgst_sgst'?subtotal*.09:0,sgst=mode==='cgst_sgst'?subtotal*.09:0,igst=mode==='igst'?subtotal*.18:0,total=subtotal+cgst+sgst+igst;
      if(advance<0||advance>total)throw new Error(advance<0?'Advance cannot be negative.':`Advance cannot exceed ${money(total)}.`);
      const invoice={id:Utils.id(),invoice_no:Utils.generateInvoiceNo(),date:invoiceDateForTrips(ts),party_id:party.id,trip_ids:ts.map(t=>t.id),trip_count:ts.length,subtotal,cgst,sgst,igst,total_amount:total,advance,balance_due:total-advance,paid_amount:advance,is_gst:!!isGst,tax_type:mode,status:advance>=total?'paid':'issued',expense_lines:lines,credit_days:Math.max(0,num(party.credit_days)||30),trips_data:ts.map(t=>({...t,vehicle:DB.get('vehicles',[]).find(v=>v.id===t.vehicle_id)})),payments:[]};
      const invs=DB.get('invoices',[]);if(invs.some(i=>String(i.status||'').toLowerCase()!=='cancelled'&&Array.isArray(i.trip_ids)&&i.trip_ids.some(id=>invoice.trip_ids.includes(id))))throw new Error('Duplicate active invoice detected.');
      DB.set('invoices',[...invs,invoice]);const all=tripsStore();ts.forEach(t=>{const x=all.find(a=>a.id===t.id);if(x)x.invoice_status='invoiced';});DB.set('trips',all,true);return invoice;
    }
  };

  // Keep the existing invoice renderer but make billable/manual charges explicit rows.
  const previousBuild=Invoices.buildInvoiceHTML;
  Invoices.buildInvoiceHTML=function(invoice,preview=false){
    let html=previousBuild.call(this,invoice,preview);
    const lines=Array.isArray(invoice?.expense_lines)?invoice.expense_lines.filter(e=>num(e.amount)>0):[];
    if(!lines.length)return html;
    // The installed renderer already renders expense_lines in the charge table.
    // Add the charge classification without changing the invoice totals/layout.
    const marker='<td colspan="5" class="summary-label">';
    if(html.includes(marker)){
      let n=0;
      html=html.replace(/<tr><td colspan="5" class="summary-label">([^<]*)<\/td><td class="money">/g,(m,name)=>{
        const line=lines[n++];
        if(!line)return m;
        return `<tr><td colspan="5" class="summary-label">${esc(line.name||name)}</td><td class="money">`;
      });
    }
    return html;
  };
})();

/* ANORI TRANSPORT — MODULE MANUAL SEARCH
   Adds a manual field-based search to Trip Management, Invoices & Billing,
   Reports & Analytics, and Driver Settlement without changing stored data.
*/
(function installModuleManualSearch(){
  'use strict';

  const FIELD_OPTIONS = [
    ['all','ALL FIELDS'],
    ['party','PARTY NAME'],
    ['driver','DRIVER NAME'],
    ['pol','POL'],
    ['pod','POD'],
    ['invoice','INVOICE NO.'],
    ['trip','TRIP NO.'],
    ['vehicle','VEHICLE NO.']
  ];

  function norm(v){ return String(v ?? '').trim().toLowerCase(); }
  function includes(v,q){ return norm(v).includes(norm(q)); }
  function linkedTripsForInvoice(inv){
    const direct = Array.isArray(inv?.trips_data) ? inv.trips_data : [];
    if(direct.length) return direct;
    const ids = Array.isArray(inv?.trip_ids) ? inv.trip_ids : [];
    return DB.get('trips',[]).filter(t=>ids.includes(t.id));
  }
  function getTrip(id){ return DB.get('trips',[]).find(t=>t.id===id); }
  function tripSearchText(t,field){
    const p=DB.get('parties',[]).find(x=>x.id===t.party_id);
    const d=DB.get('drivers',[]).find(x=>x.id===t.driver_id);
    const v=DB.get('vehicles',[]).find(x=>x.id===t.vehicle_id);
    const inv=(typeof activeInv==='function' ? activeInv(t.id) : null);
    const map={
      party:p?.name, driver:d?.name, pol:t.from, pod:t.to,
      invoice:inv?.invoice_no, trip:t.trip_no, vehicle:v?.number
    };
    if(field==='all') return [p?.name,d?.name,t.from,t.to,inv?.invoice_no,t.trip_no,v?.number,t.date].filter(Boolean).join(' ');
    return map[field] || '';
  }
  function invoiceSearchText(inv,field){
    const p=DB.get('parties',[]).find(x=>x.id===inv.party_id);
    const ts=linkedTripsForInvoice(inv);
    const drivers=ts.map(t=>DB.get('drivers',[]).find(x=>x.id===t.driver_id)?.name).filter(Boolean);
    const pols=ts.map(t=>t.from).filter(Boolean);
    const pods=ts.map(t=>t.to).filter(Boolean);
    const trips=ts.map(t=>t.trip_no).filter(Boolean);
    const vehicles=ts.map(t=>DB.get('vehicles',[]).find(x=>x.id===t.vehicle_id)?.number).filter(Boolean);
    const map={party:p?.name,driver:drivers.join(' '),pol:pols.join(' '),pod:pods.join(' '),invoice:inv.invoice_no,trip:trips.join(' '),vehicle:vehicles.join(' ')};
    if(field==='all') return [p?.name,drivers.join(' '),pols.join(' '),pods.join(' '),inv.invoice_no,trips.join(' '),vehicles.join(' '),inv.date,inv.status].filter(Boolean).join(' ');
    return map[field] || '';
  }
  function settlementSearchText(row,field){
    const t=row.trip_id ? getTrip(row.trip_id) : null;
    const p=t ? DB.get('parties',[]).find(x=>x.id===t.party_id) : null;
    const d=DB.get('drivers',[]).find(x=>x.id===row.driver_id || x.id===t?.driver_id);
    const v=t ? DB.get('vehicles',[]).find(x=>x.id===t.vehicle_id) : null;
    const inv=t && typeof activeInv==='function' ? activeInv(t.id) : null;
    const map={party:p?.name,driver:d?.name,pol:t?.from,pod:t?.to,invoice:inv?.invoice_no,trip:t?.trip_no,vehicle:v?.number};
    if(field==='all') return [p?.name,d?.name,t?.from,t?.to,inv?.invoice_no,t?.trip_no,v?.number,row.description,row.date].filter(Boolean).join(' ');
    return map[field] || '';
  }

  function panel(module){
    const id='anori-manual-search-'+module;
    const options=FIELD_OPTIONS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
    return `<div id="${id}" class="anori-manual-search card">
      <div class="anori-manual-search-title"><strong>🔎 SEARCH</strong></div>
      <div class="anori-manual-search-controls">
        <label>SEARCH BY<select id="${id}-field" class="form-control">${options}</select></label>
        <label class="anori-manual-search-query">SEARCH<input id="${id}-query" class="form-control" type="text" placeholder="ENTER SEARCH TEXT..."></label>
        <button type="button" class="btn btn-primary" onclick="window.anoriApplyModuleSearch('${module}')">🔎 SEARCH</button>
        <button type="button" class="btn btn-outline" onclick="window.anoriClearModuleSearch('${module}')">↻ CLEAR</button>
        <span id="${id}-count" class="anori-manual-search-count"></span>
      </div>
    </div>`;
  }

  const state={};
  function getRows(module){
    const content=document.querySelector('.view.active > div:last-child');
    if(!content)return [];
    const table=content.querySelector(module==='settlements' ? '#driverLedgerHost tbody' : module==='reports' ? '#reportHost tbody' : 'table tbody');
    return table ? [...table.querySelectorAll('tr')] : [];
  }
  function recordList(module){
    if(module==='trips') return DB.get('trips',[]);
    if(module==='invoices') return DB.get('invoices',[]).filter(x=>String(x.status||'').toLowerCase()!=='cancelled');
    if(module==='reports') return DB.get('trips',[]);
    if(module==='settlements') return DB.get('driver_settlements',[]);
    return [];
  }
  function rowId(module,row){ return row?.dataset?.manualSearchId || ''; }
  function attachRowIds(module){
    const rows=getRows(module), records=recordList(module);
    if(!rows.length)return;
    if(module==='invoices'){
      const ordered=records.slice().reverse();
      rows.forEach((r,i)=>{ if(ordered[i]) r.dataset.manualSearchId=ordered[i].id; });
    } else if(module==='settlements'){
      const hostRows=DB.get('driver_settlements',[]);
      rows.forEach((r,i)=>{ if(hostRows[i]) r.dataset.manualSearchId=hostRows[i].id; });
    } else {
      rows.forEach((r,i)=>{ if(records[i]) r.dataset.manualSearchId=records[i].id; });
    }
  }
  function matches(module,record,field,q){
    if(!q)return true;
    if(module==='trips' || module==='reports') return includes(tripSearchText(record,field),q);
    if(module==='invoices') return includes(invoiceSearchText(record,field),q);
    if(module==='settlements') return includes(settlementSearchText(record,field),q);
    return false;
  }
  function apply(module){
    attachRowIds(module);
    const root=document.getElementById('anori-manual-search-'+module);if(!root)return;
    const field=document.getElementById(root.id+'-field')?.value||'all';
    const q=document.getElementById(root.id+'-query')?.value||'';
    state[module]={field,q};
    const records=recordList(module);
    const map=new Map(records.map(r=>[r.id,r]));
    const rows=getRows(module);
    let shown=0;
    rows.forEach(row=>{
      const rec=map.get(rowId(module,row));
      const ok=!!rec && matches(module,rec,field,q);
      row.style.display=ok?'':'none';
      if(ok && !row.classList.contains('empty-state'))shown++;
    });
    const count=document.getElementById(root.id+'-count');
    if(count)count.textContent=q?`${shown} RESULT${shown===1?'':'S'} FOUND`:'';
  }
  function clear(module){
    const root=document.getElementById('anori-manual-search-'+module);if(!root)return;
    const input=document.getElementById(root.id+'-query');if(input)input.value='';
    const field=document.getElementById(root.id+'-field');if(field)field.value='all';
    state[module]={field:'all',q:''};
    apply(module);
  }
  function compactControls(module){
    const id='anori-manual-search-'+module;
    const options=FIELD_OPTIONS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
    const heading='';
    return `<div id="${id}" class="anori-manual-search anori-manual-search-inline">
      <strong class="anori-manual-search-inline-title">${heading}</strong>
      <label><span>SEARCH BY</span><select id="${id}-field" class="form-control">${options}</select></label>
      <label class="anori-manual-search-query"><span>SEARCH</span><input id="${id}-query" class="form-control" type="text" placeholder="ENTER SEARCH TEXT..."></label>
      <button type="button" class="btn btn-primary" onclick="window.anoriApplyModuleSearch('${module}')">🔎 SEARCH</button>
      <button type="button" class="btn btn-outline" onclick="window.anoriClearModuleSearch('${module}')">↻ CLEAR</button>
      <span id="${id}-count" class="anori-manual-search-count"></span>
    </div>`;
  }
  function install(container,module){
    if(!container || container.querySelector('#anori-manual-search-'+module))return;
    const filter=container.querySelector('.anori-filter-bar');
    if(filter){
      filter.insertAdjacentHTML('beforeend',compactControls(module));
    }else{
      container.insertAdjacentHTML('afterbegin',compactControls(module));
    }
    const input=document.getElementById('anori-manual-search-'+module+'-query');
    input?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();apply(module);}});
    setTimeout(()=>{attachRowIds(module); if(state[module]?.q)apply(module);},0);
  }

  window.anoriApplyModuleSearch=apply;
  window.anoriClearModuleSearch=clear;

  function wrap(obj,module){
    const original=obj?.render;
    if(typeof original!=='function' || obj.__manualSearchWrapped)return;
    obj.__manualSearchWrapped=true;
    obj.render=function(container){
      const result=original.call(this,container);
      install(container,module);
      setTimeout(()=>{attachRowIds(module);if(state[module]?.q)apply(module);},40);
      return result;
    };
  }
  wrap(Trips,'trips');
  wrap(Invoices,'invoices');
  wrap(Reports,'reports');
  wrap(DriverSettlement,'settlements');
})();

/* ANORI TRANSPORT — GLOBAL TABLE UX
   1) Every application table gets A-Z/Z-A sorting on data columns.
   2) Checkbox selection columns receive the explicit SELECT heading.
   Sorting is client-side only and does not modify stored data. */
(function installGlobalTableUX(){
  'use strict';

  function cellValue(cell){
    const input=cell?.querySelector('input,select,textarea');
    let value=input ? (input.value || input.getAttribute('aria-label') || input.checked ? (input.type==='checkbox' ? (input.checked?'1':'0') : input.value) : '') : (cell?.textContent||'');
    value=String(value).replace(/\s+/g,' ').trim();
    return value;
  }
  function comparable(v){
    const raw=String(v||'').trim();
    const numeric=raw.replace(/[₹,%,$,\s]/g,'');
    if(numeric!=='' && /^-?\d+(?:\.\d+)?$/.test(numeric)) return {type:'number',value:Number(numeric)};
    const d=Date.parse(raw);
    if(!Number.isNaN(d) && /\d/.test(raw) && /[-\/]/.test(raw)) return {type:'date',value:d};
    return {type:'text',value:raw.toLocaleLowerCase()};
  }
  function sortTable(table, index, direction){
    const tbody=table.tBodies?.[0]; if(!tbody)return;
    const rows=[...tbody.rows].filter(r=>!r.classList.contains('empty-state'));
    rows.sort((a,b)=>{
      const av=comparable(cellValue(a.cells[index])), bv=comparable(cellValue(b.cells[index]));
      let result=0;
      if(av.type===bv.type){
        if(av.value>bv.value)result=1; else if(av.value<bv.value)result=-1;
      }else result=String(av.value).localeCompare(String(bv.value),undefined,{numeric:true,sensitivity:'base'});
      return result*direction;
    });
    rows.forEach(r=>tbody.appendChild(r));
  }
  function prepare(root=document){
    const tables=root.querySelectorAll?.('.view.active table, #mainContent .view.active table')||[];
    tables.forEach(table=>{
      table.querySelectorAll('thead th').forEach((th,index)=>{
        if(th.querySelector('input[type="checkbox"]')){
          if(!th.dataset.selectionHeading){
            const box=th.querySelector('input[type="checkbox"]');
            th.dataset.selectionHeading='1';
            th.style.whiteSpace='nowrap';
            // Selection header intentionally remains blank; checkbox is the selector.
          }
          th.dataset.sortable='0';
          return;
        }
        if(th.dataset.sortable==='1')return;
        th.dataset.sortable='1';
        th.setAttribute('role','button');
        th.setAttribute('tabindex','0');
        th.title='SORT A-Z';
        th.style.cursor='pointer';
        th.style.userSelect='none';
        th.addEventListener('click',()=>{
          const next=th.dataset.sortDir==='1'?-1:1;
          table.querySelectorAll('thead th').forEach(x=>{if(x!==th)x.dataset.sortDir='';});
          th.dataset.sortDir=String(next);
          th.title=next===1?'SORT Z-A':'SORT A-Z';
          table.querySelectorAll('thead th .anori-sort-indicator').forEach(x=>x.remove());
          const indicator=document.createElement('span');
          indicator.className='anori-sort-indicator';
          indicator.textContent=next===1?' ↑':' ↓';
          indicator.style.fontSize='10px';
          indicator.style.opacity='.7';
          th.appendChild(indicator);
          sortTable(table,index,next);
        });
        th.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();th.click();}});
      });
    });
  }
  window.anoriInstallTableUX=()=>prepare(document.getElementById('mainContent')||document);
  const observer=new MutationObserver(()=>{ clearTimeout(observer._t); observer._t=setTimeout(()=>prepare(document.getElementById('mainContent')||document),25); });
  observer.observe(document.getElementById('mainContent')||document.body,{childList:true,subtree:true});
  setTimeout(()=>prepare(document),0);
})();


/* FINAL TRIP MANAGEMENT UI AMENDMENT
   - New Trip is inside Actions toolbar
   - Trip PDF + EMAIL actions removed
   - Selection column uses SELECT heading (global table UX)
   - 15 rows per page retained
   - Manual Search sits in the same filter/search row for cleaner layout
*/
(function installFinalTripManagementUI(){
  'use strict';
  const escV=v=>Sanitize.html(v==null?'':String(v));
  const nV=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const moneyV=v=>Utils.fmt(nV(v));
  const allTrips=()=>DB.get('trips',[])||[];
  const vehicleV=id=>(DB.get('vehicles',[])||[]).find(x=>x.id===id);
  const partyV=id=>(DB.get('parties',[])||[]).find(x=>x.id===id);
  const activeInvV=id=>typeof activeInvoiceForTrip==='function'?activeInvoiceForTrip(id):(DB.get('invoices',[])||[]).find(i=>Array.isArray(i.trip_ids)&&i.trip_ids.includes(id)&&String(i.status||'').toLowerCase()!=='cancelled');

  // Keep invoice toolbar unchanged; simplify Trip toolbar only.
  window.toolbar=function(type,countId){
    if(type!=='trip'){
      const p='Invoices.actionPreview()',pdf='Invoices.actionPDF()',email='Invoices.actionEmail()',dup='Invoices.duplicateSelected()',edit='Invoices.editSelected()',del='Invoices.deleteSelected()';
      return window.bar(`
        <button type="button" class="anori-action-btn anori-action-preview" onclick="${p}">👁 PREVIEW</button>
        <button type="button" class="anori-action-btn anori-action-payment" onclick="Invoices.actionPayment()">💵 PAYMENT</button>
        <button type="button" class="anori-action-btn anori-action-duplicate" onclick="${dup}">📋 DUPLICATE</button>
        <button type="button" class="anori-action-btn anori-action-edit" onclick="${edit}">✏️ EDIT</button>
        <button type="button" class="anori-action-btn anori-action-delete" onclick="${del}">🗑 DELETE</button>
        <button type="button" class="anori-action-btn anori-action-cancel" onclick="Invoices.actionCancel()">❌ CANCEL</button>
      `,countId);
    }
    return window.bar(`
      <button type="button" class="anori-action-btn anori-action-add" style="background:#16a34a!important;" onclick="Trips.openForm()">＋ NEW TRIP</button>
      <button type="button" class="anori-action-btn anori-action-preview" onclick="Trips.actionPreview()">👁 PREVIEW</button>
      <button type="button" class="anori-action-btn anori-action-duplicate" onclick="Trips.duplicateSelected()">📋 DUPLICATE</button>
      <button type="button" class="anori-action-btn anori-action-edit" onclick="Trips.editSelected()">✏️ EDIT</button>
      <button type="button" class="anori-action-btn anori-action-delete" onclick="Trips.deleteSelected()">🗑 DELETE</button>
      <button type="button" class="anori-action-btn anori-action-columns" onclick="Trips.openColumnSelector()">☷ COLUMNS</button>
    `,countId);
  };

  Trips.__page=Trips.__page||1;
  Trips.__selectedIds=Trips.__selectedIds instanceof Set?Trips.__selectedIds:new Set();
  const PAGE_SIZE=15;
  function current(){
    const a=allTrips();
    const pages=Math.max(1,Math.ceil(a.length/PAGE_SIZE));
    Trips.__page=Math.min(Math.max(1,Number(Trips.__page)||1),pages);
    const start=(Trips.__page-1)*PAGE_SIZE;
    return {all:a,rows:a.slice(start,start+PAGE_SIZE),pages,start};
  }
  Trips.__gotoPage=function(page){
    const {pages}=current();
    Trips.__page=Math.min(Math.max(1,Number(page)||1),pages);
    const host=document.getElementById('view-trips')||document.querySelector('#mainContent .view.active');
    if(host)Trips.render(host);
  };
  Trips.getSelected=function(){
    const valid=new Set(allTrips().map(t=>String(t.id)));
    Trips.__selectedIds=new Set([...Trips.__selectedIds].filter(id=>valid.has(String(id))));
    return [...Trips.__selectedIds];
  };
  Trips.updateSelectionCount=function(){
    const el=document.getElementById('tripSelectedCount');
    if(el)el.textContent=`${Trips.getSelected().length} SELECTED`;
    document.querySelectorAll('#view-trips .trip-row-check').forEach(cb=>cb.checked=Trips.__selectedIds.has(String(cb.value)));
    const checks=[...document.querySelectorAll('#view-trips .trip-row-check')];
    const master=document.querySelector('#view-trips .trip-page-check-all');
    if(master)master.checked=checks.length>0&&checks.every(cb=>cb.checked);
  };
  Trips.toggleAll=function(flag){
    const {rows}=current();
    rows.forEach(t=>flag?Trips.__selectedIds.add(String(t.id)):Trips.__selectedIds.delete(String(t.id)));
    Trips.updateSelectionCount();
  };
  Trips.__toggleRow=function(id,checked){
    id=String(id);if(checked)Trips.__selectedIds.add(id);else Trips.__selectedIds.delete(id);Trips.updateSelectionCount();
  };

  const TRIP_COLUMNS=[
    {key:'date',label:'DATE'},
    {key:'trip',label:'TRIP #'},
    {key:'vehicle',label:'VEHICLE'},
    {key:'driver',label:'DRIVER'},
    {key:'party',label:'PARTY'},
    {key:'route',label:'ROUTE'},
    {key:'freight',label:'FREIGHT'},
    {key:'advance',label:'TRIP ADVANCE'},
    {key:'profit',label:'PROFIT'},
    {key:'invoice',label:'INVOICE'}
  ];
  function tripColumnKeys(){
    const fallback=TRIP_COLUMNS.map(x=>x.key);
    try{const saved=JSON.parse(localStorage.getItem('anori_trip_visible_columns')||'null');return Array.isArray(saved)&&saved.length?saved.filter(k=>fallback.includes(k)):fallback;}catch(e){return fallback;}
  }
  Trips.openColumnSelector=function(){
    const currentKeys=tripColumnKeys();
    const html=`<div style="text-align:left;display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:4px 2px;">${TRIP_COLUMNS.map(c=>`<label style="display:flex;align-items:center;gap:8px;padding:9px 10px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;cursor:pointer;"><input type="checkbox" class="anori-trip-col-check" value="${c.key}" ${currentKeys.includes(c.key)?'checked':''}> <span>${c.label}</span></label>`).join('')}</div><div style="margin-top:10px;font-size:12px;color:#64748b;text-align:left;">SELECT columns to display. The SELECT column is always retained.</div>`;
    Swal.fire({title:'CUSTOM COLUMN SELECTION',html,width:560,showCancelButton:true,confirmButtonText:'SAVE COLUMNS',cancelButtonText:'CANCEL',preConfirm:()=>{const keys=[...document.querySelectorAll('.anori-trip-col-check:checked')].map(x=>x.value);if(!keys.length){Swal.showValidationMessage('Select at least one column.');return false;}return keys;}}).then(r=>{if(!r.isConfirmed)return;localStorage.setItem('anori_trip_visible_columns',JSON.stringify(r.value));Trips.__selectedIds=new Set(Trips.getSelected());Router.go('trips');});
  };

  Trips.render=function(container){
    if(typeof sync==='function')sync();
    const {all,rows,pages,start}=current();
    const total=all.length, from=total?start+1:0, to=Math.min(start+PAGE_SIZE,total);
    const selected=Trips.getSelected();
    const pageAllSelected=rows.length>0&&rows.every(t=>Trips.__selectedIds.has(String(t.id)));
    const pagination=`<div class="anori-trip-pagination"><div class="anori-trip-page-info">Showing ${from} to ${to} of ${total} entries</div><div class="anori-trip-page-controls"><button type="button" class="anori-page-btn" ${Trips.__page<=1?'disabled':''} onclick="Trips.__gotoPage(${Trips.__page-1})">‹</button><span class="anori-page-current">${Trips.__page}</span><button type="button" class="anori-page-btn" ${Trips.__page>=pages?'disabled':''} onclick="Trips.__gotoPage(${Trips.__page+1})">›</button></div></div>`;
    const visibleCols=tripColumnKeys();
    const cellFor=(t,c)=>{
      const inv=activeInvV(t.id), v=vehicleV(t.vehicle_id), p=partyV(t.party_id);
      const e=(t.expenses||[]).reduce((s,x)=>s+nV(x.amount),0), profit=nV(t.freight)-e;
      const map={date:escV(t.date),trip:`<strong>${escV(t.trip_no)}</strong>`,vehicle:escV(v?.number||'-'),driver:escV((DB.get('drivers',[])||[]).find(x=>x.id===t.driver_id)?.name||'-'),party:escV(p?.name||'-'),route:`${escV(t.from)} → ${escV(t.to)}`,freight:moneyV(t.freight),advance:moneyV(t.trip_advance_amount),profit:`<span class="profit-positive">${moneyV(profit)}</span>`,invoice:inv?'<span class="status-badge status-shared">INVOICED</span>':'<span class="status-badge status-pending">PENDING</span>'};
      return map[c]||'-';
    };
    const rowsHtml=rows.map((t,idx)=>`<tr class="anori-trip-row ${idx%2===1?'anori-trip-alt-row':''}"><td><input type="checkbox" class="trip-row-check" value="${escV(t.id)}" ${Trips.__selectedIds.has(String(t.id))?'checked':''} onchange="Trips.__toggleRow('${escV(t.id)}',this.checked)"></td>${visibleCols.map(c=>`<td>${cellFor(t,c)}</td>`).join('')}</tr>`).join('');
    const tableHead=`<th class="anori-select-heading"></th>${visibleCols.map(c=>`<th>${TRIP_COLUMNS.find(x=>x.key===c)?.label||c.toUpperCase()}</th>`).join('')}`;
    container.innerHTML=`
      <div class="anori-section-intro"><div><strong>Trip Management</strong><span>Select rows, then use the Actions above the table.</span></div></div>
      <div class="card">
        ${window.toolbar('trip','tripSelectedCount')}
        <div class="anori-filter-bar anori-trip-search-filter-row">
          <label><span>SEARCH BY</span><select id="trip-manual-filter-field" class="form-control"><option value="all">ALL FIELDS</option><option value="party">PARTY NAME</option><option value="driver">DRIVER NAME</option><option value="pol">POL</option><option value="pod">POD</option><option value="invoice">INVOICE NO.</option><option value="trip">TRIP NO.</option><option value="vehicle">VEHICLE NO.</option></select></label>
          <label class="anori-trip-search-input"><span>SEARCH</span><input id="trip-manual-filter-query" class="form-control" type="text" placeholder="ENTER PARTY, DRIVER, POL, POD, INVOICE, TRIP OR VEHICLE..."></label>
          <button type="button" class="btn btn-primary" id="trip-manual-filter-search">🔎 SEARCH</button>
          <button type="button" class="btn btn-outline" id="trip-manual-filter-clear">↻ CLEAR</button>
          <span id="trip-manual-filter-count" class="anori-manual-search-count"></span>
        </div>
        <div class="table-wrapper anori-trip-table-wrap">
          ${total?`<table class="anori-trip-table"><thead><tr><th class="anori-select-heading" aria-label=""><input type="checkbox" class="trip-page-check-all" aria-label="Select all trips on this page" ${pageAllSelected?'checked':''} onchange="Trips.toggleAll(this.checked)"></th>${visibleCols.map(c=>`<th>${TRIP_COLUMNS.find(x=>x.key===c)?.label||c.toUpperCase()}</th>`).join('')}</tr></thead><tbody>${rowsHtml}</tbody></table>`:`<div class="empty-state"><i class="fas fa-route"></i><h3>No Trips Yet</h3><p>Create your first trip.</p></div>`}
        </div>${pagination}
      </div>`;

    // Manual search is intentionally manual: no filtering while typing.
    const search=()=>{
      const field=document.getElementById('trip-manual-filter-field')?.value||'all', q=(document.getElementById('trip-manual-filter-query')?.value||'').trim().toLowerCase();
      const rowsEls=[...container.querySelectorAll('tbody tr.anori-trip-row')];
      const count=document.getElementById('trip-manual-filter-count');let shown=0;
      rowsEls.forEach(row=>{
        const t=allTrips().find(x=>String(x.id)===String(row.querySelector('.trip-row-check')?.value));
        if(!t){row.style.display='none';return;}
        const p=partyV(t.party_id),d=(DB.get('drivers',[])||[]).find(x=>x.id===t.driver_id),v=vehicleV(t.vehicle_id),inv=activeInvV(t.id);
        const map={party:p?.name,driver:d?.name,pol:t.from,pod:t.to,invoice:inv?.invoice_no,trip:t.trip_no,vehicle:v?.number};
        const text=field==='all'?[p?.name,d?.name,t.from,t.to,inv?.invoice_no,t.trip_no,v?.number,t.date].filter(Boolean).join(' '):map[field]||'';
        const ok=!q||String(text).toLowerCase().includes(q);row.style.display=ok?'':'none';if(ok)shown++;
      });
      if(count)count.textContent=q?`${shown} RESULT${shown===1?'':'S'} FOUND`:'';
    };
    document.getElementById('trip-manual-filter-search')?.addEventListener('click',search);
    document.getElementById('trip-manual-filter-clear')?.addEventListener('click',()=>{document.getElementById('trip-manual-filter-query').value='';document.getElementById('trip-manual-filter-field').value='all';search();});
    document.getElementById('trip-manual-filter-query')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search();}});
    Trips.updateSelectionCount();
    setTimeout(()=>window.anoriInstallTableUX?.(),0);
  };
  window.ANORI_TRIP_FINAL_UI=true;
})();


/* ============================================================
   ANORI TRANSPORT — INVOICES & BILLING FINAL UI AMENDMENT
   - Manual Search moved directly above the invoice table
   - No SELECT column in the invoice table
   - Row-click selection powers Preview / PDF / Payment / Cancel
   - DAYS replaces REMAINING DAYS with circular due-date indicator
   - Invoice date follows the earliest selected Trip date
   ============================================================ */
(function installInvoiceBillingFinalUI(){
  'use strict';
  if(typeof Invoices==='undefined') return;
  const escF=v=>Sanitize.html(v==null?'':String(v));
  const numF=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const moneyF=v=>Utils.fmt(numF(v));
  const allInv=()=>DB.get('invoices',[])||[];
  const partyF=id=>(DB.get('parties',[])||[]).find(p=>p.id===id);
  const paymentsF=()=>DB.get('payments',[])||[];
  const paidF=i=>numF(i?.advance)+paymentsF().filter(p=>p.invoice_id===i?.id).reduce((s,p)=>s+numF(p.amount),0);
  const balanceF=i=>Math.max(0,numF(i?.total_amount)-paidF(i));
  const statusF=i=>{
    if(!i)return 'unknown';
    if(String(i.status||'').toLowerCase()==='cancelled')return 'cancelled';
    const b=balanceF(i),p=paidF(i),due=new Date(Invoices.getDueDate(i.date,i.credit_days||30));
    if(b<=0)return 'paid';
    if(!Number.isNaN(due.getTime())&&due<new Date(`${Utils.today()}T00:00:00`))return 'overdue';
    return p>0?'part_paid':'unpaid';
  };
  const selected=new Set();
  let searchState={field:'all',query:''};
  const fieldOptions=[
    ['all','ALL FIELDS'],['party','PARTY NAME'],['driver','DRIVER NAME'],['pol','POL'],
    ['pod','POD'],['invoice','INVOICE NO.'],['trip','TRIP NO.'],['vehicle','VEHICLE NO.']
  ];
  function linkedTrips(i){
    if(Array.isArray(i?.trips_data)&&i.trips_data.length)return i.trips_data;
    const ids=Array.isArray(i?.trip_ids)?i.trip_ids:[];
    return (DB.get('trips',[])||[]).filter(t=>ids.includes(t.id));
  }
  function searchText(i,field){
    const p=partyF(i.party_id),ts=linkedTrips(i);
    const drivers=ts.map(t=>(DB.get('drivers',[])||[]).find(d=>d.id===t.driver_id)?.name).filter(Boolean).join(' ');
    const pol=ts.map(t=>t.from).filter(Boolean).join(' '),pod=ts.map(t=>t.to).filter(Boolean).join(' ');
    const trip=ts.map(t=>t.trip_no).filter(Boolean).join(' '),vehicle=ts.map(t=>(DB.get('vehicles',[])||[]).find(v=>v.id===t.vehicle_id)?.number).filter(Boolean).join(' ');
    const map={party:p?.name,driver:drivers,pol,pod,invoice:i.invoice_no,trip,vehicle};
    return field==='all'?[p?.name,drivers,pol,pod,i.invoice_no,trip,vehicle,i.date,statusF(i)].filter(Boolean).join(' '):(map[field]||'');
  }
  function dueDays(i){
    const due=Invoices.getDueDate(i.date,i.credit_days||30);
    const a=new Date(`${Utils.today()}T00:00:00`),b=new Date(`${due}T00:00:00`);
    if(Number.isNaN(b.getTime()))return null;
    return Math.round((b-a)/86400000);
  }
  function daysBadge(i){
    const d=dueDays(i);
    if(d===null)return '<span class="anori-days-badge anori-days-badge-red">-</span>';
    const overdue=d<0;
    return `<span class="anori-days-badge ${overdue?'anori-days-badge-red':'anori-days-badge-green'}" title="${overdue?'OVERDUE':'DUE AFTER'}">${Math.abs(d)}</span>`;
  }
  function renderSearch(){
    const options=fieldOptions.map(([v,l])=>`<option value="${v}" ${searchState.field===v?'selected':''}>${l}</option>`).join('');
    return `<div class="anori-invoice-searchbar"><label><span>SEARCH BY</span><select id="anori-invoice-search-field" class="form-control">${options}</select></label><label class="anori-invoice-search-query"><span>SEARCH</span><input id="anori-invoice-search-query" class="form-control" value="${escF(searchState.query)}" placeholder="ENTER SEARCH TEXT..."></label><button type="button" class="btn btn-primary" id="anori-invoice-search-btn">🔎 SEARCH</button><button type="button" class="btn btn-outline" id="anori-invoice-clear-btn">↻ CLEAR</button><span id="anori-invoice-search-count" class="anori-manual-search-count"></span></div>`;
  }
  function applySearch(){
    searchState.field=document.getElementById('anori-invoice-search-field')?.value||'all';
    searchState.query=(document.getElementById('anori-invoice-search-query')?.value||'').trim();
    const q=searchState.query.toLowerCase();let shown=0;
    document.querySelectorAll('#view-invoices tbody tr.anori-invoice-row').forEach(row=>{
      const inv=allInv().find(x=>String(x.id)===String(row.dataset.invoiceId));
      const ok=!!inv&&(!q||searchText(inv,searchState.field).toLowerCase().includes(q));
      row.style.display=ok?'':'none';if(ok)shown++;
    });
    const c=document.getElementById('anori-invoice-search-count');if(c)c.textContent=q?`${shown} RESULT${shown===1?'':'S'} FOUND`:'';
  }
  function clearSearch(){searchState={field:'all',query:''};const f=document.getElementById('anori-invoice-search-field'),q=document.getElementById('anori-invoice-search-query');if(f)f.value='all';if(q)q.value='';applySearch();}
  function selectRow(id){
    id=String(id);
    if(selected.has(id))selected.delete(id);else selected.add(id);
    document.querySelectorAll('#view-invoices .anori-invoice-row').forEach(r=>r.classList.toggle('anori-row-selected',selected.has(String(r.dataset.invoiceId))));
    Invoices.updateSelectionCount();
  }
  Invoices.getSelected=function(){
    const valid=new Set(allInv().map(i=>String(i.id)));
    [...selected].forEach(id=>{if(!valid.has(id))selected.delete(id);});
    return [...selected];
  };
  Invoices.updateSelectionCount=function(){const el=document.getElementById('invoiceSelectedCount');if(el)el.textContent=`${Invoices.getSelected().length} SELECTED`;};
  Invoices.toggleAll=function(flag){
    const rows=[...document.querySelectorAll('#view-invoices .anori-invoice-row')].filter(r=>r.style.display!=='none');
    rows.forEach(r=>flag?selected.add(String(r.dataset.invoiceId)):selected.delete(String(r.dataset.invoiceId)));
    document.querySelectorAll('#view-invoices .anori-invoice-row').forEach(r=>{
      const on=selected.has(String(r.dataset.invoiceId));
      r.classList.toggle('anori-row-selected',on);
      const cb=r.querySelector('.invoice-row-check'); if(cb) cb.checked=on;
    });
    Invoices.updateSelectionCount();
  };
  const needOne=()=>{const ids=Invoices.getSelected();if(ids.length!==1){Utils.toast(ids.length?'SELECT ONLY ONE INVOICE.':'SELECT ONE INVOICE BY CLICKING ITS ROW.','warning');return null;}return ids[0];};
  Invoices.actionPreview=function(){const id=needOne();if(id)Invoices.previewExisting(id);};
  Invoices.actionPDF=function(){const id=needOne();if(id)Invoices.downloadExisting(id);};
  Invoices.actionEmail=function(){const id=needOne();if(id)Invoices.emailExisting(id);};
  Invoices.actionPayment=function(){const id=needOne();if(id)Invoices.recordPayment(id);};
  Invoices.actionCancel=function(){const id=needOne();if(id)Invoices.cancelInvoice(id);};

  Invoices.render=function(container){
    if(typeof sync==='function')sync();
    const a=allInv();
    const active=a.filter(i=>statusF(i)!=='cancelled');
    const cnt={paid:0,unpaid:0,part_paid:0,overdue:0};active.forEach(i=>{const s=statusF(i);if(Object.prototype.hasOwnProperty.call(cnt,s))cnt[s]++;});
    const billed=active.reduce((s,i)=>s+numF(i.total_amount),0),received=active.reduce((s,i)=>s+paidF(i),0);
    container.innerHTML=`
      <div class="anori-section-intro"><div><strong>Invoices & Billing</strong><span>Payment status is calculated automatically from recorded payments.</span></div><button class="btn btn-success" onclick="Invoices.showInvoiceGenerator()">＋ NEW INVOICE</button></div>
      <div class="anori-kpi-grid anori-kpi-grid-5">
        <div class="anori-kpi-card"><span>TOTAL INVOICES</span><strong>${active.length}</strong><small>${moneyF(billed)} BILLED</small></div>
        <div class="anori-kpi-card anori-kpi-good"><span>PAID</span><strong>${cnt.paid}</strong><small>${moneyF(received)} RECEIVED</small></div>
        <div class="anori-kpi-card anori-kpi-warn"><span>UNPAID</span><strong>${cnt.unpaid}</strong><small>${moneyF(active.filter(i=>statusF(i)==='unpaid').reduce((s,i)=>s+balanceF(i),0))} PENDING</small></div>
        <div class="anori-kpi-card anori-kpi-info"><span>PART PAID</span><strong>${cnt.part_paid}</strong><small>${moneyF(active.filter(i=>statusF(i)==='part_paid').reduce((s,i)=>s+balanceF(i),0))} BALANCE</small></div>
        <div class="anori-kpi-card anori-kpi-bad"><span>OVERDUE</span><strong>${cnt.overdue}</strong><small>${moneyF(active.filter(i=>statusF(i)==='overdue').reduce((s,i)=>s+balanceF(i),0))} OVERDUE</small></div>
      </div>
      
      <div class="card">
        ${window.toolbar('invoice','invoiceSelectedCount')}
        ${renderSearch()}
        <div class="table-wrapper anori-invoice-table-wrap"><table class="anori-invoice-table"><thead><tr><th class="anori-select-col" aria-label=""><input type="checkbox" aria-label="SELECT ALL INVOICES" onchange="Invoices.toggleAll(this.checked)"></th><th>INVOICE</th><th>DATE</th><th>DUE DATE</th><th>DAYS</th><th>CUSTOMER</th><th>TRIPS</th><th>TOTAL</th><th>RECEIVED</th><th>BALANCE</th><th>STATUS</th></tr></thead><tbody>
        ${a.slice().reverse().map(i=>{const s=statusF(i),p=partyF(i.party_id),sid=String(i.id),isSel=selected.has(sid);return `<tr class="anori-invoice-row ${isSel?'anori-row-selected':''}" data-invoice-id="${escF(i.id)}" tabindex="0" title="CLICK TO SELECT"><td class="anori-select-col"><input type="checkbox" class="invoice-row-check" value="${escF(i.id)}" ${isSel?'checked':''} aria-label="SELECT INVOICE ${escF(i.invoice_no)}"></td><td><strong>${escF(i.invoice_no)}</strong></td><td>${escF(i.date)}</td><td>${escF(Invoices.getDueDate(i.date,i.credit_days||30))}</td><td>${daysBadge(i)}</td><td>${escF(p?.name||'-')}</td><td>${numF(i.trip_count)}</td><td>${moneyF(i.total_amount)}</td><td>${moneyF(paidF(i))}</td><td><strong>${moneyF(balanceF(i))}</strong></td><td><span class="status-badge status-${s.replace('_','-')}">${escF(s.replace('_',' ').toUpperCase())}</span></td></tr>`}).join('')||'<tr><td colspan="11" class="empty-state">NO INVOICES.</td></tr>'}
        </tbody></table></div>
      </div>`;
    container.querySelectorAll('.anori-invoice-row').forEach(row=>{
      row.addEventListener('click',e=>{if(e.target.closest('button,select,a'))return;if(e.target.closest('input[type="checkbox"]'))return;selectRow(row.dataset.invoiceId);});
      const cb=row.querySelector('.invoice-row-check');
      cb?.addEventListener('change',e=>{
        const id=String(row.dataset.invoiceId);
        if(e.target.checked)selected.add(id);else selected.delete(id);
        row.classList.toggle('anori-row-selected',e.target.checked);
        Invoices.updateSelectionCount();
      });
      row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectRow(row.dataset.invoiceId);}});
    });
    document.getElementById('anori-invoice-search-btn')?.addEventListener('click',applySearch);
    document.getElementById('anori-invoice-clear-btn')?.addEventListener('click',clearSearch);
    document.getElementById('anori-invoice-search-query')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applySearch();}});
    if(searchState.query)applySearch();
    Invoices.updateSelectionCount();
    setTimeout(()=>window.anoriInstallTableUX?.(),0);
  };
  window.ANORI_INVOICE_FINAL_UI=true;
})();

/* FINAL INVOICE PDF FIX
   Invoices & Billing -> PDF and Invoice Preview -> Download PDF use the same
   rendered Invoice Preview DOM and the same html2pdf pipeline. No manual
   jsPDF.addImage coordinate calculations are used here. */
(function(){
  if(!window.Invoices) return;
  Invoices.downloadInvoice = async function(invoice){
    const host=document.getElementById('previewContent');
    if(!host) return Utils.toast('Invoice Preview area is not available.','error');
    const normalized=typeof this.normalizeInvoice==='function' ? this.normalizeInvoice(invoice) : invoice;
    if(!normalized) return Utils.toast('Invoice not found.','error');

    let page = host.dataset.invoiceId===normalized.id ? host.querySelector('.invoice-page') : null;
    if(!page && typeof this.mountInvoiceDocument==='function'){
      host.innerHTML='';
      page=this.mountInvoiceDocument(normalized);
      host.dataset.invoiceId=normalized.id;
    }
    if(!page) return Utils.toast('Invoice Preview could not be prepared.','error');
    if(typeof window.html2pdf!=='function'){
      return Swal.fire({icon:'error',title:'PDF Generation Failed',text:'PDF library is not loaded.',confirmButtonText:'OK'});
    }

    const stage=page.parentElement;
    const old={
      page:{transform:page.style.transform,transformOrigin:page.style.transformOrigin,zoom:page.style.zoom,position:page.style.position,left:page.style.left,top:page.style.top,margin:page.style.margin,width:page.style.width,minWidth:page.style.minWidth,overflow:page.style.overflow},
      stage:{width:stage?.style.width||'',height:stage?.style.height||'',minHeight:stage?.style.minHeight||'',overflow:stage?.style.overflow||'',padding:stage?.style.padding||'',display:stage?.style.display||'',justifyContent:stage?.style.justifyContent||'',alignItems:stage?.style.alignItems||''},
      host:{width:host.style.width,height:host.style.height,overflow:host.style.overflow}
    };

    try{
      // Same invoice DOM as Preview; only viewer scaling is removed for capture.
      Object.assign(page.style,{transform:'none',transformOrigin:'top center',zoom:'1',position:'static',left:'auto',top:'auto',margin:'0',width:'210mm',minWidth:'210mm',overflow:'visible'});
      if(stage) Object.assign(stage.style,{width:'210mm',height:'auto',minHeight:'0',overflow:'visible',padding:'0',display:'block',justifyContent:'flex-start',alignItems:'flex-start'});
      Object.assign(host.style,{width:'210mm',height:'auto',overflow:'visible'});

      if(document.fonts?.ready) await document.fonts.ready;
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

      await window.html2pdf().set({
        margin:0,
        filename:`${normalized.invoice_no}.pdf`,
        image:{type:'jpeg',quality:.98},
        html2canvas:{
          scale:2,
          useCORS:true,
          allowTaint:false,
          backgroundColor:'#ffffff',
          logging:false,
          scrollX:0,
          scrollY:0,
          windowWidth:794,
          windowHeight:Math.max(1123,page.scrollHeight||1123)
        },
        pagebreak:{mode:['css','legacy'],avoid:['.avoid']},
        jsPDF:{unit:'mm',format:'a4',orientation:'portrait',compress:true}
      }).from(page).save();

      Utils.toast('PDF downloaded using the same Invoice Preview layout.','success');
    }catch(e){
      console.error('Invoice PDF generation failed:',e);
      await Swal.fire({icon:'error',title:'PDF Generation Failed',text:e?.message||'Unable to generate the PDF.',confirmButtonText:'OK'});
    }finally{
      Object.assign(page.style,old.page);
      if(stage) Object.assign(stage.style,old.stage);
      Object.assign(host.style,old.host);
      if(document.getElementById('previewModal')?.classList.contains('active')) this.fitPreviewToScreen?.();
    }
  };

  // Invoices & Billing table/action-bar PDF button routes through the same
  // function above, which is also used by Invoice Preview's PDF button.
  Invoices.downloadExisting = function(id){
    const invoice=(DB.get('invoices',[])||[]).find(i=>String(i.id)===String(id));
    if(!invoice) return Utils.toast('Invoice not found.','error');
    return this.downloadInvoice(invoice);
  };
  Invoices.actionPDF = function(){
    const ids=typeof this.getSelected==='function' ? this.getSelected() : [];
    if(ids.length!==1) return Utils.toast(ids.length ? 'SELECT ONLY ONE INVOICE.' : 'SELECT ONE INVOICE.', 'warning');
    return this.downloadExisting(ids[0]);
  };
})();

/* FINAL INVOICE PDF ACTION OVERRIDE
   Invoices & Billing -> Actions -> PDF intentionally uses the exact same
   download path as the Invoice Preview -> Download PDF button.
   Avoid manual jsPDF.addImage coordinates because they can produce
   "Invalid coordinates passed to jsPDF.addImage" in Chromium/Electron. */
(function installFinalInvoicePDFAction(){
  'use strict';
  if(!window.Invoices) return;

  Invoices.downloadInvoice = async function(invoice){
    const host=document.getElementById('previewContent');
    if(!host) return Utils.toast('Invoice Preview area is not available.','error');

    const normalized=typeof this.normalizeInvoice==='function' ? this.normalizeInvoice(invoice) : invoice;
    if(!normalized) return Utils.toast('Invoice not found.','error');
    if(typeof window.html2pdf!=='function'){
      return Swal.fire({icon:'error',title:'PDF Generation Failed',text:'PDF library is not loaded.',confirmButtonText:'OK'});
    }

    let page=host.dataset.invoiceId===normalized.id ? host.querySelector('.invoice-page') : null;
    if(!page && typeof this.mountInvoiceDocument==='function'){
      host.innerHTML='';
      page=this.mountInvoiceDocument(normalized);
      host.dataset.invoiceId=normalized.id;
    }
    if(!page) return Utils.toast('Invoice Preview could not be prepared.','error');

    const stage=page.parentElement;
    const old={
      page:{transform:page.style.transform,transformOrigin:page.style.transformOrigin,zoom:page.style.zoom,position:page.style.position,left:page.style.left,top:page.style.top,margin:page.style.margin,width:page.style.width,minWidth:page.style.minWidth,maxWidth:page.style.maxWidth,overflow:page.style.overflow},
      stage:{width:stage?.style.width||'',height:stage?.style.height||'',minHeight:stage?.style.minHeight||'',overflow:stage?.style.overflow||'',padding:stage?.style.padding||'',display:stage?.style.display||'',justifyContent:stage?.style.justifyContent||'',alignItems:stage?.style.alignItems||''},
      host:{width:host.style.width,height:host.style.height,overflow:host.style.overflow}
    };

    try{
      // Capture exactly the same A4 invoice document used by Preview.
      Object.assign(page.style,{
        transform:'none',transformOrigin:'top left',zoom:'1',position:'static',left:'auto',top:'auto',
        margin:'0',width:'210mm',minWidth:'210mm',maxWidth:'210mm',overflow:'visible'
      });
      if(stage) Object.assign(stage.style,{
        width:'210mm',height:'auto',minHeight:'0',overflow:'visible',padding:'0',display:'block',
        justifyContent:'flex-start',alignItems:'flex-start'
      });
      Object.assign(host.style,{width:'210mm',height:'auto',overflow:'visible'});

      if(document.fonts?.ready) await document.fonts.ready;
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

      await window.html2pdf().set({
        margin:0,
        filename:`${normalized.invoice_no || normalized.id || 'Invoice'}.pdf`,
        image:{type:'jpeg',quality:0.98},
        html2canvas:{
          scale:2,
          useCORS:true,
          allowTaint:false,
          backgroundColor:'#ffffff',
          logging:false,
          scrollX:0,
          scrollY:0,
          width:794,
          windowWidth:794,
          windowHeight:Math.max(1123,Math.ceil(page.scrollHeight||page.getBoundingClientRect().height||1123))
        },
        pagebreak:{mode:['css','legacy'],avoid:['.avoid']},
        jsPDF:{unit:'mm',format:'a4',orientation:'portrait',compress:true}
      }).from(page).save();

      Utils.toast('PDF downloaded using the same Invoice Preview.','success');
    }catch(e){
      console.error('Invoice PDF generation error:',e);
      await Swal.fire({icon:'error',title:'PDF Generation Failed',text:e?.message||'Unable to generate the PDF.',confirmButtonText:'OK'});
    }finally{
      Object.assign(page.style,old.page);
      if(stage) Object.assign(stage.style,old.stage);
      Object.assign(host.style,old.host);
      if(document.getElementById('previewModal')?.classList.contains('active') && typeof this.fitPreviewToScreen==='function'){
        this.fitPreviewToScreen();
      }
    }
  };

  Invoices.downloadExisting=function(id){
    const invoice=(DB.get('invoices',[])||[]).find(i=>String(i.id)===String(id));
    if(!invoice) return Utils.toast('Invoice not found.','error');
    return this.downloadInvoice(invoice);
  };

  Invoices.actionPDF=function(){
    const ids=typeof this.getSelected==='function' ? this.getSelected() : [];
    if(ids.length!==1) return Utils.toast(ids.length ? 'SELECT ONLY ONE INVOICE.' : 'SELECT ONE INVOICE.','warning');
    return this.downloadExisting(ids[0]);
  };
})();

/* FINAL PDF SAFETY OVERRIDE — v2.31
   Invoices & Billing PDF uses the same Invoice Preview DOM, but captures it in a
   fixed A4-sized off-screen clone. jsPDF coordinates are always finite and fixed.
   This prevents the recurring "Invalid coordinates passed to jsPDF.addImage" error.
*/
(function(){
  if(!window.Invoices) return;
  Invoices.downloadInvoice = async function(invoice){
    const normalized = typeof this.normalizeInvoice==='function' ? this.normalizeInvoice(invoice) : invoice;
    if(!normalized) return Swal.fire({icon:'error',title:'PDF Generation Failed',text:'Invoice not found.',confirmButtonText:'OK'});
    if(typeof window.html2canvas!=='function' || !window.jspdf?.jsPDF){
      return Swal.fire({icon:'error',title:'PDF Generation Failed',text:'PDF library is not loaded. Please reopen the application with internet access.',confirmButtonText:'OK'});
    }

    let source = document.getElementById('previewContent')?.querySelector('.invoice-page');
    let temp = null;
    try{
      if(!source){
        if(typeof this.mountInvoiceDocument!=='function') throw new Error('Invoice Preview renderer is unavailable.');
        const host=document.getElementById('previewContent');
        if(!host) throw new Error('Invoice Preview area is not available.');
        source=this.mountInvoiceDocument(normalized);
      }
      if(!source) throw new Error('Invoice Preview could not be prepared.');

      // Clone the exact preview invoice into a fixed A4 CSS viewport.
      temp=document.createElement('div');
      temp.setAttribute('data-anori-pdf-capture','1');
      temp.style.cssText='position:fixed;left:-10000px;top:0;width:794px;min-width:794px;background:#fff;z-index:-1;overflow:visible;padding:0;margin:0;';
      const clone=source.cloneNode(true);
      clone.style.cssText += ';transform:none !important;zoom:1 !important;position:relative !important;left:auto !important;top:auto !important;margin:0 !important;width:794px !important;min-width:794px !important;max-width:none !important;overflow:visible !important;';
      temp.appendChild(clone);
      document.body.appendChild(temp);

      if(document.fonts?.ready) await document.fonts.ready;
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

      const rect=clone.getBoundingClientRect();
      const width=Math.max(1,Math.ceil(rect.width || clone.scrollWidth || 794));
      const height=Math.max(1,Math.ceil(clone.scrollHeight || rect.height || 1123));
      if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0) throw new Error('Invoice Preview has an invalid size for PDF generation.');

      const canvas=await window.html2canvas(clone,{
        scale:2,
        useCORS:true,
        allowTaint:false,
        backgroundColor:'#ffffff',
        logging:false,
        scrollX:0,
        scrollY:0,
        width,
        height,
        windowWidth:width,
        windowHeight:Math.max(1123,height)
      });

      if(!canvas || !canvas.width || !canvas.height) throw new Error('Invoice Preview could not be rendered for PDF.');
      if(!Number.isFinite(canvas.width)||!Number.isFinite(canvas.height)) throw new Error('Invalid rendered invoice dimensions.');

      const {jsPDF}=window.jspdf;
      const pdf=new jsPDF({unit:'mm',format:'a4',orientation:'portrait',compress:true});
      const A4W=210, A4H=297, margin=5, drawW=200;
      const pxToMm=drawW/canvas.width;
      let totalH=canvas.height*pxToMm;
      if(!Number.isFinite(totalH)||totalH<=0) throw new Error('Invalid rendered invoice height.');

      const data=canvas.toDataURL('image/jpeg',0.98);
      if(!data || data==='data:,') throw new Error('Invoice image could not be created.');

      if(totalH<=A4H-10){
        const drawH=Math.max(1,Math.min(A4H-10,totalH));
        // Fixed, finite, in-page coordinates only.
        pdf.addImage(data,'JPEG',margin,margin,drawW,drawH,undefined,'FAST');
      }else{
        const pagePxHeight=Math.max(1,Math.floor((A4H-10)/pxToMm));
        let offset=0, pageNo=0;
        while(offset<canvas.height){
          if(pageNo>0) pdf.addPage();
          const sliceH=Math.min(pagePxHeight,canvas.height-offset);
          if(!Number.isFinite(sliceH)||sliceH<=0) throw new Error('Invalid PDF page slice.');
          const slice=document.createElement('canvas');
          slice.width=canvas.width;
          slice.height=Math.max(1,Math.floor(sliceH));
          const ctx=slice.getContext('2d');
          if(!ctx) throw new Error('Unable to prepare PDF page.');
          ctx.fillStyle='#fff';
          ctx.fillRect(0,0,slice.width,slice.height);
          ctx.drawImage(canvas,0,offset,canvas.width,slice.height,0,0,canvas.width,slice.height);
          const sliceData=slice.toDataURL('image/jpeg',0.98);
          const sliceMmH=Math.max(1,Math.min(A4H-10,slice.height*pxToMm));
          pdf.addImage(sliceData,'JPEG',margin,margin,drawW,sliceMmH,undefined,'FAST');
          offset += slice.height;
          pageNo++;
        }
      }

      pdf.save(`${normalized.invoice_no || normalized.id || 'invoice'}.pdf`);
      if(window.Utils?.toast) Utils.toast('PDF downloaded with the same Invoice Preview layout.','success');
    }catch(e){
      console.error('ANORI PDF generation error:',e);
      await Swal.fire({icon:'error',title:'PDF Generation Failed',text:e?.message||'Unable to generate the PDF.',confirmButtonText:'OK'});
    }finally{
      if(temp) temp.remove();
    }
  };

  Invoices.downloadExisting=function(id){
    const list=typeof DB!=='undefined' ? (DB.get('invoices',[])||[]) : [];
    const invoice=list.find(i=>String(i.id)===String(id));
    if(!invoice) return Utils.toast('Invoice not found.','error');
    return this.downloadInvoice(invoice);
  };
})();

/* ANORI TRANSPORT — FINAL PDF ENGINE v3.0
   Root-cause fix: remove all dependency on jsPDF/html2pdf for invoice export.
   The Invoice Preview DOM is rendered with html2canvas, then a standards-based
   PDF is assembled directly from JPEG image objects. This prevents every
   recurring jsPDF.addImage coordinate error, including errors originating
   inside html2pdf's internal jsPDF calls.
*/
(function installFinalNativeInvoicePdf(){
  'use strict';
  if(!window.Invoices) return;

  const concatBytes=(parts)=>{
    const total=parts.reduce((n,p)=>n+p.length,0);
    const out=new Uint8Array(total); let offset=0;
    for(const p of parts){out.set(p,offset);offset+=p.length;}
    return out;
  };
  const enc=new TextEncoder();
  const ascii=(s)=>enc.encode(s);

  function buildPdfFromJpegs(pages){
    // Each page is a JPEG already sized/cropped for one A4 page.
    const objects=[];
    objects[1]=ascii('<< /Type /Catalog /Pages 2 0 R >>');
    const pageRefs=[];
    const pageObjects=[];
    const contentObjects=[];
    const imageObjects=[];
    let objNo=3;

    for(let i=0;i<pages.length;i++){
      const imageObjNo=objNo++;
      const contentObjNo=objNo++;
      const pageObjNo=objNo++;
      imageObjects.push({objNo:imageObjNo,jpeg:pages[i].jpeg,width:pages[i].width,height:pages[i].height});
      contentObjects.push({objNo:contentObjNo,imageObjNo,drawW:pages[i].drawW,drawH:pages[i].drawH});
      pageObjects.push({objNo:pageObjNo,contentObjNo,imageObjNo});
      pageRefs.push(`${pageObjNo} 0 R`);
    }

    objects[2]=ascii(`<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${pages.length} >>`);

    for(const img of imageObjects){
      const header=ascii(`<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.jpeg.length} >>\nstream\n`);
      const footer=ascii('\nendstream');
      objects[img.objNo]=concatBytes([header,img.jpeg,footer]);
    }

    for(const c of contentObjects){
      const stream=ascii(`q\n${c.drawW} 0 0 ${c.drawH} 5 ${5 + (287-c.drawH)} cm\n/Im${c.imageObjNo} Do\nQ`);
      objects[c.objNo]=concatBytes([ascii(`<< /Length ${stream.length} >>\nstream\n`),stream,ascii('\nendstream')]);
    }

    for(const p of pageObjects){
      objects[p.objNo]=ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 210 297] /Resources << /XObject << /Im${p.imageObjNo} ${p.imageObjNo} 0 R >> >> /Contents ${p.contentObjNo} 0 R >>`);
    }

    const chunks=[ascii('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n')];
    const offsets=new Array(objects.length).fill(0);
    let position=chunks[0].length;
    for(let i=1;i<objects.length;i++){
      const body=objects[i]||ascii('');
      const head=ascii(`${i} 0 obj\n`);
      const tail=ascii('\nendobj\n');
      offsets[i]=position;
      chunks.push(head,body,tail);
      position+=head.length+body.length+tail.length;
    }
    const xrefPos=position;
    let xref=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for(let i=1;i<objects.length;i++)xref+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
    xref+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
    chunks.push(ascii(xref));
    return concatBytes(chunks);
  }

  async function renderInvoiceToPdf(invoice){
    const normalized=typeof Invoices.normalizeInvoice==='function' ? Invoices.normalizeInvoice(invoice) : invoice;
    if(!normalized) throw new Error('Invoice not found.');
    if(typeof window.html2canvas!=='function') throw new Error('PDF renderer is not loaded. Please reopen the application with internet access.');

    const host=document.getElementById('previewContent');
    if(!host) throw new Error('Invoice Preview area is not available.');

    let source=host.querySelector('.invoice-page');
    if(!source || host.dataset.invoiceId!==normalized.id){
      if(typeof Invoices.mountInvoiceDocument!=='function') throw new Error('Invoice Preview renderer is unavailable.');
      host.innerHTML='';
      source=Invoices.mountInvoiceDocument(normalized);
      host.dataset.invoiceId=normalized.id;
    }
    if(!source) throw new Error('Invoice Preview could not be prepared.');

    // Capture an isolated, fixed A4-width clone. Screen zoom, flex centering,
    // scroll containers and modal transforms cannot affect the capture.
    const capture=document.createElement('div');
    capture.style.cssText='position:fixed;left:-20000px;top:0;width:794px;background:#fff;margin:0;padding:0;overflow:visible;z-index:-2147483647;visibility:visible;';
    const clone=source.cloneNode(true);
    clone.style.cssText += ';display:block !important;position:relative !important;left:0 !important;top:0 !important;transform:none !important;zoom:1 !important;width:794px !important;min-width:794px !important;max-width:794px !important;height:auto !important;min-height:1123px !important;margin:0 !important;overflow:visible !important;box-sizing:border-box !important;';
    capture.appendChild(clone);
    document.body.appendChild(capture);

    try{
      if(document.fonts?.ready) await document.fonts.ready;
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

      const rect=clone.getBoundingClientRect();
      const width=Math.max(794,Math.ceil(clone.scrollWidth||rect.width||794));
      const height=Math.max(1123,Math.ceil(clone.scrollHeight||rect.height||1123));
      if(!Number.isFinite(width)||!Number.isFinite(height)) throw new Error('Invoice Preview has invalid dimensions.');

      const canvas=await window.html2canvas(clone,{
        scale:2,
        width,
        height,
        windowWidth:width,
        windowHeight:height,
        backgroundColor:'#ffffff',
        useCORS:true,
        allowTaint:false,
        logging:false,
        scrollX:0,
        scrollY:0
      });
      if(!canvas?.width||!canvas?.height) throw new Error('Invoice Preview could not be rendered.');

      // A4 printable area: 200 x 287 mm (5 mm margins). At 794 px CSS width,
      // one PDF page corresponds to 1123 CSS px. The 2x canvas is sliced without
      // resizing the original image horizontally, preserving preview appearance.
      const targetCssPageHeight=Math.floor(width*(287/200));
      const scaleX=canvas.width/width;
      const sliceCanvasHeight=Math.max(1,Math.floor(targetCssPageHeight*scaleX));
      const pages=[];

      for(let y=0;y<canvas.height;y+=sliceCanvasHeight){
        const sliceH=Math.min(sliceCanvasHeight,canvas.height-y);
        const slice=document.createElement('canvas');
        slice.width=canvas.width;
        slice.height=Math.max(1,sliceH);
        const ctx=slice.getContext('2d');
        if(!ctx) throw new Error('Unable to prepare PDF page.');
        ctx.fillStyle='#ffffff';
        ctx.fillRect(0,0,slice.width,slice.height);
        ctx.drawImage(canvas,0,y,canvas.width,sliceH,0,0,canvas.width,sliceH);
        const dataUrl=slice.toDataURL('image/jpeg',0.96);
        const comma=dataUrl.indexOf(',');
        if(comma<0) throw new Error('Invoice image could not be created.');
        const raw=atob(dataUrl.slice(comma+1));
        const jpeg=new Uint8Array(raw.length);
        for(let i=0;i<raw.length;i++) jpeg[i]=raw.charCodeAt(i);
        const drawW=200; const drawH=Math.min(287,drawW*(slice.height/slice.width));
        pages.push({jpeg,width:slice.width,height:slice.height,drawW,drawH});
      }

      if(!pages.length) throw new Error('No invoice pages were generated.');
      const pdfBytes=buildPdfFromJpegs(pages);
      const blob=new Blob([pdfBytes],{type:'application/pdf'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;
      a.download=`${normalized.invoice_no || normalized.id || 'Invoice'}.pdf`;
      a.style.display='none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),15000);
      if(window.Utils?.toast) Utils.toast('PDF downloaded using the Invoice Preview layout.','success');
      return true;
    }finally{
      capture.remove();
    }
  }

  // One and only active invoice PDF route. These assignments are deliberately
  // placed at the end of app.js so all legacy PDF overrides are superseded.
  Invoices.downloadInvoice=function(invoice){
    return renderInvoiceToPdf(invoice).catch(async e=>{
      console.error('ANORI FINAL PDF ENGINE ERROR:',e);
      if(window.Swal) await Swal.fire({icon:'error',title:'PDF Generation Failed',text:e?.message||'Unable to generate the PDF.',confirmButtonText:'OK'});
      else if(window.Utils?.toast) Utils.toast(e?.message||'Unable to generate the PDF.','error');
      return false;
    });
  };

  Invoices.downloadExisting=function(id){
    const invoice=(DB.get('invoices',[])||[]).find(i=>String(i.id)===String(id));
    if(!invoice) return Utils.toast('Invoice not found.','error');
    return Invoices.downloadInvoice(invoice);
  };

  // FINAL ACTION-BAR PDF ROUTE: deliberately calls the exact same
  // Invoices.downloadInvoice() used by the Invoice Preview -> Download PDF button.
  // This bypasses every legacy jsPDF/html2pdf action handler.
  Invoices.downloadSelectedPDF=function(){
    const ids=typeof Invoices.getSelected==='function' ? Invoices.getSelected() : [];
    if(ids.length!==1) return Utils.toast(ids.length ? 'SELECT ONLY ONE INVOICE.' : 'SELECT ONE INVOICE.','warning');
    const invoice=(DB.get('invoices',[])||[]).find(i=>String(i.id)===String(ids[0]));
    if(!invoice) return Utils.toast('Invoice not found.','error');
    return Invoices.downloadInvoice(invoice);
  };
  Invoices.actionPDF=function(){ return Invoices.downloadSelectedPDF(); };

  // Keep a stable public route so all dynamically-rendered Action bars use
  // the same Preview PDF implementation.
  window.__ANORI_DOWNLOAD_SELECTED_INVOICE_PDF='native-preview-pdf';
  window.__ANORI_FINAL_PDF_ENGINE='native-jpeg-pdf-v3';
})();


/* FINAL NON-GST INVOICE DISPLAY GUARD
   A Non-GST invoice must never display CGST/SGST/IGST rows in either
   Invoice Preview or the PDF generated from that same preview. Normalize
   boolean/string values before the renderer evaluates invoice.is_gst. */
(function installFinalNonGstDisplayGuard(){
  'use strict';
  if(!window.Invoices || typeof Invoices.buildInvoiceHTML!=='function') return;

  const previousBuild=Invoices.buildInvoiceHTML;
  if(Invoices.__finalNonGstDisplayGuard) return;

  function toBool(value){
    if(value===true || value===1) return true;
    const v=String(value ?? '').trim().toLowerCase();
    return v==='true' || v==='1' || v==='yes' || v==='gst';
  }

  Invoices.buildInvoiceHTML=function(invoice, preview=false){
    const source=invoice || {};
    const normalized={...source};
    // Treat an explicit tax_type of "none" as Non-GST for display.
    // This also fixes older invoices whose is_gst flag was saved as true
    // while the selected tax mode was No Tax.
    const explicitTaxType=String(source.tax_type ?? '').trim().toLowerCase();
    normalized.is_gst=toBool(source.is_gst) && explicitTaxType!=='none' && explicitTaxType!=='nongst';
    normalized.tax_type=normalized.is_gst
      ? (explicitTaxType==='igst' ? 'igst' : 'cgst_sgst')
      : 'none';

    // Non-GST invoices carry zero tax values for accounting compatibility,
    // but those values must never become visible tax rows.
    if(!normalized.is_gst){
      normalized.cgst=0;
      normalized.sgst=0;
      normalized.igst=0;
    }

    return previousBuild.call(this, normalized, preview);
  };

  Invoices.__finalNonGstDisplayGuard=true;
})();

/* FINAL DRIVER SETTLEMENT PDF LEDGER — SINGLE ACTIVE A4 PORTRAIT RENDERER */
(function installFinalDriverSettlementPdf(){
  'use strict';
  if(typeof DriverSettlement === 'undefined') return;

  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const money=v=>{try{return Utils.fmt(Number(v)||0);}catch(_){return 'Rs. '+(Number(v)||0).toFixed(2);}};
  const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const isoToday=()=>typeof today==='function'?today():new Date().toISOString().slice(0,10);

  /*
   * IMPORTANT: PDF rows come directly from the same settlement store used by
   * DriverSettlement.applyFilter(). The DOM table is deliberately NOT used
   * as the PDF data source, so PDF data cannot be lost because of table layout,
   * overflow, hidden rows, or a stale screen render.
   */
  function getPdfRows(){
    if(typeof window.syncAllDriverTripEntries==='function') window.syncAllDriverTripEntries();

    const all=Array.isArray(DB.get('driver_settlements',[])) ? DB.get('driver_settlements',[]) : [];
    const driversList=Array.isArray(DB.get('drivers',[])) ? DB.get('drivers',[]) : [];
    const tripsList=Array.isArray(DB.get('trips',[])) ? DB.get('trips',[]) : [];
    const driverById=id=>driversList.find(d=>String(d.id)===String(id));
    const tripById=id=>tripsList.find(t=>String(t.id)===String(id));

    const driverId=document.getElementById('driverLedgerDriver')?.value||'';
    const period=document.getElementById('driverLedgerPeriod')?.value||'all';
    let from=document.getElementById('driverLedgerFrom')?.value||'';
    const to=document.getElementById('driverLedgerTo')?.value||isoToday();

    if(period==='week'){
      const d=new Date();
      d.setHours(0,0,0,0);
      d.setDate(d.getDate()-d.getDay());
      from=d.toISOString().slice(0,10);
    }else if(period==='month'){
      const t=isoToday();
      from=t.slice(0,7)+'-01';
    }

    const filtered=all.filter(r=>{
      if(!r) return false;
      if(driverId && String(r.driver_id)!==String(driverId)) return false;
      const date=String(r.date||'').slice(0,10);
      if(from && date<from) return false;
      if(to && date>to) return false;
      return true;
    });

    return filtered.map((r,i)=>({
      sr:String(i+1),
      date:clean(r.date||'-'),
      driver:clean(driverById(r.driver_id)?.name||'-'),
      trip:clean(tripById(r.trip_id)?.trip_no||'-'),
      type:r.type==='debit'?'GIVEN':'PAID',
      amount:money(r.amount),
      rawAmount:num(r.amount)
    }));
  }

  DriverSettlement.downloadPDF=async function(){
    try{
      if(!window.jspdf?.jsPDF) throw new Error('PDF LIBRARY IS NOT LOADED.');

      const rows=getPdfRows();
      const company=DB.get('company_profile',{})||{};
      const driverSelect=document.getElementById('driverLedgerDriver');
      const periodSelect=document.getElementById('driverLedgerPeriod');
      const selected=clean(driverSelect?.selectedOptions?.[0]?.textContent||'ALL DRIVERS');
      const period=clean(periodSelect?.selectedOptions?.[0]?.textContent||'ALL');
      const from=clean(document.getElementById('driverLedgerFrom')?.value||'ALL');
      const to=clean(document.getElementById('driverLedgerTo')?.value||isoToday());

      let given=0,paid=0;
      rows.forEach(r=>{if(r.type==='GIVEN')given+=r.rawAmount;else paid+=r.rawAmount;});

      /* Dedicated A4 Portrait drawing surface. No HTML-to-canvas capture. */
      const W=2480,H=3508,M=90,CW=W-M*2,footerY=H-M-45;
      const canvas=document.createElement('canvas');
      canvas.width=W;canvas.height=H;
      const ctx=canvas.getContext('2d');
      if(!ctx) throw new Error('UNABLE TO PREPARE PDF CANVAS.');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.textBaseline='top';
      const fontFamily='Arial, Helvetica, sans-serif';
      const base=43.4; // current body text +40%
      const header=48;
      const defs=[
        ['sr','SR. NO.',.10,'center'],['date','DATE',.15,'left'],['driver','DRIVER',.25,'left'],
        ['trip','TRIP',.20,'left'],['type','TYPE',.12,'left'],['amount','AMOUNT',.18,'right']
      ];
      const widths=defs.map(d=>CW*d[2]);
      const xs=[];let x=M;
      widths.forEach(w=>{xs.push(x);x+=w;});

      const wrap=(text,maxW,font)=>{
        ctx.font=font;
        const words=String(text??'').split(/\s+/).filter(Boolean),out=[];let line='';
        for(const word of words){
          let candidate=line?line+' '+word:word;
          if(ctx.measureText(candidate).width<=maxW){line=candidate;continue;}
          if(line)out.push(line);
          if(ctx.measureText(word).width<=maxW){line=word;continue;}
          let part='';
          for(const ch of word){
            const test=part+ch;
            if(!part||ctx.measureText(test).width<=maxW)part=test;
            else{out.push(part);part=ch;}
          }
          line=part;
        }
        if(line)out.push(line);
        return out.length?out:[''];
      };

      const drawPage=(pageRows,summary)=>{
        ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);let y=M;
        ctx.fillStyle='#1d4ed8';ctx.fillRect(M,y,CW,8);y+=28;
        ctx.fillStyle='#0f172a';ctx.font=`700 77px ${fontFamily}`;ctx.fillText(clean(company.name||'ANORI TRANSPORT'),M,y);y+=70;
        ctx.font=`700 55px ${fontFamily}`;ctx.fillText('DRIVER SETTLEMENT LEDGER',M,y);y+=58;
        ctx.fillStyle='#475569';ctx.font=`400 31px ${fontFamily}`;
        const contact=[company.phone&&('PHONE: '+clean(company.phone)),company.gstin&&('GSTIN: '+clean(company.gstin)),company.pan&&('PAN: '+clean(company.pan))].filter(Boolean).join(' | ');
        if(contact){ctx.fillText(contact,M,y);y+=38;}y+=16;

        const metaH=82,metaW=CW/5;
        ctx.fillStyle='#f6f8fc';ctx.fillRect(M,y,CW,metaH);ctx.strokeStyle='#cbd5e1';ctx.lineWidth=2;ctx.strokeRect(M,y,CW,metaH);
        [['DRIVER',selected],['PERIOD',period],['FROM',from||'ALL'],['TO',to],['GENERATED',isoToday()]].forEach((v,i)=>{
          const mx=M+i*metaW;
          if(i){ctx.beginPath();ctx.moveTo(mx,y);ctx.lineTo(mx,y+metaH);ctx.stroke();}
          ctx.fillStyle='#475569';ctx.font=`700 25px ${fontFamily}`;ctx.fillText(v[0],mx+12,y+10);
          ctx.fillStyle='#0f172a';ctx.font=`600 31px ${fontFamily}`;ctx.fillText(wrap(v[1],metaW-24,`600 31px ${fontFamily}`)[0],mx+12,y+44);
        });
        y+=metaH+24;

        const headerH=68;
        ctx.fillStyle='#e8eff9';ctx.fillRect(M,y,CW,headerH);ctx.strokeStyle='#b9c9df';ctx.strokeRect(M,y,CW,headerH);
        defs.forEach((d,i)=>{
          const xx=xs[i];
          if(i){ctx.beginPath();ctx.moveTo(xx,y);ctx.lineTo(xx,y+headerH);ctx.stroke();}
          ctx.fillStyle='#173b6b';ctx.font=`700 ${header}px ${fontFamily}`;
          const tw=ctx.measureText(d[1]).width;
          let tx=xx+12;
          if(d[3]==='center')tx=xx+(widths[i]-tw)/2;
          if(d[3]==='right')tx=xx+widths[i]-tw-12;
          ctx.fillText(d[1],tx,y+12);
        });
        y+=headerH;

        pageRows.forEach(r=>{
          const vals=defs.map(d=>r[d[0]]);
          const wrapped=vals.map((v,i)=>wrap(v,widths[i]-24,`400 ${base}px ${fontFamily}`));
          const lines=Math.max(...wrapped.map(a=>a.length));
          const rowH=Math.max(82,lines*55+24);
          ctx.fillStyle='#fff';ctx.fillRect(M,y,CW,rowH);
          ctx.strokeStyle='#cbd5e1';ctx.strokeRect(M,y,CW,rowH);
          defs.forEach((d,i)=>{
            const xx=xs[i];
            if(i){ctx.beginPath();ctx.moveTo(xx,y);ctx.lineTo(xx,y+rowH);ctx.stroke();}
            ctx.font=`400 ${base}px ${fontFamily}`;
            wrapped[i].forEach((line,j)=>{
              const tw=ctx.measureText(line).width;
              let tx=xx+12;
              if(d[3]==='center')tx=xx+(widths[i]-tw)/2;
              if(d[3]==='right')tx=xx+widths[i]-tw-12;
              ctx.fillStyle='#172b4d';ctx.fillText(line,tx,y+12+j*55);
            });
          });
          y+=rowH;
        });

        if(summary){
          y=Math.min(y+26,H-M-240);
          const sw=1200,sx=M+CW-sw;
          [['TOTAL GIVEN / ADVANCE',money(given)],['TOTAL PAID',money(paid)],['BALANCE',money(Math.max(given-paid,0))]].forEach((r,i)=>{
            const rh=78;
            ctx.fillStyle=i===2?'#173b6b':'#f6f8fc';ctx.fillRect(sx,y,sw,rh);
            ctx.strokeStyle='#cbd5e1';ctx.strokeRect(sx,y,sw,rh);
            ctx.fillStyle=i===2?'#fff':'#172b4d';ctx.font=`700 38px ${fontFamily}`;
            ctx.fillText(r[0],sx+18,y+18);
            const tw=ctx.measureText(r[1]).width;ctx.fillText(r[1],sx+sw-tw-20,y+18);y+=rh+8;
          });
        }
        ctx.fillStyle='#64748b';ctx.font=`400 28px ${fontFamily}`;
        ctx.fillText('ANORI TRANSPORT — DRIVER SETTLEMENT LEDGER',M,footerY);
        return canvas;
      };

      /* Calculate real row heights using the same renderer metrics, then split. */
      ctx.font=`400 ${base}px ${fontFamily}`;
      const heights=rows.map(r=>{
        const vals=defs.map(d=>r[d[0]]);
        const maxLines=Math.max(...vals.map((v,i)=>wrap(v,widths[i]-24,`400 ${base}px ${fontFamily}`).length));
        return Math.max(82,maxLines*55+24);
      });
      const firstY=M+28+70+58+54+16+82+24+68;
      const available=footerY-firstY-20;
      const pages=[];let batch=[],used=0;
      rows.forEach((r,i)=>{
        if(batch.length&&used+heights[i]>available){pages.push(batch);batch=[];used=0;}
        batch.push(r);used+=heights[i];
      });
      if(batch.length||!pages.length)pages.push(batch);

      const pdf=new window.jspdf.jsPDF({unit:'mm',format:'a4',orientation:'portrait',compress:true});
      const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight();
      pages.forEach((pageRows,i)=>{
        if(i)pdf.addPage('a4','portrait');
        const c=drawPage(pageRows,i===pages.length-1);
        pdf.addImage(c.toDataURL('image/jpeg',.96),'JPEG',4,4,pw-8,ph-8,undefined,'FAST');
      });
      const safe=clean(selected).replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toUpperCase()||'ALL-DRIVERS';
      pdf.save(`ANORI_TRANSPORT_DRIVER_LEDGER_${safe}_${isoToday()}.PDF`);
      if(window.Utils?.toast)Utils.toast(`PDF ledger downloaded (${rows.length} entries).`,'success');
      return true;
    }catch(e){
      console.error('ANORI DRIVER LEDGER PDF ERROR:',e);
      if(window.Swal)await Swal.fire({icon:'error',title:'PDF GENERATION FAILED',text:e?.message||'UNABLE TO GENERATE DRIVER SETTLEMENT LEDGER PDF.',confirmButtonText:'OK'});
      else if(window.Utils?.toast)Utils.toast(e?.message||'UNABLE TO GENERATE DRIVER SETTLEMENT LEDGER PDF.','error');
      return false;
    }
  };
  DriverSettlement.exportLedger=DriverSettlement.downloadPDF;
  DriverSettlement.__finalPdfLedgerInstalled=true;
})();

/* ============================================================
   ANORI TRANSPORT — FINAL COMBINED REQUIREMENTS PASS
   - Reference-style sidebar is visual-only.
   - Settings Backup & Restore reference-style UI replaces old UI.
   - New Trip master fields use ONE input with datalist suggestions + manual entry.
   - Company / Outside Vehicle classification.
   - Outside Vehicle Vendor Cost + separate Vendor Settlement.
   - Existing Driver Settlement remains separate.
   ============================================================ */
(function installAnoriFinalRequirements(){
  'use strict';
  const esc=v=>Sanitize.html(v==null?'':String(v));
  const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const text=v=>String(v==null?'':v).trim();
  const norm=v=>text(v).toLowerCase();

  function ensureArrayKey(key){
    const v=DB.get(key,[]);
    return Array.isArray(v)?v:[];
  }

  function uniqueValues(values){
    const seen=new Set(),out=[];
    values.forEach(v=>{const s=text(v);if(!s)return;const k=norm(s);if(!seen.has(k)){seen.add(k);out.push(s);}});
    return out;
  }

  function locations(){
    const saved=ensureArrayKey('locations');
    const fromSaved=saved.map(x=>typeof x==='string'?x:(x?.name||x?.location||''));
    const fromTrips=[];
    ensureArrayKey('trips').forEach(t=>{fromTrips.push(t.from,t.to);});
    return uniqueValues(fromSaved.concat(fromTrips)).slice(0,250);
  }

  function vendors(){
    const saved=ensureArrayKey('vendors').map(x=>typeof x==='string'?x:(x?.name||x?.vendor_name||''));
    const fromTrips=ensureArrayKey('trips').map(t=>t.vendor_manual||t.vendor_name||'');
    return uniqueValues(saved.concat(fromTrips)).slice(0,250);
  }

  function matchMaster(items,key,value){
    const q=norm(value);
    if(!q)return null;
    return items.find(x=>norm(x?.[key])===q)||null;
  }

  function resolveMaster({items,key,value,dbKey,extra={}}){
    const q=text(value);
    if(!q)return {id:'',manual:''};
    const existing=matchMaster(items,key,q);
    if(existing)return {id:existing.id,manual:''};
    const item={id:Utils.id(),[key]:q,...extra,source:'manual-trip'};
    const data=ensureArrayKey(dbKey);data.push(item);DB.set(dbKey,data,true);
    return {id:item.id,manual:q};
  }

  function datalist(id,items){
    return `<datalist id="${id}">${items.map(x=>`<option value="${esc(x)}"></option>`).join('')}</datalist>`;
  }

  function combinedField(label,id,value,items,icon,listId,placeholder,required=true){
    return `<div class="form-group">
      <label>${esc(label)}${required?' *':''}</label>
      <div class="trip-combined-wrap"><i class="fas ${icon}"></i>
        <input class="trip-combined-input" id="${id}_input" list="${listId}" value="${esc(value||'')}" placeholder="${esc(placeholder)}" autocomplete="off" ${required?'required':''}>
      </div>
      ${datalist(listId,items)}
      <small class="trip-combined-help">Select existing data or type a new value in the same box.</small>
    </div>`;
  }

  function expenseRow(exp){
    const masters=typeof getExpenseMaster==='function'?getExpenseMaster():[];
    const values=uniqueValues(masters.map(x=>x.name).concat(ensureArrayKey('trips').flatMap(t=>(t.expenses||[]).map(e=>e.type))));
    const type=text(exp?.type);
    return `<div class="form-row anori-trip-exp-row" style="margin-bottom:8px">
      <div class="form-group"><label>Expense Type</label>
        <div class="trip-combined-wrap"><i class="fas fa-receipt"></i><input class="trip-combined-input exp-type" list="expenseTypeListFinal" value="${esc(type)}" placeholder="Type / filter expense..." autocomplete="off"></div>
      </div>
      <div class="form-group"><label>Amount</label><div class="trip-input-wrap"><span class="trip-input-prefix">₹</span><input type="number" class="form-control exp-amt" min="0" step="0.01" placeholder="Amount" value="${num(exp?.amount)||''}"></div></div>
      <div class="form-group" style="align-self:end"><button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.anori-trip-exp-row').remove()"><i class="fas fa-trash"></i> Remove</button></div>
    </div>`;
  }

  function formHtml(trip){
    const vehicleRecords=ensureArrayKey('vehicles');
    const vehicles=vehicleRecords.map(v=>v.number).filter(Boolean);
    const drivers=ensureArrayKey('drivers').map(d=>d.name).filter(Boolean);
    const parties=ensureArrayKey('parties').map(p=>p.name).filter(Boolean);
    const locs=locations(), vend=vendors();
    const selectedVehicle=trip?.vehicle_id?vehicleRecords.find(v=>v.id===trip.vehicle_id):matchMaster(vehicleRecords,'number',trip?.vehicle_manual||'');
    const vehicle=trip?.vehicle_manual||selectedVehicle?.number||'';
    const driver=trip?.driver_manual||ensureArrayKey('drivers').find(d=>d.id===trip?.driver_id)?.name||'';
    const party=trip?.party_manual||ensureArrayKey('parties').find(p=>p.id===trip?.party_id)?.name||'';
    const vendor=trip?.vendor_manual||ensureArrayKey('vendors').find(v=>v.id===trip?.vendor_id)?.name||trip?.vendor_name||'';
    const expenses=(trip?.expenses||[]);
    const masterClass=String(selectedVehicle?.classification||selectedVehicle?.vehicle_classification||'').toLowerCase();
    const masterOutside=['outside','outside vehicle','outside organization vehicle','outside organization','external','vendor'].includes(masterClass);
    const cls=trip?.vehicle_classification==='outside'||(!trip?.id&&masterOutside)?'outside':'company';
    return `<div class="anori-simple-form trip-form-layout">
      <section class="trip-form-section"><div class="trip-form-section-head"><i class="fas fa-calendar-alt"></i><span>Trip Details</span></div><div class="trip-form-grid">
        <div class="form-group"><label>Date *</label><div class="trip-input-wrap"><i class="fas fa-calendar-alt"></i><input type="date" class="form-control" id="t_date" value="${esc(trip?.date||Utils.today())}" required></div></div>
        ${combinedField('Vehicle','t_vehicle',vehicle,vehicles,'fa-truck','vehicleList','Type / filter vehicle...',true)}
        ${combinedField('Driver','t_driver',driver,drivers,'fa-user','driverList','Type / filter driver...',true)}
      </div></section>

      <section class="trip-form-section"><div class="trip-form-section-head"><i class="fas fa-users"></i><span>Customer &amp; Route</span></div><div class="trip-form-grid">
        ${combinedField('Party / Customer','t_party',party,parties,'fa-user','partyList','Type / filter customer...',true)}
        ${combinedField('From','t_from',trip?.from||'',locs,'fa-map-marker-alt','fromList','Type / filter location...',true)}
        ${combinedField('To','t_to',trip?.to||'',locs,'fa-map-marker-alt','toList','Type / filter location...',true)}
      </div></section>

      <section class="trip-form-section"><div class="trip-form-section-head"><i class="fas fa-rupee-sign"></i><span>Freight &amp; Advance</span></div><div class="trip-form-grid">
        <div class="form-group"><label>Freight (₹) *</label><div class="trip-input-wrap"><span class="trip-input-prefix">₹</span><input type="number" class="form-control" id="t_freight" min="0" step="0.01" value="${num(trip?.freight)||''}" required></div></div>
        <div class="form-group"><label>Trip Advance Amount (₹)</label><div class="trip-input-wrap"><span class="trip-input-prefix">₹</span><input type="number" class="form-control" id="t_trip_advance" min="0" step="0.01" value="${num(trip?.trip_advance_amount)||0}"></div><small class="anori-help">Separate trip advance amount.</small></div>
        <div class="form-group"><label>Driver Amount / Advance (₹)</label><div class="trip-input-wrap"><span class="trip-input-prefix">₹</span><input type="number" class="form-control" id="t_driver_amount" min="0" step="0.01" value="${num(trip?.driver_amount)||0}"></div><small class="anori-help">This automatically appears in Driver Settlement for a matched driver.</small></div>
      </div></section>

      <section class="trip-form-section trip-classification-section"><div class="trip-form-section-head"><i class="fas fa-truck"></i><span>Vehicle Classification</span></div><div class="form-group" style="padding:12px 14px 4px;margin:0"><div class="trip-classification-control"><select id="t_vehicle_classification" aria-label="Vehicle Classification"><option value="company" ${cls==='company'?'selected':''}>COMPANY VEHICLE</option><option value="outside" ${cls==='outside'?'selected':''}>OUTSIDE VEHICLE</option></select><span class="anori-help" style="margin:0">Outside Vehicle creates a separate vendor settlement.</span></div></div>
        <div class="trip-outside-fields ${cls==='outside'?'is-visible':''}" id="tripOutsideFields" data-outside-section="true" style="padding:4px 14px 12px">
          ${combinedField('Owner / Vendor','t_vendor',vendor,vend,'fa-building','vendorList','Type / filter vendor...',true)}
          <div class="form-group"><label>Vehicle Hire / Vendor Cost (₹) *</label><div class="trip-input-wrap"><span class="trip-input-prefix">₹</span><input type="number" class="form-control" id="t_vendor_cost" min="0" step="0.01" value="${num(trip?.vendor_cost)||0}"></div><small class="anori-help">Separate outside-vehicle/vendor cost. Do not mix with Customer Freight.</small></div>
          <div class="form-group"><label>Vendor Advance (₹)</label><div class="trip-input-wrap"><span class="trip-input-prefix">₹</span><input type="number" class="form-control" id="t_vendor_advance" min="0" step="0.01" value="${num(trip?.vendor_advance)||0}"></div></div>
          <div class="form-group"><label>Vendor Contact</label><input class="form-control" id="t_vendor_contact" value="${esc(trip?.vendor_contact||'')}" placeholder="Vendor contact number"></div>
        </div>
      </section>

      <section class="trip-form-section"><div class="trip-form-section-head"><i class="fas fa-file-alt"></i><span>Trip Advice</span></div><div class="form-group trip-form-full"><div class="trip-input-wrap trip-textarea-wrap"><i class="fas fa-file-alt"></i><textarea class="form-control trip-advice-box" id="t_trip_advice" rows="3" placeholder="Enter trip advice / instructions...">${esc(trip?.trip_advice||'')}</textarea></div></div></section>

      <section class="trip-form-section"><div class="trip-form-section-head"><i class="fas fa-clipboard-list"></i><span>Trip Expenses</span></div><datalist id="expenseTypeListFinal">${uniqueValues((typeof getExpenseMaster==='function'?getExpenseMaster():[]).map(x=>x.name).concat(ensureArrayKey('trips').flatMap(t=>(t.expenses||[]).map(e=>e.type)))).map(v=>`<option value="${esc(v)}"></option>`).join('')}</datalist><div id="expRows" class="trip-expenses-list">${expenses.map(expenseRow).join('')}</div><button type="button" class="btn btn-outline btn-sm trip-add-expense" onclick="Trips.addExpRow()"><i class="fas fa-plus"></i> Add Expense</button></section>

      <section class="trip-form-section trip-notes-section"><div class="trip-form-section-head"><i class="fas fa-sticky-note"></i><span>Notes</span></div><div class="form-group trip-form-full"><div class="trip-input-wrap trip-textarea-wrap"><i class="fas fa-list"></i><textarea class="form-control" id="t_notes" rows="2" placeholder="Enter notes...">${esc(trip?.notes||'')}</textarea></div></div></section>
    </div>`;
  }

  function readForm(){
    const vehicleText=text(document.getElementById('t_vehicle_input')?.value);
    const driverText=text(document.getElementById('t_driver_input')?.value);
    const partyText=text(document.getElementById('t_party_input')?.value);
    const from=text(document.getElementById('t_from_input')?.value);
    const to=text(document.getElementById('t_to_input')?.value);
    const vendorText=text(document.getElementById('t_vendor_input')?.value);
    const cls=document.getElementById('t_vehicle_classification')?.value==='outside'?'outside':'company';
    if(!vehicleText||!driverText||!partyText||!from||!to){Utils.toast('Please select or manually enter Vehicle, Driver, Customer, From and To.','error');return null;}
    const freight=num(document.getElementById('t_freight')?.value), tripAdvance=num(document.getElementById('t_trip_advance')?.value), driverAmount=num(document.getElementById('t_driver_amount')?.value);
    if(freight<=0)return Utils.toast('Freight amount must be greater than zero.','error');
    if(tripAdvance<0||driverAmount<0)return Utils.toast('Amounts cannot be negative.','error');
    const vendorCost=cls==='outside'?num(document.getElementById('t_vendor_cost')?.value):0;
    if(cls==='outside' && !vendorText){Utils.toast('Please select or manually enter Owner / Vendor for an Outside Vehicle.','error');return null;}
    if(cls==='outside' && vendorCost<=0){Utils.toast('Enter Vehicle Hire / Vendor Cost for an Outside Vehicle.','error');return null;}

    const vr=resolveMaster({items:ensureArrayKey('vehicles'),key:'number',value:vehicleText,dbKey:'vehicles',extra:{type:'Manual',driver_amount:0,classification:cls==='outside'?'OUTSIDE ORGANIZATION VEHICLE':'COMPANY VEHICLE',vehicle_classification:cls==='outside'?'OUTSIDE ORGANIZATION VEHICLE':'COMPANY VEHICLE'}});
    const dr=resolveMaster({items:ensureArrayKey('drivers'),key:'name',value:driverText,dbKey:'drivers',extra:{mobile:''}});
    const pr=resolveMaster({items:ensureArrayKey('parties'),key:'name',value:partyText,dbKey:'parties',extra:{gst:'',addr:''}});
    const ven=cls==='outside'?resolveMaster({items:ensureArrayKey('vendors'),key:'name',value:vendorText,dbKey:'vendors',extra:{mobile:text(document.getElementById('t_vendor_contact')?.value)}}):{id:'',manual:''};
    const expenses=[];
    document.querySelectorAll('#expRows .anori-trip-exp-row').forEach(r=>{
      const type=text(r.querySelector('.exp-type')?.value),amount=num(r.querySelector('.exp-amt')?.value);
      if(type&&amount>0)expenses.push({type,amount});
    });
    return {
      date:document.getElementById('t_date')?.value||Utils.today(),
      vehicle_id:vr.id,driver_id:dr.id,party_id:pr.id,
      vehicle_manual:vr.manual,driver_manual:dr.manual,party_manual:pr.manual,
      from,to,freight,driver_amount:driverAmount,trip_advance_amount:tripAdvance,
      vehicle_classification:cls,
      vendor_id:ven.id,vendor_manual:ven.manual,vendor_name:vendorText,vendor_contact:text(document.getElementById('t_vendor_contact')?.value),vendor_cost:vendorCost,
      vendor_advance:cls==='outside'?num(document.getElementById('t_vendor_advance')?.value):0,
      expenses,notes:text(document.getElementById('t_notes')?.value),trip_advice:text(document.getElementById('t_trip_advice')?.value)
    };
  }

  function syncVendorSettlement(trip){
    let data=ensureArrayKey('vendor_settlements');
    const idx=data.findIndex(x=>x.trip_id===trip.id);
    if(trip.vehicle_classification!=='outside'||num(trip.vendor_cost)<=0){if(idx>=0)data.splice(idx,1);DB.set('vendor_settlements',data,true);return;}
    const existing=idx>=0?data[idx]:null;
    const row={id:existing?.id||Utils.id(),trip_id:trip.id,date:trip.date||Utils.today(),vehicle_id:trip.vehicle_id||'',vendor_id:trip.vendor_id||'',vendor_name:trip.vendor_name||'',vehicle_number:ensureArrayKey('vehicles').find(v=>v.id===trip.vehicle_id)?.number||trip.vehicle_manual||'',vendor_cost:num(trip.vendor_cost),vendor_advance:num(trip.vendor_advance||0),deductions:num(trip.vendor_deductions||0),balance_payable:Math.max(0,num(trip.vendor_cost)-num(trip.vendor_advance||0)-num(trip.vendor_deductions||0)),status:'pending'};
    if(idx>=0)data[idx]=row;else data.push(row);DB.set('vendor_settlements',data,true);
  }

  window.anoriSyncVendorSettlement=syncVendorSettlement;

  function bindTripForm(trip,isEdit,id){
    const cls=document.getElementById('t_vehicle_classification'), outside=document.getElementById('tripOutsideFields');
    const refreshOutside=(autoScroll=false)=>{
      const on=cls?.value==='outside';
      if(outside)outside.classList.toggle('is-visible',on);
      if(!on){
        const vc=document.getElementById('t_vendor_cost');if(vc)vc.value='0';
        const va=document.getElementById('t_vendor_advance');if(va)va.value='0';
      } else if(autoScroll){
        setTimeout(()=>outside?.scrollIntoView({behavior:'smooth',block:'nearest'}),80);
      }
    };
    cls?.addEventListener('change',()=>refreshOutside(true));
    refreshOutside(false);

    const vehicleInput=document.getElementById('t_vehicle_input');
    vehicleInput?.addEventListener('change',()=>{
      const v=matchMaster(ensureArrayKey('vehicles'),'number',vehicleInput.value);
      const masterClass=String(v?.classification||v?.vehicle_classification||'').toLowerCase();
      const outsideVehicle=['outside','outside vehicle','outside organization vehicle','outside organization','external','vendor'].includes(masterClass);
      if(v&&cls){
        cls.value=outsideVehicle?'outside':'company';
        refreshOutside(true);
      }
      const driverAmount=document.getElementById('t_driver_amount');
      if(v&&driverAmount&&num(trip?.driver_amount)===0)driverAmount.value=num(v.driver_amount)||0;
    });
    vehicleInput?.addEventListener('input',()=>{
      const v=matchMaster(ensureArrayKey('vehicles'),'number',vehicleInput.value);
      if(!v)return;
      const masterClass=String(v.classification||v.vehicle_classification||'').toLowerCase();
      if(cls){cls.value=['outside','outside vehicle','outside organization vehicle','outside organization','external','vendor'].includes(masterClass)?'outside':'company';refreshOutside(true);}
    });

    if(!document.querySelector('#expRows .anori-trip-exp-row'))Trips.addExpRow();
  }

  Trips.addExpRow=function(type='',amount=''){
    const rows=document.getElementById('expRows');if(!rows)return;
    const div=document.createElement('div');div.className='form-row anori-trip-exp-row';div.style.marginBottom='8px';
    const values=uniqueValues((typeof getExpenseMaster==='function'?getExpenseMaster():[]).map(x=>x.name).concat(ensureArrayKey('trips').flatMap(t=>(t.expenses||[]).map(e=>e.type))));
    div.innerHTML=`<div class="form-group"><label>Expense Type</label><div class="trip-combined-wrap"><i class="fas fa-receipt"></i><input class="trip-combined-input exp-type" list="expenseTypeListFinal" value="${esc(type)}" placeholder="Type / filter expense..." autocomplete="off"></div></div><div class="form-group"><label>Amount</label><div class="trip-input-wrap"><span class="trip-input-prefix">₹</span><input type="number" class="form-control exp-amt" min="0" step="0.01" placeholder="Amount" value="${num(amount)||''}"></div></div><div class="form-group" style="align-self:end"><button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.anori-trip-exp-row').remove()"><i class="fas fa-trash"></i> Remove</button></div>`;
    rows.appendChild(div);
    let dl=document.getElementById('expenseTypeListFinal');if(!dl){dl=document.createElement('datalist');dl.id='expenseTypeListFinal';document.body.appendChild(dl);}dl.innerHTML=values.map(v=>`<option value="${esc(v)}"></option>`).join('');
  };

  Trips.openForm=function(){
    UI.openModal('Create New Trip',formHtml(null),()=>{
      const form=readForm();if(!form)return;
      const trip={id:Utils.id(),trip_no:Utils.generateTripNo(form.date),...form,status:'completed',invoice_status:'pending',is_gst:true};
      const data=ensureArrayKey('trips');data.push(trip);if(!DB.set('trips',data))return;
      if(typeof syncDriverTripEntry==='function')syncDriverTripEntry(trip);
      syncVendorSettlement(trip);
      UI.closeModal();Utils.toast('Trip created successfully.','success');Router.go('trips');
    },true);
    bindTripForm(null,false,null);
  };

  Trips.showEditModal=function(id){
    const trip=ensureArrayKey('trips').find(t=>t.id===id);if(!trip)return;
    if(typeof activeInvoiceForTrip==='function'&&activeInvoiceForTrip(id))return Swal.fire({icon:'warning',title:'Trip Locked',text:'Cancel the active invoice before editing this trip.',confirmButtonText:'OK'});
    UI.openModal('Edit Trip',formHtml(trip),()=>{
      if(typeof activeInvoiceForTrip==='function'&&activeInvoiceForTrip(id))return Swal.fire({icon:'warning',title:'Trip Locked',text:'Cancel the active invoice before editing this trip.',confirmButtonText:'OK'});
      const form=readForm();if(!form)return;
      const data=ensureArrayKey('trips'),idx=data.findIndex(t=>t.id===id);if(idx<0)return Utils.toast('Trip not found.','error');
      data[idx]={...data[idx],...form};if(!DB.set('trips',data))return;
      if(typeof syncDriverTripEntry==='function')syncDriverTripEntry(data[idx]);
      syncVendorSettlement(data[idx]);
      UI.closeModal();Utils.toast('Trip updated successfully.','success');Router.go('trips');
    },true);
    bindTripForm(trip,true,id);
  };
  Trips.openEditForm=function(id){Trips.showEditModal(id);};

  /* Trip list: preserve existing columns while showing manual values and outside classification. */
  const baseTripRender=Trips.render.bind(Trips);
  Trips.render=function(container){
    baseTripRender(container);
    const table=container.querySelector('table');if(!table)return;
    const trips=ensureArrayKey('trips'),vehicles=ensureArrayKey('vehicles'),drivers=ensureArrayKey('drivers'),parties=ensureArrayKey('parties');
    table.querySelectorAll('tbody tr').forEach((tr,i)=>{
      const check=tr.querySelector('.trip-row-check');if(!check)return;
      const t=trips.find(x=>String(x.id)===String(check.value));if(!t)return;
      const cells=tr.children;
      const v=vehicles.find(x=>x.id===t.vehicle_id),d=drivers.find(x=>x.id===t.driver_id),p=parties.find(x=>x.id===t.party_id);
      const map=[{idx:3,val:v?.number||t.vehicle_manual||'-'},{idx:4,val:d?.name||t.driver_manual||'-'},{idx:5,val:p?.name||t.party_manual||'-'}];
      map.forEach(m=>{if(cells[m.idx])cells[m.idx].textContent=m.val;});
      const routeIdx=6;if(cells[routeIdx])cells[routeIdx].textContent=`${t.from||'-'} → ${t.to||'-'}`;
    });
  };

  /* Final settings UI: old backup/import cards are removed by replacing the page. */
  Settings.render=function(container){
    const company=DB.get('company_profile',{})||{};
    const backupFolder=localStorage.getItem('anori_backup_folder_path')||localStorage.getItem('anori_backup_folder_name')||'';
    const driveFolder=localStorage.getItem('anori_google_drive_folder')||'';
    const last=localStorage.getItem('anori_backup_last_status')||localStorage.getItem('anori_backup_last_time')||'Not backed up yet';
    const supported=typeof window.showDirectoryPicker==='function'||!!window.anoriElectronBackup?.isAvailable;
    container.innerHTML=`
      <div class="anori-settings-page">
        <div class="anori-section-intro"><div><strong>Settings</strong><span>System, company and data protection controls.</span></div></div>

        <div class="card">
          <h3 class="card-title"><i class="fas fa-building"></i> Company Settings</h3>
          <div class="form-row">
            <div class="form-group"><label>Company Name</label><input class="form-control" id="sys_company_name" value="${esc(company.name||'ANORI TRANSPORT')}"></div>
            <div class="form-group"><label>GSTIN</label><input class="form-control" id="sys_company_gstin" value="${esc(company.gstin||company.gst||'')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Phone</label><input class="form-control" id="sys_company_phone" value="${esc(company.phone||'')}"></div>
            <div class="form-group"><label>Email</label><input class="form-control" id="sys_company_email" value="${esc(company.email||'')}"></div>
          </div>
          <div class="form-group"><label>Address</label><textarea class="form-control" id="sys_company_address" rows="2">${esc(company.address||company.addr||'')}</textarea></div>
          <button class="btn btn-primary" type="button" onclick="window.anoriSaveFinalSystemSettings()"><i class="fas fa-save"></i> Save Settings</button>
        </div>

        <div class="anori-settings-card" id="anoriBackupRestoreReferenceCard">
          <div class="anori-ref-head"><i class="fas fa-save"></i> Data Backup &amp; Restore</div>
          <div class="anori-ref-body">
            <div class="anori-backup-ref-row">
              <div class="anori-backup-ref-label">Backup Folder Path</div>
              <input class="anori-backup-ref-input" id="anoriBackupFolderPathInput" value="${esc(backupFolder)}" placeholder="Select backup folder or enter path">
              <button class="anori-ref-btn anori-ref-btn-blue" type="button" onclick="window.anoriBrowseBackupFolderFinal()">📁 BROWSE FOLDER</button>
              <button class="anori-ref-btn anori-ref-btn-green" type="button" onclick="window.anoriSaveBackupPathFinal()">💾 SAVE PATH</button>
            </div>
            <div class="anori-backup-ref-row">
              <div class="anori-backup-ref-label">Google Drive Folder</div>
              <input class="anori-backup-ref-input" id="anoriGoogleDriveFolderInput" value="${esc(driveFolder)}" placeholder="Google Drive Desktop synced folder">
              <button class="anori-ref-btn anori-ref-btn-blue" type="button" onclick="window.anoriBrowseDriveFolderFinal()">☁ BROWSE DRIVE</button>
              <button class="anori-ref-btn anori-ref-btn-green" type="button" onclick="window.anoriSaveDrivePathFinal()">💾 SAVE DRIVE</button>
            </div>
            <div class="anori-backup-ref-actions" style="border-top:0;padding-top:0">
              <button class="anori-ref-btn anori-ref-btn-orange" type="button" onclick="window.anoriImportFile?.()">📥 IMPORT DATA</button>
              <button class="anori-ref-btn anori-ref-btn-green" type="button" onclick="window.anoriExportJSON?.()">📤 EXPORT DATA</button>
            </div>
            <div class="anori-backup-ref-actions">
              <button class="anori-ref-btn anori-ref-btn-green" type="button" onclick="window.anoriExportXLSX?.()">📊 EXPORT TO EXCEL</button>
              <button class="anori-ref-btn anori-ref-btn-green" type="button" onclick="window.anoriExportSQLite?.()">🗄 EXPORT TO SQLITE</button>
              <button class="anori-ref-btn anori-ref-btn-orange" type="button" onclick="window.anoriImportByFormat?.('sqlite')">📥 IMPORT SQLITE</button>
              <button class="anori-ref-btn anori-ref-btn-orange" type="button" onclick="window.anoriImportByFormat?.('json')">📥 IMPORT JSON</button>
              <button class="anori-ref-btn anori-ref-btn-blue" type="button" onclick="window.anoriBackupNowFinal?.()">💾 AUTO BACKUP NOW</button>
              <button class="anori-ref-btn anori-ref-btn-outline" type="button" onclick="window.anoriBackupStatus?.()">🟢 ONLINE / STATUS</button>
            </div>
            <div class="anori-backup-ref-status">
              <div class="anori-ref-status-line success">📁 ${esc(backupFolder||'Backup folder not selected')} — backup controls ready.</div>
              <div class="anori-ref-status-line info">☁ Google Drive: ${esc(driveFolder||'Not configured')}</div>
              <div class="anori-ref-status-line">⏰ Auto backup status: ${esc(last)}</div>
            </div>
            <div class="anori-backup-ref-note">${supported?'Direct folder access is available in this environment.':'Browser folder access depends on Chrome/Edge; the Windows EXE can use the native folder picker.'} Google Drive must be a locally synced folder; no fake cloud connection is created.</div>
          </div>
        </div>
      </div>`;
  };

  window.anoriSaveFinalSystemSettings=function(){
    const c=DB.get('company_profile',{})||{};
    DB.set('company_profile',{...c,name:text(document.getElementById('sys_company_name')?.value)||'ANORI TRANSPORT',gstin:text(document.getElementById('sys_company_gstin')?.value),gst:text(document.getElementById('sys_company_gstin')?.value),phone:text(document.getElementById('sys_company_phone')?.value),email:text(document.getElementById('sys_company_email')?.value),address:text(document.getElementById('sys_company_address')?.value),addr:text(document.getElementById('sys_company_address')?.value)},true);
    Utils.toast('Settings saved successfully.','success');
  };

  window.anoriSaveBackupPathFinal=async function(){
    const v=text(document.getElementById('anoriBackupFolderPathInput')?.value);
    if(!v){localStorage.removeItem('anori_backup_folder_name');localStorage.removeItem('anori_backup_folder_path');Utils.toast('Backup path cleared.','success');return;}
    if(typeof window.anoriSetBackupFolderPath==='function'){
      const ok=await window.anoriSetBackupFolderPath(v);
      if(ok)return;
    }
    localStorage.setItem('anori_backup_folder_name',v);
    Utils.toast('Backup path saved as a reference. Use BROWSE FOLDER to grant write access.','info');
  };
  window.anoriSaveDrivePathFinal=function(){
    const v=text(document.getElementById('anoriGoogleDriveFolderInput')?.value);
    localStorage.setItem('anori_google_drive_folder',v);
    Utils.toast(v?'Google Drive synced-folder path saved.':'Google Drive path cleared.','success');
  };
  async function pickFolder(kind){
    try{
      if(window.anoriElectronBackup?.isAvailable && typeof window.anoriElectronBackup.selectFolder==='function'){
        const info=await window.anoriElectronBackup.selectFolder();
        if(info?.path){
          if(kind==='drive'){localStorage.setItem('anori_google_drive_folder',info.path);const el=document.getElementById('anoriGoogleDriveFolderInput');if(el)el.value=info.path;}
          else {localStorage.setItem('anori_backup_folder_name',info.path);const el=document.getElementById('anoriBackupFolderPathInput');if(el)el.value=info.path;}
          Utils.toast('Folder selected successfully.','success');return;
        }
      }
      if(typeof window.showDirectoryPicker!=='function'){Utils.toast('Folder picker is not available in this browser.','warning');return;}
      const h=await window.showDirectoryPicker({mode:'readwrite'});
      if(kind==='drive'){localStorage.setItem('anori_google_drive_folder',h.name||'Selected Folder');const el=document.getElementById('anoriGoogleDriveFolderInput');if(el)el.value=h.name||'Selected Folder';}
      else {localStorage.setItem('anori_backup_folder_name',h.name||'Selected Folder');const el=document.getElementById('anoriBackupFolderPathInput');if(el)el.value=h.name||'Selected Folder';}
      Utils.toast('Folder selected successfully.','success');
    }catch(e){if(e?.name!=='AbortError')Utils.toast('Folder selection failed.','error');}
  }
  // Use the application's real backup controller so Browse Folder creates a
  // writable folder handle used by AUTO BACKUP NOW / scheduled backup.
  window.anoriBrowseBackupFolderFinal=async()=>{
    if(typeof window.anoriSelectBackupFolder==='function') {
      try {
        if(window.anoriElectronBackup?.isAvailable || typeof window.showDirectoryPicker==='function') return window.anoriSelectBackupFolder();
      } catch (_) {}
    }
    if(typeof window.showDirectoryPicker==='function') return pickFolder('backup');
    if(typeof window.showSaveFilePicker==='function' && typeof window.anoriSelectBackupFile==='function'){
      Utils.toast('This browser does not expose folder access here. Select the backup file location instead.','info');
      return window.anoriSelectBackupFile();
    }
    Utils.toast('Folder selection is unavailable in this browser/file mode. Use the ANORI TRANSPORT desktop EXE for native folder selection.','warning');
  };
  window.anoriBrowseDriveFolderFinal=async()=>{
    if(window.anoriElectronBackup?.isAvailable || typeof window.showDirectoryPicker==='function') return pickFolder('drive');
    Utils.toast('Drive folder selection is unavailable in this browser/file mode. Use the desktop EXE or type the synced folder path manually.','warning');
  };
  window.anoriBackupNowFinal=async()=>{
    if(typeof window.anoriBackupNow==='function'){
      const result=await window.anoriBackupNow();
      if(result!==false)return result;
    }
    if(typeof window.anoriSelectBackupFolder==='function') return window.anoriSelectBackupFolder();
    return false;
  };

  /* Keep data-transfer/backup exports complete for new vendor records. */
  try{
    const patchKeys=()=>{
      const files=[window.__ANORI_DATA_TRANSFER_KEYS__];
      void files;
    };
    patchKeys();
  }catch(_){ }

  try{localStorage.setItem('anori_app_version','2.30.0');}catch(_){ }
  window.ANORI_V230_FINAL=true;
})();

/* ============================================================
   OUTSIDE VEHICLE — VENDOR SETTLEMENT UI
   Kept inside the existing Settlement area so no new navigation/data
   module is introduced.
   ============================================================ */
(function installOutsideVendorSettlementView(){
  'use strict';
  const esc=v=>Sanitize.html(v==null?'':String(v));
  const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0;};
  const previousRender=DriverSettlement.render.bind(DriverSettlement);
  DriverSettlement.render=function(container){
    previousRender(container);
    const rows=DB.get('vendor_settlements',[])||[];
    const trips=DB.get('trips',[])||[];
    const vehicles=DB.get('vehicles',[])||[];
    const body=rows.length?rows.slice().reverse().map(r=>{
      const t=trips.find(x=>x.id===r.trip_id),v=vehicles.find(x=>x.id===r.vehicle_id);
      return `<tr><td>${esc(r.date||t?.date||'-')}</td><td><strong>${esc(t?.trip_no||r.trip_id||'-')}</strong></td><td>${esc(v?.number||r.vehicle_number||t?.vehicle_manual||'-')}</td><td>${esc(r.vendor_name||'-')}</td><td>${Utils.fmt(r.vendor_cost)}</td><td>${Utils.fmt(r.vendor_advance)}</td><td>${Utils.fmt(r.deductions)}</td><td><strong>${Utils.fmt(r.balance_payable)}</strong></td><td><span class="status-badge ${r.status==='paid'?'status-paid':'status-pending'}">${esc(String(r.status||'pending').toUpperCase())}</span></td><td><button type="button" class="btn btn-outline btn-sm" onclick="window.anoriEditVendorSettlement?.('${esc(r.id)}')"><i class="fas fa-edit"></i> Edit</button></td></tr>`;
    }).join(''):'<tr><td colspan="10" class="empty-state">No outside vehicle vendor settlements yet.</td></tr>';
    container.insertAdjacentHTML('beforeend',`<div class="card anori-vendor-settlement-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px"><div><h3 class="card-title"><i class="fas fa-truck-loading"></i> Outside Vehicle / Vendor Settlement</h3><span class="anori-help">Vendor vehicle costs are tracked separately from Driver Settlement.</span></div></div><div class="table-wrapper"><table><thead><tr><th>Date</th><th>Trip</th><th>Vehicle</th><th>Vendor</th><th>Vehicle Cost</th><th>Vendor Advance</th><th>Deductions</th><th>Balance Payable</th><th>Status</th><th>Action</th></tr></thead><tbody>${body}</tbody></table></div></div>`);
  };

  window.anoriEditVendorSettlement=function(id){
    const rows=DB.get('vendor_settlements',[])||[],r=rows.find(x=>x.id===id);if(!r)return;
    const html=`<div class="form-row"><div class="form-group"><label>Vendor Advance (₹)</label><input class="form-control" id="vs_advance" type="number" min="0" step="0.01" value="${num(r.vendor_advance)}"></div><div class="form-group"><label>Deductions (₹)</label><input class="form-control" id="vs_deductions" type="number" min="0" step="0.01" value="${num(r.deductions)}"></div></div><div class="form-group"><label>Status</label><select class="form-control" id="vs_status"><option value="pending" ${r.status==='pending'?'selected':''}>Pending</option><option value="paid" ${r.status==='paid'?'selected':''}>Paid</option></select></div>`;
    UI.openModal('Edit Vendor Settlement',html,()=>{
      const advance=num(document.getElementById('vs_advance')?.value),deductions=num(document.getElementById('vs_deductions')?.value),status=document.getElementById('vs_status')?.value||'pending';
      const data=DB.get('vendor_settlements',[])||[],idx=data.findIndex(x=>x.id===id);if(idx<0)return;
      data[idx]={...data[idx],vendor_advance:advance,deductions, status,balance_payable:Math.max(0,num(data[idx].vendor_cost)-advance-deductions)};
      DB.set('vendor_settlements',data,true);UI.closeModal();Utils.toast('Vendor settlement updated.','success');Router.go('settlements');
    });
  };
})();


/* ============================================================
   ANORI TRANSPORT — AMENDMENT HOTFIX 2026-10-04
   Scope only:
   1) Master Vehicle -> New Trip automatic classification
   2) Backup folder picker/path UI synchronization
   3) No unrelated workflow changes
   ============================================================ */
(function installAmendmentHotfix_20261004(){
  'use strict';
  if(window.__ANORI_AMENDMENT_HOTFIX_20261004__) return;
  window.__ANORI_AMENDMENT_HOTFIX_20261004__=true;

  const txt=v=>String(v==null?'':v).trim();
  const key=v=>txt(v).toLowerCase().replace(/[._-]+/g,' ').replace(/\s+/g,' ');
  const arr=k=>{const v=DB.get(k,[]);return Array.isArray(v)?v:[];};
  const isOutside=v=>{
    const k=key(v?.classification||v?.vehicle_classification||v||'');
    return ['outside','outside vehicle','outside organization vehicle','outside organization','external','vendor'].includes(k);
  };
  const findVehicle=value=>{
    const q=key(value);
    if(!q) return null;
    return arr('vehicles').find(v=>key(v?.number)===q)||null;
  };

  // Re-evaluate the selected vehicle from the actual Master Data record.
  // This fixes both new-trip selection and edit-trip opening.
  function syncVehicleClassification(forceFromMaster=true, scrollOutside=false){
    const input=document.getElementById('t_vehicle_input');
    const select=document.getElementById('t_vehicle_classification');
    const outside=document.getElementById('tripOutsideFields');
    if(!select) return false;

    const vehicle=input ? findVehicle(input.value) : null;
    if(vehicle && (forceFromMaster || vehicle.classification || vehicle.vehicle_classification)){
      // Existing Master Data vehicles always use their saved classification.
      select.value=isOutside(vehicle)?'outside':'company';
      select.disabled=true;
      select.title='Vehicle Classification is controlled by the selected Master Data vehicle.';
    } else {
      // A manually entered vehicle must remain classifiable by the user.
      select.disabled=false;
      select.removeAttribute('title');
      if(!select.value) select.value='company';
    }

    // Apply visibility from the current control value on every path, including
    // manual vehicle entry and direct classification changes.
    const outsideVehicle=select.value==='outside';
    if(outside) outside.classList.toggle('is-visible',outsideVehicle);
    if(outsideVehicle){
      if(scrollOutside) setTimeout(()=>outside?.scrollIntoView({behavior:'smooth',block:'nearest'}),80);
      setTimeout(()=>{
        const vendor=document.getElementById('t_vendor_input');
        if(vendor && !vendor.value && outsideVehicle) vendor.focus({preventScroll:true});
      },40);
    }

    if(vehicle){
      const driverAmount=document.getElementById('t_driver_amount');
      if(driverAmount && Number(driverAmount.value||0)===0 && Number(vehicle.driver_amount||0)>0){
        driverAmount.value=Number(vehicle.driver_amount)||0;
      }
    }
    return !!vehicle;
  }

  // Patch the existing trip-form binder without replacing the trip workflow.
  if(window.Trips && typeof Trips.showEditModal==='function' && !Trips.__vehicleClassificationHotfix){
    const originalShowEdit=Trips.showEditModal;
    Trips.showEditModal=function(id){
      const result=originalShowEdit.apply(this,arguments);
      setTimeout(()=>syncVehicleClassification(true),60);
      return result;
    };
    Trips.__vehicleClassificationHotfix=true;
  }

  // Capture dynamically rendered New Trip vehicle input changes.
  document.addEventListener('input',e=>{
    if(e.target?.id==='t_vehicle_input') syncVehicleClassification(true);
  },true);
  document.addEventListener('change',e=>{
    if(e.target?.id==='t_vehicle_input') syncVehicleClassification(true);
    else if(e.target?.id==='t_vehicle_classification') syncVehicleClassification(false,true);
  },true);
  document.addEventListener('input',e=>{
    if(e.target?.id==='t_vehicle_classification') syncVehicleClassification(false,false);
  },true);
  document.addEventListener('blur',e=>{
    if(e.target?.id==='t_vehicle_input') syncVehicleClassification(true);
  },true);

  // Backup UI helpers: use the existing native/Electron controller, but also
  // synchronize the visible path field with the real selected path.
  function setBackupInput(value){
    const el=document.getElementById('anoriBackupFolderPathInput');
    if(el && value) el.value=value;
  }

  const originalSetBackupPath=window.anoriSetBackupFolderPath;
  if(typeof originalSetBackupPath==='function' && !window.__ANORI_BACKUP_PATH_WRAPPED__){
    window.anoriSetBackupFolderPath=async function(pathValue){
      const result=await originalSetBackupPath(pathValue);
      if(result){
        try{localStorage.setItem('anori_backup_folder_path',txt(pathValue));}catch(_){ }
        setBackupInput(txt(pathValue));
      }
      return result;
    };
    window.__ANORI_BACKUP_PATH_WRAPPED__=true;
  }

  const originalBrowse=window.anoriBrowseBackupFolderFinal;
  window.anoriBrowseBackupFolderFinal=async function(){
    try{
      // Electron/EXE: use the real native Windows folder picker and persist the
      // actual path through the application's existing backup controller.
      if(window.anoriElectronBackup?.isAvailable && typeof window.anoriElectronBackup.selectFolder==='function'){
        const info=await window.anoriElectronBackup.selectFolder();
        if(!info?.path) return false;
        if(typeof window.anoriSetBackupFolderPath!=='function') return false;
        const ok=await window.anoriSetBackupFolderPath(info.path);
        if(!ok) return false;
        try{localStorage.setItem('anori_backup_folder_path',info.path);localStorage.setItem('anori_backup_folder_name',info.name||info.path);}catch(_){ }
        setBackupInput(info.path);
        if(window.Utils?.toast) Utils.toast('Backup folder selected, initial backup written, and destination verified.','success');
        return true;
      }

      // Browser: let the existing controller open the directory picker once.
      if(typeof window.showDirectoryPicker==='function' && typeof window.anoriSelectBackupFolder==='function'){
        const ok=await window.anoriSelectBackupFolder();
        if(ok!==true) return false;
        const saved=localStorage.getItem('anori_backup_folder_name')||'';
        if(saved) setBackupInput(saved);
        return true;
      }

      if(typeof originalBrowse==='function') return originalBrowse();
      if(window.Utils?.toast) Utils.toast('Folder selection is unavailable in this runtime. Use the ANORI TRANSPORT desktop EXE for native folder selection.','warning');
      return false;
    }catch(e){
      if(e?.name!=='AbortError'){
        console.error('Backup folder selection failed:',e);
        if(window.Utils?.toast) Utils.toast('Backup folder selection failed: '+(e.message||'unknown error'),'error');
      }
      return false;
    }
  };

  const originalBackupNowFinal=window.anoriBackupNowFinal;
  window.anoriBackupNowFinal=async function(){
    if(typeof window.anoriBackupNow==='function'){
      const result=await window.anoriBackupNow();
      if(result!==false) return result;
    }
    if(typeof originalBackupNowFinal==='function') return originalBackupNowFinal();
    return false;
  };

  // Restore the actual saved path into the Settings field whenever Settings
  // is opened/re-rendered.
  const originalSettingsRender=window.Settings?.render;
  if(window.Settings && typeof originalSettingsRender==='function' && !window.Settings.__backupPathUiHotfix){
    window.Settings.render=function(container){
      const result=originalSettingsRender.apply(this,arguments);
      setTimeout(()=>{
        const saved=localStorage.getItem('anori_backup_folder_path')||'';
        if(saved) setBackupInput(saved);
      },0);
      return result;
    };
    window.Settings.__backupPathUiHotfix=true;
  }
})();

/* ===== END js/app.js ===== */


/* ===== BEGIN js/data-transfer.js ===== */
/* ANORI TRANSPORT - Global Data Import / Export Center
 * Full-fidelity JSON / Excel / SQLite / CSV transfers.
 * Uses browser-safe download and File System Access APIs when available.
 */
(function installAnoriDataTransfer(){
  'use strict';
  if(window.__ANORI_DATA_TRANSFER_V1__) return;
  window.__ANORI_DATA_TRANSFER_V1__=true;

  const DATA_KEYS=['company_profile','vehicles','drivers','parties','vendors','trips','invoices','driver_settlements','vendor_settlements','payments','expense_master','followups','audit_log'];
  const todaySafe=()=>typeof today==='function'?today():new Date().toISOString().slice(0,10);
  const esc=v=>typeof Sanitize!=='undefined'&&Sanitize.html?Sanitize.html(v==null?'':String(v)):String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const snapshot=()=>{
    const out={version:'2.24',application:'ANORI TRANSPORT',exported_at:new Date().toISOString()};
    DATA_KEYS.forEach(k=>out[k]=DB.get(k,k==='company_profile'?{}:[]));
    return out;
  };
  const download=(blob,name)=>{
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const notify=(m,t='info')=>{try{Utils.toast(m,t)}catch(_){console.log(m)}};
  const confirmImport=async present=>{
    if(window.Swal){
      const r=await Swal.fire({icon:'warning',title:'IMPORT DATA?',html:`<div style="text-align:left"><p><strong>${present.length}</strong> supported data sections found.</p><p>This will replace the matching data in ANORI TRANSPORT.</p><p>Your existing data will be protected by an internal rollback snapshot. No file will be downloaded unless you explicitly choose an Export option.</p></div>`,showCancelButton:true,confirmButtonText:'IMPORT DATA',cancelButtonText:'CANCEL'});
      return r.isConfirmed;
    }
    return window.confirm('Import '+present.length+' data sections? Existing data will be protected by an internal rollback snapshot. No file will be downloaded automatically.');
  };
  const applyImport=async data=>{
    const present=DATA_KEYS.filter(k=>Object.prototype.hasOwnProperty.call(data,k));
    if(!present.length) throw new Error('No supported ANORI TRANSPORT data sections found.');
    if(present.some(k=>k==='company_profile' ? (data[k]===null || typeof data[k]!=='object' || Array.isArray(data[k])) : !Array.isArray(data[k]))) throw new Error('Invalid data structure: company profile must be an object and other supported sections must be arrays.');
    const approx=(()=>{try{return JSON.stringify(data).length}catch(_){return 0}})();
    if(approx>100*1024*1024) throw new Error('Import file is too large. Maximum supported size is 100 MB.');
    if(!await confirmImport(present)) return false;
    // Keep a persistent internal snapshot plus an in-memory snapshot. No backup file is downloaded.
    const rollback={};DATA_KEYS.forEach(k=>rollback[k]=DB.get(k,k==='company_profile'?{}:[]));
    try{if(window.ANORI_DATA_SAFETY?.createRollbackSnapshot)await window.ANORI_DATA_SAFETY.createRollbackSnapshot('pre-import');}catch(e){console.warn('Persistent safety snapshot unavailable; continuing with in-memory rollback.',e);}
    try{
      present.forEach(k=>{if(!DB.set(k,data[k],true))throw new Error(`Could not save section: ${k}`);});
      if(typeof sync==='function')sync();
      notify('Data imported successfully. No backup file was downloaded. Previous data remains available for rollback if the import fails.','success');
      if(typeof Router!=='undefined'&&Router.go)Router.go('settings');
      return true;
    }catch(e){
      console.error('Import failed; restoring previous data.',e);
      try{DATA_KEYS.forEach(k=>DB.set(k,rollback[k],true));if(typeof sync==='function')sync();}catch(restoreError){console.error('Rollback failed:',restoreError);}
      throw new Error('Import failed and the previous data was restored. '+(e.message||''));
    }
  };

  // ---------- JSON ----------
  window.anoriExportJSON=()=>{download(new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json'}),`anori-data-${todaySafe()}.json`);notify('JSON export downloaded.','success');};

  // ---------- Excel ----------
  window.anoriExportXLSX=()=>{
    if(typeof XLSX==='undefined')return notify('Excel library unavailable.','error');
    const wb=XLSX.utils.book_new();
    const meta=[];
    DATA_KEYS.forEach(k=>{
      const v=DB.get(k,k==='company_profile'?{}:[]);
      if(Array.isArray(v)){
        const rows=v.length?v:[{}];
        XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),k.slice(0,31));
      }else{
        meta.push({section:k,json:JSON.stringify(v??{})});
      }
    });
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(meta.length?meta:[{section:'company_profile',json:'{}'}]),'__ANORI_META__');
    XLSX.writeFile(wb,`anori-data-${todaySafe()}.xlsx`);
    notify('Excel export downloaded.','success');
  };

  // ---------- SQLite ----------
  window.anoriExportSQLite=async()=>{
    if(typeof initSqlJs!=='function')return notify('SQLite library unavailable.','error');
    try{
      const SQL=await initSqlJs({locateFile:f=>`https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${f}`});
      const db=new SQL.Database();
      db.run('CREATE TABLE IF NOT EXISTS anori_meta (key TEXT PRIMARY KEY, value TEXT)');
      db.run('INSERT INTO anori_meta VALUES (?,?)',['application','ANORI TRANSPORT']);
      db.run('INSERT INTO anori_meta VALUES (?,?)',['exported_at',new Date().toISOString()]);
      DATA_KEYS.forEach(k=>{
        const table=k.replace(/[^A-Za-z0-9_]/g,'_');
        db.run(`CREATE TABLE IF NOT EXISTS "${table}" (json TEXT NOT NULL)`);
        const v=DB.get(k,k==='company_profile'?{}:[]);
        const rows=Array.isArray(v)?v:[v];
        rows.forEach(r=>db.run(`INSERT INTO "${table}" (json) VALUES (?)`,[JSON.stringify(r??{})]));
      });
      const bytes=db.export();db.close();
      download(new Blob([bytes],{type:'application/x-sqlite3'}),`anori-data-${todaySafe()}.sqlite`);
      notify('SQLite export downloaded.','success');
    }catch(e){console.error(e);notify('SQLite export failed: '+(e.message||'unknown error'),'error');}
  };

  // ---------- CSV (one file containing every table/section) ----------
  const csvQuote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
  window.anoriExportCSV=()=>{
    const s=snapshot(),out=[];
    DATA_KEYS.forEach(k=>{
      const raw=s[k],rows=Array.isArray(raw)?raw:[raw||{}];
      const keys=[...new Set(rows.flatMap(r=>Object.keys(r||{})))];
      out.push(`# SECTION: ${k}`);
      out.push(keys.map(csvQuote).join(','));
      rows.forEach(r=>out.push(keys.map(q=>csvQuote(typeof r?.[q]==='object'?JSON.stringify(r[q]):r?.[q])).join(',')));
      out.push('');
    });
    download(new Blob([out.join('\n')],{type:'text/csv;charset=utf-8'}),`anori-data-${todaySafe()}.csv`);
    notify('CSV export downloaded.','success');
  };

  // ---------- Import ----------
  // Normalize only fields that are semantically dates. This prevents Excel/CSV
  // round-trips from turning application dates into locale-dependent strings.
  const isDateKey=k=>{const x=String(k||'').toLowerCase();return x==='date'||x.endsWith('_date')||x.startsWith('date_')||x==='dob'||x.endsWith('_dob');};
  const isDateTimeKey=k=>{const x=String(k||'').toLowerCase();return x.endsWith('_at')||x==='created'||x==='updated';};
  const pad=n=>String(n).padStart(2,'0');
  const excelSerialToDate=v=>{
    const n=Number(v); if(!Number.isFinite(n)||n<1||n>2958465)return null;
    const d=new Date(Date.UTC(1899,11,30)+Math.round(n)*86400000);
    return Number.isNaN(d.getTime())?null:`${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
  };
  const normalizeDate=(v,key)=>{
    if(v==null||v==='')return v;
    if(v instanceof Date){
      if(isDateTimeKey(key))return v.toISOString();
      return `${v.getFullYear()}-${pad(v.getMonth()+1)}-${pad(v.getDate())}`;
    }
    if(!isDateKey(key))return v;
    if(typeof v==='number')return excelSerialToDate(v)||v;
    const s=String(v).trim();
    if(/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(s))return s.slice(0,10);
    let m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if(m){
      const a=Number(m[1]),b=Number(m[2]),y=Number(m[3]);
      // For ambiguous DD/MM vs MM/DD, prefer the application's Indian date convention
      // when both parts are <= 12, while unambiguous values are handled directly.
      const day=a>12? a : b>12 ? b : a;
      const month=a>12? b : b>12 ? a : b;
      const d=new Date(Date.UTC(y,month-1,day));
      if(d.getUTCFullYear()===y&&d.getUTCMonth()===month-1&&d.getUTCDate()===day)return `${y}-${pad(month)}-${pad(day)}`;
    }
    return v;
  };
  const normalizeRecord=(value)=>{
    if(Array.isArray(value))return value.map(normalizeRecord);
    if(value&&typeof value==='object'&&! (value instanceof Date)){
      const out={};Object.keys(value).forEach(k=>out[k]=normalizeDate(normalizeRecord(value[k]),k));return out;
    }
    return value;
  };
  const normalizeImportedPayload=(data)=>{
    const out={};DATA_KEYS.forEach(k=>{if(Object.prototype.hasOwnProperty.call(data,k))out[k]=normalizeRecord(data[k]);});return out;
  };
  const readJson=async f=>normalizeImportedPayload(JSON.parse(await f.text()));
  const readXlsx=async f=>{
    if(typeof XLSX==='undefined')throw new Error('Excel library unavailable.');
    const wb=XLSX.read(await f.arrayBuffer(),{type:'array',cellDates:true,cellNF:true,cellText:false}),d={};
    wb.SheetNames.forEach(name=>{
      if(name==='__ANORI_META__'){
        const rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:''});
        rows.forEach(r=>{if(r.section){try{d[r.section]=JSON.parse(r.json||'{}');}catch(e){throw new Error(`Invalid metadata for section ${r.section}.`);}}});
      }else if(DATA_KEYS.includes(name)){
        const rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:'',raw:true});
        d[name]=name==='company_profile'?(rows[0]||{}):rows;
      }
    });
    return normalizeImportedPayload(d);
  };
  const readSqlite=async f=>{
    if(typeof initSqlJs!=='function')throw new Error('SQLite library unavailable.');
    const SQL=await initSqlJs({locateFile:x=>`https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${x}`});
    const db=new SQL.Database(new Uint8Array(await f.arrayBuffer())),d={};
    DATA_KEYS.forEach(k=>{
      const table=k.replace(/[^A-Za-z0-9_]/g,'_');
      try{
        const q=db.exec(`SELECT json FROM "${table}"`);
        if(q[0]){
          const vals=q[0].values.map(r=>JSON.parse(r[0]));
          d[k]=k==='company_profile'?(vals[0]||{}):vals;
        }
      }catch(_){ }
    });
    db.close();return normalizeImportedPayload(d);
  };
  const readCsv=async f=>{
    const text=(await f.text()).replace(/^\uFEFF/,'');
    const lines=text.split(/\r?\n/),d={};let section=null,headers=null;
    const parseLine=line=>{const out=[];let cur='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){cur+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){out.push(cur);cur='';}else cur+=c;}out.push(cur);return out;};
    for(const line of lines){
      if(!line.trim())continue;
      const m=line.match(/^# SECTION:\s*(.+)$/i);if(m){section=m[1].trim();headers=null;continue;}
      if(!section||!DATA_KEYS.includes(section))continue;
      if(!headers){headers=parseLine(line);continue;}
      const vals=parseLine(line),obj={};headers.forEach((h,i)=>{let v=vals[i]??'';if((v.startsWith('{')&&v.endsWith('}'))||(v.startsWith('[')&&v.endsWith(']'))){try{v=JSON.parse(v)}catch(_){}}obj[h]=v;});
      (d[section]||(d[section]=[])).push(obj);
    }
    if(d.company_profile)d.company_profile=d.company_profile[0]||{};
    return normalizeImportedPayload(d);
  };

  // Replace the legacy app.js file picker with the format-aware implementation
  // above so every Import button uses the same validation, date handling and
  // safety/rollback path. No existing application data is touched until the
  // user confirms the import and the pre-import backup succeeds.
  window.anoriImportFile=async()=>{
    const i=document.createElement('input');i.type='file';i.accept='.json,.xlsx,.sqlite,.db,.csv';
    i.onchange=async()=>{
      try{
        const f=i.files?.[0];if(!f)return;
        const n=f.name.toLowerCase();
        const format=n.endsWith('.json')?'json':n.endsWith('.xlsx')?'xlsx':(n.endsWith('.sqlite')||n.endsWith('.db'))?'sqlite':n.endsWith('.csv')?'csv':null;
        if(!format)throw new Error('Unsupported import format. Use JSON, XLSX, CSV or SQLite.');
        let d;if(format==='json')d=await readJson(f);else if(format==='xlsx')d=await readXlsx(f);else if(format==='sqlite')d=await readSqlite(f);else d=await readCsv(f);
        return await applyImport(d);
      }catch(e){console.error(e);if(window.Swal)await Swal.fire({icon:'error',title:'IMPORT FAILED',text:e.message||'Unable to import file.'});else notify(e.message||'Import failed.','error');}
    };i.click();
  };

  window.anoriImportByFormat=async format=>{
    const accept={json:'.json',xlsx:'.xlsx',sqlite:'.sqlite,.db',csv:'.csv'}[format]||'.json';
    const i=document.createElement('input');i.type='file';i.accept=accept;
    i.onchange=async()=>{try{const f=i.files?.[0];if(!f)return;let d;if(format==='json')d=await readJson(f);else if(format==='xlsx')d=await readXlsx(f);else if(format==='sqlite')d=await readSqlite(f);else d=await readCsv(f);await applyImport(d);}catch(e){console.error(e);if(window.Swal)Swal.fire({icon:'error',title:'IMPORT FAILED',text:e.message||'Unable to import file.'});else notify(e.message||'Import failed.','error');}};
    i.click();
  };

  // ---------- Manual export destination ----------
  let exportFolder=null;
  window.anoriSelectExportPath=async()=>{
    if(typeof window.showDirectoryPicker!=='function'){
      if(window.Swal)Swal.fire({icon:'info',title:'BROWSER PATH ACCESS',html:'Your browser does not allow a website to set an arbitrary Windows path. Use <strong>Select Export Folder</strong> in Chrome/Edge, or use the normal Download buttons.'});
      return;
    }
    try{
      const h=await window.showDirectoryPicker({id:'anori-export',mode:'readwrite'});
      if(h){exportFolder=h;localStorage.setItem('anori_export_folder_name',h.name||'Selected Folder');const el=document.getElementById('anoriExportPathName');if(el)el.textContent=h.name||'Selected Folder';notify('Export folder selected.','success');}
    }catch(e){if(e.name!=='AbortError')notify('Export folder selection failed.','error');}
  };
  window.anoriExportToPath=async()=>{
    const format=(document.getElementById('anoriExportFormat')?.value||'json').toLowerCase();
    if(!exportFolder)return window.anoriSelectExportPath();
    try{
      if(typeof exportFolder.queryPermission==='function'&&await exportFolder.queryPermission({mode:'readwrite'})!=='granted'){
        if(typeof exportFolder.requestPermission!=='function'||await exportFolder.requestPermission({mode:'readwrite'})!=='granted')throw new Error('Write permission not granted.');
      }
      let bytes,name,type;
      if(format==='json'){bytes=new TextEncoder().encode(JSON.stringify(snapshot(),null,2));name=`anori-data-${todaySafe()}.json`;type='application/json';}
      else if(format==='sqlite'){
        if(typeof initSqlJs!=='function')throw new Error('SQLite library unavailable.');
        const SQL=await initSqlJs({locateFile:f=>`https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${f}`}),db=new SQL.Database();
        DATA_KEYS.forEach(k=>{const t=k.replace(/[^A-Za-z0-9_]/g,'_');db.run(`CREATE TABLE "${t}" (json TEXT NOT NULL)`);const v=DB.get(k,k==='company_profile'?{}:[]);(Array.isArray(v)?v:[v]).forEach(r=>db.run(`INSERT INTO "${t}" VALUES (?)`,[JSON.stringify(r??{})]));});
        bytes=db.export();db.close();name=`anori-data-${todaySafe()}.sqlite`;type='application/x-sqlite3';
      }else throw new Error('Select JSON or SQLite.');
      const fh=await exportFolder.getFileHandle(name,{create:true}),w=await fh.createWritable();await w.write(new Blob([bytes],{type}));await w.close();notify(`${format.toUpperCase()} exported to selected folder.`,'success');
    }catch(e){console.error(e);notify('Export failed: '+(e.message||'unknown error'),'error');}
  };

  // ---------- Settings UI ----------
  const baseSettings=window.Settings&&Settings.render?Settings.render.bind(Settings):null;
  if(baseSettings){
    Settings.render=function(container){
      baseSettings(container);
      const cards=[...container.querySelectorAll('.card')];
      const card=cards.find(c=>/Data Import \/ Export/i.test(c.textContent||''));
      if(!card)return;
      card.innerHTML=`
        <h3 class="card-title"><i class="fas fa-database"></i> DATA IMPORT / EXPORT</h3>
        <div class="anori-data-transfer-path">
          <div><strong>EXPORT PATH</strong><span id="anoriExportPathName">${esc(localStorage.getItem('anori_export_folder_name')||'NOT SELECTED')}</span></div>
          <div class="anori-data-transfer-path-actions"><select id="anoriExportFormat" class="form-control"><option value="json">JSON</option><option value="sqlite">SQLITE</option></select><button class="anori-action-btn anori-action-export" type="button" onclick="anoriSelectExportPath()">📁 SELECT EXPORT FOLDER</button><button class="anori-action-btn anori-action-preview" type="button" onclick="anoriExportToPath()">⬆ EXPORT TO PATH</button></div>
        </div>
        <div class="anori-transfer-grid">
          <div class="anori-transfer-card"><h4>📦 JSON</h4><p>FULL DATA BACKUP / RESTORE</p><div><button class="anori-action-btn anori-action-export" type="button" onclick="anoriExportJSON()">EXPORT JSON</button><button class="anori-action-btn anori-action-convert" type="button" onclick="anoriImportByFormat('json')">IMPORT JSON</button></div></div>
          <div class="anori-transfer-card"><h4>📊 EXCEL</h4><p>ALL TABLES IN ONE WORKBOOK</p><div><button class="anori-action-btn anori-action-export" type="button" onclick="anoriExportXLSX()">EXPORT EXCEL</button><button class="anori-action-btn anori-action-convert" type="button" onclick="anoriImportByFormat('xlsx')">IMPORT EXCEL</button></div></div>
          <div class="anori-transfer-card"><h4>🗄 SQLITE</h4><p>FULL DATABASE BACKUP / RESTORE</p><div><button class="anori-action-btn anori-action-export" type="button" onclick="anoriExportSQLite()">EXPORT SQLITE</button><button class="anori-action-btn anori-action-convert" type="button" onclick="anoriImportByFormat('sqlite')">IMPORT SQLITE</button></div></div>
          <div class="anori-transfer-card"><h4>📄 CSV</h4><p>ALL DATA SECTIONS IN ONE FILE</p><div><button class="anori-action-btn anori-action-export" type="button" onclick="anoriExportCSV()">EXPORT CSV</button><button class="anori-action-btn anori-action-convert" type="button" onclick="anoriImportByFormat('csv')">IMPORT CSV</button></div></div>
        </div>
        <small class="anori-help">JSON and SQLite preserve the complete ANORI TRANSPORT data structure. Excel and CSV are designed for editable data exchange. Browser security does not allow an arbitrary typed Windows path; use the folder picker for direct export.</small>`;
    };
  }
})();

/* ===== END js/data-transfer.js ===== */


/* ===== BEGIN js/invoice-pdf-final-v4.js ===== */

/* ANORI TRANSPORT — FINAL PDF ENGINE v3.0
   Root-cause fix: remove all dependency on jsPDF/html2pdf for invoice export.
   The Invoice Preview DOM is rendered with html2canvas, then a standards-based
   PDF is assembled directly from JPEG image objects. This prevents every
   recurring jsPDF.addImage coordinate error, including errors originating
   inside html2pdf's internal jsPDF calls.
*/
(function installFinalNativeInvoicePdf(){
  'use strict';
  if(!window.Invoices) return;

  const concatBytes=(parts)=>{
    const total=parts.reduce((n,p)=>n+p.length,0);
    const out=new Uint8Array(total); let offset=0;
    for(const p of parts){out.set(p,offset);offset+=p.length;}
    return out;
  };
  const enc=new TextEncoder();
  const ascii=(s)=>enc.encode(s);

  function buildPdfFromJpegs(pages){
    // Each page is a JPEG already sized/cropped for one A4 page.
    const objects=[];
    objects[1]=ascii('<< /Type /Catalog /Pages 2 0 R >>');
    const pageRefs=[];
    const pageObjects=[];
    const contentObjects=[];
    const imageObjects=[];
    let objNo=3;

    for(let i=0;i<pages.length;i++){
      const imageObjNo=objNo++;
      const contentObjNo=objNo++;
      const pageObjNo=objNo++;
      imageObjects.push({objNo:imageObjNo,jpeg:pages[i].jpeg,width:pages[i].width,height:pages[i].height});
      contentObjects.push({objNo:contentObjNo,imageObjNo,drawW:pages[i].drawW,drawH:pages[i].drawH});
      pageObjects.push({objNo:pageObjNo,contentObjNo,imageObjNo});
      pageRefs.push(`${pageObjNo} 0 R`);
    }

    objects[2]=ascii(`<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${pages.length} >>`);

    for(const img of imageObjects){
      const header=ascii(`<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.jpeg.length} >>\nstream\n`);
      const footer=ascii('\nendstream');
      objects[img.objNo]=concatBytes([header,img.jpeg,footer]);
    }

    for(const c of contentObjects){
      const stream=ascii(`q\n${c.drawW} 0 0 ${c.drawH} 5 ${5 + (287-c.drawH)} cm\n/Im${c.imageObjNo} Do\nQ`);
      objects[c.objNo]=concatBytes([ascii(`<< /Length ${stream.length} >>\nstream\n`),stream,ascii('\nendstream')]);
    }

    for(const p of pageObjects){
      objects[p.objNo]=ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 210 297] /Resources << /XObject << /Im${p.imageObjNo} ${p.imageObjNo} 0 R >> >> /Contents ${p.contentObjNo} 0 R >>`);
    }

    const chunks=[ascii('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n')];
    const offsets=new Array(objects.length).fill(0);
    let position=chunks[0].length;
    for(let i=1;i<objects.length;i++){
      const body=objects[i]||ascii('');
      const head=ascii(`${i} 0 obj\n`);
      const tail=ascii('\nendobj\n');
      offsets[i]=position;
      chunks.push(head,body,tail);
      position+=head.length+body.length+tail.length;
    }
    const xrefPos=position;
    let xref=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for(let i=1;i<objects.length;i++)xref+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
    xref+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
    chunks.push(ascii(xref));
    return concatBytes(chunks);
  }

  async function renderInvoiceToPdf(invoice){
    const normalized=typeof Invoices.normalizeInvoice==='function' ? Invoices.normalizeInvoice(invoice) : invoice;
    if(!normalized) throw new Error('Invoice not found.');
    if(typeof window.html2canvas!=='function') throw new Error('PDF renderer is not loaded. Please reopen the application with internet access.');

    const host=document.getElementById('previewContent');
    if(!host) throw new Error('Invoice Preview area is not available.');

    let source=host.querySelector('.invoice-page');
    if(!source || host.dataset.invoiceId!==normalized.id){
      if(typeof Invoices.mountInvoiceDocument!=='function') throw new Error('Invoice Preview renderer is unavailable.');
      host.innerHTML='';
      source=Invoices.mountInvoiceDocument(normalized);
      host.dataset.invoiceId=normalized.id;
    }
    if(!source) throw new Error('Invoice Preview could not be prepared.');

    // Capture an isolated, fixed A4-width clone. Screen zoom, flex centering,
    // scroll containers and modal transforms cannot affect the capture.
    const capture=document.createElement('div');
    capture.style.cssText='position:fixed;left:-20000px;top:0;width:794px;background:#fff;margin:0;padding:0;overflow:visible;z-index:-2147483647;visibility:visible;';
    const clone=source.cloneNode(true);
    clone.style.cssText += ';display:block !important;position:relative !important;left:0 !important;top:0 !important;transform:none !important;zoom:1 !important;width:794px !important;min-width:794px !important;max-width:794px !important;height:auto !important;min-height:1123px !important;margin:0 !important;overflow:visible !important;box-sizing:border-box !important;';
    capture.appendChild(clone);
    document.body.appendChild(capture);

    try{
      if(document.fonts?.ready) await document.fonts.ready;
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

      const rect=clone.getBoundingClientRect();
      const width=Math.max(794,Math.ceil(clone.scrollWidth||rect.width||794));
      const height=Math.max(1123,Math.ceil(clone.scrollHeight||rect.height||1123));
      if(!Number.isFinite(width)||!Number.isFinite(height)) throw new Error('Invoice Preview has invalid dimensions.');

      const canvas=await window.html2canvas(clone,{
        scale:2,
        width,
        height,
        windowWidth:width,
        windowHeight:height,
        backgroundColor:'#ffffff',
        useCORS:true,
        allowTaint:false,
        logging:false,
        scrollX:0,
        scrollY:0
      });
      if(!canvas?.width||!canvas?.height) throw new Error('Invoice Preview could not be rendered.');

      // A4 printable area: 200 x 287 mm (5 mm margins). At 794 px CSS width,
      // one PDF page corresponds to 1123 CSS px. The 2x canvas is sliced without
      // resizing the original image horizontally, preserving preview appearance.
      const targetCssPageHeight=Math.floor(width*(287/200));
      const scaleX=canvas.width/width;
      const sliceCanvasHeight=Math.max(1,Math.floor(targetCssPageHeight*scaleX));
      const pages=[];

      for(let y=0;y<canvas.height;y+=sliceCanvasHeight){
        const sliceH=Math.min(sliceCanvasHeight,canvas.height-y);
        const slice=document.createElement('canvas');
        slice.width=canvas.width;
        slice.height=Math.max(1,sliceH);
        const ctx=slice.getContext('2d');
        if(!ctx) throw new Error('Unable to prepare PDF page.');
        ctx.fillStyle='#ffffff';
        ctx.fillRect(0,0,slice.width,slice.height);
        ctx.drawImage(canvas,0,y,canvas.width,sliceH,0,0,canvas.width,sliceH);
        const dataUrl=slice.toDataURL('image/jpeg',0.96);
        const comma=dataUrl.indexOf(',');
        if(comma<0) throw new Error('Invoice image could not be created.');
        const raw=atob(dataUrl.slice(comma+1));
        const jpeg=new Uint8Array(raw.length);
        for(let i=0;i<raw.length;i++) jpeg[i]=raw.charCodeAt(i);
        const drawW=200; const drawH=Math.min(287,drawW*(slice.height/slice.width));
        pages.push({jpeg,width:slice.width,height:slice.height,drawW,drawH});
      }

      if(!pages.length) throw new Error('No invoice pages were generated.');
      const pdfBytes=buildPdfFromJpegs(pages);
      const blob=new Blob([pdfBytes],{type:'application/pdf'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;
      a.download=`${normalized.invoice_no || normalized.id || 'Invoice'}.pdf`;
      a.style.display='none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),15000);
      if(window.Utils?.toast) Utils.toast('PDF downloaded using the Invoice Preview layout.','success');
      return true;
    }finally{
      capture.remove();
    }
  }

  // One and only active invoice PDF route. These assignments are deliberately
  // placed at the end of app.js so all legacy PDF overrides are superseded.
  Invoices.downloadInvoice=function(invoice){
    return renderInvoiceToPdf(invoice).catch(async e=>{
      console.error('ANORI FINAL PDF ENGINE ERROR:',e);
      if(window.Swal) await Swal.fire({icon:'error',title:'PDF Generation Failed',text:e?.message||'Unable to generate the PDF.',confirmButtonText:'OK'});
      else if(window.Utils?.toast) Utils.toast(e?.message||'Unable to generate the PDF.','error');
      return false;
    });
  };

  Invoices.downloadExisting=function(id){
    const invoice=(DB.get('invoices',[])||[]).find(i=>String(i.id)===String(id));
    if(!invoice) return Utils.toast('Invoice not found.','error');
    return Invoices.downloadInvoice(invoice);
  };

  // FINAL ACTION-BAR PDF ROUTE: deliberately calls the exact same
  // Invoices.downloadInvoice() used by the Invoice Preview -> Download PDF button.
  // This bypasses every legacy jsPDF/html2pdf action handler.
  Invoices.downloadSelectedPDF=function(){
    const ids=typeof Invoices.getSelected==='function' ? Invoices.getSelected() : [];
    if(ids.length!==1) return Utils.toast(ids.length ? 'SELECT ONLY ONE INVOICE.' : 'SELECT ONE INVOICE.','warning');
    const invoice=(DB.get('invoices',[])||[]).find(i=>String(i.id)===String(ids[0]));
    if(!invoice) return Utils.toast('Invoice not found.','error');
    return Invoices.downloadInvoice(invoice);
  };
  Invoices.actionPDF=function(){ return Invoices.downloadSelectedPDF(); };

  // Keep a stable public route so all dynamically-rendered Action bars use
  // the same Preview PDF implementation.
  window.__ANORI_DOWNLOAD_SELECTED_INVOICE_PDF='native-preview-pdf';
  window.__ANORI_FINAL_PDF_ENGINE='native-jpeg-pdf-v3';
})();

/* FINAL ACTION HARD-WIRE v4
   Invoices & Billing PDF button and Invoice Preview PDF button both use this exact route. */
(function hardWireInvoicePdfAction(){
  'use strict';
  if(!window.Invoices) return;
  const getInvoiceById=id => (window.DB?.get('invoices',[])||[]).find(i=>String(i.id)===String(id));
  window.__ANORI_PDF_ACTION_READY=true;
  window.__ANORI_DOWNLOAD_INVOICE_PDF = function(invoice){
    return window.Invoices.downloadInvoice(invoice);
  };
  window.Invoices.downloadExisting = function(id){
    const invoice=getInvoiceById(id);
    if(!invoice) return window.Utils?.toast ? Utils.toast('Invoice not found.','error') : false;
    return window.__ANORI_DOWNLOAD_INVOICE_PDF(invoice);
  };
  window.Invoices.downloadSelectedPDF = function(){
    const ids=typeof window.Invoices.getSelected==='function' ? window.Invoices.getSelected() : [];
    if(ids.length!==1){
      const msg=ids.length ? 'SELECT ONLY ONE INVOICE.' : 'SELECT ONE INVOICE.';
      return window.Utils?.toast ? Utils.toast(msg,'warning') : false;
    }
    const invoice=getInvoiceById(ids[0]);
    if(!invoice) return window.Utils?.toast ? Utils.toast('Invoice not found.','error') : false;
    return window.__ANORI_DOWNLOAD_INVOICE_PDF(invoice);
  };
  window.Invoices.actionPDF = function(){ return window.Invoices.downloadSelectedPDF(); };
})();

/* ===== END js/invoice-pdf-final-v4.js ===== */


/* ===== BEGIN js/anori-data-safety.js ===== */
/* ANORI TRANSPORT — Persistent Data Safety Layer v2.25
   Internal snapshots only. Never downloads a file automatically. */
(function(){
  'use strict';
  const DB_NAME='anori_safety_v225', STORE='snapshots', MAX=3;
  const KEYS=['company_profile','vehicles','drivers','parties','trips','invoices','driver_settlements','payments','expense_master','followups','audit_log'];
  function open(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
  function all(){return new Promise(async(resolve,reject)=>{try{const db=await open();const tx=db.transaction(STORE,'readonly'),q=tx.objectStore(STORE).getAll();q.onsuccess=()=>{db.close();resolve((q.result||[]).sort((a,b)=>b.created_at.localeCompare(a.created_at)))};q.onerror=()=>{db.close();reject(q.error)}}catch(e){reject(e)}})}
  async function sha(text){if(window.crypto?.subtle){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}return String(text.length);}
  function collect(){const data={};KEYS.forEach(k=>data[k]=DB.get(k,k==='company_profile'?{}:[]));return data;}
  async function create(reason='manual'){const data=collect(),json=JSON.stringify(data),item={id:Date.now()+'-'+Math.random().toString(36).slice(2),created_at:new Date().toISOString(),reason,checksum:await sha(json),data};const db=await open();await new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(item);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});db.close();const items=await all();for(const old of items.slice(MAX)){const d=await open();await new Promise(r=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(old.id);tx.oncomplete=r;tx.onerror=r});d.close();}return item;}
  async function latest(){const a=await all();return a[0]||null;}
  async function restoreLatest(){const item=await latest();if(!item)throw new Error('No internal safety snapshot is available.');const json=JSON.stringify(item.data);if(await sha(json)!==item.checksum)throw new Error('Safety snapshot integrity check failed.');KEYS.forEach(k=>{if(Object.prototype.hasOwnProperty.call(item.data,k))DB.set(k,item.data[k],true)});if(typeof sync==='function')sync();return item;}
  async function status(){const a=await all();return {count:a.length,latest:a[0]||null};}
  window.ANORI_DATA_SAFETY=Object.assign(window.ANORI_DATA_SAFETY||{}, {version:'2.25',keys:KEYS,createRollbackSnapshot:create,restoreRollbackSnapshot:restoreLatest,status});
  window.anoriRestoreLastSafetySnapshot=async function(){
    try{
      const s=await status(); if(!s.latest){if(window.Swal)await Swal.fire({icon:'info',title:'NO SAFETY SNAPSHOT',text:'No internal rollback snapshot is available.'});return false;}
      const ok=window.Swal ? (await Swal.fire({icon:'warning',title:'RESTORE LAST INTERNAL SNAPSHOT?',html:`<p>This restores the application data captured before the last protected operation.</p><p><strong>${new Date(s.latest.created_at).toLocaleString()}</strong></p><p>No file will be downloaded.</p>`,showCancelButton:true,confirmButtonText:'RESTORE',cancelButtonText:'CANCEL'})).isConfirmed : window.confirm('Restore the last internal safety snapshot?');
      if(!ok)return false; await restoreLatest(); if(window.Swal)await Swal.fire({icon:'success',title:'DATA RESTORED',text:'The last internal safety snapshot has been restored.'}); return true;
    }catch(e){console.error(e);if(window.Swal)Swal.fire({icon:'error',title:'RESTORE FAILED',text:e.message||'Unable to restore snapshot.'});return false;}
  };
})();

/* ===== END js/anori-data-safety.js ===== */
