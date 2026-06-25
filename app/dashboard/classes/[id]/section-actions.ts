'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { sectionSchema } from '@/lib/validations/schemas';
import { SupabaseClient } from '@supabase/supabase-js';

async function checkAdmin(supabase: SupabaseClient, classId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: member } = await supabase
    .from('class_members')
    .select('role')
    .eq('class_id', classId)
    .eq('user_id', user.id)
    .single();

  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    throw new Error('Forbidden: Admin access required');
  }
}

export async function createSection(classId: string, title: string, order: number) {
  const supabase = await createClient();
  await checkAdmin(supabase, classId);

  const validated = sectionSchema.parse({ title, order });

  const { data, error } = await supabase
    .from('sections')
    .insert({
      class_id: classId,
      title: validated.title,
      order: validated.order,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/classes/${classId}`);
  return data;
}

export async function updateSection(classId: string, sectionId: string, title: string) {
  const supabase = await createClient();
  await checkAdmin(supabase, classId);

  const validated = sectionSchema.partial().parse({ title });

  const { error } = await supabase
    .from('sections')
    .update({ title: validated.title })
    .eq('id', sectionId)
    .eq('class_id', classId); // Extra safety

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/classes/${classId}`);
}

export async function deleteSection(classId: string, sectionId: string) {
  const supabase = await createClient();
  await checkAdmin(supabase, classId);

  const { error } = await supabase
    .from('sections')
    .delete()
    .eq('id', sectionId)
    .eq('class_id', classId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/classes/${classId}`);
}

export async function reorderSections(classId: string, sectionIds: string[]) {
  const supabase = await createClient();
  await checkAdmin(supabase, classId);

  for (let i = 0; i < sectionIds.length; i++) {
    await supabase
      .from('sections')
      .update({ order: i })
      .eq('id', sectionIds[i])
      .eq('class_id', classId);
  }

  revalidatePath(`/dashboard/classes/${classId}`);
}
