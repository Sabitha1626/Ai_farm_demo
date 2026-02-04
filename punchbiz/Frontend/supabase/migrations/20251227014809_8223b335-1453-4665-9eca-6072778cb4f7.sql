-- Create storage bucket for cow photos
INSERT INTO storage.buckets (id, name, public) VALUES ('cow-photos', 'cow-photos', true);

-- Create policies for cow photo uploads
CREATE POLICY "Anyone can view cow photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'cow-photos');

CREATE POLICY "Users can upload their own cow photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'cow-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own cow photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'cow-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own cow photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'cow-photos' AND auth.uid()::text = (storage.foldername(name))[1]);