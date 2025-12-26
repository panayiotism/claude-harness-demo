import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX } from 'lucide-react';
import WidgetCard from './WidgetCard';
import Button from './Button';
import Modal from './Modal';

type TimerMode = 'work' | 'break';

const PomodoroWidget: React.FC = () => {
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>('work');
  const [sessions, setSessions] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    if (soundEnabled) {
      playSound();
    }
    if (mode === 'work') {
      setSessions((prev) => prev + 1);
      setMode('break');
      setTimeLeft(breakDuration * 60);
    } else {
      setMode('work');
      setTimeLeft(workDuration * 60);
    }
  };

  const playSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setMode('work');
    setTimeLeft(workDuration * 60);
  };

  const handleSaveSettings = () => {
    setTimeLeft(mode === 'work' ? workDuration * 60 : breakDuration * 60);
    setIsSettingsOpen(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSeconds = mode === 'work' ? workDuration * 60 : breakDuration * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 88;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <>
      <WidgetCard title="Pomodoro" delay={3}>
        <div className="flex flex-col items-center">
          {/* Timer Display */}
          <div className="relative w-48 h-48 mb-6">
            {/* Background circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-noir-700"
              />
              {/* Progress circle */}
              <motion.circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={mode === 'work' ? 'text-amber-400' : 'text-teal-400'}
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={timeLeft}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.15 }}
                  className="font-display text-4xl font-bold text-white tracking-tight"
                >
                  {formatTime(timeLeft)}
                </motion.div>
              </AnimatePresence>
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-xs font-medium mt-1 ${
                  mode === 'work' ? 'text-amber-400' : 'text-teal-400'
                }`}
              >
                {mode === 'work' ? 'Focus Time' : 'Break Time'}
              </motion.div>
            </div>

            {/* Pulsing glow when running */}
            {isRunning && (
              <motion.div
                className={`absolute inset-0 rounded-full ${
                  mode === 'work' ? 'bg-amber-400' : 'bg-teal-400'
                }`}
                initial={{ opacity: 0.1, scale: 1 }}
                animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ filter: 'blur(30px)', zIndex: -1 }}
              />
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 mb-6">
            {!isRunning ? (
              <Button onClick={handleStart} size="lg">
                <Play className="w-5 h-5" />
                Start
              </Button>
            ) : (
              <Button onClick={handlePause} variant="secondary" size="lg">
                <Pause className="w-5 h-5" />
                Pause
              </Button>
            )}
            <motion.button
              whileHover={{ scale: 1.05, rotate: -15 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="p-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <motion.div
                key={sessions}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="font-display text-2xl font-bold text-white"
              >
                {sessions}
              </motion.div>
              <div className="text-xs text-white/40 mt-0.5">Sessions</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled
                  ? 'text-amber-400 bg-amber-400/10'
                  : 'text-white/40 bg-white/[0.04]'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </WidgetCard>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Timer Settings">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Work Duration
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="60"
                value={workDuration}
                onChange={(e) => setWorkDuration(parseInt(e.target.value))}
                className="flex-1 h-1.5 bg-noir-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400"
              />
              <span className="w-16 text-right font-display font-medium text-white">
                {workDuration} min
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Break Duration
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="30"
                value={breakDuration}
                onChange={(e) => setBreakDuration(parseInt(e.target.value))}
                className="flex-1 h-1.5 bg-noir-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-400"
              />
              <span className="w-16 text-right font-display font-medium text-white">
                {breakDuration} min
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <label className="text-sm font-medium text-white/60">Sound Notifications</label>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                soundEnabled ? 'bg-amber-400' : 'bg-noir-700'
              }`}
            >
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm ${
                  soundEnabled ? 'left-7' : 'left-1'
                }`}
              />
            </motion.button>
          </div>
          <Button onClick={handleSaveSettings} className="w-full">
            Save Settings
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default PomodoroWidget;
