import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, RefreshCw, TrendingUp, CheckCircle2, Clock, Lightbulb, Loader2 } from 'lucide-react';
import WidgetCard from './WidgetCard';
import Button from './Button';
import { ProductivityStats, InsightsResponse, aiApi } from '../api/ai';
import { tasksApi } from '../api/tasks';

const CACHE_KEY = 'insights_cache';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

interface CachedInsights {
  insights: InsightsResponse;
  cachedAt: number;
}

const InsightsWidget: React.FC = () => {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [stats, setStats] = useState<ProductivityStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canRefresh, setCanRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load cached insights
  const loadCachedInsights = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { insights: cachedInsights, cachedAt }: CachedInsights = JSON.parse(cached);
        const age = Date.now() - cachedAt;
        if (age < CACHE_TTL) {
          setInsights(cachedInsights);
          setLastUpdated(new Date(cachedAt));
          setCanRefresh(age >= CACHE_TTL);
          return true;
        }
      }
    } catch {
      localStorage.removeItem(CACHE_KEY);
    }
    return false;
  }, []);

  // Load stats from tasks
  const loadStats = useCallback(async () => {
    try {
      const tasks = await tasksApi.getAll();
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      const completedTasks = tasks.filter((t) => t.completed);
      const completedToday = completedTasks.filter((t) => {
        const completedDate = new Date(t.createdAt);
        return completedDate >= todayStart;
      });
      const completedThisWeek = completedTasks.filter((t) => {
        const completedDate = new Date(t.createdAt);
        return completedDate >= weekStart;
      });

      // Get pomodoro stats from localStorage (PomodoroWidget stores sessions there)
      let pomodoroSessions = 0;
      let pomodoroMinutes = 0;
      try {
        const pomodoroData = localStorage.getItem('pomodoro_sessions');
        if (pomodoroData) {
          const sessions = JSON.parse(pomodoroData);
          pomodoroSessions = sessions.length;
          pomodoroMinutes = sessions.reduce((acc: number, s: { duration: number }) => acc + s.duration, 0);
        }
      } catch {
        // Ignore pomodoro parse errors
      }

      const newStats: ProductivityStats = {
        tasksCompleted: completedTasks.length,
        tasksTotal: tasks.length,
        tasksCompletedToday: completedToday.length,
        tasksCompletedThisWeek: completedThisWeek.length,
        pomodoroSessions,
        pomodoroMinutes,
        completionRate: tasks.length > 0 ? completedTasks.length / tasks.length : 0,
      };

      setStats(newStats);
      return newStats;
    } catch {
      // Fallback to localStorage tasks
      const stored = localStorage.getItem('tasks');
      if (stored) {
        const tasks = JSON.parse(stored);
        const completed = tasks.filter((t: { completed: boolean }) => t.completed);
        return {
          tasksCompleted: completed.length,
          tasksTotal: tasks.length,
          tasksCompletedToday: 0,
          tasksCompletedThisWeek: completed.length,
          pomodoroSessions: 0,
          pomodoroMinutes: 0,
          completionRate: tasks.length > 0 ? completed.length / tasks.length : 0,
        };
      }
      return null;
    }
  }, []);

  // Generate insights
  const generateInsights = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const hasCached = loadCachedInsights();
      if (hasCached) return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentStats = await loadStats();
      if (!currentStats) {
        setError('No task data available');
        return;
      }

      const newInsights = await aiApi.getInsights(currentStats);

      // Cache the insights
      const cacheData: CachedInsights = {
        insights: newInsights,
        cachedAt: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

      setInsights(newInsights);
      setLastUpdated(new Date());
      setCanRefresh(false);

      // Re-enable refresh after TTL
      setTimeout(() => setCanRefresh(true), CACHE_TTL);
    } catch (err) {
      console.error('Error generating insights:', err);
      setError('Unable to generate insights');
    } finally {
      setIsLoading(false);
    }
  }, [loadCachedInsights, loadStats]);

  // Initial load
  useEffect(() => {
    loadStats();
    generateInsights();
  }, [loadStats, generateInsights]);

  // Listen for task changes from TasksWidget
  useEffect(() => {
    const handleTasksUpdated = () => {
      // Reload stats when tasks change (but don't regenerate AI insights)
      loadStats();
    };

    window.addEventListener('tasks-updated', handleTasksUpdated);
    return () => {
      window.removeEventListener('tasks-updated', handleTasksUpdated);
    };
  }, [loadStats]);

  // Format time since last update
  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    const mins = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  return (
    <WidgetCard title="Insights" delay={5}>
      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-teal-500/10 rounded-xl p-3 text-center border border-teal-500/20"
          >
            <CheckCircle2 className="w-5 h-5 text-teal-400 mx-auto mb-1" />
            <div className="font-display text-xl font-bold text-white">
              {stats.tasksCompleted}
            </div>
            <div className="text-xs text-white/40">Completed</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-amber-500/10 rounded-xl p-3 text-center border border-amber-500/20"
          >
            <TrendingUp className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <div className="font-display text-xl font-bold text-white">
              {Math.round(stats.completionRate * 100)}%
            </div>
            <div className="text-xs text-white/40">Rate</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-purple-500/10 rounded-xl p-3 text-center border border-purple-500/20"
          >
            <Clock className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <div className="font-display text-xl font-bold text-white">
              {stats.pomodoroMinutes}
            </div>
            <div className="text-xs text-white/40">Focus mins</div>
          </motion.div>
        </div>
      )}

      {/* AI Insights */}
      <div className="mb-4">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-8"
            >
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              <span className="ml-2 text-sm text-white/40">Analyzing your productivity...</span>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <Brain className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/40">{error}</p>
            </motion.div>
          ) : insights ? (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-xl p-4 border border-purple-500/20">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-white/80 leading-relaxed">
                    {insights.summary}
                  </p>
                </div>
              </div>

              {/* Tips */}
              {insights.tips.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Tips for you</span>
                  </div>
                  {insights.tips.map((tip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-start gap-2 text-sm text-white/60"
                    >
                      <span className="text-amber-400">•</span>
                      <span>{tip}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <Brain className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/40">Add some tasks to get insights</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {lastUpdated && (
          <span className="text-xs text-white/30">{formatLastUpdated()}</span>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => generateInsights(true)}
          disabled={isLoading || !canRefresh}
          className="ml-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {canRefresh ? 'Refresh' : 'Wait 1hr'}
        </Button>
      </div>
    </WidgetCard>
  );
};

export default InsightsWidget;
