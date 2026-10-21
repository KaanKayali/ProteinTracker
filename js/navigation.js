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

    } else {
        if (desktopTracker) {
            desktopTracker.className = `flex items-center space-x-2 px-4 py-2 rounded-xl text-sm sm:text-base font-bold ${inactiveTextClass} transition-all duration-200 shadow-none`;
        }
        if (desktopProfile) {
            desktopProfile.className = 'flex items-center space-x-2 px-4 py-2 rounded-xl text-sm sm:text-base font-bold transition-all duration-200 bg-brand-600 text-white shadow-none';
        }

    }

    [mobileTracker, mobileProfile].forEach((button, index) => {
        if (!button) return;
        const active = (index === 0 && currentActiveTab === 'tracker')
            || (index === 1 && currentActiveTab === 'profile');
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
    });
}

function toggleProfileSettings() {
    const panel = document.getElementById('profile-settings-panel');
    const toggle = document.getElementById('profile-settings-toggle');
    const chevron = document.getElementById('profile-settings-chevron');
    if (!panel || !toggle) return;

    const isOpening = panel.classList.contains('hidden');
    panel.classList.toggle('hidden', !isOpening);
    toggle.setAttribute('aria-expanded', String(isOpening));
    if (chevron) chevron.classList.toggle('settings-chevron-open', isOpening);
}

function setAppLanguage(language) {
    currentLanguage = language === 'en' ? 'en' : 'de';
    saveData();
    applyLanguageUI();
    updateCurrentDateHeader();
    const keypad = document.getElementById('calculator-keypad');
    const keypadToggleText = document.getElementById('keypad-toggle-text');
    if (keypad && keypadToggleText) {
        keypadToggleText.textContent = t(keypad.classList.contains('hidden') ? 'showKeypad' : 'hideKeypad');
    }
    renderDashboard();
    updateChart();
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
        alert(t('targetSaved'));
    } else {
        alert(t('invalidTarget'));
    }
}

// Export data backup to a JSON file
