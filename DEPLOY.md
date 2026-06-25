# Guia de Deploy Profissional - OrganizaEstudo

Siga este guia para colocar o OrganizaEstudo em produção utilizando Vercel e Supabase.

## 1. Preparação do Supabase

Antes de fazer o deploy do código, o banco de dados deve estar pronto.

1. Acesse o [Supabase Dashboard](https://supabase.com).
2. Vá em **SQL Editor**.
3. Execute o conteúdo dos arquivos de migração (na ordem):
   - `supabase/migrations/20240626000000_create_sections_and_items.sql` (Criação de tabelas e bucket).
   - `supabase/migrations/20240627000000_security_hardening.sql` (Reforço de segurança e MIME types).
4. Em **Authentication > URL Configuration**, adicione a URL da sua Vercel aos "Redirect URLs".

## 2. Deploy na Vercel

1. Vá para o [Vercel Dashboard](https://vercel.com).
2. Clique em **New Project** e importe seu repositório do GitHub.
3. Na seção **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`: Sua URL do projeto Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Sua chave anônima (anon public).
4. Clique em **Deploy**.

## 3. Verificação de Produção

Após o deploy, verifique:
- **Build Log**: Certifique-se de que não houve erros de linting ou tipos.
- **Auth**: Tente criar uma conta e fazer login.
- **Storage**: Tente fazer o upload de um PDF e verifique se ele abre corretamente.
- **Performance**: O site deve carregar rapidamente devido às otimizações do Next.js.

## 4. Manutenção

Para atualizar o projeto:
1. Faça suas alterações localmente.
2. `git commit -m "Suas melhorias"`
3. `git push origin main`
4. A Vercel detectará o push e fará o redeploy automaticamente.
