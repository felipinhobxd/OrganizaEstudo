'use server';

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
  try {
    const supabase = await createClient();

    const rawEmail = formData.get('email');
    const rawPassword = formData.get('password');
    const rawFullName = formData.get('full_name');

    const validated = authSchema.parse({
      email: rawEmail,
      password: rawPassword,
      fullName: rawFullName,
    });

    const { data, error } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        data: {
          full_name: validated.fullName,
        },
      },
    });

    if (error) {
      console.error('Supabase signup error:', error.message);
      return redirect('/login?error=' + encodeURIComponent(error.message));
    }

    if (!data.user) {
      return redirect('/login?error=' + encodeURIComponent('Falha ao criar usuário. Tente novamente.'));
    }

    revalidatePath('/', 'layout');
    return redirect('/login?message=' + encodeURIComponent('Conta criada com sucesso! Verifique seu e-mail ou tente fazer o login.'));
  } catch (err: any) {
    console.error('Catch-all signup error:', err);
    if (err.name === 'ZodError') {
      const firstError = err.errors[0]?.message || 'Dados inválidos';
      return redirect('/login?error=' + encodeURIComponent(firstError));
    }
    // Check if it's a redirect (which Next.js throws internally)
    if (err.message === 'NEXT_REDIRECT') {
      throw err;
    }
    return redirect('/login?error=' + encodeURIComponent(err.message || 'Erro inesperado ao criar conta.'));
  }
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
