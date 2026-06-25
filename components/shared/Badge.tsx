'use client';

import { cn } from '@/utils/ui/cn';

export type BadgeColor = 'gray' | 'blue' | 'red' | 'indigo' | 'green' | 'amber';

interface BadgeProps {
  icon?: React.ReactNode;
  label: string;
  color?: BadgeColor;
  className?: string;
}

export function Badge({ icon, label, color = 'gray', className }: BadgeProps) {
  const colors: Record<BadgeColor, string> = {
    gray: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    red: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
    green: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  };

  return (
    <div className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight",
      colors[color],
      className
    )}>
      {icon && <span className="mr-1 shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
    </div>
  );
}
