'use client';

import { useState } from 'react';
import { Bell, X, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/shared/Button';
import { cn } from '@/utils/ui/cn';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/app/dashboard/actions';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

interface NotificationPanelProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ notifications, isOpen, onClose }: NotificationPanelProps) {
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      toast.success('Todas as notificações lidas.');
    } catch (error) {
      toast.error('Erro ao marcar como lidas.');
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-950 border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <header className="p-4 border-b border-border flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex items-center space-x-2">
                <Bell size={18} className="text-primary" />
                <h3 className="font-bold text-foreground">Notificações</h3>
                {unreadCount > 0 && (
                  <span className="bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={isMarkingAll}
                    className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline disabled:opacity-50"
                  >
                    Ler tudo
                  </button>
                )}
                <button onClick={onClose} className="text-gray-400 hover:text-foreground transition">
                  <X size={18} />
                </button>
              </div>
            </header>

            <main className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center space-y-3">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400">
                    <Bell size={24} />
                  </div>
                  <p className="text-sm text-gray-500">Nenhuma notificação por enquanto.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group relative",
                        !n.read && "bg-primary/5 dark:bg-primary/10"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-foreground pr-6">{n.title}</h4>
                        {!n.read && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="absolute top-4 right-4 p-1 text-primary opacity-0 group-hover:opacity-100 transition shadow-sm bg-white dark:bg-gray-800 rounded-md border border-border"
                            title="Marcar como lida"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed mb-2">{n.message}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(n.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        {n.link && (
                          <a
                            href={n.link}
                            className="text-[10px] font-bold text-primary flex items-center hover:underline"
                          >
                            Ver detalhes <ExternalLink size={10} className="ml-1" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>

            <footer className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-border text-center">
              <button className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-foreground transition">
                Ver histórico completo
              </button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
