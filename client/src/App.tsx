import { motion } from 'motion/react';
import WeatherWidget from './components/WeatherWidget';
import NotesWidget from './components/NotesWidget';
import TasksWidget from './components/TasksWidget';
import PomodoroWidget from './components/PomodoroWidget';
import QuickLinksWidget from './components/QuickLinksWidget';

function App() {
  return (
    <div className="min-h-screen bg-noir-950 relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Top-left glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        {/* Bottom-right glow */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* Main content */}
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="mb-10 pt-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-gradient-to-b from-amber-400 to-amber-500/50 rounded-full" />
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
                Dashboard
              </h1>
            </div>
            <p className="text-white/40 text-sm ml-5 pl-px">
              Your personal productivity command center
            </p>
          </motion.header>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <WeatherWidget />
            <NotesWidget />
            <TasksWidget />
            <PomodoroWidget />
            <QuickLinksWidget />
          </div>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 pb-6 text-center"
          >
            <p className="text-white/20 text-xs tracking-wide">
              Built with React, TypeScript, Tailwind CSS & Motion
            </p>
          </motion.footer>
        </div>
      </div>
    </div>
  );
}

export default App;
