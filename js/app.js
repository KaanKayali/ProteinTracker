// Local storage keys
const LOCAL_LOGS_KEY = 'protein_tracker_logs_v1';
const LOCAL_FINISHED_KEY = 'protein_tracker_finished_v1';
const LOCAL_TARGET_KEY = 'protein_tracker_target_v1';

// App state
let activeLogs = [];
let finishedDays = [];
let dailyTarget = 160;
let chartInstance = null;
let activeChartType = 'bar';

// Theme accent colors
const BRAND_MAIN = '#9a80b2';
const BRAND_HOVER = '#866b9f';
const BRAND_LIGHT = '#b096c4';

// Boot up app once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    loadStoredData();
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

        // Clean up legacy key if present
        localStorage.removeItem('protein_tracker_active_date_v1');
    } catch (err) {
        console.error('Failed to load local storage data:', err);
        activeLogs = [];
        finishedDays = [];
    }
}

// Persist state to browser storage
function saveData() {
    try {
        localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(activeLogs));
        localStorage.setItem(LOCAL_FINISHED_KEY, JSON.stringify(finishedDays));
        localStorage.setItem(LOCAL_TARGET_KEY, dailyTarget.toString());
    } catch (err) {
        console.error('Failed to save to local storage:', err);
    }
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

// Quick preset increments (+10, +25, etc.)
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
        if (toggleText) toggleText.innerText = 'Hide Keypad';
    } else {
        keypad.classList.add('hidden');
        if (toggleText) toggleText.innerText = 'Show Keypad';
    }
}

// Allow pressing Enter key to submit
function checkInputMode() {
    const input = document.getElementById('protein-input');
    if (!input) return;
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
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
    // Backward compatibility for earlier records
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

    if (todayTotalEl) todayTotalEl.innerText = todayTotal;
    if (targetDisplayEl) targetDisplayEl.innerText = dailyTarget;

    // Radial progress ring calculation
    const percent = Math.min(Math.round((todayTotal / dailyTarget) * 100), 100);
    const progressPercentEl = document.getElementById('progress-percent');
    if (progressPercentEl) progressPercentEl.innerText = `${percent}%`;
    
    const circle = document.getElementById('progress-circle');
    if (circle) circle.setAttribute('stroke-dasharray', `${percent}, 100`);

    // Log list container
    const container = document.getElementById('today-logs-container');
    const logCountEl = document.getElementById('log-count');
    if (logCountEl) logCountEl.innerText = `${activeLogs.length} ${activeLogs.length === 1 ? 'Entry' : 'Entries'}`;

    if (container) {
        if (activeLogs.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    <i class="fa-solid fa-cookie-bite text-2xl mb-1 opacity-40"></i>
                    <p class="text-xs">No protein entries logged yet today.</p>
                </div>
            `;
        } else {
            container.innerHTML = activeLogs.map(log => {
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
                        <button onclick="deleteLogEntry('${log.id}')" class="text-slate-500 hover:text-rose-400 p-2 rounded-lg transition-colors" title="Delete entry">
                            <i class="fa-solid fa-trash-can text-sm"></i>
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
    // Clone and sort entries chronologically (oldest -> newest)
    const sorted = [...finishedDays].sort((a, b) => {
        const timeA = parseFinishedDateTime(a).sortTime;
        const timeB = parseFinishedDateTime(b).sortTime;
        return timeA - timeB;
    });

    const labels = sorted.map(item => {
        const parsed = parseFinishedDateTime(item);
        // Multi-line centered array label: [ "16. Oktober 2026", "23:50" ]
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

    chartInstance = new Chart(ctx, {
        type: activeChartType,
        data: {
            labels: labels,
            datasets: [{
                label: 'Protein (g)',
                data: data,
                backgroundColor: 'rgba(154, 128, 178, 0.4)',
                borderColor: BRAND_MAIN,
                borderWidth: 2,
                borderRadius: 8,
                tension: 0.25,
                fill: true,
                pointBackgroundColor: BRAND_LIGHT,
                pointRadius: 5
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
                    bodyColor: BRAND_LIGHT,
                    borderColor: '#334155',
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
                        color: '#94a3b8',
                        font: { size: 10 },
                        align: 'center',
                        maxRotation: 0,
                        minRotation: 0
                    }
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

// Switch between Tracker and Stats view
function switchTab(tab) {
    const trackerTab = document.getElementById('view-tracker');
    const statsTab = document.getElementById('view-stats');
    const btnTracker = document.getElementById('nav-tracker');
    const btnStats = document.getElementById('nav-stats');

    if (tab === 'tracker') {
        trackerTab.classList.remove('hidden');
        statsTab.classList.add('hidden');
        btnTracker.className = 'flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-semibold transition-all duration-200 bg-brand-600 text-white shadow-sm';
        btnStats.className = 'flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-white transition-all duration-200';
    } else {
        trackerTab.classList.add('hidden');
        statsTab.classList.remove('hidden');
        btnStats.className = 'flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-semibold transition-all duration-200 bg-brand-600 text-white shadow-sm';
        btnTracker.className = 'flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-white transition-all duration-200';
        renderStatsSummary();
        updateChart();
    }
}

// Daily target modal handling
function openTargetModal() {
    const modal = document.getElementById('target-modal');
    const input = document.getElementById('target-modal-input');
    if (input) {
        input.value = dailyTarget;
    }
    if (modal) {
        modal.classList.remove('hidden');
        input?.focus();
    }
}

function closeTargetModal() {
    const modal = document.getElementById('target-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

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
        closeTargetModal();
    } else {
        alert('Please enter a valid target greater than 0.');
    }
}

// Export data backup to a JSON file
function exportDataBackup() {
    const backupData = {
        version: '1.2.0',
        exportedAt: new Date().toISOString(),
        dailyTarget: dailyTarget,
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
                throw new Error('Invalid backup format');
            }

            if (confirm('Importing this file will merge its records with your existing data. Do you want to proceed?')) {
                if (typeof data.dailyTarget === 'number' && data.dailyTarget > 0) {
                    dailyTarget = data.dailyTarget;
                }

                if (Array.isArray(data.finishedDays)) {
                    // Normalize and merge finished days
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

                    // Sort newest to oldest in array
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
                closeTargetModal();
                renderDashboard();
                updateChart();
                alert('Backup successfully imported.');
            }
        } catch (err) {
            console.error('Import error:', err);
            alert('Failed to read backup file. Please ensure it is a valid ProteinTracker JSON file.');
        }
    };
    reader.readAsText(file);
}

// Delete history with prompt
function confirmClearHistory() {
    if (confirm('Are you sure you want to permanently delete all history?')) {
        finishedDays = [];
        saveData();
        renderDashboard();
        updateChart();
    }
}
