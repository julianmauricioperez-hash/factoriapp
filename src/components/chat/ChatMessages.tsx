import { useEffect, useRef, useState } from "react";
import { User, Bot, BookmarkPlus, Copy, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/hooks/useChatConversations";
import { SavePromptDialog } from "./SavePromptDialog";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
interface ChatMessagesProps {
  messages: ChatMessage[];
  streamingContent?: string;
  isLoading?: boolean;
}

export function ChatMessages({ messages, streamingContent, isLoading }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [textToSave, setTextToSave] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSavePrompt = (text: string) => {
    setTextToSave(text);
    setSaveDialogOpen(true);
  };

  const handleCopyMessage = async (messageId: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    toast({
      title: "¡Copiado!",
      description: "Mensaje copiado al portapapeles.",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  if (messages.length === 0 && !streamingContent) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-md">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">¡Prueba tus prompts con IA!</h3>
            <p className="text-sm text-muted-foreground">
              Escribe un prompt o pégalo desde tu biblioteca para ver cómo responde la IA.
              Puedes editar el prompt antes de enviarlo.
            </p>
          </div>
        </div>
        <SavePromptDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          initialText={textToSave}
        />
      </>
    );
  }

  return (
    <>
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "group flex gap-3 animate-slide-up",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
              style={{ animationDelay: `${Math.min(index * 30, 150)}ms`, animationFillMode: "backwards" }}
            >
              {message.role === "assistant" && (
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className="flex flex-col gap-1 max-w-[80%]">
                <div
                  className={cn(
                    "rounded-lg px-4 py-2",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted prose dark:prose-invert max-w-none chat-markdown"
                  )}
                >
                  {message.role === "user" ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  )}
                </div>
                {/* Action buttons */}
                <div className={cn(
                  "flex gap-1",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                    onClick={() => handleCopyMessage(message.id, message.content)}
                  >
                    {copiedId === message.id ? (
                      <Check className="h-3 w-3 mr-1 text-success" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    {copiedId === message.id ? "Copiado" : "Copiar"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                    onClick={() => handleSavePrompt(message.content)}
                  >
                    <BookmarkPlus className="h-3 w-3 mr-1" />
                    Guardar
                  </Button>
                </div>
              </div>
              {message.role === "user" && (
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Streaming message */}
          {streamingContent && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-lg px-4 py-2 max-w-[80%] bg-muted prose dark:prose-invert max-w-none chat-markdown">
                <ReactMarkdown>{streamingContent}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && !streamingContent && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="rounded-lg px-4 py-3 bg-muted">
                <div className="flex gap-1.5 items-center">
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="text-xs text-muted-foreground ml-2">Pensando...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <SavePromptDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        initialText={textToSave}
      />
    </>
  );
}
