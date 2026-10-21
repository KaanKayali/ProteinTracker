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
            const dateLine = d.toLocaleDateString(getCurrentLocale(), { day: 'numeric', month: 'long', year: 'numeric' });
            const timeLine = d.toLocaleTimeString(getCurrentLocale(), { hour: '2-digit', minute: '2-digit' });
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
            ? d.toLocaleDateString(getCurrentLocale(), { day: 'numeric', month: 'long', year: 'numeric' })
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
                        label: (context) => `${context.parsed.y} g ${t('protein')}`
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
