'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Bell, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Profile } from '@/types/database';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';

interface NavbarProps {
  user: SupabaseUser | null;
  profile?: Profile | null;
  notifications?: any[];
  title?: string;
}

export default function Navbar({ user, profile, notifications = [], title = "Dashboard" }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="bg-background/80 backdrop-blur-md border-b border-border h-16 sticky top-0 px-8 flex justify-between items-center z-30">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
        </div>
      </header>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const avatarUrl = profile?.avatar_url;

  return (
    <header className="bg-background/80 backdrop-blur-md border-b border-border h-16 sticky top-0 px-8 flex justify-between items-center z-30">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
      </div>

      <div className="flex items-center space-x-4">
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 hover:text-foreground transition"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 hover:text-foreground transition relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-white text-[10px] flex items-center justify-center font-black rounded-full border-2 border-background">
                {unreadCount}
              </span>
            )}
          </button>

          <NotificationPanel
            notifications={notifications}
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
          />
        </div>

        <div className="flex items-center space-x-3 border-l border-border pl-4">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm uppercase overflow-hidden border border-primary/20">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              displayName.charAt(0) || <User size={16} />
            )}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold leading-none text-foreground truncate max-w-[120px]">
              {displayName}
            </p>
            <span className="text-[10px] text-gray-400">Aluno</span>
          </div>
        </div>
      </div>
    </header>
  );
}
