<div align="center">

# Stashly

### The Offline-First Budget Saving and Wishlist Tracker for Windows

*Turn financial goals and wishlist milestones into consistent daily habits.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?logo=windows)](https://github.com/YimAyuVadna/Stashly)
[![Built with Electron](https://img.shields.io/badge/Built%20with-Electron%20%7C%20React%20%7C%20TypeScript-47848F?logo=electron)](https://github.com/YimAyuVadna/Stashly)
[![Local Storage](https://img.shields.io/badge/Storage-SQLite%20(Local%20%26%20Private)-003B57?logo=sqlite)](https://github.com/YimAyuVadna/Stashly)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
  - [1. Personalized Wishlist and Goal Management](#1-personalized-wishlist-and-goal-management)
  - [2. Quick Save Modal and Preset Customization](#2-quick-save-modal-and-preset-customization)
  - [3. GitHub-Style 365-Day Savings Heatmap](#3-github-style-365-day-savings-heatmap)
  - [4. Daily and Weekly Habits and Streaks](#4-daily-and-weekly-habits-and-streaks)
  - [5. Visual Analytics and Reporting](#5-visual-analytics-and-reporting)
  - [6. Complete Transaction Audit Log](#6-complete-transaction-audit-log)
  - [7. Privacy, Local Storage, and Data Mobility](#7-privacy-local-storage-and-data-mobility)
- [Architecture and Tech Stack](#architecture-and-tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation and Development](#installation-and-development)
  - [Running Unit Tests](#running-unit-tests)
- [Packaging for Windows (.exe)](#packaging-for-windows-exe)
- [Security and Privacy](#security-and-privacy)
- [License](#license)

---

## Overview

Stashly is a dedicated desktop application built for Windows 10 and Windows 11. Instead of tracking expenditures retrospectively after money is already spent, Stashly focuses on proactive, goal-directed saving.

Whether saving for computer hardware, travel, equipment upgrades, or emergency reserves, Stashly connects daily micro-deposits directly to concrete objectives. Progress is measured with visual indicators, velocity projections, milestone celebrations, and a year-long activity heatmap.

All records remain exclusively on the user device within a local SQLite database. No external account registration, third-party network requests, cloud telemetry, or user tracking are involved.

---

## Key Features

### 1. Personalized Wishlist and Goal Management
- **Item Metadata**: Save items with product cover images (stored locally), links, brand, model, description, category, and target prices.
- **Priority Classification**: Organize goals with High, Medium, and Low priority badges.
- **Lifecycle Tracking**: Support for Active, Completed, Paused, and Archived status workflows.
- **Dedicated Goal Detail View**:
  - Breakdown of total target amount, amount saved to date, and remaining balance.
  - Granular transaction log associated directly with the target item.
  - Dynamic completion projections calculated from historical saving velocity.
  - Milestone visual effects when target funding reaches 100%.

### 2. Quick Save Modal and Preset Customization
- **Global Deposit Action**: Access the Quick Save dialog from anywhere within the application.
- **Configurable One-Click Presets**: Pre-configured values ($0.50, $1.00, $2.50, $5.00, $10.00, $20.00) that can be reordered, enabled, or modified in Settings.
- **Custom Amounts and Withdrawals**: Record custom deposit or withdrawal values alongside descriptive transaction notes.
- **Goal Allocation**: Direct contributions to a specific wishlist objective or accrue toward General Savings.
- **Undo Capability**: Notification prompt allowing immediate reversal of accidental entries.

### 3. GitHub-Style 365-Day Savings Heatmap
- **Annual Grid Matrix**: 52-week activity visualization detailing performance across every calendar day of the selected year.
- **Target-Relative Intensity Scale**:
  - Level 0: No deposits recorded ($0.00)
  - Level 1: 1% to 24% of daily target met
  - Level 2: 25% to 49% of daily target met
  - Level 3: 50% to 99% of daily target met
  - Level 4: 100% or more of daily target reached
- **Day Inspection Tooltips**: Hover over dates to view exact amounts, transaction count, and target allocations.
- **Annual Navigation**: Traverse past years and inspect aggregate metrics including total saved, active saving days, and daily average.

### 4. Daily and Weekly Habits and Streaks
- **Daily Target Progress**: Live calculation showing current day contributions against the configured daily quota.
- **Weekly Schedule Strip**: Monitor the active week (with selectable Monday or Sunday start day) with completion marks.
- **Streak Evaluation**:
  - Current Streak: Consecutive active saving days.
  - Longest Streak: All-time record streak.
- **Rest Day and Schedule Flexibility**: Accommodates adjustments without compromising streak continuity.

### 5. Visual Analytics and Reporting
- **Configurable Time Horizons**: View metrics filtered across 30 days, 90 days, or all-time history.
- **Deposit Trends**: Time-series charts visualizing month-over-month contribution volumes and net balance adjustments.
- **Category and Goal Allocation**: Visual breakdowns illustrating how funds are dispersed among active wishlist items.
- **Fulfillment Horizon**: Estimated timeline projections forecasting completion dates for remaining targets.

### 6. Complete Transaction Audit Log
- **Centralized Ledger**: Comprehensive chronological record of all deposits, withdrawals, and balance corrections.
- **Filtering and Search**: Isolate transactions by associated wishlist item, transaction type, or date interval.
- **Record Management**: Modify dates, amounts, and notes or delete invalid entries directly from the log table.

### 7. Privacy, Local Storage, and Data Mobility
- **Offline Architecture**: Stored locally in `%APPDATA%/stashly/stashly.db` via SQLite with Write-Ahead Logging (WAL) enabled.
- **CSV Data Export**: Export complete ledger entries to an industry-standard CSV file for review in external spreadsheet tools.
- **Database Backup**: Create an uncompressed, standalone `.db` snapshot copy of the full database at any time.
- **Database Restoration**: Restore previous database backups directly from the interface with automated application restart.
- **Customizable Preferences**: Configure currency symbols (USD, EUR, GBP, CAD, AUD, JPY, and others) and application theme preferences.

---

## Architecture and Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Desktop Runtime** | Electron 34 | Hardened application window, secure preload scripts, IPC bridges, and context isolation |
| **Frontend Framework** | React 18 / TypeScript 5 | Component architecture, strict type checking, and modular state management |
| **Styling** | Tailwind CSS 3 | Responsive styling, typography configurations, and theme tokens |
| **Icons and Visuals** | Lucide React / Phosphor Icons | System navigation and status indicator iconography |
| **Data Visualization** | Recharts 2 | Responsive charts for deposit distributions and time series |
| **Date Manipulation** | date-fns 3 | Date mathematics, calendar interval generation, and timezone handling |
| **Database** | better-sqlite3 11 | Synchronous SQLite driver in WAL mode with enforced foreign key integrity |
| **Testing** | Vitest 3 | Fast unit testing and calculation verification |
| **Build and Bundling** | Vite 6 / electron-builder 25 | Hot module replacement in development and Windows distribution compilation |

---

## Getting Started

### Prerequisites
- Windows 10 or Windows 11
- Node.js LTS (version 20 or 22 recommended)
- npm package manager (included with Node.js)

### Installation and Development

1. Clone the repository:
   ```bash
   git clone https://github.com/YimAyuVadna/Stashly.git
   cd Stashly
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch development environment:
   ```bash
   npm run dev
   ```
   This command starts the Vite development server and launches the Electron application with Hot Module Replacement.

### Running Unit Tests

Execute the automated test suite using Vitest:

```bash
npm test
```

---

## Packaging for Windows (.exe)

Stashly is configured to compile Windows distribution packages through electron-builder:

```bash
npm run dist
```

Upon compilation, artifacts are output to the `release/` folder:
- `release/Stashly-Setup.exe`: Standard Windows NSIS installer with desktop and Start Menu shortcuts.
- `release/Stashly-Portable.exe`: Standalone portable executable requiring no prior installation.

---

## Security and Privacy

- **Zero External Telemetry**: The application does not transmit analytics, logs, or usage information over the network.
- **Process Isolation**: The renderer process does not have direct access to the Node.js runtime or filesystem; interactions occur exclusively through explicit Electron IPC channels.
- **Local Asset Handling**: Uploaded images are stored in protected local app data directories and rendered using custom protocol handlers.
- **Filesystem Integrity**: All financial records, settings, and historical entries remain on the local machine.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
