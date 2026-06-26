'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { authSchema } from '@/lib/validations/schemas';

export async function login(formData: FormData) {
  try {
    const supabase = await createClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return redirect('/login?error=' + encodeURIComponent('Preencha todos os campos.'));
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error.message);
      return redirect('/login?error=' + encodeURIComponent('Credenciais inválidas ou e-mail não confirmado.'));
    }

    revalidatePath('/', 'layout');
    return redirect('/dashboard');
  } catch (err: any) {
    if (err.message === 'NEXT_REDIRECT') throw err;
    console.error('Login catch error:', err);
    return redirect('/login?error=' + encodeURIComponent('Erro ao tentar entrar. Verifique sua conexão.'));
  }
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
      // More user friendly message for common Supabase errors
      let msg = error.message;
      if (msg.includes('already registered')) msg = 'Este e-mail já está cadastrado.';
      return redirect('/login?error=' + encodeURIComponent(msg));
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
