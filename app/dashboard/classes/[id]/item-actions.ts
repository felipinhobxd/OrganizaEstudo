'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { itemSchema } from '@/lib/validations/schemas';
import { SupabaseClient } from '@supabase/supabase-js';

async function checkItemPermission(supabase: SupabaseClient, sectionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: section } = await supabase
    .from('sections')
    .select('class_id')
    .eq('id', sectionId)
    .single();

  if (!section) throw new Error('Section not found');

  const { data: member } = await supabase
    .from('class_members')
    .select('role')
    .eq('class_id', section.class_id)
    .eq('user_id', user.id)
    .single();

  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    throw new Error('Forbidden: Admin access required');
  }

  return section.class_id;
}

export async function createItem(classId: string, sectionId: string, title: string, order: number) {
  const supabase = await createClient();
  await checkItemPermission(supabase, sectionId);

  const validated = itemSchema.parse({ title, order });

  const { data, error } = await supabase
    .from('items')
    .insert({
      section_id: sectionId,
      title: validated.title,
      order: validated.order,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/classes/${classId}`);
  return data;
}

export async function updateItem(classId: string, itemId: string, updates: any) {
  const supabase = await createClient();

  const { data: item } = await supabase
    .from('items')
    .select('section_id')
    .eq('id', itemId)
    .single();

  if (!item) throw new Error('Item not found');
  await checkItemPermission(supabase, item.section_id);

  const validated = itemSchema.partial().parse(updates);

  const { error } = await supabase
    .from('items')
    .update(validated)
    .eq('id', itemId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/classes/${classId}`);
}

export async function deleteItem(classId: string, itemId: string) {
  const supabase = await createClient();

  const { data: item } = await supabase
    .from('items')
    .select('section_id')
    .eq('id', itemId)
    .single();

  if (!item) throw new Error('Item not found');
  await checkItemPermission(supabase, item.section_id);

  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', itemId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/classes/${classId}`);
}

export async function reorderItems(classId: string, sectionId: string, itemIds: string[]) {
  const supabase = await createClient();
  await checkItemPermission(supabase, sectionId);

  for (let i = 0; i < itemIds.length; i++) {
    await supabase
      .from('items')
      .update({ order: i, section_id: sectionId })
      .eq('id', itemIds[i]);
  }

  revalidatePath(`/dashboard/classes/${classId}`);
}

export async function moveItem(classId: string, itemId: string, newSectionId: string, newOrder: number) {
  const supabase = await createClient();
  await checkItemPermission(supabase, newSectionId);

  const { error } = await supabase
    .from('items')
    .update({ section_id: newSectionId, order: newOrder })
    .eq('id', itemId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/classes/${classId}`);
}
