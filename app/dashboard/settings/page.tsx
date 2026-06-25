import AppLayout from '@/components/layout/AppLayout';
import { createClient } from '@/utils/supabase/server';
import { Settings as SettingsIcon } from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userClasses } = await supabase
    .from('class_members')
    .select(`classes (id, name)`)
    .eq('user_id', user?.id);
  const classes = userClasses?.map((c: any) => c.classes) || [];

  return (
    <AppLayout user={user} classes={classes} title="Configurações">
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <SettingsIcon size={32} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Configurações da Conta</h1>
        <p className="text-gray-500 max-w-md">
          Gerencie seu perfil, preferências de notificação e segurança da conta nesta área (em breve).
        </p>
      </div>
    </AppLayout>
  );
}
