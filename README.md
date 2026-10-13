<div align="center">

#  Stashly

### *The Offline-First Budget Saving & Wishlist Tracker for Windows*

*Turn big dreams and large purchases into effortless daily micro-habits.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?logo=windows)](https://github.com/YimAyuVadna/Stashly)
[![Built with Electron](https://img.shields.io/badge/Built%20with-Electron%20%7C%20React%20%7C%20TypeScript-47848F?logo=electron)](https://github.com/YimAyuVadna/Stashly)
[![Local Storage](https://img.shields.io/badge/Storage-SQLite%20(Local%20%26%20Private)-003B57?logo=sqlite)](https://github.com/YimAyuVadna/Stashly)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Comprehensive Features](#-comprehensive-features)
  - [1. Personalized Wishlist & Goal Management](#1-personalized-wishlist--goal-management)
  - [2. Quick Save Modal & Preset Customization](#2-quick-save-modal--preset-customization)
  - [3. GitHub-Style 365-Day Savings Heatmap](#3-github-style-365-day-savings-heatmap)
  - [4. Daily & Weekly Habits & Streaks](#4-daily--weekly-habits--streaks)
  - [5. Visual Analytics & Charts](#5-visual-analytics--charts)
  - [6. Complete Transaction Audit Log](#6-complete-transaction-audit-log)
  - [7. Privacy, Local Storage & Data Mobility](#7-privacy-local-storage--data-mobility)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Local Run](#installation--local-run)
  - [Running Unit Tests](#running-unit-tests)
- [Packaging for Windows (.exe)](#-packaging-for-windows-exe)
- [Security & Privacy](#-security--privacy)
- [License](#-license)

---

## 🌟 Overview

**Stashly** is a purpose-built desktop application designed for Windows 10 and 11. Instead of tracking money passively after it is already spent, Stashly shifts focus to **intentional forward saving**. 

Whether you are saving for a new workstation, a camera lens, a vacation, or an emergency buffer, Stashly links your daily micro-contributions directly to tangible goals with visual progress bars, celebration confetti, and GitHub-style habit tracking.

All data is stored directly on your device in a fast, robust SQLite database—no accounts required, no telemetry, no cloud subscriptions, and zero external tracking.

---

## 🚀 Comprehensive Features

### 1. Personalized Wishlist & Goal Management
- **Visual Wishlist Items**: Add items complete with cover images (stored locally), product URLs, brand, model, description, category, and target prices.
- **Priority Tiering**: Organize wishlist goals into `High`, `Medium`, and `Low` priority badges.
- **Goal Status Management**: Manage goals across `Active`, `Completed`, `Paused`, and `Archived` states.
- **Detailed Goal View**:
  - Breakdown of total target amount vs. total saved vs. remaining balance.
  - Dedicated item contribution history with inline timestamps and notes.
  - Estimated completion forecast calculated from your recent saving velocity.
  - Confetti celebration animations when target goals reach 100%.

### 2. Quick Save Modal & Preset Customization
- **Instant Contribution Trigger**: Access the Quick Save modal anywhere across the app.
- **Configurable Presets**: Default quick-tap values ($0.50, $1.00, $2.50, $5.00, $10.00, $20.00) that can be fully re-ordered, disabled, or tailored in Settings.
- **Custom Deposit Amounts**: Support for arbitrary contribution or withdrawal amounts with attached notes.
- **Target Routing**: Route deposits directly to a specific wishlist item or accumulate in **General Savings**.
- **Undo Safeguard**: Instant toast notification with an undo trigger to reverse accidental deposits immediately.

### 3. GitHub-Style 365-Day Savings Heatmap
- **Interactive Yearly Grid**: A visual 52-week calendar tracking every day of the selected year.
- **Goal-Relative Intensity Scaling**:
  - `Level 0`: No savings recorded ($0)
  - `Level 1`: 1% – 24% of daily target reached
  - `Level 2`: 25% – 49% of daily target reached
  - `Level 3`: 50% – 99% of daily target reached
  - `Level 4`: 100%+ of daily target achieved
- **Interactive Tooltips**: Hover over any day square to see precise savings amounts, total contributions, and allocated goals for that date.
- **Year-Over-Year Navigation**: Browse past years or inspect current annual metrics (Total Saved, Saving Days Count, Average per Saving Day).

### 4. Daily & Weekly Habits & Streaks
- **Daily Target Progress**: Real-time progress bar tracking today's deposits against your configured daily target.
- **Weekly Calendar Strip**: View current week performance (Monday-Sunday or Sunday-Saturday configurable) with success checkmarks.
- **Streak Tracking Engine**:
  - **Current Streak**: Consecutive saving days count.
  - **Longest Streak**: All-time consecutive saving streak record.
- **Rest Day / Milestone Awareness**: Clear visual confirmation when targets are met.

### 5. Visual Analytics & Charts
- **Time Range Filters**: Filter analysis over the last 30 days, 90 days, or All-Time.
- **Deposit Velocity & Trends**: Interactive charts showing monthly contribution trends and net totals.
- **Portfolio Allocation**: Goal distribution breakdown showing where your savings are distributed across wishlist priorities and items.
- **Fulfillment Horizon**: Realistic completion projection for your active wishlists.

### 6. Complete Transaction Audit Log
- **Comprehensive Ledger**: View every contribution, withdrawal, and adjustment in chronological order.
- **Search & Filtering**: Filter transaction records by wishlist goal, transaction type, or specific date range.
- **Edit & Delete**: Full CRUD controls to amend dates, notes, or amounts.

### 7. Privacy, Local Storage & Data Mobility
- **100% Offline-First**: Stored locally in `%APPDATA%/stashly/stashly.db` using SQLite with Write-Ahead Logging (`WAL`) mode enabled.
- **One-Click CSV Export**: Export your complete transaction history to a spreadsheet-ready `.csv` file anytime.
- **Database Backup**: Export a standalone `.db` snapshot of your entire database with one click.
- **Database Restore**: Restore previous database backups directly from within the Settings page with automated safe app restart.
- **Custom Currency & Settings**: Configure preferred currency code (`USD`, `EUR`, `GBP`, `CAD`, `AUD`, `JPY`, etc.) and week starting day.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Desktop Runtime** | [Electron 34](https://www.electronjs.org/) (Secure Preload, Context Isolation enabled, native menus removed) |
| **Frontend UI** | [React 18](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/), [Tailwind CSS 3](https://tailwindcss.com/) |
| **Icons & Visuals** | [Lucide React](https://lucide.dev/), [Phosphor Icons](https://phosphoricons.com/), [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti), [GSAP](https://greensock.com/gsap/) |
| **Data Visualization** | [Recharts 2](https://recharts.org/), custom SVG GitHub-style Calendar Matrix |
| **Date & Utilities** | [date-fns 3](https://date-fns.org/), [Zod 3](https://zod.dev/) |
| **Database Engine** | [better-sqlite3 11](https://github.com/WiseLibs/better-sqlite3) (SQLite in WAL mode, foreign keys enforced) |
| **Test Suite** | [Vitest 3](https://vitest.dev/) |
| **Packaging & Build** | [electron-builder 25](https://www.electron.build/), [Vite 6](https://vitejs.dev/) |

---

## 💻 Getting Started

### Prerequisites
- **Operating System**: Windows 10 or 11
- **Node.js**: v20 LTS or v22 LTS ([Download Node.js](https://nodejs.org/))
- **npm**: v10+ (bundled with Node.js)

### Installation & Local Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YimAyuVadna/Stashly.git
   cd Stashly
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start in development mode:**
   ```bash
   npm run dev
   ```
   *This concurrently starts the Vite development server and launches the Electron desktop window with Hot Module Replacement (HMR).*

### Running Unit Tests

Run the Vitest test suite to verify calculation utilities, streaks, and data validation:

```bash
npm test
```

---

## 📦 Packaging for Windows (.exe)

Stashly is configured to produce production-grade Windows executables using `electron-builder`.

To build the installer and portable binary:

```bash
npm run dist
```

After compilation, the built files will be located in the `release/` directory:
- `release/Stashly-Setup.exe` — Full Windows NSIS desktop installer (adds desktop icon & start menu shortcut).
- `release/Stashly-Portable.exe` — Zero-install single-file portable executable.

---

## 🔒 Security & Privacy

- **No Remote Telemetry**: Stashly does not phone home or transmit analytics.
- **Context Isolation**: Renderer processes cannot directly access Node.js internals; all operations pass through strict, validated Electron IPC channels.
- **Secure Image Protocol**: Images selected from the local filesystem are sanitized and served via secure custom protocol handling (`sq-file://`).
- **Encrypted / Local DB**: All records reside solely on your device filesystem.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.
