import * as React from 'react';
import { cn } from '@/lib/utils';
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea className={cn('flex min-h-[110px] w-full rounded-2xl border border-border bg-white px-5 py-3.5 text-sm transition-all outline-none resize-none placeholder:text-muted-foreground/60 hover:border-orange-300/70 focus:border-orange-400 focus:ring-2 focus:ring-orange-500/12 disabled:cursor-not-allowed disabled:opacity-50', className)} ref={ref} {...props} />
));
Textarea.displayName = 'Textarea';
export { Textarea };
