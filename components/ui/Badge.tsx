
import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', ...props }) => {
  const variantClasses = {
    default: 'border-transparent bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-900',
    secondary: 'border-transparent bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50',
    destructive: 'border-transparent bg-red-500 text-slate-50 dark:bg-red-900 dark:text-slate-50',
    outline: 'text-slate-950 dark:text-slate-50',
    success: 'border-transparent bg-emerald-500 text-slate-50 dark:bg-emerald-700 dark:text-slate-50',
    warning: 'border-transparent bg-amber-500 text-slate-50 dark:bg-amber-600 dark:text-slate-50'
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:border-slate-800 dark:focus:ring-slate-300',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
};

export default Badge;
