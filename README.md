# OrganizaEstudo 🎓

O OrganizaEstudo é a plataforma definitiva para organização de estudos, combinando a flexibilidade do Notion com a fluidez do Discord. Crie turmas, organize conteúdos em seções e gerencie materiais de forma profissional.

## ✨ Funcionalidades

- **Organização Estilo Notion**: Crie seções e itens com interface limpa e intuitiva.
- **Drag & Drop**: Reorganize todo o seu conteúdo de forma visual.
- **Conteúdo Rico**: Suporte a Markdown, Checklists, Links e vídeos do YouTube.
- **Gestão de Anexos**: Upload seguro de PDFs, Office, Imagens e Vídeos via Supabase Storage.
- **Segurança Avançada**: Proteção contra XSS, SQL Injection e controle de acesso via RLS.
- **Interface Profissional**: Dark Mode nativo, animações fluidas e design responsivo.

## 🚀 Tecnologias

- **Frontend**: Next.js 15+, React 19, Tailwind CSS 4.
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage).
- **Validação**: Zod.
- **Animações**: Framer Motion.
- **Componentes**: Lucide React, Sonner (Toasts), @hello-pangea/dnd.

## 🛠️ Configuração do Projeto

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/organizaestudo.git
cd organizaestudo
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Crie um arquivo `.env.local` baseado no `.env.example` e preencha com suas credenciais do Supabase.

### 4. Configurar o Banco de Dados (Supabase)
Execute os scripts SQL localizados em `supabase/migrations/` no SQL Editor do seu projeto Supabase na seguinte ordem:
1. `20240625000000_core_schema.sql`
2. `20240626000000_create_sections_and_items.sql`
3. `20240627000000_security_hardening.sql`

## 📦 Deploy na Vercel

Este projeto está pronto para ser implantado na Vercel com apenas um comando.

1. Conecte seu repositório GitHub à Vercel.
2. Configure as seguintes variáveis de ambiente na Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. O comando de build (`npm run build`) e o diretório de saída serão detectados automaticamente.
4. Clique em **Deploy**.

## 🛡️ Segurança

O projeto passou por um hardening completo:
- Sanitização de Markdown para prevenir XSS.
- Validação de inputs via Zod.
- Políticas de RLS no banco de dados e storage.
- Restrição de MIME Types para arquivos anexados.

## 📄 Licença

Este projeto está sob a licença MIT.
