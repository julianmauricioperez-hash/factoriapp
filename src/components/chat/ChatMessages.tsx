import { useEffect, useRef } from "react";
import { User, Bot } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/hooks/useChatConversations";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatMessagesProps {
  messages: ChatMessage[];
  streamingContent?: string;
  isLoading?: boolean;
}

export function ChatMessages({ messages, streamingContent, isLoading }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  if (messages.length === 0 && !streamingContent) {
    return (
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
    );
  }

  return (
    <ScrollArea ref={scrollRef} className="flex-1 p-4">
      <div className="space-y-4 max-w-3xl mx-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "rounded-lg px-4 py-2 max-w-[80%]",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted prose prose-sm dark:prose-invert max-w-none"
              )}
            >
              {message.role === "user" ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              )}
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
          <div className="flex gap-3 justify-start">
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="rounded-lg px-4 py-2 max-w-[80%] bg-muted prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{streamingContent}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !streamingContent && (
          <div className="flex gap-3 justify-start">
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <div className="rounded-lg px-4 py-2 bg-muted">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
