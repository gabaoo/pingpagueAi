
import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDownIcon } from '../Icons';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        className={cn(
          'h-10 w-full appearance-none truncate rounded-md border border-slate-200 bg-transparent py-2 pl-3 pr-8 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="absolute right-3 top-3 h-4 w-4 opacity-50" />
    </div>
  );
});
Select.displayName = 'Select';

export default Select;
