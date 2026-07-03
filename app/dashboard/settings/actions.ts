'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { profileSchema } from '@/lib/validations/schemas';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const full_name = formData.get('full_name') as string;
  const avatar_url = formData.get('avatar_url') as string;

  const validated = profileSchema.parse({ full_name, avatar_url });

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: validated.full_name,
      avatar_url: validated.avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard', 'layout');
}
