import { createClass } from '@/app/dashboard/classes/actions';
import AppLayout from '@/components/layout/AppLayout';
import { createClient } from '@/utils/supabase/server';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { AlertCircle, BookPlus } from 'lucide-react';
import { Class } from '@/types/database';

export default async function CreateClassPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userClasses } = await supabase
    .from('class_members')
    .select(`classes (id, name)`)
    .eq('user_id', user?.id);
  const classes = userClasses?.map((c) => c.classes as unknown as Class) || [];

  return (
    <AppLayout user={user} classes={classes} title="Criar Turma">
      <div className="max-w-2xl mx-auto py-12">
        <Card className="shadow-xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="bg-primary/10 p-4 rounded-2xl mb-4 text-primary">
              <BookPlus size={32} />
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Nova Turma</h1>
            <p className="text-gray-500 mt-2">
              Crie um ambiente de estudos colaborativo. O código de acesso será gerado após a criação.
            </p>
          </div>

          {searchParams.error && (
            <div className="mb-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex items-center space-x-3">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">{searchParams.error}</p>
            </div>
          )}

          <form action={createClass} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400">Nome da Turma</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Ex: Engenharia de Software 2026"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400">Descrição (Opcional)</label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Fale brevemente sobre o objetivo deste grupo de estudos..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground resize-none"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <a href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full py-6">Cancelar</Button>
              </a>
              <Button type="submit" className="flex-1 py-6">Criar Turma</Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
