'use client';
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none',
  { variants: { variant: {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-sm',
    premium: 'btn-premium text-white rounded-xl font-bold',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl',
    outline: 'border-2 border-border bg-transparent hover:bg-accent hover:border-primary/40 rounded-xl',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl',
    ghost: 'hover:bg-accent hover:text-accent-foreground rounded-xl',
    link: 'text-primary underline-offset-4 hover:underline',
    'orange-outline': 'border-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-400 rounded-xl',
    'glass-dark': 'glass-dark text-white hover:bg-white/10 rounded-xl',
  }, size: {
    default: 'h-11 px-5 py-2.5 text-sm',
    sm: 'h-8 px-3.5 py-1.5 text-xs rounded-lg',
    lg: 'h-13 px-7 py-3 text-base',
    xl: 'h-14 px-9 py-3.5 text-lg',
    '2xl': 'h-16 px-12 py-4 text-xl',
    icon: 'h-10 w-10 rounded-xl',
    'icon-sm': 'h-8 w-8 rounded-lg',
    'icon-lg': 'h-12 w-12 rounded-xl',
  } }, defaultVariants: { variant: 'default', size: 'default' } }
);
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';
export { Button, buttonVariants };
