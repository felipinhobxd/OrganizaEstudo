import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Plus, Users, ArrowRight } from 'lucide-react';
import { ClassMember, Class } from '@/types/database';
import { getNotifications } from './actions';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch data in parallel to optimize performance
  const [profileRes, userClassesRes, notificationsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('class_members').select(`role, classes (*)`).eq('user_id', user.id),
    getNotifications()
  ]);

  const profile = profileRes.data;
  const userClasses = userClassesRes.data as any[];
  const notifications = notificationsRes;

  const classes = userClasses?.map((c) => c.classes) || [];

  return (
    <AppLayout
      user={user}
      profile={profile}
      classes={classes}
      notifications={notifications}
      title="Dashboard"
    >
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Olá, {profile?.full_name || user?.email?.split('@')[0]}! 👋
            </h1>
            <p className="text-gray-500 mt-1">Bem-vindo de volta ao seu centro de estudos.</p>
          </div>
          <div className="flex space-x-3">
            <Link href="/dashboard/classes/join">
              <Button variant="outline" leftIcon={<Users size={18} />}>
                Entrar em Turma
              </Button>
            </Link>
            <Link href="/dashboard/classes/create">
              <Button leftIcon={<Plus size={18} />}>
                Criar Turma
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userClasses && userClasses.length > 0 ? (
            userClasses.map((item) => (
              <Link key={item.classes.id} href={`/dashboard/classes/${item.classes.id}`}>
                <Card hoverable className="h-full flex flex-col justify-between group">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <Users className="text-primary" size={20} />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                        item.role === 'owner' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                      }`}>
                        {item.role === 'owner' ? 'Proprietário' : 'Membro'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {item.classes.name}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                      {item.classes.description || "Nenhuma descrição fornecida para esta turma."}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-border flex justify-between items-center text-xs font-medium">
                    <span className="text-gray-400">Código: <span className="text-foreground font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{item.classes.invite_code}</span></span>
                    <ArrowRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Plus className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Você ainda não faz parte de nenhuma turma</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-8">
                Crie seu primeiro grupo de estudos ou peça o código de acesso para seus colegas.
              </p>
              <div className="flex space-x-4">
                <Link href="/dashboard/classes/create">
                  <Button variant="primary">Criar minha Turma</Button>
                </Link>
                <Link href="/dashboard/classes/join">
                  <Button variant="outline">Tenho um código</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
