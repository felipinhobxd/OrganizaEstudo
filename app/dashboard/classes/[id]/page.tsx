import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { leaveClass, deleteClass } from '@/app/dashboard/classes/actions';
import SectionManager from '@/components/sections/SectionManager';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { LogOut, Trash2, Users, Info } from 'lucide-react';
import { Metadata } from 'next';
import { ClassMember, Section, Class, Item } from '@/types/database';
import { cn } from '@/utils/ui/cn';

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const supabase = await createClient();
  const { data: classData } = await supabase
    .from('classes')
    .select('name, description')
    .eq('id', params.id)
    .single();

  return {
    title: classData?.name || 'Turma',
    description: classData?.description || 'Detalhes da turma no OrganizaEstudo.'
  };
}

export default async function ClassDashboardPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select(`
      *,
      class_members (
        role,
        profiles (
          id,
          full_name,
          avatar_url
        )
      ),
      sections (
        *,
        items (
          *
        )
      )
    `)
    .eq('id', params.id)
    .single();

  if (classError || !classData) {
    return notFound();
  }

  // Fetch all classes for the sidebar
  const { data: userClasses } = await supabase
    .from('class_members')
    .select(`classes (id, name, description, invite_code, owner_id, created_at)`)
    .eq('user_id', user.id);
  const classes = userClasses?.map((c) => c.classes as unknown as Class) || [];

  const sortedSections: Section[] = (classData.sections || [])
    .sort((a: Section, b: Section) => a.order - b.order)
    .map((section: any) => ({
      ...section,
      items: (section.items || []).sort((a: Item, b: Item) => a.order - b.order)
    }));

  const userMembership = (classData.class_members as ClassMember[]).find((m) => (m.profiles as any)?.id === user.id);
  const isAdmin = userMembership?.role === 'owner' || userMembership?.role === 'admin';
  const isOwner = userMembership?.role === 'owner';

  return (
    <AppLayout user={user} classes={classes} title={classData.name}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <Card className="relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-2 text-primary">
                <Info size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Sobre a Turma</span>
              </div>
              <div className="flex items-center space-x-2">
                {isOwner ? (
                  <form action={deleteClass.bind(null, classData.id)}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      leftIcon={<Trash2 size={16} />}
                    >
                      Excluir Turma
                    </Button>
                  </form>
                ) : (
                  <form action={leaveClass.bind(null, classData.id)}>
                    <Button variant="ghost" size="sm" leftIcon={<LogOut size={16} />}>
                      Sair da Turma
                    </Button>
                  </form>
                )}
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
              {classData.description || "Esta turma ainda não possui uma descrição detalhada."}
            </p>
          </Card>

          <SectionManager
            classId={classData.id}
            initialSections={sortedSections}
            isAdmin={isAdmin}
          />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <Card className="bg-primary text-white border-none shadow-lg shadow-primary/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 transform">
              <Users size={120} />
            </div>
            <h3 className="font-bold text-xl mb-2 relative z-10">Convidar Colegas</h3>
            <p className="text-white/80 text-sm mb-6 relative z-10 leading-relaxed">
              Compartilhe o código abaixo para que outros alunos possam participar desta turma.
            </p>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center relative z-10 transition-all hover:bg-white/20">
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2">Código de Acesso</span>
              <span className="text-3xl font-mono font-bold tracking-[0.2em] select-all drop-shadow-sm">{classData.invite_code}</span>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-border bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
              <h3 className="font-bold text-foreground flex items-center space-x-2">
                <Users size={18} className="text-primary" />
                <span>Membros</span>
              </h3>
              <span className="text-xs font-bold text-gray-400 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {classData.class_members?.length || 0}
              </span>
            </div>
            <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {classData.class_members?.map((member: any) => (
                <div key={member.profiles?.id} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase shrink-0 border border-primary/20 group-hover:scale-105 transition-transform">
                    {member.profiles?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {member.profiles?.full_name || 'Usuário'}
                    </p>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider",
                      member.role === 'owner' ? 'text-amber-500' :
                      member.role === 'admin' ? 'text-primary' : 'text-gray-400'
                    )}>
                      {member.role === 'owner' ? 'Proprietário' :
                       member.role === 'admin' ? 'Administrador' : 'Membro'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </AppLayout>
  );
}
