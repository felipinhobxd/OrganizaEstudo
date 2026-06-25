'use server';

import { createClient } from '@/utils/supabase/server';
import { getUniqueInviteCode } from '@/services/class-service';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { classSchema } from '@/lib/validations/schemas';

export async function createClass(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const rawName = formData.get('name') as string;
  const rawDescription = formData.get('description') as string;

  const validated = classSchema.parse({
    name: rawName,
    description: rawDescription
  });

  const inviteCode = await getUniqueInviteCode();

  const { data, error } = await supabase
    .from('classes')
    .insert({
      name: validated.name,
      description: validated.description,
      invite_code: inviteCode,
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return redirect(`/dashboard/classes/create?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/dashboard');
  redirect(`/dashboard/classes/${data.id}`);
}

export async function joinClass(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const inviteCode = (formData.get('invite_code') as string).toUpperCase().trim();

  // 1. Find the class by invite code
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('id')
    .eq('invite_code', inviteCode)
    .maybeSingle();

  if (classError || !classData) {
    return redirect(`/dashboard/classes/join?error=${encodeURIComponent('Código de convite inválido ou turma não encontrada.')}`);
  }

  // 2. Check if already a member
  const { data: existingMember } = await supabase
    .from('class_members')
    .select('role')
    .eq('class_id', classData.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMember) {
    return redirect(`/dashboard/classes/${classData.id}`);
  }

  // 3. Join the class
  const { error: joinError } = await supabase
    .from('class_members')
    .insert({
      class_id: classData.id,
      user_id: user.id,
      role: 'member',
    });

  if (joinError) {
    return redirect(`/dashboard/classes/join?error=${encodeURIComponent(joinError.message)}`);
  }

  revalidatePath('/dashboard');
  redirect(`/dashboard/classes/${classData.id}`);
}

export async function leaveClass(classId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Check if user is the owner (owners cannot leave via this action, they must delete the class)
  const { data: classData } = await supabase
    .from('classes')
    .select('owner_id')
    .eq('id', classId)
    .single();

  if (classData?.owner_id === user.id) {
    throw new Error('Owners cannot leave the class. Delete the class instead.');
  }

  const { error } = await supabase
    .from('class_members')
    .delete()
    .eq('class_id', classId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function deleteClass(classId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // RLS will handle the permission check, but we validate here for better UX
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', classId)
    .eq('owner_id', user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
