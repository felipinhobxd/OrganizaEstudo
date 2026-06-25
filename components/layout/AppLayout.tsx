'use client';

import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { User } from '@supabase/supabase-js';
import { Class } from '@/types/database';

interface AppLayoutProps {
  children: React.ReactNode;
  user: User | null;
  classes: Class[];
  title?: string;
}

export default function AppLayout({ children, user, classes, title }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar classes={classes} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar user={user} title={title} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
