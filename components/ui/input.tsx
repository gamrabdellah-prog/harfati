import * as React from 'react';
import { cn } from '@/lib/utils';
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input type={type} className={cn('flex h-12 w-full rounded-2xl border border-border bg-white px-5 py-3 text-sm transition-all outline-none placeholder:text-muted-foreground/60 hover:border-orange-300/70 focus:border-orange-400 focus:ring-2 focus:ring-orange-500/12 disabled:cursor-not-allowed disabled:opacity-50', className)} ref={ref} {...props} />
));
Input.displayName = 'Input';
export { Input };
