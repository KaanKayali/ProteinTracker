function exportDataBackup() {
    const backupData = {
        version: '1.3.0',
        exportedAt: new Date().toISOString(),
        dailyTarget: dailyTarget,
        currentTheme: currentTheme,
        currentLanguage: currentLanguage,
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

            if (confirm(t('importConfirm'))) {
                if (typeof data.dailyTarget === 'number' && data.dailyTarget > 0) {
                    dailyTarget = data.dailyTarget;
                }
                if (data.currentTheme === 'light' || data.currentTheme === 'dark') {
                    currentTheme = data.currentTheme;
                    applyThemeUI();
                }
                if (data.currentLanguage === 'de' || data.currentLanguage === 'en') {
                    currentLanguage = data.currentLanguage;
                    applyLanguageUI();
                    updateCurrentDateHeader();
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
                alert(t('importSuccess'));
            }
        } catch (err) {
            console.error('Import error:', err);
            alert(t('importFailure'));
        }
    };
    reader.readAsText(file);
}

// Delete history with prompt
function confirmClearHistory() {
    if (confirm(t('clearConfirm'))) {
        finishedDays = [];
        activeLogs = [];
        saveData();
        renderDashboard();
        updateChart();
        alert(t('clearSuccess'));
    }
}
