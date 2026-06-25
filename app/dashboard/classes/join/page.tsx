import { joinClass } from '@/app/dashboard/classes/actions';
import AppLayout from '@/components/layout/AppLayout';
import { createClient } from '@/utils/supabase/server';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { AlertCircle, Users } from 'lucide-react';
import { Class } from '@/types/database';

export default async function JoinClassPage(props: {
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
    <AppLayout user={user} classes={classes} title="Entrar em Turma">
      <div className="max-w-xl mx-auto py-12">
        <Card className="shadow-xl">
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="bg-primary/10 p-4 rounded-2xl mb-4 text-primary">
              <Users size={32} />
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Participar de uma Turma</h1>
            <p className="text-gray-500 mt-2">
              Insira o código enviado pelo seu colega ou professor.
            </p>
          </div>

          {searchParams.error && (
            <div className="mb-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex items-center space-x-3">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">{searchParams.error}</p>
            </div>
          )}

          <form action={joinClass} className="space-y-8">
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 text-center block">Código de Convite</label>
              <input
                id="invite_code"
                name="invite_code"
                type="text"
                required
                placeholder="Ex: 8XQ4LM2P"
                className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-border rounded-2xl py-6 text-center text-3xl font-mono font-bold tracking-[0.3em] uppercase focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-foreground"
              />
            </div>

            <div className="flex flex-col gap-4">
              <Button type="submit" className="w-full py-6 text-lg">Entrar na Turma</Button>
              <a href="/dashboard" className="w-full">
                <Button variant="ghost" className="w-full py-4 text-gray-400">Cancelar e Voltar</Button>
              </a>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
