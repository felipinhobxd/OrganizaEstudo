-- 1. Create PROFILES table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create CLASSES table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    invite_code TEXT UNIQUE NOT NULL,
    owner_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create CLASS_MEMBERS table
CREATE TABLE IF NOT EXISTS public.class_members (
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (class_id, user_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

-- POLICIES for Profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- POLICIES for Classes
CREATE POLICY "Members can view class" ON public.classes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.class_members
            WHERE class_members.class_id = classes.id
            AND class_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can manage class" ON public.classes
    FOR ALL USING (auth.uid() = owner_id);

-- POLICIES for Class Members
CREATE POLICY "Members can see each other" ON public.class_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.class_members AS cm
            WHERE cm.class_id = class_members.class_id
            AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners/Admins can manage members" ON public.class_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.class_members AS cm
            WHERE cm.class_id = class_members.class_id
            AND cm.user_id = auth.uid()
            AND (cm.role = 'owner' OR cm.role = 'admin')
        )
    );

-- Function to handle profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to automatically add the owner as a member when a class is created
CREATE OR REPLACE FUNCTION public.handle_new_class()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.class_members (class_id, user_id, role)
  VALUES (new.id, new.owner_id, 'owner');
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_class_created
  AFTER INSERT ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_class();
