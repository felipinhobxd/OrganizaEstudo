-- ==========================================
-- SCRIPT DE CONFIGURAÇÃO (V6 - SOLUÇÃO ATÔMICA)
-- Resolve DE VEZ o erro de "Infinite Recursion"
-- ==========================================

-- 1. LIMPEZA TOTAL (Remove TUDO para garantir que não sobrem políticas fantasmas)
DROP POLICY IF EXISTS "Public Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Own Profile" ON public.profiles;
DROP POLICY IF EXISTS "Class View" ON public.classes;
DROP POLICY IF EXISTS "Class Manage" ON public.classes;
DROP POLICY IF EXISTS "Member View" ON public.class_members;
DROP POLICY IF EXISTS "Member Manage" ON public.class_members;
DROP POLICY IF EXISTS "Section View" ON public.sections;
DROP POLICY IF EXISTS "Section Manage" ON public.sections;
DROP POLICY IF EXISTS "Item View" ON public.items;
DROP POLICY IF EXISTS "Item Manage" ON public.items;

-- 2. FUNÇÕES DE BYPASS (SECURITY DEFINER)
-- Estas funções rodam fora do RLS, quebrando qualquer ciclo de recursão.
CREATE OR REPLACE FUNCTION public.is_member_of(p_class_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.class_members
        WHERE class_id = p_class_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_owner_of(p_class_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.classes
        WHERE id = p_class_id
        AND owner_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. POLÍTICAS BLINDADAS (Simples e Diretas)

-- [CLASSES]
-- Ver: Se eu sou o dono OU se a função de bypass diz que sou membro
CREATE POLICY "Class View" ON public.classes
FOR SELECT USING (owner_id = auth.uid() OR public.is_member_of(id));

CREATE POLICY "Class Manage" ON public.classes
FOR ALL USING (owner_id = auth.uid());

-- [CLASS_MEMBERS] - O PONTO CRÍTICO DA RECURSÃO
-- Regra de Ouro: Nunca use subqueries em class_members que consultem class_members.
-- Ver: Todo usuário autenticado pode ver os membros de uma turma (simplifica e mata a recursão)
CREATE POLICY "Member View" ON public.class_members
FOR SELECT USING (auth.role() = 'authenticated');

-- Gerenciar: Somente se a função de bypass diz que sou o dono da turma
CREATE POLICY "Member Manage" ON public.class_members
FOR ALL USING (public.is_owner_of(class_id));

-- [SECTIONS]
CREATE POLICY "Section View" ON public.sections
FOR SELECT USING (public.is_member_of(class_id) OR public.is_owner_of(class_id));

CREATE POLICY "Section Manage" ON public.sections
FOR ALL USING (public.is_owner_of(class_id));

-- [ITEMS]
CREATE POLICY "Item View" ON public.items
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.sections s
        WHERE s.id = section_id
        AND (public.is_member_of(s.class_id) OR public.is_owner_of(s.class_id))
    )
);

CREATE POLICY "Item Manage" ON public.items
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.sections s
        WHERE s.id = section_id
        AND public.is_owner_of(s.class_id)
    )
);

-- [PROFILES]
CREATE POLICY "Public Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Own Profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- [NOTIFICATIONS]
DROP POLICY IF EXISTS "User View Notifications" ON public.notifications;
DROP POLICY IF EXISTS "User Update Notifications" ON public.notifications;
DROP POLICY IF EXISTS "User Delete Notifications" ON public.notifications;
CREATE POLICY "User View Notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User Update Notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User Delete Notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- 4. GARANTIR RLS ATIVO
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
