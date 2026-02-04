import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CowPhotoUploadProps {
  cowId: string;
  currentImageUrl?: string | null;
  onUploadComplete: (url: string) => void;
}

export function CowPhotoUpload({ cowId, currentImageUrl, onUploadComplete }: CowPhotoUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to get full URL if it's a relative path from our backend
  const getFullImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    // Assuming backend is at the same origin or we know the BASE_URL from api.ts
    // For now, let's just use the relative URL as it should work if proxied or same origin
    // But since we use axios with a baseURL, we might need to prepend it
    const baseURL = (api.defaults.baseURL || '').replace('/api', '');
    return `${baseURL}${url}`;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create a local preview first
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Prepare form data
      const formData = new FormData();
      formData.append('photo', file);

      // Upload to our backend
      const response = await api.post(`/upload/cow-photo/${cowId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const publicUrl = response.data.url;
      onUploadComplete(publicUrl);
      toast.success('Photo uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
      setPreview(getFullImageUrl(currentImageUrl));
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;

    try {
      await api.delete(`/upload/cow-photo/${cowId}`);
      setPreview(null);
      onUploadComplete('');
      toast.success('Photo removed');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove photo');
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative group">
          <img
            src={getFullImageUrl(preview) || preview}
            alt="Cow"
            className="w-full h-40 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleRemovePhoto}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full h-32 border-dashed flex flex-col gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <>
              <Upload className="h-6 w-6" />
              <span className="text-sm">Upload Photo</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}
