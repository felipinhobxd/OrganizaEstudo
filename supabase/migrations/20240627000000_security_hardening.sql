-- REFORÇO DE SEGURANÇA (HARDENING)

-- 1. Restrição de MIME Types no Storage
-- Impede upload de arquivos potencialmente perigosos (.exe, .sh, .bat, etc)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'text/plain'
]
WHERE id = 'class-attachments';

-- 2. Reforço de RLS nas Seções (Garantir isolamento total)
DROP POLICY IF EXISTS "Users can view sections in their classes" ON public.sections;
CREATE POLICY "Users can view sections in their classes" ON public.sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.class_members
            WHERE class_members.class_id = sections.class_id
            AND class_members.user_id = auth.uid()
        )
    );

-- 3. Reforço de RLS nos Itens
DROP POLICY IF EXISTS "Users can view items in their sections" ON public.items;
CREATE POLICY "Users can view items in their sections" ON public.items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sections
            JOIN public.class_members ON sections.class_id = class_members.class_id
            WHERE sections.id = items.section_id
            AND class_members.user_id = auth.uid()
        )
    );

-- 4. Prevenção de Account Takeover via Profile Manipulation
-- Garante que um usuário só pode editar o próprio perfil (se a tabela profiles existir)
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can update own profile" ON public.profiles
--    FOR UPDATE USING (auth.uid() = id);

-- 5. Hardening de Storage (Bloqueio de acesso anônimo absoluto)
-- Embora o bucket já seja privado, forçamos a negação de qualquer política anônima futura
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
