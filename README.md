# ProteinTracker Pro ⚡

Eine moderne, leichtgewichtige Web-App zum schnellen und unkomplizierten Tracken der täglichen Proteinzufuhr – optimiert für Smartphone und Desktop.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)

---

## ✨ Features

- **Schnelles Logging:** Direkte Zahleneingabe, Quick-Add-Buttons (+10g, +25g, +30g Shake, +50g) sowie ein integriertes Touch-Keypad für unterwegs.
- **Fortschrittsanzeige:** Interaktiver Kreisring zur visuellen Verfolgung des täglichen Proteinziels.
- **Verlauf & Historie:** Einzelne Einträge des Tages einsehen und bei Bedarf löschen.
- **Tag beenden:** Schließt den Tag ab, archiviert das Gesamtergebnis und setzt den Zähler für den nächsten Tag zurück.
- **Statistik-Dashboard:** 
  - 7-Tage-Durchschnitt
  - Allzeit-Rekord & Gesamtsumme
  - Balken- und Liniendiagramme via Chart.js
  - Historienübersicht aller abgeschlossenen Tage
- **100% Client-Side:** Alle Daten werden lokal im Browser via `localStorage` gespeichert (kein Backend oder Login erforderlich).
- **Responsive & Dark Mode:** Elegantes UI mit Tailwind CSS.

---

## 📁 Projektstruktur

```text
ProteinTracker/
├── index.html        # Haupt-HTML-Struktur
├── css/
│   └── style.css     # Eigene CSS-Styles, Animationen & Utilities
├── js/
│   └── app.js        # Gesamte App-Logik, State-Management & Charts
├── .gitignore        # Ignorierte Dateien für Git
└── README.md         # Projektdokumentation
```

---

## 🚀 Erste Schritte

### Lokal ausführen
Einfach die [index.html](file:///c:/Development/ProteinTracker/index.html) in einem modernen Webbrowser öffnen oder einen lokalen Dev-Server starten (z. B. VS Code Live Server):

```bash
# Mit Python (optional)
python -m http.server 8000

# Mit Node.js npx (optional)
npx serve .
```

---

## 📤 Auf GitHub hochladen

Führe folgende Befehle im Projektverzeichnis aus:

```bash
# 1. Git Repository initialisieren
git init

# 2. Alle Dateien zum Commit hinzufügen
git add .

# 3. Ersten Commit erstellen
git commit -m "Initial commit: Modularized ProteinTracker structure"

# 4. Haupt-Branch auf main setzen
git branch -M main

# 5. Remote-Repository verknüpfen (Ersetze die URL mit deinem GitHub-Repo)
git remote add origin https://github.com/DEIN-BENUTZERNAME/DEIN-REPO-NAME.git

# 6. Auf GitHub pushen
git push -u origin main
```

---

## 🌐 GitHub Pages Deployment

Da es sich um eine statische Web-App handelt, kann sie direkt kostenlos über **GitHub Pages** bereitgestellt werden:
1. Gehe in deinem GitHub-Repo auf **Settings** > **Pages**.
2. Wähle unter **Branch** den Branch `main` und `/ (root)` aus.
3. Klicke auf **Save**. Die App ist in wenigen Augenblicken live erreichbar!
