// Local storage keys
const LOCAL_LOGS_KEY = 'protein_tracker_logs_v1';
const LOCAL_FINISHED_KEY = 'protein_tracker_finished_v1';
const LOCAL_TARGET_KEY = 'protein_tracker_target_v1';
const LOCAL_THEME_KEY = 'protein_tracker_theme_v1';
const LOCAL_LANGUAGE_KEY = 'protein_tracker_language_v1';

// App state
let activeLogs = [];
let finishedDays = [];
let dailyTarget = 160;
let chartInstance = null;
let activeChartType = 'bar';
let currentTheme = 'dark'; // 'dark' or 'light'
let currentLanguage = 'de'; // 'de' or 'en'
let currentActiveTab = 'tracker'; // 'tracker' or 'profile'

// Theme accent colors
const BRAND_MAIN = '#9a80b2';
const BRAND_HOVER = '#866b9f';
const BRAND_LIGHT = '#b096c4';

// Boot up app once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    loadStoredData();
    applyLanguageUI();
    applyThemeUI();
    updateCurrentDateHeader();
    updateFinishButtonLanguage();
    renderDashboard();
    initChart();
    checkInputMode();
});

// Keep the primary action aligned with the browser's selected language.
function updateFinishButtonLanguage() {
    const label = document.getElementById('finish-day-label');
    const button = document.getElementById('finish-day-button');
    const text = currentLanguage === 'de' ? 'Tag beenden' : 'Finish Day';

    if (label) label.textContent = t('finishButton');
    if (button) button.title = text;
    if (button) button.setAttribute('aria-label', text);
}

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
    const todayStr = new Date().toLocaleDateString(getCurrentLocale(), options);
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

        const storedLanguage = localStorage.getItem(LOCAL_LANGUAGE_KEY);
        currentLanguage = storedLanguage === 'de' || storedLanguage === 'en'
            ? storedLanguage
            : (navigator.language?.toLowerCase().startsWith('de') ? 'de' : 'en');

        // Clean up legacy key if present
        localStorage.removeItem('protein_tracker_active_date_v1');
    } catch (err) {
        console.error('Failed to load local storage data:', err);
        activeLogs = [];
        finishedDays = [];
        currentTheme = 'dark';
        currentLanguage = 'de';
    }
}

// Persist state to browser storage
function saveData() {
    try {
        localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(activeLogs));
        localStorage.setItem(LOCAL_FINISHED_KEY, JSON.stringify(finishedDays));
        localStorage.setItem(LOCAL_TARGET_KEY, dailyTarget.toString());
        localStorage.setItem(LOCAL_THEME_KEY, currentTheme);
        localStorage.setItem(LOCAL_LANGUAGE_KEY, currentLanguage);
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
