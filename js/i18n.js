const APP_TRANSLATIONS = {
    de: {
        finishButton: 'Tag beenden & speichern',
        hideKeypad: 'Tastatur ausblenden',
        showKeypad: 'Tastatur anzeigen',
        noEntries: 'Noch keine Proteine eingetragen.',
        sessionEntry: 'Eintrag',
        sessionEntries: 'Einträge',
        protein: 'Protein',
        deleteEntry: 'Eintrag löschen',
        targetSaved: 'Tagesziel erfolgreich gespeichert!',
        invalidTarget: 'Bitte gib eine gültige Zahl größer als 0 ein.',
        importConfirm: 'Durch den Import werden diese Daten mit deinen bestehenden Daten zusammengeführt. Fortfahren?',
        importSuccess: 'Backup erfolgreich importiert!',
        importFailure: 'Fehler beim Lesen der Backup-Datei.',
        clearConfirm: 'Möchtest du wirklich alle Verlaufsdaten unwiderruflich löschen?',
        clearSuccess: 'Alle Verlaufsdaten wurden gelöscht!'
    },
    en: {
        finishButton: 'Finish Day & Save',
        hideKeypad: 'Hide keypad',
        showKeypad: 'Show keypad',
        noEntries: 'No protein entries yet.',
        sessionEntry: 'entry',
        sessionEntries: 'entries',
        protein: 'protein',
        deleteEntry: 'Delete entry',
        targetSaved: 'Daily target saved!',
        invalidTarget: 'Please enter a valid number greater than 0.',
        importConfirm: 'This will merge the backup data with your existing data. Continue?',
        importSuccess: 'Backup imported successfully!',
        importFailure: 'Could not read the backup file.',
        clearConfirm: 'Are you sure you want to permanently delete all history?',
        clearSuccess: 'All history has been deleted.'
    }
};

const ENGLISH_STATIC_TEXT = {
    'Profil': 'Profile',
    'Heute': 'Today',
    'Ziel:': 'Goal:',
    'Ziel': 'Goal',
    'g / Tag': 'g / day',
    'Finish Day & Save': 'Finish Day & Save',
    'Protein Hinzufügen': 'Add Protein',
    'Gramm': 'Grams',
    'Add': 'Add',
    'Einträge der aktuellen Session': 'Current Session Entries',
    'Dein Profil & Statistik': 'Your Profile & Statistics',
    'Fortschrittsübersicht & Personalisierung': 'Progress overview & personalization',
    'Ø Pro beendetem Tag': 'Average per completed day',
    'Bester beendeter Tag': 'Best completed day',
    'Gesamttotal': 'All-time total',
    'Verlauf beendeter Tage': 'Completed day history',
    'Erreichte Proteine geordnet nach Abschluss-Datum und Uhrzeit': 'Protein intake by completion date and time',
    'Balken': 'Bar',
    'Linie': 'Line',
    'Einstellungen': 'Settings',
    'Sprache': 'Language',
    'Ziel, Design, Backup & Verlauf': 'Goal, appearance, backup & history',
    'Design-Modus': 'Appearance',
    'Tägliches Proteinziel': 'Daily protein target',
    'Passe dein tägliches Proteinziel an. Das Ziel bleibt dauerhaft aktiv.': 'Set your daily protein target. It stays active until you change it.',
    'z. B. 160': 'e.g. 160',
    'Ziel Speichern': 'Save target',
    'Backup & Übertragung': 'Backup & transfer',
    'Exportiere deine Einträge als JSON-Datei zur Sicherung oder um sie zwischen Handy und Laptop zu synchronisieren.': 'Export your entries as a JSON file to back them up or sync them between phone and laptop.',
    'Exportieren': 'Export',
    'Importieren': 'Import',
    'Alle Verlaufsdaten löschen': 'Delete all history',
    'Tag jetzt beenden?': 'Finish today?',
    'Dein Gesamttotal von': 'Your total of',
    'wird mit aktuellem Datum und Uhrzeit im Diagramm gespeichert. Danach startet der Zähler neu.': 'will be saved to the chart with the current date and time. The counter will then reset.',
    'Abbrechen': 'Cancel',
    'Ja, Beenden': 'Yes, finish',
    'Hauptnavigation': 'Main navigation',
    'ProteinTracker Logo': 'ProteinTracker logo',
    '0 Einträge': '0 entries'
};

const GERMAN_STATIC_TEXT = {
    'Add': 'Hinzufügen',
    'Dark Mode': 'Dunkelmodus',
    'Light Mode': 'Hellmodus',
    'Finish Day': 'Tag beenden',
    'Finish & Save Day': 'Tag speichern & beenden'
};

const STATIC_TEXT_NODES = new WeakMap();
const STATIC_ATTRIBUTES = new WeakMap();

function t(key) {
    return APP_TRANSLATIONS[currentLanguage]?.[key] ?? key;
}

function getCurrentLocale() {
    return currentLanguage === 'en' ? 'en-US' : 'de-DE';
}

function applyLanguageUI() {
    const lang = currentLanguage === 'en' ? 'en' : 'de';
    document.documentElement.lang = lang;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
        const original = STATIC_TEXT_NODES.has(node) ? STATIC_TEXT_NODES.get(node) : node.nodeValue;
        STATIC_TEXT_NODES.set(node, original);
        const trimmed = original.trim();
        const translated = lang === 'en' ? ENGLISH_STATIC_TEXT[trimmed] : GERMAN_STATIC_TEXT[trimmed];
        node.nodeValue = original.replace(trimmed, translated ?? trimmed);
    }

    document.querySelectorAll('[placeholder], [title], [aria-label]').forEach(element => {
        ['placeholder', 'title', 'aria-label'].forEach(attribute => {
            if (!element.hasAttribute(attribute)) return;
            let source = STATIC_ATTRIBUTES.get(element)?.[attribute];
            if (source === undefined) {
                source = element.getAttribute(attribute);
                const stored = STATIC_ATTRIBUTES.get(element) || {};
                stored[attribute] = source;
                STATIC_ATTRIBUTES.set(element, stored);
            }
            const trimmed = source.trim();
            const translated = lang === 'en' ? ENGLISH_STATIC_TEXT[trimmed] : GERMAN_STATIC_TEXT[trimmed];
            element.setAttribute(attribute, source.replace(trimmed, translated ?? trimmed));
        });
    });

    const languageSelect = document.getElementById('language-select');
    if (languageSelect) languageSelect.value = lang;
    const keypad = document.getElementById('calculator-keypad');
    const keypadToggleText = document.getElementById('keypad-toggle-text');
    if (keypad && keypadToggleText) {
        keypadToggleText.textContent = t(keypad.classList.contains('hidden') ? 'showKeypad' : 'hideKeypad');
    }
    updateFinishButtonLanguage();
}
