-- Create stock_items table for monthly feed/supply tracking
CREATE TABLE public.stock_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'feed',
  quantity NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'kg',
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  is_purchased BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own stock items"
ON public.stock_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock items"
ON public.stock_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock items"
ON public.stock_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock items"
ON public.stock_items FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_stock_items_updated_at
BEFORE UPDATE ON public.stock_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();