import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { aiApi, ParsedTask } from '../api/ai';

interface NaturalLanguageInputProps {
  onTaskParsed: (task: ParsedTask) => void;
  onError?: () => void;
  disabled?: boolean;
}

const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({
  onTaskParsed,
  onError,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || isLoading || disabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await aiApi.parseTask(text.trim());
      setText('');
      onTaskParsed(result.task);
    } catch (err) {
      console.error('Failed to parse task:', err);
      setError('AI unavailable');
      onError?.();
    } finally {
      setIsLoading(false);
    }
  }, [text, isLoading, disabled, onTaskParsed, onError]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        {/* Input field */}
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          disabled={isLoading || disabled}
          placeholder="Type naturally... e.g., 'Call mom tomorrow morning'"
          className="w-full pl-10 pr-4 py-3 bg-white/[0.06] border border-purple-500/20 rounded-xl text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        />

        {/* Sparkles icon / Loading spinner */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ rotate: { duration: 1, repeat: Infinity, ease: 'linear' } }}
              >
                <Loader2 className="w-4 h-4 text-purple-400" />
              </motion.div>
            ) : (
              <motion.div
                key="sparkles"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
              >
                <Sparkles className="w-4 h-4 text-purple-400/70" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            className="flex items-center gap-1.5 mt-2 text-xs text-red-400/80"
          >
            <AlertCircle className="w-3 h-3" />
            <span>{error} - use manual entry below</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint text */}
      <AnimatePresence>
        {text.length > 0 && !isLoading && !error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 text-xs text-white/30"
          >
            Press Enter to parse with AI
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NaturalLanguageInput;
