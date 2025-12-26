import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Check, Calendar, ListTodo } from 'lucide-react';
import WidgetCard from './WidgetCard';
import Button from './Button';
import Modal from './Modal';
import { Task } from '../types';
import { tasksApi } from '../api/tasks';

type FilterType = 'all' | 'active' | 'completed';

const TasksWidget: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [formData, setFormData] = useState({
    title: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
  });
  const [useLocalStorage, setUseLocalStorage] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const apiTasks = await tasksApi.getAll();
      setTasks(apiTasks);
      setUseLocalStorage(false);
    } catch (error) {
      const stored = localStorage.getItem('tasks');
      if (stored) {
        setTasks(JSON.parse(stored));
      }
      setUseLocalStorage(true);
    }
  };

  const saveToStorage = (updatedTasks: Task[]) => {
    if (useLocalStorage) {
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    }
  };

  const handleAdd = async () => {
    if (!formData.title.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: formData.title,
      completed: false,
      priority: formData.priority,
      dueDate: formData.dueDate || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      if (useLocalStorage) {
        const updatedTasks = [...tasks, newTask];
        setTasks(updatedTasks);
        saveToStorage(updatedTasks);
      } else {
        const created = await tasksApi.create({
          title: newTask.title,
          completed: false,
          priority: newTask.priority,
          dueDate: newTask.dueDate,
        });
        setTasks([...tasks, created]);
      }
      setFormData({ title: '', priority: 'medium', dueDate: '' });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      if (useLocalStorage) {
        const updatedTasks = tasks.map((task) =>
          task.id === id ? { ...task, completed: !task.completed } : task
        );
        setTasks(updatedTasks);
        saveToStorage(updatedTasks);
      } else {
        const updated = await tasksApi.toggleComplete(id);
        setTasks(tasks.map((task) => (task.id === id ? updated : task)));
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (useLocalStorage) {
        const updatedTasks = tasks.filter((task) => task.id !== id);
        setTasks(updatedTasks);
        saveToStorage(updatedTasks);
      } else {
        await tasksApi.delete(id);
        setTasks(tasks.filter((task) => task.id !== id));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          badge: 'bg-red-500/10 text-red-400 border-red-500/20',
          indicator: 'bg-red-500',
        };
      case 'medium':
        return {
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          indicator: 'bg-amber-500',
        };
      case 'low':
        return {
          badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
          indicator: 'bg-teal-500',
        };
      default:
        return {
          badge: 'bg-white/5 text-white/40 border-white/10',
          indicator: 'bg-white/40',
        };
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <>
      <WidgetCard title="Tasks" delay={2}>
        {/* Progress bar */}
        {tasks.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-white/40">Progress</span>
              <span className="text-amber-400">{completedCount}/{tasks.length}</span>
            </div>
            <div className="h-1 bg-noir-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
              />
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-noir-800/50 rounded-lg mb-4">
          {(['all', 'active', 'completed'] as FilterType[]).map((f) => (
            <motion.button
              key={f}
              onClick={() => setFilter(f)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-amber-300 text-black'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </motion.button>
          ))}
        </div>

        {/* Task list */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 mb-4">
          {filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <ListTodo className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">
                {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task, index) => {
                const styles = getPriorityStyles(task.priority);
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 25,
                      delay: index * 0.03
                    }}
                    className={`group relative bg-noir-800/50 rounded-xl p-3 border border-white/[0.04] ${
                      task.completed ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <motion.button
                        onClick={() => handleToggle(task.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          task.completed
                            ? 'bg-teal-500 border-teal-500'
                            : 'border-white/20 hover:border-amber-400/50'
                        }`}
                      >
                        <AnimatePresence>
                          {task.completed && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                            >
                              <Check className="w-3 h-3 text-noir-950" strokeWidth={3} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm text-white ${task.completed ? 'line-through text-white/50' : ''}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded border ${styles.badge}`}>
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-white/40 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(task.id)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-white/[0.04] hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="w-full">
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </WidgetCard>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Task">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Task</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-noir-800 border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-colors"
              placeholder="What needs to be done?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Priority</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((p) => {
                const styles = getPriorityStyles(p);
                return (
                  <motion.button
                    key={p}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      formData.priority === p
                        ? styles.badge
                        : 'border-white/[0.08] text-white/40 hover:border-white/20'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </motion.button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-4 py-2.5 bg-noir-800 border border-white/[0.08] rounded-lg text-white focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-colors"
            />
          </div>
          <Button onClick={handleAdd} className="w-full">
            Add Task
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default TasksWidget;
