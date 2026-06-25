'use strict';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { authSchema } from '@/lib/validations/schemas';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const validated = authSchema.pick({ email: true, password: true }).parse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  const { error } = await supabase.auth.signInWithPassword({
    email: validated.email,
    password: validated.password,
  });

  if (error) {
    return redirect('/login?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const validated = authSchema.parse({
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('full_name'),
  });

  const { error } = await supabase.auth.signUp({
    email: validated.email,
    password: validated.password,
    options: {
      data: {
        full_name: validated.fullName,
      },
    },
  });

  if (error) {
    return redirect('/login?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/', 'layout');
  redirect('/login?message=' + encodeURIComponent('Check your email to confirm your account.'));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return redirect('/forgot-password?error=' + encodeURIComponent(error.message));
  }

  redirect('/forgot-password?message=' + encodeURIComponent('Password reset link sent to your email.'));
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return redirect('/reset-password?error=' + encodeURIComponent(error.message));
  }

  redirect('/login?message=' + encodeURIComponent('Password updated successfully.'));
}
