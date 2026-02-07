import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AttachmentPreview, ChatAttachment } from "./AttachmentPreview";
import { AudioRecorder } from "./AudioRecorder";
import { toast } from "@/hooks/use-toast";

interface ChatInputProps {
  onSend: (message: string, attachments?: ChatAttachment[]) => void;
  disabled?: boolean;
  initialValue?: string;
  placeholder?: string;
}

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPTED_DOC_TYPES = ["application/pdf", "text/plain", "text/markdown"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ChatInput({ 
  onSend, 
  disabled, 
  initialValue = "", 
  placeholder = "Escribe tu mensaje o pega un prompt..." 
}: ChatInputProps) {
  const [value, setValue] = useState(initialValue);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
    }
  }, [initialValue]);

  const handleSubmit = () => {
    if ((!value.trim() && attachments.length === 0) || disabled) return;
    onSend(value.trim(), attachments.length > 0 ? attachments : undefined);
    setValue("");
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: ChatAttachment[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Archivo muy grande",
          description: `${file.name} supera el límite de 10MB.`,
          variant: "destructive",
        });
        return;
      }

      if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        const previewUrl = URL.createObjectURL(file);
        newAttachments.push({ file, type: "image", previewUrl });
      } else if (ACCEPTED_DOC_TYPES.includes(file.type) || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
        newAttachments.push({ file, type: "document" });
      } else {
        toast({
          title: "Tipo no soportado",
          description: `${file.name} no es un formato soportado (imágenes, PDF, TXT, MD).`,
          variant: "destructive",
        });
      }
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments((prev) => {
      const removed = prev[index];
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleTranscription = useCallback((text: string) => {
    setValue((prev) => (prev ? prev + " " + text : text));
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      attachments.forEach((a) => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      });
    };
  }, []);

  return (
    <div className="border-t bg-background">
      <AttachmentPreview
        attachments={attachments}
        onRemove={handleRemoveAttachment}
      />
      <div className="p-4">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={[...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_DOC_TYPES, ".md", ".txt"].join(",")}
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          
          {/* Attach button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title="Adjuntar imagen o documento"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Audio recorder */}
          <AudioRecorder
            onTranscription={handleTranscription}
            disabled={disabled}
          />

          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[44px] max-h-[200px] resize-none"
            rows={1}
          />
          <Button 
            onClick={handleSubmit} 
            disabled={disabled || (!value.trim() && attachments.length === 0)}
            size="icon"
            className="shrink-0 h-11 w-11"
          >
            {disabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Presiona Enter para enviar, Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  );
}
