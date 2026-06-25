'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  Calendar,
  Settings,
  Plus,
  GraduationCap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/utils/ui/cn';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Class } from '@/types/database';

interface SidebarProps {
  classes: Class[];
}

export default function Sidebar({ classes }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const mainNav = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Minhas Turmas', href: '/dashboard/classes', icon: BookOpen },
    { name: 'Agenda', href: '/dashboard/calendar', icon: Calendar },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="bg-sidebar border-r border-border h-screen sticky top-0 flex flex-col transition-all duration-300 z-40"
    >
      <div className="p-6 flex items-center justify-between">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center space-x-2 shrink-0"
            >
              <div className="bg-primary p-1.5 rounded-lg">
                <GraduationCap className="text-white" size={24} />
              </div>
              <span className="font-bold text-xl tracking-tight text-foreground">Organiza</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-sidebar-foreground transition shrink-0"
          aria-label={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
        {mainNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all group",
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-sidebar-foreground hover:bg-gray-200 dark:hover:bg-gray-800"
              )}
            >
              <item.icon size={20} className={cn(isActive ? "text-white" : "text-gray-400 group-hover:text-foreground")} />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          );
        })}

        <div className="pt-8 pb-4">
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Suas Turmas
            </p>
          )}
          <div className="space-y-1">
            {classes.map((cls) => {
              const isActive = pathname.includes(`/dashboard/classes/${cls.id}`);
              return (
                <Link
                  key={cls.id}
                  href={`/dashboard/classes/${cls.id}`}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-xl transition-all group",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground hover:bg-gray-200 dark:hover:bg-gray-800"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    isActive ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"
                  )} />
                  {!isCollapsed && <span className="text-sm font-medium truncate">{cls.name}</span>}
                </Link>
              );
            })}

            <Link
              href="/dashboard/classes/create"
              className="flex items-center space-x-3 px-3 py-2 rounded-xl text-gray-400 hover:text-primary transition-colors group"
            >
              <Plus size={20} />
              {!isCollapsed && <span className="text-sm font-medium">Criar Turma</span>}
            </Link>
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center space-x-3 px-3 py-2 rounded-xl transition-all",
            pathname === '/dashboard/settings'
              ? "bg-primary/10 text-primary"
              : "text-sidebar-foreground hover:bg-gray-200 dark:hover:bg-gray-800"
          )}
        >
          <Settings size={20} />
          {!isCollapsed && <span className="font-medium text-sm">Configurações</span>}
        </Link>
      </div>
    </motion.aside>
  );
}
