// Data Structure definition
// Storage Key: 'protein_tracker_logs_v1' -> Array of { id, timestamp (ISO), dateString ('YYYY-MM-DD'), amount (number) }
// Storage Key: 'protein_tracker_finished_v1' -> Array of { dateString, totalAmount, logsCount, finishedAt }
// Storage Key: 'protein_tracker_target_v1' -> Daily Goal Target in grams

const LOCAL_LOGS_KEY = 'protein_tracker_logs_v1';
const LOCAL_FINISHED_KEY = 'protein_tracker_finished_v1';
const LOCAL_TARGET_KEY = 'protein_tracker_target_v1';

let activeLogs = [];
let finishedDays = [];
let dailyTarget = 160;
let chartInstance = null;
let activeChartType = 'bar';

// Initializer
window.addEventListener('DOMContentLoaded', () => {
    loadStoredData();
    updateCurrentDateHeader();
    renderDashboard();
    initChart();
    checkInputMode();
});

// Helper: Format Date strings
function getTodayDateString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function updateCurrentDateHeader() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const todayStr = new Date().toLocaleDateString('de-DE', options);
    const dateDisplay = document.getElementById('current-date-display');
    if (dateDisplay) {
        dateDisplay.innerText = todayStr;
    }
}

// Load all data from localStorage
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
    } catch (e) {
        console.error('Error loading localStorage:', e);
        activeLogs = [];
        finishedDays = [];
    }
}

function saveData() {
    try {
        localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(activeLogs));
        localStorage.setItem(LOCAL_FINISHED_KEY, JSON.stringify(finishedDays));
        localStorage.setItem(LOCAL_TARGET_KEY, dailyTarget.toString());
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

// On-screen Keypad logic
function keypadPress(digit) {
    const input = document.getElementById('protein-input');
    if (input.value === '0') {
        input.value = digit;
    } else {
        input.value += digit;
    }
}

function keypadClear() {
    document.getElementById('protein-input').value = '';
}

function keypadBackspace() {
    const input = document.getElementById('protein-input');
    input.value = input.value.slice(0, -1);
}

function quickAdd(amount) {
    const input = document.getElementById('protein-input');
    const currentVal = parseInt(input.value, 10) || 0;
    input.value = currentVal + amount;
}

function toggleKeypad() {
    const keypad = document.getElementById('calculator-keypad');
    const toggleText = document.getElementById('keypad-toggle-text');
    if (keypad.classList.contains('hidden')) {
        keypad.classList.remove('hidden');
        toggleText.innerText = 'Tastatur ausblenden';
    } else {
        keypad.classList.add('hidden');
        toggleText.innerText = 'Tastatur anzeigen';
    }
}

function checkInputMode() {
    const input = document.getElementById('protein-input');
    if (!input) return;
    // Desktop keyboard handling
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            submitProteinEntry();
        }
    });
}

// Submit protein entry
function submitProteinEntry() {
    const input = document.getElementById('protein-input');
    const amount = parseInt(input.value, 10);

    if (isNaN(amount) || amount <= 0) {
        return;
    }

    const now = new Date();
    const newEntry = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        timestamp: now.toISOString(),
        dateString: getTodayDateString(),
        amount: amount
    };

    activeLogs.unshift(newEntry); // Add to beginning
    saveData();
    input.value = '';

    renderDashboard();
    updateChart();
}

// Delete individual log entry
function deleteLogEntry(id) {
    activeLogs = activeLogs.filter(log => log.id !== id);
    saveData();
    renderDashboard();
    updateChart();
}

// Calculate today's active total
function getTodayTotal() {
    const todayStr = getTodayDateString();
    return activeLogs
        .filter(log => log.dateString === todayStr)
        .reduce((sum, log) => sum + log.amount, 0);
}

// Render Dashboard UI
function renderDashboard() {
    const todayTotal = getTodayTotal();
    const todayStr = getTodayDateString();
    const todayLogs = activeLogs.filter(log => log.dateString === todayStr);

    // Update main counter
    const todayTotalEl = document.getElementById('today-total');
    const targetDisplayEl = document.getElementById('target-display-text');
    if (todayTotalEl) todayTotalEl.innerText = todayTotal;
    if (targetDisplayEl) targetDisplayEl.innerText = dailyTarget;

    // Update Progress Ring
    const percent = Math.min(Math.round((todayTotal / dailyTarget) * 100), 100);
    const progressPercentEl = document.getElementById('progress-percent');
    if (progressPercentEl) progressPercentEl.innerText = `${percent}%`;
    
    const circle = document.getElementById('progress-circle');
    if (circle) circle.setAttribute('stroke-dasharray', `${percent}, 100`);

    // Update Logs Stream
    const container = document.getElementById('today-logs-container');
    const logCountEl = document.getElementById('log-count');
    if (logCountEl) logCountEl.innerText = `${todayLogs.length} Einträge`;

    if (container) {
        if (todayLogs.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    <i class="fa-solid fa-cookie-bite text-2xl mb-1 opacity-40"></i>
                    <p class="text-xs">Noch keine Proteine für heute eingetragen.</p>
                </div>
            `;
        } else {
            container.innerHTML = todayLogs.map(log => {
                const timeStr = new Date(log.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                return `
                    <div class="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs">
                                <i class="fa-solid fa-plus"></i>
                            </div>
                            <div>
                                <p class="text-sm font-bold text-white">+${log.amount}g Protein</p>
                                <p class="text-[10px] text-slate-400"><i class="fa-regular fa-clock mr-1"></i>${timeStr} Uhr</p>
                            </div>
                        </div>
                        <button onclick="deleteLogEntry('${log.id}')" class="text-slate-500 hover:text-rose-400 p-2 rounded-lg transition-colors" title="Eintrag löschen">
                            <i class="fa-solid fa-trash-can text-sm"></i>
                        </button>
                    </div>
                `;
            }).join('');
        }
    }

    renderStatsSummary();
}

// Finish Day Modal & Handlers
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

function confirmFinishDay() {
    const todayStr = getTodayDateString();
    const todayLogs = activeLogs.filter(log => log.dateString === todayStr);
    const total = todayLogs.reduce((sum, log) => sum + log.amount, 0);

    // Record finished day summary
    const finishedEntry = {
        dateString: todayStr,
        totalAmount: total,
        logsCount: todayLogs.length,
        finishedAt: new Date().toISOString()
    };

    // Remove existing finished entry for today if resetting again
    finishedDays = finishedDays.filter(day => day.dateString !== todayStr);
    finishedDays.unshift(finishedEntry);

    // Remove active logs for today (Reset to 0)
    activeLogs = activeLogs.filter(log => log.dateString !== todayStr);

    saveData();
    closeFinishModal();
    renderDashboard();
    updateChart();
}

// Statistics and Aggregations
function renderStatsSummary() {
    const historyList = document.getElementById('finished-days-list');

    // Render Finished Days History List
    if (historyList) {
        if (finishedDays.length === 0) {
            historyList.innerHTML = `
                <div class="text-center py-6 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    <p class="text-xs">Noch keine Tage abgeschlossen.</p>
                </div>
            `;
        } else {
            historyList.innerHTML = finishedDays.map(item => {
                const dateFormatted = new Date(item.dateString + 'T00:00:00').toLocaleDateString('de-DE', {
                    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
                });
                const targetMet = item.totalAmount >= dailyTarget;

                return `
                    <div class="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 rounded-lg ${targetMet ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'} flex items-center justify-center font-bold text-xs">
                                <i class="fa-solid ${targetMet ? 'fa-check' : 'fa-minus'}"></i>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-white">${dateFormatted}</p>
                                <p class="text-[10px] text-slate-400">${item.logsCount} Einträge</p>
                            </div>
                        </div>
                        <span class="text-sm font-black text-white">${item.totalAmount}g</span>
                    </div>
                `;
            }).join('');
        }
    }

    // Calculation Metrics
    const totals = finishedDays.map(d => d.totalAmount);
    const totalAllTime = totals.reduce((a, b) => a + b, 0) + getTodayTotal();
    const maxRecord = totals.length > 0 ? Math.max(...totals, getTodayTotal()) : getTodayTotal();
    
    // 7 day average
    const last7Days = finishedDays.slice(0, 7);
    const avg7 = last7Days.length > 0 ? Math.round(last7Days.reduce((a, b) => a + b.totalAmount, 0) / last7Days.length) : getTodayTotal();

    const avg7El = document.getElementById('avg-7-days');
    const maxRecordEl = document.getElementById('max-day-record');
    const totalAllTimeEl = document.getElementById('total-all-time');

    if (avg7El) avg7El.innerText = `${avg7} g`;
    if (maxRecordEl) maxRecordEl.innerText = `${maxRecord} g`;
    if (totalAllTimeEl) totalAllTimeEl.innerText = `${totalAllTime} g`;
}

// Chart.js Setup & Updates
function getAggregatedChartData() {
    // Aggregate both finished days and current active day entries
    const map = {};

    // Historical finished days
    finishedDays.forEach(d => {
        map[d.dateString] = (map[d.dateString] || 0) + d.totalAmount;
    });

    // Active logs today
    const todayStr = getTodayDateString();
    const todayActiveTotal = getTodayTotal();
    if (todayActiveTotal > 0 || !map[todayStr]) {
        map[todayStr] = todayActiveTotal;
    }

    // Sort dates ascending
    const dates = Object.keys(map).sort();
    // Take up to last 14 days
    const recentDates = dates.slice(-14);

    const labels = recentDates.map(d => {
        const dateObj = new Date(d + 'T00:00:00');
        return dateObj.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    });

    const data = recentDates.map(d => map[d]);

    return { labels, data };
}

function initChart() {
    const canvas = document.getElementById('proteinChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { labels, data } = getAggregatedChartData();

    chartInstance = new Chart(ctx, {
        type: activeChartType,
        data: {
            labels: labels,
            datasets: [{
                label: 'Protein (g)',
                data: data,
                backgroundColor: 'rgba(99, 102, 241, 0.4)',
                borderColor: '#6366f1',
                borderWidth: 2,
                borderRadius: 8,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#818cf8',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0f172a',
                    titleColor: '#f8fafc',
                    bodyColor: '#818cf8',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: (context) => `${context.parsed.y} g Protein`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: '#94a3b8', font: { size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(51, 65, 85, 0.4)', drawBorder: false },
                    ticks: { color: '#94a3b8', font: { size: 10 } },
                    beginAtZero: true
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
    chartInstance.update();
}

function setChartType(type) {
    activeChartType = type;
    const btnBar = document.getElementById('chart-btn-bar');
    const btnLine = document.getElementById('chart-btn-line');
    if (btnBar) btnBar.className = type === 'bar' ? 'px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-600 text-white' : 'px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white';
    if (btnLine) btnLine.className = type === 'line' ? 'px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-600 text-white' : 'px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white';
    
    if (chartInstance) {
        chartInstance.destroy();
        initChart();
    }
}

// View Navigation
function switchTab(tab) {
    const trackerTab = document.getElementById('view-tracker');
    const statsTab = document.getElementById('view-stats');
    const btnTracker = document.getElementById('nav-tracker');
    const btnStats = document.getElementById('nav-stats');

    if (tab === 'tracker') {
        trackerTab.classList.remove('hidden');
        statsTab.classList.add('hidden');
        btnTracker.className = 'flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 bg-brand-600 text-white shadow-sm';
        btnStats.className = 'flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all duration-200';
    } else {
        trackerTab.classList.add('hidden');
        statsTab.classList.remove('hidden');
        btnStats.className = 'flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 bg-brand-600 text-white shadow-sm';
        btnTracker.className = 'flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all duration-200';
        updateChart();
    }
}

// Target Setting Prompt
function openTargetPrompt() {
    const newTarget = prompt('Neues tägliches Proteinziel (in Grams) eingeben:', dailyTarget);
    if (newTarget !== null) {
        const parsed = parseInt(newTarget, 10);
        if (!isNaN(parsed) && parsed > 0) {
            dailyTarget = parsed;
            saveData();
            renderDashboard();
        }
    }
}

// Clear All History Confirmation
function confirmClearHistory() {
    if (confirm('Möchtest du wirklich die gesamte Historie unwiderruflich löschen?')) {
        finishedDays = [];
        saveData();
        renderDashboard();
        updateChart();
    }
}
