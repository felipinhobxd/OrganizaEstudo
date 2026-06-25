-- Create sections table
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create items table
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

-- --- STORAGE CONFIGURATION ---

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('class-attachments', 'class-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Users can upload files to their classes
CREATE POLICY "Admins can upload attachments" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'class-attachments' AND
        EXISTS (
            SELECT 1 FROM public.class_members
            WHERE class_members.class_id::text = (storage.foldername(name))[1]
            AND class_members.user_id = auth.uid()
            AND (role = 'owner' OR role = 'admin')
        )
    );

-- Storage Policy: Members can view files in their classes
CREATE POLICY "Members can view attachments" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'class-attachments' AND
        EXISTS (
            SELECT 1 FROM public.class_members
            WHERE class_members.class_id::text = (storage.foldername(name))[1]
            AND class_members.user_id = auth.uid()
        )
    );

-- Storage Policy: Admins can delete files in their classes
CREATE POLICY "Admins can delete attachments" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'class-attachments' AND
        EXISTS (
            SELECT 1 FROM public.class_members
            WHERE class_members.class_id::text = (storage.foldername(name))[1]
            AND class_members.user_id = auth.uid()
            AND (role = 'owner' OR role = 'admin')
        )
    );

-- Enable RLS
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Policies for sections
CREATE POLICY "Users can view sections in their classes" ON public.sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.class_members
            WHERE class_members.class_id = sections.class_id
            AND class_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage sections" ON public.sections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.class_members
            WHERE class_members.class_id = sections.class_id
            AND class_members.user_id = auth.uid()
            AND (role = 'owner' OR role = 'admin')
        )
    );

-- Policies for items
CREATE POLICY "Users can view items in their sections" ON public.items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sections
            JOIN public.class_members ON sections.class_id = class_members.class_id
            WHERE sections.id = items.section_id
            AND class_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage items" ON public.items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.sections
            JOIN public.class_members ON sections.class_id = class_members.class_id
            WHERE sections.id = items.section_id
            AND class_members.user_id = auth.uid()
            AND (role = 'owner' OR role = 'admin')
        )
    );