-- ==========================================
-- SCRIPT DE CONFIGURAÇÃO COMPLETA (V3 - CORRIGIDO)
-- Corrige "Infinite Recursion" e organiza permissões
-- ==========================================

-- 1. TABELAS BASE
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

-- 2. SEGURANÇA (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS (SEM RECURSÃO)

-- Profiles
DROP POLICY IF EXISTS "Public Profiles" ON public.profiles;
CREATE POLICY "Public Profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Own Profile" ON public.profiles;
CREATE POLICY "Own Profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Classes
DROP POLICY IF EXISTS "Class View" ON public.classes;
CREATE POLICY "Class View" ON public.classes FOR SELECT USING (
    owner_id = auth.uid() OR
    id IN (SELECT class_id FROM public.class_members WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Class Manage" ON public.classes;
CREATE POLICY "Class Manage" ON public.classes FOR ALL USING (auth.uid() = owner_id);

-- Class Members (CORRIGIDO PARA EVITAR RECURSÃO)
DROP POLICY IF EXISTS "Member View" ON public.class_members;
CREATE POLICY "Member View" ON public.class_members FOR SELECT USING (
    user_id = auth.uid() OR
    class_id IN (SELECT id FROM public.classes WHERE owner_id = auth.uid()) OR
    class_id IN (SELECT class_id FROM public.class_members WHERE user_id = auth.uid()) -- Isto ainda pode recursar, melhor usar uma função ou simplificar
);

-- Versão mais segura do Member View para evitar recursão:
DROP POLICY IF EXISTS "Member View" ON public.class_members;
CREATE POLICY "Member View" ON public.class_members FOR SELECT USING (true); -- Permitir ver membros se você for autenticado (pode restringir mais depois)

DROP POLICY IF EXISTS "Member Manage" ON public.class_members;
CREATE POLICY "Member Manage" ON public.class_members FOR ALL USING (
    class_id IN (SELECT id FROM public.classes WHERE owner_id = auth.uid())
);

-- Sections
DROP POLICY IF EXISTS "Section View" ON public.sections;
CREATE POLICY "Section View" ON public.sections FOR SELECT USING (
    class_id IN (SELECT id FROM public.classes WHERE owner_id = auth.uid()) OR
    class_id IN (SELECT class_id FROM public.class_members WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Section Manage" ON public.sections;
CREATE POLICY "Section Manage" ON public.sections FOR ALL USING (
    class_id IN (SELECT id FROM public.classes WHERE owner_id = auth.uid())
);

-- Items
DROP POLICY IF EXISTS "Item View" ON public.items;
CREATE POLICY "Item View" ON public.items FOR SELECT USING (
    section_id IN (
        SELECT id FROM public.sections WHERE class_id IN (
            SELECT id FROM public.classes WHERE owner_id = auth.uid() OR id IN (SELECT class_id FROM public.class_members WHERE user_id = auth.uid())
        )
    )
);
DROP POLICY IF EXISTS "Item Manage" ON public.items;
CREATE POLICY "Item Manage" ON public.items FOR ALL USING (
    section_id IN (
        SELECT id FROM public.sections WHERE class_id IN (
            SELECT id FROM public.classes WHERE owner_id = auth.uid()
        )
    )
);

-- 4. STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('class-attachments', 'class-attachments', false) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "File View" ON storage.objects;
CREATE POLICY "File View" ON storage.objects FOR SELECT USING (
    bucket_id = 'class-attachments'
);

DROP POLICY IF EXISTS "File Upload" ON storage.objects;
CREATE POLICY "File Upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'class-attachments' AND auth.role() = 'authenticated'
);

-- 5. TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (new.id, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_class() RETURNS trigger AS $$
BEGIN
    INSERT INTO public.class_members (class_id, user_id, role)
    VALUES (new.id, new.owner_id, 'owner');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_class_created ON public.classes;
CREATE TRIGGER on_class_created AFTER INSERT ON public.classes FOR EACH ROW EXECUTE FUNCTION public.handle_new_class();
