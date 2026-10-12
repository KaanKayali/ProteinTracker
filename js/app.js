// Local storage keys
const LOCAL_LOGS_KEY = 'protein_tracker_logs_v1';
const LOCAL_FINISHED_KEY = 'protein_tracker_finished_v1';
const LOCAL_TARGET_KEY = 'protein_tracker_target_v1';
const LOCAL_CURRENT_DATE_KEY = 'protein_tracker_active_date_v1';

// App state
let activeLogs = [];
let finishedDays = [];
let dailyTarget = 160;
let chartInstance = null;
let activeChartType = 'bar';
let activeWorkingDate = null;

// Theme accent colors
const BRAND_MAIN = '#9a80b2';
const BRAND_HOVER = '#866b9f';
const BRAND_LIGHT = '#b096c4';

// Boot up app once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    loadStoredData();
    checkDayTransition();
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

// Display formatted date string in header and banner
function updateCurrentDateHeader() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const todayStr = new Date().toLocaleDateString('en-US', options);
    const dateDisplay = document.getElementById('current-date-display');
    if (dateDisplay) {
        dateDisplay.innerText = todayStr;
    }
}

// Handle transition if opening app on a new calendar day
function checkDayTransition() {
    const todayStr = getTodayDateString();
    const banner = document.getElementById('day-rollover-banner');
    const bannerText = document.getElementById('day-rollover-text');

    if (!activeWorkingDate) {
        activeWorkingDate = todayStr;
        saveData();
        return;
    }

    if (activeWorkingDate !== todayStr) {
        // Find unfinalized logs from previous day(s)
        const pastLogs = activeLogs.filter(log => log.dateString === activeWorkingDate);
        const pastSum = pastLogs.reduce((sum, log) => sum + log.amount, 0);

        if (pastLogs.length > 0 && pastSum > 0) {
            if (banner && bannerText) {
                bannerText.innerText = `New day started. You have ${pastSum}g unfinalized from ${activeWorkingDate}. Archive it to yesterday's history or continue tracking.`;
                banner.classList.remove('hidden');
            }
        } else {
            activeWorkingDate = todayStr;
            saveData();
        }
    }
}

// User action from banner to archive prior day
function archivePreviousDayFromBanner() {
    if (!activeWorkingDate) return;
    const pastLogs = activeLogs.filter(log => log.dateString === activeWorkingDate);

    if (pastLogs.length > 0) {
        const finishedEntry = {
            dateString: activeWorkingDate,
            logs: pastLogs.map(l => ({ id: l.id, timestamp: l.timestamp, amount: l.amount }))
        };

        finishedDays = finishedDays.filter(day => day.dateString !== activeWorkingDate);
        finishedDays.unshift(finishedEntry);
        activeLogs = activeLogs.filter(log => log.dateString !== activeWorkingDate);
    }

    activeWorkingDate = getTodayDateString();
    saveData();
    dismissDayRolloverBanner();
    renderDashboard();
    updateChart();
}

// User chooses to merge yesterday's entries into today
function carryOverToTodayFromBanner() {
    const todayStr = getTodayDateString();
    activeLogs = activeLogs.map(log => {
        if (log.dateString === activeWorkingDate) {
            return { ...log, dateString: todayStr };
        }
        return log;
    });

    activeWorkingDate = todayStr;
    saveData();
    dismissDayRolloverBanner();
    renderDashboard();
    updateChart();
}

function dismissDayRolloverBanner() {
    const banner = document.getElementById('day-rollover-banner');
    if (banner) {
        banner.classList.add('hidden');
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

        activeWorkingDate = localStorage.getItem(LOCAL_CURRENT_DATE_KEY) || getTodayDateString();
    } catch (err) {
        console.error('Failed to load local storage data:', err);
        activeLogs = [];
        finishedDays = [];
        activeWorkingDate = getTodayDateString();
    }
}

// Persist state to browser storage
function saveData() {
    try {
        localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(activeLogs));
        localStorage.setItem(LOCAL_FINISHED_KEY, JSON.stringify(finishedDays));
        localStorage.setItem(LOCAL_TARGET_KEY, dailyTarget.toString());
        if (activeWorkingDate) {
            localStorage.setItem(LOCAL_CURRENT_DATE_KEY, activeWorkingDate);
        }
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
    activeWorkingDate = todayStr;

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

// Sum of grams currently active (today + unfinalized)
function getTodayTotal() {
    const todayStr = getTodayDateString();
    return activeLogs
        .filter(log => log.dateString === todayStr || log.dateString === activeWorkingDate)
        .reduce((sum, log) => sum + log.amount, 0);
}

// Re-render UI elements
function renderDashboard() {
    const todayTotal = getTodayTotal();
    const todayStr = getTodayDateString();
    const displayLogs = activeLogs.filter(log => log.dateString === todayStr || log.dateString === activeWorkingDate);

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
    if (logCountEl) logCountEl.innerText = `${displayLogs.length} ${displayLogs.length === 1 ? 'Entry' : 'Entries'}`;

    if (container) {
        if (displayLogs.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    <i class="fa-solid fa-cookie-bite text-2xl mb-1 opacity-40"></i>
                    <p class="text-xs">No protein entries logged yet today.</p>
                </div>
            `;
        } else {
            container.innerHTML = displayLogs.map(log => {
                const timeStr = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                return `
                    <div class="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs">
                                <i class="fa-solid fa-plus"></i>
                            </div>
                            <div>
                                <p class="text-sm font-bold text-white">+${log.amount}g Protein</p>
                                <p class="text-[10px] text-slate-400"><i class="fa-regular fa-clock mr-1"></i>${timeStr}</p>
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

function confirmFinishDay() {
    const targetDate = activeWorkingDate || getTodayDateString();
    const dayLogs = activeLogs.filter(log => log.dateString === targetDate);

    // Save only the individual values and timestamp
    const finishedEntry = {
        dateString: targetDate,
        finishedAt: new Date().toISOString(),
        logs: dayLogs.map(l => ({ id: l.id, timestamp: l.timestamp, amount: l.amount }))
    };

    // Replace if this date was previously finalized, else prepend
    finishedDays = finishedDays.filter(day => day.dateString !== targetDate);
    finishedDays.unshift(finishedEntry);

    // Clear active logs for finalized date
    activeLogs = activeLogs.filter(log => log.dateString !== targetDate);

    // Advance working date to today
    activeWorkingDate = getTodayDateString();

    saveData();
    closeFinishModal();
    dismissDayRolloverBanner();
    renderDashboard();
    updateChart();
}

// Summary cards metrics
function renderStatsSummary() {
    const finishedTotals = finishedDays.map(d => getFinishedDayAmount(d));
    const totalAllTime = finishedTotals.reduce((a, b) => a + b, 0) + getTodayTotal();
    const maxRecord = finishedTotals.length > 0 ? Math.max(...finishedTotals) : 0;
    
    // Average across finished days
    const avgFinished = finishedTotals.length > 0 ? Math.round(finishedTotals.reduce((a, b) => a + b, 0) / finishedTotals.length) : 0;

    const avgEl = document.getElementById('avg-7-days');
    const maxRecordEl = document.getElementById('max-day-record');
    const totalAllTimeEl = document.getElementById('total-all-time');

    if (avgEl) avgEl.innerText = `${avgFinished} g`;
    if (maxRecordEl) maxRecordEl.innerText = `${maxRecord} g`;
    if (totalAllTimeEl) totalAllTimeEl.innerText = `${totalAllTime} g`;
}

// Prepare dataset for Chart.js across all finished days
function getAggregatedChartData() {
    // Map dateString -> total calculated on the fly
    const map = {};

    finishedDays.forEach(d => {
        map[d.dateString] = getFinishedDayAmount(d);
    });

    // Sort all dates chronologically
    const sortedDates = Object.keys(map).sort();

    const labels = sortedDates.map(d => {
        const dateObj = new Date(d + 'T00:00:00');
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const data = sortedDates.map(d => map[d]);

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
                label: 'Finished Protein (g)',
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
                        label: (context) => `${context.parsed.y} g Protein finalized`
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
        version: '1.1.0',
        exportedAt: new Date().toISOString(),
        dailyTarget: dailyTarget,
        activeWorkingDate: activeWorkingDate,
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
                    const existingMap = new Map();
                    finishedDays.forEach(day => existingMap.set(day.dateString, day));
                    data.finishedDays.forEach(day => {
                        if (day && day.dateString) {
                            existingMap.set(day.dateString, day);
                        }
                    });
                    finishedDays = Array.from(existingMap.values()).sort((a, b) => b.dateString.localeCompare(a.dateString));
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
