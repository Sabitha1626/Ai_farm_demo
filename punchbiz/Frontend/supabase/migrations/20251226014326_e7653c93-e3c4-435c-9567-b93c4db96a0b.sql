-- Create attendance_records table for biometric staff tracking
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  check_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  check_out TIMESTAMP WITH TIME ZONE,
  biometric_id TEXT, -- Fingerprint or other biometric identifier
  biometric_type TEXT DEFAULT 'fingerprint', -- fingerprint, face_id, card, manual
  location TEXT,
  status TEXT DEFAULT 'present', -- present, late, early_out, absent
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own attendance records"
ON public.attendance_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendance records"
ON public.attendance_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance records"
ON public.attendance_records FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attendance records"
ON public.attendance_records FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_attendance_staff_date ON public.attendance_records(staff_id, check_in);
CREATE INDEX idx_attendance_user_date ON public.attendance_records(user_id, check_in);

-- Create heat_alerts table
CREATE TABLE public.heat_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cow_id UUID NOT NULL REFERENCES public.cows(id) ON DELETE CASCADE,
  heat_record_id UUID REFERENCES public.heat_records(id) ON DELETE SET NULL,
  alert_type TEXT DEFAULT 'heat_detected', -- heat_detected, optimal_breeding, breeding_reminder
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  sensor_type TEXT,
  sensor_reading NUMERIC,
  optimal_breeding_start TIMESTAMP WITH TIME ZONE,
  optimal_breeding_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.heat_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own heat alerts"
ON public.heat_alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own heat alerts"
ON public.heat_alerts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own heat alerts"
ON public.heat_alerts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own heat alerts"
ON public.heat_alerts FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_heat_alerts_user_unread ON public.heat_alerts(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_heat_alerts_cow ON public.heat_alerts(cow_id);

-- Create breeding_events table for the calendar
CREATE TABLE public.breeding_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cow_id UUID NOT NULL REFERENCES public.cows(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- heat_detected, insemination, pregnancy_check, expected_calving, actual_calving
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE, -- For events with duration
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled, missed
  is_reminder_sent BOOLEAN DEFAULT false,
  reminder_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.breeding_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own breeding events"
ON public.breeding_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own breeding events"
ON public.breeding_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own breeding events"
ON public.breeding_events FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own breeding events"
ON public.breeding_events FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_breeding_events_user_date ON public.breeding_events(user_id, event_date);
CREATE INDEX idx_breeding_events_cow ON public.breeding_events(cow_id);

-- Add biometric_id to staff table
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS biometric_id TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS biometric_type TEXT DEFAULT 'fingerprint';

-- Add trigger for updated_at
CREATE TRIGGER update_attendance_records_updated_at
BEFORE UPDATE ON public.attendance_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_heat_alerts_updated_at
BEFORE UPDATE ON public.heat_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_breeding_events_updated_at
BEFORE UPDATE ON public.breeding_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();