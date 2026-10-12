# Stashly — Budget Saving & Wishlist Tracker

Stashly is an offline-first desktop application engineered for Windows 10/11 that turns large purchases and wishlist desires into manageable daily habits.

## 🚀 Key Features

- **Personalized Wishlist Tracking**: Create wishlist items with uploaded product images, target prices, brand/model metadata, and priority badges.
- **Quick Save Hub**: Rapidly record contributions using preset amounts ($0.50, $1.00, $2.50, $5.00, $10.00, $20.00) or custom figures with instant Undo safeguards.
- **GitHub-Style Yearly Savings Heatmap**: Interactive 365-day calendar visualization displaying savings density and goal achievement levels with responsive hover tooltips.
- **Daily & Weekly Saving Goals**: Set real targets and monitor day-by-day progress without fabricated metrics.
- **Interactive Analytics**: Monthly bar charts, goal distribution charts, and timeline graphs rendered from verified transaction history.
- **Robust Local Storage**: SQLite-backed local persistence (`stashly.db`) stored securely in user app data with full CSV export, database backup, and restore capabilities.

## 🛠️ Tech Stack

- **Framework**: Electron (Context Isolation, Secure Preload API)
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts, date-fns
- **Database**: SQLite via `better-sqlite3` (WAL mode enabled, foreign keys enforced)
- **Testing**: Vitest
- **Packager**: electron-builder (NSIS Installer & Portable Executable)

## 📦 Building and Packaging for Windows

### Prerequisites
- Node.js LTS (v20+ or v22+)
- Windows 10/11

### Run in Development
```bash
# Start Vite development server & Electron desktop window
npm run dev
```

### Run Automated Tests
```bash
npm test
```

### Package Windows .exe
```bash
npm run dist
```
Upon completion, the installer and portable executable will be placed in the `release/` directory:
- `release/Stashly-Setup.exe`
- `release/Stashly-Portable.exe`
