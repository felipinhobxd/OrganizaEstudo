import AppLayout from '@/components/layout/AppLayout';
import { createClient } from '@/utils/supabase/server';
import { Card } from '@/components/shared/Card';
import { Calendar as CalendarIcon } from 'lucide-react';

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userClasses } = await supabase
    .from('class_members')
    .select(`classes (id, name)`)
    .eq('user_id', user?.id);
  const classes = userClasses?.map((c: any) => c.classes) || [];

  return (
    <AppLayout user={user} classes={classes} title="Agenda">
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <CalendarIcon size={32} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Agenda e Cronograma</h1>
        <p className="text-gray-500 max-w-md">
          Em breve você poderá visualizar datas de provas, entregas de trabalhos e cronogramas de estudo aqui.
        </p>
      </div>
    </AppLayout>
  );
}
