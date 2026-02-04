-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  farm_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Create cows table
CREATE TABLE public.cows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tag_number TEXT NOT NULL,
  breed TEXT,
  date_of_birth DATE,
  weight NUMERIC,
  status TEXT DEFAULT 'healthy' CHECK (status IN ('healthy', 'pregnant', 'sick', 'in_heat')),
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on cows
ALTER TABLE public.cows ENABLE ROW LEVEL SECURITY;

-- Cows policies
CREATE POLICY "Users can view their own cows" 
ON public.cows FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cows" 
ON public.cows FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cows" 
ON public.cows FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cows" 
ON public.cows FOR DELETE 
USING (auth.uid() = user_id);

-- Create heat_records table for heat detection
CREATE TABLE public.heat_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cow_id UUID NOT NULL REFERENCES public.cows(id) ON DELETE CASCADE,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  intensity TEXT DEFAULT 'medium' CHECK (intensity IN ('low', 'medium', 'high')),
  symptoms TEXT[],
  ai_confidence NUMERIC,
  notes TEXT,
  is_inseminated BOOLEAN DEFAULT false,
  insemination_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on heat_records
ALTER TABLE public.heat_records ENABLE ROW LEVEL SECURITY;

-- Heat records policies
CREATE POLICY "Users can view their own heat records" 
ON public.heat_records FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own heat records" 
ON public.heat_records FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own heat records" 
ON public.heat_records FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own heat records" 
ON public.heat_records FOR DELETE 
USING (auth.uid() = user_id);

-- Create chat_messages table for AI chatbot history
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat messages policies
CREATE POLICY "Users can view their own messages" 
ON public.chat_messages FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" 
ON public.chat_messages FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cows_updated_at
BEFORE UPDATE ON public.cows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();