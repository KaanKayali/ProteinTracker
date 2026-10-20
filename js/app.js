// Local storage keys
const LOCAL_LOGS_KEY = 'protein_tracker_logs_v1';
const LOCAL_FINISHED_KEY = 'protein_tracker_finished_v1';
const LOCAL_TARGET_KEY = 'protein_tracker_target_v1';
const LOCAL_THEME_KEY = 'protein_tracker_theme_v1';

// App state
let activeLogs = [];
let finishedDays = [];
let dailyTarget = 160;
let chartInstance = null;
let activeChartType = 'bar';
let currentTheme = 'dark'; // 'dark' or 'light'
let currentActiveTab = 'tracker'; // 'tracker' or 'profile'

// Theme accent colors
const BRAND_MAIN = '#9a80b2';
const BRAND_HOVER = '#866b9f';
const BRAND_LIGHT = '#b096c4';

// Boot up app once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    loadStoredData();
    applyThemeUI();
    updateCurrentDateHeader();
    renderDashboard();
    initChart();
    checkInputMode();
});

// Format date to YYYY-MM-DD
function getTodayDateString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Display formatted date string in header
function updateCurrentDateHeader() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const todayStr = new Date().toLocaleDateString('de-DE', options);
    const dateDisplay = document.getElementById('current-date-display');
    if (dateDisplay) {
        dateDisplay.innerText = todayStr;
    }
}

// Read saved state from browser storage
function loadStoredData() {
    try {
        const logsRaw = localStorage.getItem(LOCAL_LOGS_KEY);
        activeLogs = logsRaw ? JSON.parse(logsRaw) : [];

        const finishedRaw = localStorage.getItem(LOCAL_FINISHED_KEY);
        finishedDays = finishedRaw ? JSON.parse(finishedRaw) : [];

        const targetRaw = localStorage.getItem(LOCAL_TARGET_KEY);
        if (targetRaw) {
            dailyTarget = parseInt(targetRaw, 10) || 160;
        }

        const storedTheme = localStorage.getItem(LOCAL_THEME_KEY);
        if (storedTheme === 'light' || storedTheme === 'dark') {
            currentTheme = storedTheme;
        } else {
            currentTheme = 'dark';
        }

        // Clean up legacy key if present
        localStorage.removeItem('protein_tracker_active_date_v1');
    } catch (err) {
        console.error('Failed to load local storage data:', err);
        activeLogs = [];
        finishedDays = [];
        currentTheme = 'dark';
    }
}

// Persist state to browser storage
function saveData() {
    try {
        localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(activeLogs));
        localStorage.setItem(LOCAL_FINISHED_KEY, JSON.stringify(finishedDays));
        localStorage.setItem(LOCAL_TARGET_KEY, dailyTarget.toString());
        localStorage.setItem(LOCAL_THEME_KEY, currentTheme);
    } catch (err) {
        console.error('Failed to save to local storage:', err);
    }
}

// Theme toggling (Dark Mode vs Light Mode with light-gray styling)
function setAppTheme(theme) {
    currentTheme = (theme === 'light') ? 'light' : 'dark';
    saveData();
    applyThemeUI();
    updateChartTheme();
}

function applyThemeUI() {
    const html = document.documentElement;
    const body = document.body;
    const header = document.querySelector('header');
    const bottomNav = document.querySelector('nav');
    const btnDark = document.getElementById('theme-btn-dark');
    const btnLight = document.getElementById('theme-btn-light');
    const desktopNavContainer = document.getElementById('nav-desktop-container');
    const chartTypeContainer = document.getElementById('chart-type-container');

    if (currentTheme === 'light') {
        html.classList.remove('dark');
        body.classList.remove('bg-dark-bg', 'text-slate-100');
        body.classList.add('bg-light-bg', 'text-light-text');

        if (header) {
            header.classList.remove('bg-dark-card/90', 'border-dark-border');
            header.classList.add('bg-light-card/90', 'border-light-border');
        }

        if (bottomNav) {
            bottomNav.classList.remove('bg-dark-card/95', 'border-dark-border');
            bottomNav.classList.add('bg-light-card/95', 'border-light-border');
        }

        if (desktopNavContainer) {
            desktopNavContainer.classList.remove('bg-dark-bg', 'border-dark-border');
            desktopNavContainer.classList.add('bg-light-cardAlt', 'border-light-border');
        }

        if (chartTypeContainer) {
            chartTypeContainer.classList.remove('bg-dark-bg', 'border-dark-border');
            chartTypeContainer.classList.add('bg-light-cardAlt', 'border-light-border');
        }

        // Update cards and inputs dynamically for light mode
        document.querySelectorAll('.bg-dark-card').forEach(el => {
            el.classList.replace('bg-dark-card', 'bg-light-card');
            el.classList.replace('border-dark-border', 'border-light-border');
        });
        document.querySelectorAll('.bg-dark-cardAlt').forEach(el => {
            el.classList.replace('bg-dark-cardAlt', 'bg-light-cardAlt');
            el.classList.replace('border-dark-border', 'border-light-border');
        });
        document.querySelectorAll('.bg-dark-input').forEach(el => {
            el.classList.replace('bg-dark-input', 'bg-light-input');
            el.classList.replace('border-dark-border', 'border-light-border');
            el.classList.add('text-light-text');
        });
        document.querySelectorAll('.border-dark-border').forEach(el => {
            el.classList.replace('border-dark-border', 'border-light-border');
        });
        document.querySelectorAll('.text-dark-textMuted').forEach(el => {
            el.classList.replace('text-dark-textMuted', 'text-light-textMuted');
        });

        const circleBg = document.getElementById('progress-circle-bg');
        if (circleBg) {
            circleBg.setAttribute('class', 'text-slate-300');
        }

        // Theme toggle button states
        if (btnLight) {
            btnLight.className = 'flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-brand-500 bg-brand-500/20 text-brand-700 text-xs font-bold transition-all shadow-none';
        }
        if (btnDark) {
            btnDark.className = 'flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-light-border bg-light-cardAlt text-slate-600 hover:text-slate-900 text-xs font-bold transition-all shadow-none';
        }
    } else {
        html.classList.add('dark');
        body.classList.remove('bg-light-bg', 'text-light-text');
        body.classList.add('bg-dark-bg', 'text-slate-100');

        if (header) {
            header.classList.remove('bg-light-card/90', 'border-light-border');
            header.classList.add('bg-dark-card/90', 'border-dark-border');
        }

        if (bottomNav) {
            bottomNav.classList.remove('bg-light-card/95', 'border-light-border');
            bottomNav.classList.add('bg-dark-card/95', 'border-dark-border');
        }

        if (desktopNavContainer) {
            desktopNavContainer.classList.remove('bg-light-cardAlt', 'border-light-border');
            desktopNavContainer.classList.add('bg-dark-bg', 'border-dark-border');
        }

        if (chartTypeContainer) {
            chartTypeContainer.classList.remove('bg-light-cardAlt', 'border-light-border');
            chartTypeContainer.classList.add('bg-dark-bg', 'border-dark-border');
        }

        // Restore dark neutral gray classes
        document.querySelectorAll('.bg-light-card').forEach(el => {
            el.classList.replace('bg-light-card', 'bg-dark-card');
            el.classList.replace('border-light-border', 'border-dark-border');
        });
        document.querySelectorAll('.bg-light-cardAlt').forEach(el => {
            el.classList.replace('bg-light-cardAlt', 'bg-dark-cardAlt');
            el.classList.replace('border-light-border', 'border-dark-border');
        });
        document.querySelectorAll('.bg-light-input').forEach(el => {
            el.classList.replace('bg-light-input', 'bg-dark-input');
            el.classList.replace('border-light-border', 'border-dark-border');
            el.classList.remove('text-light-text');
        });
        document.querySelectorAll('.border-light-border').forEach(el => {
            el.classList.replace('border-light-border', 'border-dark-border');
        });
        document.querySelectorAll('.text-light-textMuted').forEach(el => {
            el.classList.replace('text-light-textMuted', 'text-dark-textMuted');
        });

        const circleBg = document.getElementById('progress-circle-bg');
        if (circleBg) {
            circleBg.setAttribute('class', 'text-dark-cardAlt');
        }

        // Theme toggle button states
        if (btnDark) {
            btnDark.className = 'flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-brand-500 bg-brand-500/20 text-white text-xs font-bold transition-all shadow-none';
        }
        if (btnLight) {
            btnLight.className = 'flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dark-border bg-dark-cardAlt text-dark-textMuted hover:text-white text-xs font-bold transition-all shadow-none';
        }
    }

    // Refresh navigation tab and chart switcher buttons styling
    updateTabNavButtons();
    updateChartTypeButtons();
    renderDashboard();
}

// Numeric keypad handlers
function keypadPress(digit) {
    const input = document.getElementById('protein-input');
    if (!input) return;
    if (input.value === '0') {
        input.value = digit;
    } else {
        input.value += digit;
    }
}

function keypadClear() {
    const input = document.getElementById('protein-input');
    if (input) input.value = '';
}

function keypadBackspace() {
    const input = document.getElementById('protein-input');
    if (input) input.value = input.value.slice(0, -1);
}

// Quick preset increments (+10, +20, +25, etc.)
function quickAdd(amount) {
    const input = document.getElementById('protein-input');
    if (!input) return;
    const currentVal = parseInt(input.value, 10) || 0;
    input.value = currentVal + amount;
}

// Toggle keypad visibility on small screens
function toggleKeypad() {
    const keypad = document.getElementById('calculator-keypad');
    const toggleText = document.getElementById('keypad-toggle-text');
    if (!keypad) return;
    if (keypad.classList.contains('hidden')) {
        keypad.classList.remove('hidden');
        if (toggleText) toggleText.innerText = 'Tastatur ausblenden';
    } else {
        keypad.classList.add('hidden');
        if (toggleText) toggleText.innerText = 'Tastatur anzeigen';
    }
}

// Desktop & mobile keyboard handling: allow direct typing and Enter key submission
function checkInputMode() {
    const input = document.getElementById('protein-input');
    if (!input) return;

    // Ensure field is not read-only so laptop and phone keyboards can type freely
    input.removeAttribute('readonly');

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitProteinEntry();
        }
    });
}

// Add new entry
function submitProteinEntry() {
    const input = document.getElementById('protein-input');
    if (!input) return;
    const amount = parseInt(input.value, 10);

    if (isNaN(amount) || amount <= 0) {
        return;
    }

    const todayStr = getTodayDateString();
    const now = new Date();
    const newEntry = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        timestamp: now.toISOString(),
        dateString: todayStr,
        amount: amount
    };

    activeLogs.unshift(newEntry);
    saveData();
    input.value = '';

    renderDashboard();
    updateChart();
}

// Remove an entry by ID
function deleteLogEntry(id) {
    activeLogs = activeLogs.filter(log => log.id !== id);
    saveData();
    renderDashboard();
    updateChart();
}

// Calculate sum of logs for a finished day entry
function getFinishedDayAmount(dayItem) {
    if (!dayItem) return 0;
    if (Array.isArray(dayItem.logs) && dayItem.logs.length > 0) {
        return dayItem.logs.reduce((sum, log) => sum + (Number(log.amount) || 0), 0);
    }
    return Number(dayItem.totalAmount) || 0;
}

// Sum of grams currently active
function getTodayTotal() {
    return activeLogs.reduce((sum, log) => sum + log.amount, 0);
}

// Re-render UI elements
function renderDashboard() {
    const todayTotal = getTodayTotal();

    // Summary totals and target
    const todayTotalEl = document.getElementById('today-total');
    const targetDisplayEl = document.getElementById('target-display-text');
    const targetInputEl = document.getElementById('target-modal-input');

    if (todayTotalEl) todayTotalEl.innerText = todayTotal;
    if (targetDisplayEl) targetDisplayEl.innerText = dailyTarget;
    if (targetInputEl) targetInputEl.value = dailyTarget;

    // Radial progress ring calculation
    const percent = Math.min(Math.round((todayTotal / dailyTarget) * 100), 100);
    const progressPercentEl = document.getElementById('progress-percent');
    if (progressPercentEl) progressPercentEl.innerText = `${percent}%`;
    
    const circle = document.getElementById('progress-circle');
    if (circle) circle.setAttribute('stroke-dasharray', `${percent}, 100`);

    // Log list container
    const container = document.getElementById('today-logs-container');
    const logCountEl = document.getElementById('log-count');
    if (logCountEl) logCountEl.innerText = `${activeLogs.length} ${activeLogs.length === 1 ? 'Eintrag' : 'Einträge'}`;

    if (container) {
        if (activeLogs.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-dark-textMuted rounded-2xl bg-dark-cardAlt/40">
                    <i class="fa-solid fa-cookie-bite text-3xl mb-1.5 opacity-40"></i>
                    <p class="text-sm font-medium">Noch keine Proteine eingetragen.</p>
                </div>
            `;
        } else {
            const itemBg = currentTheme === 'light' ? 'bg-light-cardAlt' : 'bg-dark-cardAlt';
            const textClass = currentTheme === 'light' ? 'text-light-text' : 'text-white';
            const mutedClass = currentTheme === 'light' ? 'text-light-textMuted' : 'text-dark-textMuted';

            container.innerHTML = activeLogs.map(log => {
                const timeStr = new Date(log.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                return `
                    <div class="flex items-center justify-between p-3.5 ${itemBg} rounded-2xl transition-all shadow-none">
                        <div class="flex items-center space-x-3.5">
                            <div class="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center font-black text-sm flex-shrink-0">
                                <i class="fa-solid fa-plus text-sm"></i>
                            </div>
                            <div>
                                <p class="text-base sm:text-lg font-black ${textClass}">+${log.amount}g Protein</p>
                                <p class="text-xs sm:text-sm ${mutedClass}"><i class="fa-regular fa-clock mr-1"></i>${timeStr} Uhr</p>
                            </div>
                        </div>
                        <button onclick="deleteLogEntry('${log.id}')" class="text-dark-textMuted hover:text-rose-400 p-2.5 rounded-xl transition-colors shadow-none" title="Eintrag löschen">
                            <i class="fa-solid fa-trash-can text-base"></i>
                        </button>
                    </div>
                `;
            }).join('');
        }
    }

    renderStatsSummary();
}

// Confirmation modal for closing out the day
function openFinishModal() {
    const todayTotal = getTodayTotal();
    const modalAmount = document.getElementById('modal-protein-amount');
    if (modalAmount) modalAmount.innerText = `${todayTotal}g`;
    const finishModal = document.getElementById('finish-modal');
    if (finishModal) finishModal.classList.remove('hidden');
}

function closeFinishModal() {
    const finishModal = document.getElementById('finish-modal');
    if (finishModal) finishModal.classList.add('hidden');
}

// Confirm day completion: records completion timestamp (e.g. 17. Oktober 00:02)
function confirmFinishDay() {
    const finishDate = new Date();
    const yyyy = finishDate.getFullYear();
    const mm = String(finishDate.getMonth() + 1).padStart(2, '0');
    const dd = String(finishDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const finishedEntry = {
        id: 'finish_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        dateString: dateStr,
        finishedAt: finishDate.toISOString(),
        logs: activeLogs.map(l => ({ id: l.id, timestamp: l.timestamp, amount: l.amount }))
    };

    // Prepend new completion entry (allows multiple completions per day)
    finishedDays.unshift(finishedEntry);

    // Clear active logs for next session
    activeLogs = [];

    saveData();
    closeFinishModal();
    renderDashboard();
    updateChart();
}

// Summary cards metrics
function renderStatsSummary() {
    const finishedTotals = finishedDays.map(d => getFinishedDayAmount(d));
    const totalAllTime = finishedTotals.reduce((a, b) => a + b, 0) + getTodayTotal();
    const maxRecord = finishedTotals.length > 0 ? Math.max(...finishedTotals) : 0;
    
    // Average across finished sessions
    const avgFinished = finishedTotals.length > 0 ? Math.round(finishedTotals.reduce((a, b) => a + b, 0) / finishedTotals.length) : 0;

    const avgEl = document.getElementById('avg-7-days');
    const maxRecordEl = document.getElementById('max-day-record');
    const totalAllTimeEl = document.getElementById('total-all-time');

    if (avgEl) avgEl.innerText = `${avgFinished} g`;
    if (maxRecordEl) maxRecordEl.innerText = `${maxRecord} g`;
    if (totalAllTimeEl) totalAllTimeEl.innerText = `${totalAllTime} g`;
}

// Helper: Parse finish date & time with backwards compatibility
function parseFinishedDateTime(item) {
    if (item.finishedAt) {
        const d = new Date(item.finishedAt);
        if (!isNaN(d.getTime())) {
            const dateLine = d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
            const timeLine = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
            return {
                sortTime: d.getTime(),
                dateLine: dateLine,
                timeLine: timeLine,
                fullLabel: `${dateLine} ${timeLine}`
            };
        }
    }

    // Legacy fallback without finishedAt timestamp: default to 00:00
    if (item.dateString) {
        const d = new Date(item.dateString + 'T00:00:00');
        const dateLine = !isNaN(d.getTime())
            ? d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
            : item.dateString;
        return {
            sortTime: !isNaN(d.getTime()) ? d.getTime() : 0,
            dateLine: dateLine,
            timeLine: '00:00',
            fullLabel: `${dateLine} 00:00`
        };
    }

    return {
        sortTime: 0,
        dateLine: '--',
        timeLine: '00:00',
        fullLabel: '-- 00:00'
    };
}

// Prepare dataset for Chart.js across all finished days
function getAggregatedChartData() {
    const sorted = [...finishedDays].sort((a, b) => {
        const timeA = parseFinishedDateTime(a).sortTime;
        const timeB = parseFinishedDateTime(b).sortTime;
        return timeA - timeB;
    });

    const labels = sorted.map(item => {
        const parsed = parseFinishedDateTime(item);
        return [parsed.dateLine, parsed.timeLine];
    });

    const data = sorted.map(item => getFinishedDayAmount(item));

    return { labels, data };
}

function initChart() {
    const canvas = document.getElementById('proteinChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { labels, data } = getAggregatedChartData();

    const isLight = (currentTheme === 'light');
    const tickColor = isLight ? '#334155' : '#949ba4';
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)';

    chartInstance = new Chart(ctx, {
        type: activeChartType,
        data: {
            labels: labels,
            datasets: [{
                label: 'Protein (g)',
                data: data,
                backgroundColor: 'rgba(154, 128, 178, 0.45)',
                borderColor: BRAND_MAIN,
                borderWidth: 2,
                borderRadius: 8,
                tension: 0.25,
                fill: true,
                pointBackgroundColor: BRAND_LIGHT,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            // Instant render without animation per user specification
            animation: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isLight ? '#edf0f5' : '#181a1f',
                    titleColor: isLight ? '#0f172a' : '#f8fafc',
                    bodyColor: isLight ? '#715689' : '#ded4e7',
                    borderColor: isLight ? '#c4cdd8' : '#2a2e35',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        title: (context) => {
                            if (!context || !context[0]) return '';
                            const rawLabel = context[0].label;
                            if (Array.isArray(rawLabel)) {
                                return rawLabel.join(' • ');
                            }
                            return rawLabel;
                        },
                        label: (context) => `${context.parsed.y} g Protein`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: {
                        color: tickColor,
                        font: { size: 12, family: '"Plus Jakarta Sans", system-ui, sans-serif', weight: '600' },
                        align: 'center',
                        maxRotation: 0,
                        minRotation: 0
                    }
                },
                y: {
                    grid: { color: gridColor, drawBorder: false },
                    ticks: {
                        color: tickColor,
                        font: { size: 12, family: '"Plus Jakarta Sans", system-ui, sans-serif', weight: '600' },
                        beginAtZero: true
                    }
                }
            }
        }
    });
}

function updateChart() {
    if (!chartInstance) return;
    const { labels, data } = getAggregatedChartData();
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = data;
    chartInstance.update('none'); // Update immediately without animation
}

function updateChartTheme() {
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
    initChart();
}

function setChartType(type) {
    activeChartType = type;
    updateChartTypeButtons();
    
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
        initChart();
    }
}

function updateChartTypeButtons() {
    const btnBar = document.getElementById('chart-btn-bar');
    const btnLine = document.getElementById('chart-btn-line');
    const isLight = (currentTheme === 'light');
    const inactiveText = isLight ? 'text-slate-600 hover:text-slate-900' : 'text-dark-textMuted hover:text-white';

    if (btnBar) {
        btnBar.className = activeChartType === 'bar'
            ? 'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-brand-600 text-white shadow-none'
            : `px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold ${inactiveText} transition-all shadow-none`;
    }
    if (btnLine) {
        btnLine.className = activeChartType === 'line'
            ? 'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-brand-600 text-white shadow-none'
            : `px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold ${inactiveText} transition-all shadow-none`;
    }
}

// Navigation switcher (Tracking vs Profile/Settings) with mobile bottom bar & desktop header
function switchTab(tab) {
    currentActiveTab = tab;
    const trackerTab = document.getElementById('view-tracker');
    const profileTab = document.getElementById('view-profile');

    if (tab === 'tracker') {
        trackerTab.classList.remove('hidden');
        profileTab.classList.add('hidden');
    } else {
        trackerTab.classList.add('hidden');
        profileTab.classList.remove('hidden');
        renderStatsSummary();
        updateChart();
    }

    updateTabNavButtons();
}

function updateTabNavButtons() {
    const desktopTracker = document.getElementById('nav-desktop-tracker');
    const desktopProfile = document.getElementById('nav-desktop-profile');
    const mobileTracker = document.getElementById('nav-mobile-tracker');
    const mobileProfile = document.getElementById('nav-mobile-profile');

    const isLight = (currentTheme === 'light');
    const inactiveTextClass = isLight ? 'text-slate-600 hover:text-slate-900' : 'text-dark-textMuted hover:text-white';

    if (currentActiveTab === 'tracker') {
        if (desktopTracker) {
            desktopTracker.className = 'flex items-center space-x-2 px-4 py-2 rounded-xl text-sm sm:text-base font-bold transition-all duration-200 bg-brand-600 text-white shadow-none';
        }
        if (desktopProfile) {
            desktopProfile.className = `flex items-center space-x-2 px-4 py-2 rounded-xl text-sm sm:text-base font-bold ${inactiveTextClass} transition-all duration-200 shadow-none`;
        }

        if (mobileTracker) {
            mobileTracker.className = 'flex flex-col items-center justify-center py-1 px-4 text-brand-500 transition-colors shadow-none';
            mobileTracker.querySelector('span').className = 'text-xs sm:text-sm font-bold';
        }
        if (mobileProfile) {
            mobileProfile.className = `flex flex-col items-center justify-center py-1 px-4 ${inactiveTextClass} transition-colors shadow-none`;
            mobileProfile.querySelector('span').className = 'text-xs sm:text-sm font-semibold';
        }
    } else {
        if (desktopTracker) {
            desktopTracker.className = `flex items-center space-x-2 px-4 py-2 rounded-xl text-sm sm:text-base font-bold ${inactiveTextClass} transition-all duration-200 shadow-none`;
        }
        if (desktopProfile) {
            desktopProfile.className = 'flex items-center space-x-2 px-4 py-2 rounded-xl text-sm sm:text-base font-bold transition-all duration-200 bg-brand-600 text-white shadow-none';
        }

        if (mobileTracker) {
            mobileTracker.className = `flex flex-col items-center justify-center py-1 px-4 ${inactiveTextClass} transition-colors shadow-none`;
            mobileTracker.querySelector('span').className = 'text-xs sm:text-sm font-medium';
        }
        if (mobileProfile) {
            mobileProfile.className = 'flex flex-col items-center justify-center py-1 px-4 text-brand-500 transition-colors shadow-none';
            mobileProfile.querySelector('span').className = 'text-xs sm:text-sm font-bold';
        }
    }
}

// Daily target update handler
function updateDailyTarget(val) {
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
        dailyTarget = parsed;
        saveData();
        renderDashboard();
        return true;
    }
    return false;
}

function handleTargetFormSubmit(event) {
    event.preventDefault();
    const input = document.getElementById('target-modal-input');
    if (!input) return;
    if (updateDailyTarget(input.value)) {
        alert('Tagesziel erfolgreich gespeichert!');
    } else {
        alert('Bitte gib eine gültige Zahl größer als 0 ein.');
    }
}

// Export data backup to a JSON file
function exportDataBackup() {
    const backupData = {
        version: '1.2.0',
        exportedAt: new Date().toISOString(),
        dailyTarget: dailyTarget,
        currentTheme: currentTheme,
        activeLogs: activeLogs,
        finishedDays: finishedDays
    };

    const jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateFormatted = getTodayDateString();
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `proteintracker-backup-${dateFormatted}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// Import data backup from JSON file
function triggerImportFileInput() {
    const fileInput = document.getElementById('import-file-input');
    if (fileInput) {
        fileInput.value = '';
        fileInput.click();
    }
}

function handleImportFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            if (!data || (typeof data !== 'object')) {
                throw new Error('Ungültiges Backup-Format');
            }

            if (confirm('Durch den Import werden diese Daten mit deinen bestehenden Daten zusammengeführt. Fortfahren?')) {
                if (typeof data.dailyTarget === 'number' && data.dailyTarget > 0) {
                    dailyTarget = data.dailyTarget;
                }
                if (data.currentTheme === 'light' || data.currentTheme === 'dark') {
                    currentTheme = data.currentTheme;
                    applyThemeUI();
                }

                if (Array.isArray(data.finishedDays)) {
                    data.finishedDays.forEach(incoming => {
                        if (!incoming) return;
                        const incomingFinishedAt = incoming.finishedAt || (incoming.dateString ? incoming.dateString + 'T00:00:00' : null);
                        const alreadyExists = finishedDays.some(f => {
                            if (incoming.id && f.id && incoming.id === f.id) return true;
                            if (incomingFinishedAt && f.finishedAt && incomingFinishedAt === f.finishedAt) return true;
                            return false;
                        });

                        if (!alreadyExists) {
                            finishedDays.push({
                                id: incoming.id || ('finish_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),
                                dateString: incoming.dateString || getTodayDateString(),
                                finishedAt: incomingFinishedAt || new Date().toISOString(),
                                logs: Array.isArray(incoming.logs) ? incoming.logs : []
                            });
                        }
                    });

                    finishedDays.sort((a, b) => {
                        const timeA = parseFinishedDateTime(a).sortTime;
                        const timeB = parseFinishedDateTime(b).sortTime;
                        return timeB - timeA;
                    });
                }

                if (Array.isArray(data.activeLogs)) {
                    const existingLogIds = new Set(activeLogs.map(l => l.id));
                    data.activeLogs.forEach(log => {
                        if (log && log.id && !existingLogIds.has(log.id)) {
                            activeLogs.push(log);
                        }
                    });
                }

                saveData();
                renderDashboard();
                updateChart();
                alert('Backup erfolgreich importiert!');
            }
        } catch (err) {
            console.error('Import error:', err);
            alert('Fehler beim Lesen der Backup-Datei.');
        }
    };
    reader.readAsText(file);
}

// Delete history with prompt
function confirmClearHistory() {
    if (confirm('Möchtest du wirklich alle Verlaufsdaten unwiderruflich löschen?')) {
        finishedDays = [];
        activeLogs = [];
        saveData();
        renderDashboard();
        updateChart();
        alert('Alle Verlaufsdaten wurden gelöscht.');
    }
}
