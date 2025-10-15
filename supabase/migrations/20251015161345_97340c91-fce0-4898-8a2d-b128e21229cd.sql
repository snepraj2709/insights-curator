-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create topics table
CREATE TABLE public.topics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert predefined topics
INSERT INTO public.topics (id, name, icon, color, description) VALUES
  ('ai', 'Artificial Intelligence', '🤖', 'from-violet-500 to-purple-500', 'Latest developments in AI and machine learning'),
  ('startups', 'Startups & VC', '🚀', 'from-blue-500 to-cyan-500', 'Startup news, funding rounds, and VC trends'),
  ('marketing', 'Marketing & Growth', '📈', 'from-green-500 to-emerald-500', 'Marketing strategies and growth hacking'),
  ('finance', 'Finance & Markets', '💰', 'from-yellow-500 to-orange-500', 'Financial markets and investment insights'),
  ('health', 'Health & Wellness', '❤️', 'from-red-500 to-pink-500', 'Health trends and wellness tips'),
  ('tech', 'Technology', '💻', 'from-indigo-500 to-blue-500', 'Technology news and innovations'),
  ('science', 'Science & Research', '🔬', 'from-teal-500 to-cyan-500', 'Scientific discoveries and research'),
  ('productivity', 'Productivity', '⚡', 'from-amber-500 to-yellow-500', 'Productivity tools and techniques');

-- Create user_topics table (many-to-many)
CREATE TABLE public.user_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

-- Create insights table
CREATE TABLE public.insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_links JSONB NOT NULL DEFAULT '[]',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Create digests table
CREATE TABLE public.digests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  intro_text TEXT NOT NULL,
  insights JSONB NOT NULL DEFAULT '[]',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digests ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles RLS policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Topics RLS policies (public read)
CREATE POLICY "Anyone can view topics"
  ON public.topics FOR SELECT
  TO authenticated
  USING (true);

-- User topics RLS policies
CREATE POLICY "Users can view their own topic selections"
  ON public.user_topics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own topic selections"
  ON public.user_topics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own topic selections"
  ON public.user_topics FOR DELETE
  USING (auth.uid() = user_id);

-- Insights RLS policies
CREATE POLICY "Users can view insights for their topics"
  ON public.insights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_topics
      WHERE user_topics.user_id = auth.uid()
        AND user_topics.topic_id = insights.topic_id
    )
  );

CREATE POLICY "Admins can insert insights"
  ON public.insights FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Digests RLS policies
CREATE POLICY "Users can view their own digests"
  ON public.digests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own digests"
  ON public.digests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();