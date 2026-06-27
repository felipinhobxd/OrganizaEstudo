import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Plus, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ClassMember, Class } from '@/types/database';

export default async function ClassesListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: userClasses } = await supabase
    .from('class_members')
    .select(`
      role,
      classes (
        id,
        name,
        description,
        invite_code,
        owner_id,
        created_at
      )
    `)
    .eq('user_id', user.id) as { data: (Pick<ClassMember, 'role'> & { classes: Class })[] | null };

  const classes = userClasses?.map((c) => c.classes) || [];

  return (
    <AppLayout user={user} classes={classes} title="Minhas Turmas">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Minhas Turmas</h1>
            <p className="text-gray-500 text-sm">Lista de todas as turmas que você participa.</p>
          </div>
          <Link href="/dashboard/classes/create">
            <Button leftIcon={<Plus size={18} />}>Nova Turma</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.length > 0 ? (
            userClasses?.map((item) => (
              <Link key={item.classes.id} href={`/dashboard/classes/${item.classes.id}`}>
                <Card hoverable className="h-full flex flex-col justify-between group">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Users className="text-primary" size={20} />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                        item.role === 'owner' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {item.role === 'owner' ? 'Proprietário' : 'Membro'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {item.classes.name}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                      {item.classes.description || "Sem descrição."}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-border flex justify-between items-center text-xs font-medium">
                    <span className="text-gray-400">Código: <span className="font-mono text-foreground">{item.classes.invite_code}</span></span>
                    <ArrowRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-border">
              <p className="text-gray-500">Você ainda não participa de nenhuma turma.</p>
              <Link href="/dashboard/classes/join" className="text-primary font-bold hover:underline mt-4 inline-block">
                Entrar em uma turma agora
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
