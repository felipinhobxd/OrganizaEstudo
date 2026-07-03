import AppLayout from '@/components/layout/AppLayout';
import { createClient } from '@/utils/supabase/server';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { Profile, Class } from '@/types/database';
import { getNotifications } from '../actions';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Parallel fetching
  const [profileRes, userClassesRes, notificationsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('class_members').select(`classes (*)`).eq('user_id', user.id),
    getNotifications()
  ]);

  const profile = profileRes.data;
  const userClasses = userClassesRes.data as any[];
  const notifications = notificationsRes;

  const classes = userClasses?.map((c: any) => c.classes as Class) || [];

  return (
    <AppLayout
      user={user}
      profile={profile}
      classes={classes}
      notifications={notifications}
      title="Configurações"
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Suas Configurações</h1>
          <p className="text-gray-500">Gerencie suas informações pessoais e preferências.</p>
        </div>

        <ProfileForm
          profile={profile as Profile}
          userId={user.id}
        />
      </div>
    </AppLayout>
  );
}
