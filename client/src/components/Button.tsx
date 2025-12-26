import React from 'react';
import { motion } from 'motion/react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  onClick,
  type = 'button',
}) => {
  const baseClasses = `
    font-display font-medium
    rounded-lg
    flex items-center justify-center gap-2
    transition-colors duration-200
    disabled:opacity-40 disabled:cursor-not-allowed
    relative overflow-hidden
  `;

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-amber-300 to-amber-400
      text-black font-semibold
      shadow-glow-amber
      hover:from-amber-400 hover:to-amber-500
    `,
    secondary: `
      bg-white/[0.06]
      text-white
      border border-white/10
      hover:bg-white/[0.1]
      hover:border-white/15
    `,
    danger: `
      bg-red-500/20
      text-red-400
      border border-red-500/30
      hover:bg-red-500/30
    `,
    ghost: `
      bg-transparent
      text-white/60
      hover:text-white
      hover:bg-white/[0.04]
    `,
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </motion.button>
  );
};

export default Button;
