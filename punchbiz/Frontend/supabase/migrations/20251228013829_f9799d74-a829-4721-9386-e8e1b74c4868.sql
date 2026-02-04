-- Milk production records table
CREATE TABLE public.milk_production (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cow_id UUID NOT NULL REFERENCES public.cows(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  quantity_liters NUMERIC NOT NULL,
  quality_grade TEXT DEFAULT 'A',
  fat_percentage NUMERIC,
  protein_percentage NUMERIC,
  sensor_id TEXT,
  is_automatic BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Weight sensor readings table
CREATE TABLE public.weight_sensor_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cow_id UUID NOT NULL REFERENCES public.cows(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  weight_kg NUMERIC NOT NULL,
  sensor_id TEXT,
  is_automatic BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Health records table
CREATE TABLE public.health_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cow_id UUID NOT NULL REFERENCES public.cows(id) ON DELETE CASCADE,
  record_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  record_type TEXT NOT NULL,
  diagnosis TEXT,
  treatment TEXT,
  medications TEXT,
  veterinarian TEXT,
  cost NUMERIC,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Push notification subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.milk_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Milk production policies
CREATE POLICY "Users can view their own milk production" ON public.milk_production FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own milk production" ON public.milk_production FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own milk production" ON public.milk_production FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own milk production" ON public.milk_production FOR DELETE USING (auth.uid() = user_id);

-- Weight sensor policies
CREATE POLICY "Users can view their own weight readings" ON public.weight_sensor_readings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own weight readings" ON public.weight_sensor_readings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own weight readings" ON public.weight_sensor_readings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own weight readings" ON public.weight_sensor_readings FOR DELETE USING (auth.uid() = user_id);

-- Health records policies
CREATE POLICY "Users can view their own health records" ON public.health_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own health records" ON public.health_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own health records" ON public.health_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own health records" ON public.health_records FOR DELETE USING (auth.uid() = user_id);

-- Push subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON public.push_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subscriptions" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for sensor tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.milk_production;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weight_sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;

-- Add trigger for health records updated_at
CREATE TRIGGER update_health_records_updated_at
BEFORE UPDATE ON public.health_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();