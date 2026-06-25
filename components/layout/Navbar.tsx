'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Bell, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface NavbarProps {
  user: SupabaseUser | null;
  title?: string;
}

export default function Navbar({ user, title = "Dashboard" }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Usando requestAnimationFrame ou setTimeout para evitar o erro de set-state-in-effect
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return (
    <header className="bg-background/80 backdrop-blur-md border-b border-border h-16 sticky top-0 px-8 flex justify-between items-center z-30">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
      </div>
    </header>
  );

  return (
    <header className="bg-background/80 backdrop-blur-md border-b border-border h-16 sticky top-0 px-8 flex justify-between items-center z-30">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 hover:text-foreground transition"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 hover:text-foreground transition relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>

        <div className="flex items-center space-x-3 border-l border-border pl-4">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm uppercase">
            {user?.email?.charAt(0) || <User size={16} />}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold leading-none text-foreground truncate max-w-[120px]">
              {user?.email?.split('@')[0]}
            </p>
            <span className="text-[10px] text-gray-400">Aluno</span>
          </div>
        </div>
      </div>
    </header>
  );
}
