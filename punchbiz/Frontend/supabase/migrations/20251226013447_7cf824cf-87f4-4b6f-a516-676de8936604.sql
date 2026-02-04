-- Add sensor_type column to heat_records table
ALTER TABLE public.heat_records 
ADD COLUMN sensor_type text DEFAULT 'manual';

-- Add sensor_reading column for actual sensor data
ALTER TABLE public.heat_records 
ADD COLUMN sensor_reading numeric;

-- Create index for faster queries by sensor type
CREATE INDEX idx_heat_records_sensor_type ON public.heat_records(sensor_type);