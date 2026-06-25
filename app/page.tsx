import Link from 'next/link';
import { Button } from '@/components/shared/Button';
import { GraduationCap, ArrowRight, Sparkles, Layout, Shield, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      <header className="px-8 py-6 flex justify-between items-center border-b border-gray-100 dark:border-gray-900">
        <div className="flex items-center space-x-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <GraduationCap className="text-white" size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">OrganizaEstudo</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login">
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link href="/login">
            <Button>Começar Agora</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-8 py-24 md:py-32 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
            <Sparkles size={14} />
            <span>Sua jornada acadêmica organizada</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            A forma mais <span className="text-primary">inteligente</span> de estudar.
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in duration-1000 delay-400">
            Crie turmas, organize conteúdos em seções estilo Notion e colabore com seus colegas em uma plataforma moderna e segura.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in duration-1000 delay-600">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight size={20} />}>
                Criar minha Conta
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Ver Demonstração
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 dark:bg-gray-900/50 py-24 border-y border-gray-100 dark:border-gray-900">
          <div className="px-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard
              icon={<Layout className="text-primary" />}
              title="Organização Estilo Notion"
              description="Flexibilidade total para criar seções, itens e arrastar conteúdos conforme sua necessidade."
            />
            <FeatureCard
              icon={<Zap className="text-amber-500" />}
              title="Conteúdo Rico"
              description="Markdown, checklists, vídeos incorporados e anexos em um único lugar."
            />
            <FeatureCard
              icon={<Shield className="text-green-500" />}
              title="Privado e Seguro"
              description="Seus dados protegidos por Row Level Security e arquivos criptografados no Storage."
            />
          </div>
        </section>
      </main>

      <footer className="px-8 py-12 border-t border-gray-100 dark:border-gray-900 text-center">
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} OrganizaEstudo. A plataforma definitiva para estudantes.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center space-y-4">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        {icon}
      </div>
      <h3 className="font-bold text-xl text-foreground">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
