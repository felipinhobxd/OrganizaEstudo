import { login, signup } from '@/app/auth/actions';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { GraduationCap, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default async function LoginPage(props: {
  searchParams: Promise<{ message: string; error: string }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="mb-8 flex flex-col items-center">
        <div className="bg-primary p-3 rounded-2xl mb-4 shadow-lg shadow-primary/20">
          <GraduationCap className="text-white" size={32} />
        </div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">OrganizaEstudo</h1>
      </div>

      <div className="w-full max-w-md space-y-6">
        {searchParams.error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="text-red-500 shrink-0" size={20} />
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">{searchParams.error}</p>
          </div>
        )}

        {searchParams.message && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 p-4 rounded-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="text-green-500 shrink-0" size={20} />
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">{searchParams.message}</p>
          </div>
        )}

        <Card className="shadow-2xl border-border">
          <div className="space-y-8">
            {/* LOGIN SECTION */}
            <form className="space-y-4">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground">Entrar</h2>
                <p className="text-sm text-gray-500">Acesse sua conta para continuar.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    name="email"
                    type="email"
                    placeholder="exemplo@email.com"
                    required
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-border rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Senha</label>
                  <a href="/forgot-password" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">Esqueceu?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-border rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <Button formAction={login} className="w-full py-6 text-base" variant="primary">
                Acessar Conta
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]"><span className="bg-white dark:bg-gray-900 px-4 text-gray-400">Ou crie uma nova</span></div>
            </div>

            {/* SIGNUP SECTION */}
            <form className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    name="full_name"
                    type="text"
                    placeholder="Seu nome"
                    required
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-border rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">E-mail</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    required
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Senha</label>
                  <input
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <Button formAction={signup} className="w-full py-6 text-base" variant="outline">
                Cadastrar agora
              </Button>
            </form>
          </div>
        </Card>

        <p className="text-center text-xs text-gray-400">
          Ao continuar, você concorda com nossos <Link href="#" className="underline">Termos de Uso</Link>.
        </p>
      </div>
    </div>
  );
}

function Link({ children, href, className }: { children: React.ReactNode, href: string, className?: string }) {
  return <a href={href} className={className}>{children}</a>;
}
