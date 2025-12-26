import React from 'react';
import { motion } from 'motion/react';

interface WidgetCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  delay?: number;
}

const WidgetCard: React.FC<WidgetCardProps> = ({
  title,
  children,
  className = '',
  fullWidth = false,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        delay: delay * 0.1
      }}
      whileHover={{
        y: -2,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      }}
      className={`
        ${fullWidth ? 'col-span-1 lg:col-span-2' : 'col-span-1'}
        relative
        bg-noir-850
        rounded-2xl
        border border-white/[0.06]
        shadow-crystal
        overflow-hidden
        crystal-shine
        ${className}
      `}
    >
      {/* Subtle top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Corner accent */}
      <div className="absolute top-0 left-0 w-16 h-16 overflow-hidden">
        <div className="absolute top-0 left-0 w-px h-8 bg-gradient-to-b from-amber-400/50 to-transparent" />
        <div className="absolute top-0 left-0 h-px w-8 bg-gradient-to-r from-amber-400/50 to-transparent" />
      </div>

      <div className="p-6">
        <motion.h2
          className="font-display text-xl font-semibold text-white mb-5 tracking-tight flex items-center gap-3"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay * 0.1 + 0.1 }}
        >
          <span className="w-1 h-5 bg-amber-400 rounded-full" />
          {title}
        </motion.h2>
        <div className="text-white/80">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export default WidgetCard;
