import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Bot, User, Mic, MicOff, Image, X, Loader2, Volume2, VolumeX } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  audioUrl?: string;
}

export default function AIChat() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const response = await api.get('/chat');
      setMessages(response.data.map((m: any) => ({
        role: m.role,
        content: m.content
      })));
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image too large. Max 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const transcribeAudio = async (audioBlob: Blob): Promise<string | null> => {
    setIsTranscribing(true);
    // Note: This still uses the old voice-to-text logic which might fail if Supabase functions are disabled
    // For now, we only refactor the main chat part.
    try {
      toast.info('Voice features are being migrated...');
      return null;
    } catch (error: unknown) {
      console.error('Transcription error:', error);
      return null;
    } finally {
      setIsTranscribing(false);
    }
  };

  const playTextToSpeech = async (text: string) => {
    if (!voiceEnabled || !text) return;
    toast.info('Voice features are being migrated...');
  };

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsPlayingAudio(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setIsProcessingAudio(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const transcribedText = await transcribeAudio(audioBlob);
        if (transcribedText) {
          await sendMessage(transcribedText);
        }
        setIsProcessingAudio(false);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendMessage = async (text?: string, imageBase64?: string) => {
    const messageText = text || input;
    if (!messageText.trim() && !imageBase64) return;
    if (loading) return;

    const userMessage: Message = {
      role: 'user',
      content: messageText || '[Image uploaded]',
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setImagePreview(null);
    setLoading(true);

    try {
      const response = await api.post('/chat', {
        message: messageText,
        // Backend handles saving user message and generating assistant response
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.content
      };
      setMessages(prev => [...prev, assistantMessage]);

      if (voiceEnabled && response.data.content) {
        playTextToSpeech(response.data.content);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      toast.error('Failed to get response from AI');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input, imagePreview || undefined);
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-73px)] lg:h-screen flex flex-col bg-background">
        <div className="p-4 lg:p-6 border-b border-border bg-card shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {t('aiAssistant') || 'AI Assistant'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('askAnything') || 'Ask me anything about your farm management'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="voice-mode"
                checked={voiceEnabled}
                onCheckedChange={setVoiceEnabled}
              />
              <Label htmlFor="voice-mode" className="text-sm flex items-center gap-2">
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                {voiceEnabled ? t('voiceEnabled') || 'Voice' : t('voiceDisabled') || 'Silent'}
              </Label>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
          {initialLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">
                {t('howCanIHelp') || 'How can I help you today?'}
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                {t('askAboutBreeding') || 'Ask about cow health, breeding cycles, or milk production.'}
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-card text-card-foreground border border-border rounded-tl-none'
                  }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === 'assistant' && voiceEnabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 px-2 text-xs"
                      onClick={() => isPlayingAudio ? stopAudio() : playTextToSpeech(msg.content)}
                    >
                      {isPlayingAudio ? (
                        <VolumeX className="h-3 w-3 mr-1" />
                      ) : (
                        <Volume2 className="h-3 w-3 mr-1" />
                      )}
                      {isPlayingAudio ? t('stopVoice') || 'Stop' : t('playVoice') || 'Listen'}
                    </Button>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm rounded-tl-none">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-75" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-150" />
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Form Container */}
        <div className="p-4 border-t border-border bg-card">
          {imagePreview && (
            <div className="mb-4 relative inline-block">
              <img
                src={imagePreview}
                alt="Upload preview"
                className="h-20 w-20 object-cover rounded-lg border border-border"
              />
              <button
                type="button"
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                onClick={() => setImagePreview(null)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <Image className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`h-10 w-10 ${isRecording ? 'text-destructive' : 'text-muted-foreground'}`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={loading || isProcessingAudio || isTranscribing}
              >
                {isProcessingAudio || isTranscribing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
            </div>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isTranscribing ? t('transcribing') || 'Transcribing...' : t('typeMessage') || 'Ask me something...'}
              disabled={loading || isRecording || isTranscribing}
              className="flex-1 rounded-full px-4"
            />

            <Button
              type="submit"
              className="rounded-full h-10 w-10 p-0"
              disabled={loading || (!input.trim() && !imagePreview)}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
