'use client';

import { cn } from '@/utils/ui/cn';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function Card({ children, className, hoverable = false }: CardProps) {
  return (
    <motion.div
      whileHover={hoverable ? { y: -4, scale: 1.01 } : {}}
      className={cn(
        "bg-white dark:bg-gray-900 border border-border rounded-2xl p-6 shadow-sm overflow-hidden",
        hoverable && "cursor-pointer hover:shadow-xl hover:border-primary/20 transition-colors",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
