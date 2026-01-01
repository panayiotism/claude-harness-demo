import React from 'react';
import { motion } from 'motion/react';
import { Plus, X, Lightbulb } from 'lucide-react';
import { TaskSuggestion } from '../api/ai';

interface SuggestionCardProps {
  suggestion: TaskSuggestion;
  onAdd: (suggestion: TaskSuggestion) => void;
  onDismiss: (id: string) => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAdd,
  onDismiss,
}) => {
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'low':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      default:
        return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="relative bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-xl p-3 border border-purple-500/20"
    >
      <div className="flex items-start gap-3">
        {/* Lightbulb icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-purple-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-white mb-1">
            {suggestion.title}
          </p>
          <p className="text-xs text-white/40 mb-2">
            {suggestion.reason}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded border ${getPriorityStyles(suggestion.priority)}`}>
            {suggestion.priority}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onAdd(suggestion)}
            className="p-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 transition-colors"
            title="Add task"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDismiss(suggestion.id)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default SuggestionCard;
