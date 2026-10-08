# ProteinTracker

ProteinTracker is a lightweight, responsive client-side web application built for logging and monitoring daily protein consumption. It offers numeric logging, an on-screen keypad for touch devices, daily goal tracking, and a historical chart.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)

## Overview

The application runs entirely in the browser using static files. It requires no backend server or account authentication. State is persisted locally on the client using the browser's `localStorage` API.

## Features

- **Fast Entry Logging**: Log intake via direct keyboard entry, quick-add preset buttons (+10g, +25g, +30g, +50g), or the built-in numeric touch keypad.
- **Persistent Daily Goal**: Configure your daily target via the settings modal in the header. The value remains active until modified.
- **Progress Tracking**: A dynamic radial progress ring provides immediate visual feedback against your daily target.
- **Daily Entries Stream**: View, verify, and delete individual log entries for the current day.
- **Day Archival**: Finalize and close out your daily log to store totals in your history and reset the current day's counter.
- **Historical Analytics**: Review past intake with 7-day rolling averages, all-time record metrics, and interactive bar or line charts powered by Chart.js.
- **Mobile-First Interface**: Designed with a compact layout to ensure keypad controls are directly accessible without unnecessary scrolling on mobile viewports.

## Project Structure

```text
ProteinTracker/
├── assets/
│   └── logo.png       Application icon and favicon
├── css/
│   └── style.css      Custom styles and scrollbar overrides
├── js/
│   └── app.js         Core state management, event listeners, and chart logic
├── .gitignore         Git ignore definitions
├── index.html         Main HTML document and user interface
└── README.md          Project documentation
```

## Running the Application Locally

Since this is a static project, you can run it by opening `index.html` directly in any modern browser.

Alternatively, you can start a local development server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx serve .
```

Once running, navigate to `http://localhost:8000` in your web browser.



