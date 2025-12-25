import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Calendar } from 'lucide-react';
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 border-red-500/50 text-red-300';
      case 'medium':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300';
      case 'low':
        return 'bg-green-500/20 border-green-500/50 text-green-300';
      default:
        return 'bg-gray-500/20 border-gray-500/50 text-gray-300';
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  return (
    <>
      <WidgetCard title="Tasks">
        <div className="mb-4 flex gap-2">
          {(['all', 'active', 'completed'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              {filter === 'all' ? 'No tasks yet!' : `No ${filter} tasks`}
            </div>
          ) : (
            filteredTasks.map((task, index) => (
              <div
                key={task.id}
                className={`bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-all duration-200 border border-white/10 animate-slide-in ${
                  task.completed ? 'opacity-60' : ''
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggle(task.id)}
                    className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      task.completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-white/40 hover:border-white/60'
                    }`}
                  >
                    {task.completed && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-white ${task.completed ? 'line-through' : ''}`}>
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className="text-xs text-white/50 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-red-300 hover:text-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="w-full">
          <Plus className="w-5 h-5" />
          Add Task
        </Button>
      </WidgetCard>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Task">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Task</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="What needs to be done?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Due Date (Optional)</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
