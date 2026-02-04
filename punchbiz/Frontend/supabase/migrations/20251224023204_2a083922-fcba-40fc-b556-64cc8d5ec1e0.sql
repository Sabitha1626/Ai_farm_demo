-- Create a table for staff members
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  phone TEXT,
  is_absent BOOLEAN NOT NULL DEFAULT false,
  absent_reason TEXT,
  absent_since TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own staff" 
ON public.staff 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own staff" 
ON public.staff 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own staff" 
ON public.staff 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own staff" 
ON public.staff 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON public.staff
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();