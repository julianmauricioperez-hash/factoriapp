import { X, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ChatAttachment {
  file: File;
  type: "image" | "document";
  previewUrl?: string;
}

interface AttachmentPreviewProps {
  attachments: ChatAttachment[];
  onRemove: (index: number) => void;
}

export function AttachmentPreview({ attachments, onRemove }: AttachmentPreviewProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap px-4 pt-2">
      {attachments.map((attachment, index) => (
        <div
          key={index}
          className="relative group flex items-center gap-2 bg-muted rounded-lg p-2 pr-8 max-w-[200px]"
        >
          {attachment.type === "image" && attachment.previewUrl ? (
            <img
              src={attachment.previewUrl}
              alt={attachment.file.name}
              className="w-10 h-10 rounded object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          )}
          <span className="text-xs truncate">{attachment.file.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0.5 right-0.5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemove(index)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
