# Changelog

All notable changes to the ProteinTracker project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-10-09

### Added
- **JSON Data Backup & Sync**: Added `Export Backup` and `Import Backup` buttons in the settings modal, enabling users to transfer tracking data between mobile and desktop devices without requiring an external server or account.
- **Day Rollover Safeguard & Banner**: Added calendar day detection upon app launch. If unfinalized protein entries exist from a previous date, an informative banner appears allowing the user to either archive those entries to the prior day's history or merge them into today's total.
- **Dedicated Changelog**: Added `CHANGELOG.md` to track project evolution across releases.

### Fixed
- **Mobile Header Text Truncation**: Resolved an issue where the title "ProteinTracker" was cut off (`ProteinTra...`) on narrow mobile viewports. Replaced clipping constraints with fluid spacing and non-wrapping typography.
- **Accidental Day Reset Behavior**: Addressed unintended counter resets caused by midnight date boundary changes when users had not pressed "Finish Day". Previous day entries are now preserved and explicitly accounted for.

---

## [1.0.0] - 2026-10-08

### Added
- Initial modularized release of ProteinTracker.
- Pure client-side logging with local storage persistence.
- Daily protein goal configuration with persistent state.
- Interactive radial progress ring.
- Quick-add preset buttons (+10g, +25g, +30g, +50g) and on-screen numeric keypad.
- Statistics dashboard with 7-day rolling average, best day records, and Chart.js bar and line graphs.
- Day archival workflow ("Finish Day") with history review.
- Custom visual identity with `#9a80b2` accent palette and application icon.
