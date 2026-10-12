<div align="center">

# 💎 Stashly

**Your Personal Desktop Savings & Wishlist Companion**  
*Turn big financial targets and wishlist dreams into achievable daily habits.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?logo=windows)](https://github.com/YimAyuVadna/Stashly)
[![Built with Electron](https://img.shields.io/badge/Built%20with-Electron%20%7C%20React%20%7C%20TypeScript-47848F?logo=electron)](https://github.com/YimAyuVadna/Stashly)

</div>

---

## 🌟 Overview

**Stashly** is an offline-first desktop application engineered for Windows. It helps you save money intentionally by linking daily contributions directly to items on your wishlist. Featuring GitHub-style habit tracking, goal milestones, visual charts, and local SQLite data storage, your financial information never leaves your machine.

---

## ✨ Features

- **🎯 Personalized Wishlist Tracking**
  - Add wishlist goals with photos, links, priority tags, and target amounts.
  - Track individual progress percentage and estimated completion dates.

- **⚡ Quick Save Hub**
  - Instant one-click contribution presets ($0.50, $1.00, $2.50, $5.00, $10.00, $20.00) or custom deposit amounts.
  - Instant undo safeguard for mistaken entries.

- **📅 GitHub-Style Savings Heatmap**
  - Interactive 365-day calendar visualizing daily contribution intensity and consistency streaks.

- **📊 Comprehensive Analytics**
  - Monthly deposit breakdown and category/goal distribution with interactive charts.
  - Realistic milestone forecasting based on your active deposit velocity.

- **🔒 Offline-First & Private Storage**
  - Stored locally via SQLite (`better-sqlite3`) with WAL mode.
  - Zero external cloud dependencies, zero data tracking.
  - One-click CSV export, database backup, and restore capabilities.

---

## 🛠️ Tech Stack

- **Core / Runtime**: [Electron](https://www.electronjs.org/) (Secure Preload & IPC Architecture)
- **Frontend**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Icons & Visuals**: [Lucide React](https://lucide.dev/), [Phosphor Icons](https://phosphoricons.com/), [Recharts](https://recharts.org/), [GSAP](https://greensock.com/gsap/)
- **Local Database**: [SQLite](https://www.sqlite.org/) via `better-sqlite3`
- **Testing**: [Vitest](https://vitest.dev/)
- **Packaging**: [electron-builder](https://www.electron.build/)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 LTS or v22 LTS recommended)
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- Windows 10 or 11

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YimAyuVadna/Stashly.git
   cd Stashly
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run dev
   ```

4. **Run unit tests:**
   ```bash
   npm test
   ```

---

## 📦 Building the Windows Application

To build the standalone Windows installer and portable executable:

```bash
npm run dist
```

Generated outputs will be located in the `release/` directory:
- `Stashly-Setup.exe` (NSIS Installer)
- `Stashly-Portable.exe` (Portable Single-file Executable)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
