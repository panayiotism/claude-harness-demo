# Personal Dashboard - Frontend

A beautiful, modern personal dashboard built with React, TypeScript, and Tailwind CSS.

## Features

### Weather Widget
- Auto-detects your location using geolocation API
- Displays current temperature, humidity, and weather conditions
- Beautiful gradient backgrounds that change based on weather
- Uses Open-Meteo API (no API key required)

### Notes Widget
- Create, edit, and delete notes
- Markdown support for rich text formatting
- LocalStorage fallback with API-ready integration
- Smooth animations

### Tasks Widget
- Create tasks with priority levels (low, medium, high)
- Set due dates
- Filter by status (all, active, completed)
- Color-coded priority indicators
- Satisfying completion animations

### Pomodoro Timer
- Configurable work and break durations
- Visual progress ring
- Session counter
- Sound notifications (toggleable)
- Start, pause, and reset controls

### Quick Links
- Customizable bookmark grid
- Add links with custom emojis or automatic favicons
- Edit and delete functionality
- Opens links in new tabs

## Tech Stack

- React 18.3
- TypeScript (strict mode)
- Vite (fast build tool)
- Tailwind CSS (utility-first styling)
- Axios (API requests)
- Lucide React (icons)
- React Markdown (markdown rendering)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# From the root directory
npm install

# Or from the client directory
cd client
npm install
```

### Development

```bash
# From root directory
npm run dev

# Or from client directory
cd client
npm run dev
```

The app will be available at http://localhost:3000

### Production Build

```bash
# From root directory
npm run build

# Or from client directory
cd client
npm run build
```

Build output will be in `client/dist/`

### Preview Production Build

```bash
cd client
npm run preview
```

## Project Structure

```
client/
├── public/
│   └── vite.svg
├── src/
│   ├── api/
│   │   ├── index.ts         # Axios instance
│   │   ├── notes.ts         # Notes API
│   │   ├── tasks.ts         # Tasks API
│   │   └── links.ts         # Links API
│   ├── components/
│   │   ├── Button.tsx       # Reusable button
│   │   ├── Modal.tsx        # Reusable modal
│   │   ├── WidgetCard.tsx   # Widget wrapper
│   │   ├── WeatherWidget.tsx
│   │   ├── NotesWidget.tsx
│   │   ├── TasksWidget.tsx
│   │   ├── PomodoroWidget.tsx
│   │   └── QuickLinksWidget.tsx
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # React entry point
│   └── index.css            # Tailwind imports
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.ts
```

## Design System

### Colors
- Primary: Purple gradient (from-purple-500 to-pink-500)
- Background: Dark gradient (from-purple-900 via-blue-900 to-pink-900)
- Glassmorphism: backdrop-blur with semi-transparent backgrounds

### Animations
- fade-in: Smooth opacity transition
- slide-in: Slide from top with fade
- pulse-slow: Slow breathing animation

### Responsive Design
- Mobile: Single column layout
- Desktop: 2-column grid
- Weather widget spans full width on all screens

## API Integration

The app is designed to work with or without a backend:
- Falls back to localStorage when API is unavailable
- API endpoints expected at `/api/notes`, `/api/tasks`, `/api/links`
- Vite proxy configured to forward `/api` requests to `http://localhost:3001`

To connect to a backend, ensure it's running on port 3001 or update `vite.config.ts`.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires:
- Geolocation API support
- localStorage support
- Modern JavaScript features (ES2020)

## License

MIT
