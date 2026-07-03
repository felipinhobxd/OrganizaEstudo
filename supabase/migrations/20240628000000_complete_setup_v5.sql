-- ==========================================
-- SCRIPT DE CONFIGURAÇÃO COMPLETA (V5 - FINAL FIX)
-- Resolve o erro de "Infinite Recursion" no RLS
-- ==========================================

-- 1. TABELAS BASE (Sem alterações na estrutura)
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

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. HABILITAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. FUNÇÕES DE SUPORTE (SECURITY DEFINER para quebrar a recursão)

-- Verifica se o usuário é membro da turma (ignora RLS na consulta interna)
CREATE OR REPLACE FUNCTION public.check_is_member(p_class_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.class_members
        WHERE class_id = p_class_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verifica se o usuário é proprietário da turma (ignora RLS na consulta interna)
CREATE OR REPLACE FUNCTION public.check_is_owner(p_class_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.classes
        WHERE id = p_class_id
        AND owner_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. POLÍTICAS (REESCRITAS PARA PERFORMANCE E ZERO RECURSÃO)

-- Profiles
DROP POLICY IF EXISTS "Public Profiles" ON public.profiles;
CREATE POLICY "Public Profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Own Profile" ON public.profiles;
CREATE POLICY "Own Profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Classes
DROP POLICY IF EXISTS "Class View" ON public.classes;
CREATE POLICY "Class View" ON public.classes FOR SELECT USING (
    owner_id = auth.uid() OR public.check_is_member(id)
);
DROP POLICY IF EXISTS "Class Manage" ON public.classes;
CREATE POLICY "Class Manage" ON public.classes FOR ALL USING (auth.uid() = owner_id);

-- Class Members
DROP POLICY IF EXISTS "Member View" ON public.class_members;
CREATE POLICY "Member View" ON public.class_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Member Manage" ON public.class_members;
CREATE POLICY "Member Manage" ON public.class_members FOR ALL USING (
    public.check_is_owner(class_id)
);

-- Sections
DROP POLICY IF EXISTS "Section View" ON public.sections;
CREATE POLICY "Section View" ON public.sections FOR SELECT USING (
    public.check_is_member(class_id) OR public.check_is_owner(class_id)
);
DROP POLICY IF EXISTS "Section Manage" ON public.sections;
CREATE POLICY "Section Manage" ON public.sections FOR ALL USING (
    public.check_is_owner(class_id)
);

-- Items
DROP POLICY IF EXISTS "Item View" ON public.items;
CREATE POLICY "Item View" ON public.items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.sections
        WHERE id = section_id
        AND (public.check_is_member(class_id) OR public.check_is_owner(class_id))
    )
);
DROP POLICY IF EXISTS "Item Manage" ON public.items;
CREATE POLICY "Item Manage" ON public.items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.sections
        WHERE id = section_id
        AND public.check_is_owner(class_id)
    )
);

-- Notifications
DROP POLICY IF EXISTS "User View Notifications" ON public.notifications;
CREATE POLICY "User View Notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "User Update Notifications" ON public.notifications;
CREATE POLICY "User Update Notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "User Delete Notifications" ON public.notifications;
CREATE POLICY "User Delete Notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- 5. STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('class-attachments', 'class-attachments', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Storage Policies (Simplificadas)
DROP POLICY IF EXISTS "Attachments View" ON storage.objects;
CREATE POLICY "Attachments View" ON storage.objects FOR SELECT USING (bucket_id = 'class-attachments');
DROP POLICY IF EXISTS "Attachments Upload" ON storage.objects;
CREATE POLICY "Attachments Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'class-attachments' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Avatar View" ON storage.objects;
CREATE POLICY "Avatar View" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Avatar Upload" ON storage.objects;
CREATE POLICY "Avatar Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Avatar Update" ON storage.objects;
CREATE POLICY "Avatar Update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Avatar Delete" ON storage.objects;
CREATE POLICY "Avatar Delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- 6. TRIGGERS (Aprimorados)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
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
