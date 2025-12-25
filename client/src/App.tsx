import WeatherWidget from './components/WeatherWidget';
import NotesWidget from './components/NotesWidget';
import TasksWidget from './components/TasksWidget';
import PomodoroWidget from './components/PomodoroWidget';
import QuickLinksWidget from './components/QuickLinksWidget';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
            Personal Dashboard
          </h1>
          <p className="text-white/60 text-lg">
            Your productivity hub
          </p>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weather Widget - Full Width */}
          <WeatherWidget />

          {/* Notes Widget */}
          <NotesWidget />

          {/* Tasks Widget */}
          <TasksWidget />

          {/* Pomodoro Widget */}
          <PomodoroWidget />

          {/* Quick Links Widget */}
          <QuickLinksWidget />
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-white/40 text-sm animate-fade-in">
          <p>Built with React, TypeScript, and Tailwind CSS</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
