/**
 * Mobile Card Component
 * Touch-optimized card with mobile-first design
 */
import React from 'react';
import { useHapticFeedback } from '../../hooks/mobile/useHapticFeedback';

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  onLongPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  disabled?: boolean;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  className = '',
  onClick,
  onLongPress,
  variant = 'default',
  padding = 'md',
  hover = true,
  disabled = false
}) => {
  const { light } = useHapticFeedback();

  const handleClick = () => {
    if (disabled) return;
    if (onClick) {
      light();
      onClick();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (disabled) return;
    if (onLongPress) {
      e.preventDefault();
      light();
      onLongPress();
    }
  };

  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg border-0',
    outlined: 'bg-transparent border-2 border-gray-300 dark:border-gray-600',
    glass: 'bg-white/10 backdrop-blur-md border border-white/20'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const baseClasses = `
    rounded-xl
    transition-all
    duration-200
    ease-in-out
    ${variantClasses[variant]}
    ${paddingClasses[padding]}
    ${onClick && !disabled ? 'cursor-pointer touch-target' : ''}
    ${hover && onClick && !disabled ? 'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={baseClasses}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      disabled={disabled}
    >
      {children}
    </Component>
  );
};

export default MobileCard;