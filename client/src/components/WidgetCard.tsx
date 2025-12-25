import React from 'react';

interface WidgetCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

const WidgetCard: React.FC<WidgetCardProps> = ({ title, children, className = '', fullWidth = false }) => {
  return (
    <div
      className={`
        ${fullWidth ? 'col-span-1 lg:col-span-2' : 'col-span-1'}
        bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20
        p-6 transition-all duration-300 hover:shadow-2xl hover:bg-white/15
        animate-fade-in
        ${className}
      `}
    >
      <h2 className="text-2xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        {title}
      </h2>
      <div className="text-white/90">
        {children}
      </div>
    </div>
  );
};

export default WidgetCard;
