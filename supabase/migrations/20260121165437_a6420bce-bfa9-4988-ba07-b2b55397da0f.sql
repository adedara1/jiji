-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'premium');

-- Create enum for project status
CREATE TYPE public.project_status AS ENUM ('draft', 'published', 'archived');

-- Create enum for component types
CREATE TYPE public.component_type AS ENUM ('section', 'header', 'footer', 'hero', 'text', 'image', 'button', 'form', 'card', 'grid', 'container', 'navbar', 'custom');

-- User roles table (security best practice - separate from profiles)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- User profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Projects table (websites/apps created by users)
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status project_status NOT NULL DEFAULT 'draft',
    thumbnail_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pages within projects
CREATE TABLE public.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL DEFAULT 'Home',
    slug TEXT NOT NULL DEFAULT 'home',
    is_homepage BOOLEAN DEFAULT false,
    meta_title TEXT,
    meta_description TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, slug)
);

-- Components on pages (drag & drop elements)
CREATE TABLE public.components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES public.components(id) ON DELETE CASCADE,
    component_type component_type NOT NULL,
    name TEXT,
    props JSONB DEFAULT '{}',
    styles JSONB DEFAULT '{}',
    content JSONB DEFAULT '{}',
    order_index INTEGER NOT NULL DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Component templates (reusable components)
CREATE TABLE public.component_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    component_type component_type NOT NULL,
    props JSONB DEFAULT '{}',
    styles JSONB DEFAULT '{}',
    content JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Project exports/deployments
CREATE TABLE public.deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    version TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    deploy_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
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

-- Function to check project ownership
CREATE OR REPLACE FUNCTION public.owns_project(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = _project_id
      AND user_id = _user_id
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
ON public.projects FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON public.projects FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON public.projects FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for pages
CREATE POLICY "Users can view pages of their projects"
ON public.pages FOR SELECT
TO authenticated
USING (public.owns_project(auth.uid(), project_id));

CREATE POLICY "Users can create pages in their projects"
ON public.pages FOR INSERT
TO authenticated
WITH CHECK (public.owns_project(auth.uid(), project_id));

CREATE POLICY "Users can update pages in their projects"
ON public.pages FOR UPDATE
TO authenticated
USING (public.owns_project(auth.uid(), project_id));

CREATE POLICY "Users can delete pages in their projects"
ON public.pages FOR DELETE
TO authenticated
USING (public.owns_project(auth.uid(), project_id));

-- RLS Policies for components
CREATE POLICY "Users can view components of their pages"
ON public.components FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pages p
    JOIN public.projects pr ON p.project_id = pr.id
    WHERE p.id = page_id AND pr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create components in their pages"
ON public.components FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pages p
    JOIN public.projects pr ON p.project_id = pr.id
    WHERE p.id = page_id AND pr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update components in their pages"
ON public.components FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pages p
    JOIN public.projects pr ON p.project_id = pr.id
    WHERE p.id = page_id AND pr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete components in their pages"
ON public.components FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pages p
    JOIN public.projects pr ON p.project_id = pr.id
    WHERE p.id = page_id AND pr.user_id = auth.uid()
  )
);

-- RLS Policies for component_templates
CREATE POLICY "Users can view public templates or their own"
ON public.component_templates FOR SELECT
TO authenticated
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
ON public.component_templates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
ON public.component_templates FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
ON public.component_templates FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for deployments
CREATE POLICY "Users can view deployments of their projects"
ON public.deployments FOR SELECT
TO authenticated
USING (public.owns_project(auth.uid(), project_id));

CREATE POLICY "Users can create deployments for their projects"
ON public.deployments FOR INSERT
TO authenticated
WITH CHECK (public.owns_project(auth.uid(), project_id));

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_components_updated_at
  BEFORE UPDATE ON public.components
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();