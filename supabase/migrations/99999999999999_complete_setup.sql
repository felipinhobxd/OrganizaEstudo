-- ==========================================
-- SCRIPT DE CONFIGURAÇÃO COMPLETA (UNIFICADO)
-- OrganizaEstudo - Executar este script para resetar/configurar o banco do zero
-- ==========================================

-- 1. Tabelas Base (Perfis, Turmas, Membros)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    invite_code TEXT UNIQUE NOT NULL,
    owner_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.class_members (
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (class_id, user_id)
);

-- 2. Tabelas de Conteúdo (Seções, Itens)
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content_markdown TEXT,
    links JSONB DEFAULT '[]'::jsonb,
    checklist JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    youtube_url TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar Segurança (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Acesso
-- Profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Classes
DROP POLICY IF EXISTS "Members can view class" ON public.classes;
CREATE POLICY "Members can view class" ON public.classes FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.class_members WHERE class_members.class_id = classes.id AND class_members.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Owners can manage class" ON public.classes;
CREATE POLICY "Owners can manage class" ON public.classes FOR ALL USING (auth.uid() = owner_id);

-- Members
DROP POLICY IF EXISTS "Members can see each other" ON public.class_members;
CREATE POLICY "Members can see each other" ON public.class_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.class_members AS cm WHERE cm.class_id = class_members.class_id AND cm.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Owners/Admins can manage members" ON public.class_members;
CREATE POLICY "Owners/Admins can manage members" ON public.class_members FOR ALL USING (
    EXISTS (SELECT 1 FROM public.class_members AS cm WHERE cm.class_id = class_members.class_id AND cm.user_id = auth.uid() AND (cm.role = 'owner' OR cm.role = 'admin'))
);

-- Sections
DROP POLICY IF EXISTS "Users can view sections in their classes" ON public.sections;
CREATE POLICY "Users can view sections in their classes" ON public.sections FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.class_members WHERE class_members.class_id = sections.class_id AND class_members.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins can manage sections" ON public.sections;
CREATE POLICY "Admins can manage sections" ON public.sections FOR ALL USING (
    EXISTS (SELECT 1 FROM public.class_members WHERE class_members.class_id = sections.class_id AND class_members.user_id = auth.uid() AND (role = 'owner' OR role = 'admin'))
);

-- Items
DROP POLICY IF EXISTS "Users can view items in their sections" ON public.items;
CREATE POLICY "Users can view items in their sections" ON public.items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sections JOIN public.class_members ON sections.class_id = class_members.class_id WHERE sections.id = items.section_id AND class_members.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins can manage items" ON public.items;
CREATE POLICY "Admins can manage items" ON public.items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.sections JOIN public.class_members ON sections.class_id = class_members.class_id WHERE sections.id = items.section_id AND class_members.user_id = auth.uid() AND (role = 'owner' OR role = 'admin'))
);

-- 5. Storage (Bucket e Políticas)
INSERT INTO storage.buckets (id, name, public)
VALUES ('class-attachments', 'class-attachments', false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view attachments" ON storage.objects;
CREATE POLICY "Members can view attachments" ON storage.objects FOR SELECT USING (
    bucket_id = 'class-attachments' AND EXISTS (SELECT 1 FROM public.class_members WHERE class_members.class_id::text = (storage.foldername(name))[1] AND class_members.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can upload attachments" ON storage.objects;
CREATE POLICY "Admins can upload attachments" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'class-attachments' AND EXISTS (SELECT 1 FROM public.class_members WHERE class_members.class_id::text = (storage.foldername(name))[1] AND class_members.user_id = auth.uid() AND (role = 'owner' OR role = 'admin'))
);

DROP POLICY IF EXISTS "Admins can delete attachments" ON storage.objects;
CREATE POLICY "Admins can delete attachments" ON storage.objects FOR DELETE USING (
    bucket_id = 'class-attachments' AND EXISTS (SELECT 1 FROM public.class_members WHERE class_members.class_id::text = (storage.foldername(name))[1] AND class_members.user_id = auth.uid() AND (role = 'owner' OR role = 'admin'))
);

-- Restrição de MIME Types
UPDATE storage.buckets SET allowed_mime_types = ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm','text/plain'] WHERE id = 'class-attachments';

-- 6. Gatilhos Automáticos (Triggers)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_class()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.class_members (class_id, user_id, role)
  VALUES (new.id, new.owner_id, 'owner');
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_class_created ON public.classes;
CREATE TRIGGER on_class_created
  AFTER INSERT ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_class();
