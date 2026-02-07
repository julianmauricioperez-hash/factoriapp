import { useState, useRef, useCallback } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AudioRecorderProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export function AudioRecorder({ onTranscription, disabled }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        await transcribeAudio(audioBlob, mediaRecorder.mimeType);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono. Verifica los permisos.",
        variant: "destructive",
      });
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const transcribeAudio = async (audioBlob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ audio: base64Audio, mimeType }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al transcribir el audio");
      }

      const data = await response.json();
      if (data.text && data.text.trim()) {
        onTranscription(data.text.trim());
      } else {
        toast({
          title: "Sin contenido",
          description: "No se detectó voz en la grabación.",
        });
      }
    } catch (error) {
      console.error("Transcription error:", error);
      toast({
        title: "Error de transcripción",
        description: error instanceof Error ? error.message : "No se pudo transcribir el audio",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "shrink-0 h-9 w-9",
        isRecording && "text-destructive animate-pulse"
      )}
      onClick={handleClick}
      disabled={disabled || isTranscribing}
      title={isRecording ? "Detener grabación" : "Grabar audio"}
    >
      {isTranscribing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <Square className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
