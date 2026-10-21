// Numeric keypad and protein-entry actions
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
        if (toggleText) toggleText.innerText = t('hideKeypad');
    } else {
        keypad.classList.add('hidden');
        if (toggleText) toggleText.innerText = t('showKeypad');
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
    if (logCountEl) {
        const countLabel = activeLogs.length === 1 ? t('sessionEntry') : t('sessionEntries');
        logCountEl.innerText = `${activeLogs.length} ${countLabel}`;
    }

    if (container) {
        if (activeLogs.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-dark-textMuted rounded-2xl bg-dark-cardAlt/40">
                    <i class="fa-solid fa-cookie-bite text-3xl mb-1.5 opacity-40"></i>
                    <p class="text-sm font-medium">${t('noEntries')}</p>
                </div>
            `;
        } else {
            const itemBg = currentTheme === 'light' ? 'bg-light-cardAlt' : 'bg-dark-cardAlt';
            const textClass = currentTheme === 'light' ? 'text-light-text' : 'text-white';
            const mutedClass = currentTheme === 'light' ? 'text-light-textMuted' : 'text-dark-textMuted';

            container.innerHTML = activeLogs.map(log => {
                const timeStr = new Date(log.timestamp).toLocaleTimeString(getCurrentLocale(), { hour: '2-digit', minute: '2-digit' });
                return `
                    <div class="flex items-center justify-between p-3.5 ${itemBg} rounded-2xl transition-all shadow-none">
                        <div class="flex items-center space-x-3.5">
                            <div class="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center font-black text-sm flex-shrink-0">
                                <i class="fa-solid fa-plus text-sm"></i>
                            </div>
                            <div>
                                <p class="text-base sm:text-lg font-black ${textClass}">+${log.amount}g ${t('protein')}</p>
                                <p class="text-xs sm:text-sm ${mutedClass}"><i class="fa-regular fa-clock mr-1"></i>${timeStr}${currentLanguage === 'de' ? ' Uhr' : ''}</p>
                            </div>
                        </div>
                        <button onclick="deleteLogEntry('${log.id}')" class="text-dark-textMuted hover:text-rose-400 p-2.5 rounded-xl transition-colors shadow-none" title="${t('deleteEntry')}">
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
