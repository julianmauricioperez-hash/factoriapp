import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Menu, Download } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { useChatConversations, ChatMessage } from "@/hooks/useChatConversations";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const Chat = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  
  const {
    conversations,
    loading: conversationsLoading,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    getMessages,
    addMessage,
  } = useChatConversations();

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("google/gemini-3-flash-preview");

  // Get initial prompt from URL params
  const initialPrompt = searchParams.get("prompt") || "";

  const loadConversation = useCallback(async (id: string) => {
    const msgs = await getMessages(id);
    setMessages(msgs);
    setSelectedConversationId(id);
    setSidebarOpen(false);
  }, [getMessages]);

  const handleNewConversation = async () => {
    const id = await createConversation();
    if (id) {
      setSelectedConversationId(id);
      setMessages([]);
      setSidebarOpen(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
    if (selectedConversationId === id) {
      setSelectedConversationId(null);
      setMessages([]);
    }
  };

  const exportConversationToMarkdown = () => {
    if (messages.length === 0) {
      toast({
        title: "Sin mensajes",
        description: "No hay mensajes para exportar.",
        variant: "destructive",
      });
      return;
    }

    const conversation = conversations.find(c => c.id === selectedConversationId);
    const title = conversation?.title || "Conversación";
    const date = new Date().toLocaleDateString("es-ES");
    
    let markdown = `# ${title}\n\n`;
    markdown += `*Exportado el ${date}*\n\n---\n\n`;
    
    messages.forEach((msg) => {
      const role = msg.role === "user" ? "**Tú:**" : "**IA:**";
      markdown += `${role}\n\n${msg.content}\n\n---\n\n`;
    });

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]/gi, "_")}.md`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "¡Exportado!",
      description: "Conversación exportada como Markdown.",
    });
  };

  const exportConversationToText = () => {
    if (messages.length === 0) {
      toast({
        title: "Sin mensajes",
        description: "No hay mensajes para exportar.",
        variant: "destructive",
      });
      return;
    }

    const conversation = conversations.find(c => c.id === selectedConversationId);
    const title = conversation?.title || "Conversación";
    
    let text = `${title}\n${"=".repeat(title.length)}\n\n`;
    
    messages.forEach((msg) => {
      const role = msg.role === "user" ? "Tú:" : "IA:";
      text += `${role}\n${msg.content}\n\n`;
    });

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]/gi, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "¡Exportado!",
      description: "Conversación exportada como texto.",
    });
  };

  const streamChat = async (allMessages: { role: string; content: string }[], model: string) => {
    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages, model }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        throw new Error("Límite de solicitudes excedido. Intenta de nuevo en unos minutos.");
      }
      if (response.status === 402) {
        throw new Error("Créditos de IA agotados.");
      }
      throw new Error(errorData.error || "Error al conectar con la IA");
    }

    if (!response.body) throw new Error("No se recibió respuesta");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullContent += content;
            setStreamingContent(fullContent);
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    return fullContent;
  };

  const handleSendMessage = async (content: string) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para usar el chat.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    let conversationId = selectedConversationId;

    // Create new conversation if none selected
    if (!conversationId) {
      const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      conversationId = await createConversation(title);
      if (!conversationId) {
        toast({
          title: "Error",
          description: "No se pudo crear la conversación.",
          variant: "destructive",
        });
        return;
      }
      setSelectedConversationId(conversationId);
    }

    // Add user message
    const userMessage = await addMessage(conversationId, "user", content);
    if (!userMessage) return;

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent("");

    try {
      const allMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const assistantContent = await streamChat(allMessages, selectedModel);

      // Save assistant message
      const assistantMessage = await addMessage(conversationId, "assistant", assistantContent);
      if (assistantMessage) {
        setMessages(prev => [...prev, assistantMessage]);
      }

      // Update title if first message
      if (messages.length === 0) {
        const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
        await updateConversationTitle(conversationId, title);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al enviar mensaje",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setStreamingContent("");
    }
  };

  if (authLoading) {
    return (
      <AppLayout title="Chat IA">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout title="Chat IA">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-muted-foreground">Inicia sesión para usar el chat con IA</p>
          <Button onClick={() => navigate("/auth")}>Iniciar sesión</Button>
        </div>
      </AppLayout>
    );
  }

  const sidebarContent = (
    <ChatSidebar
      conversations={conversations}
      selectedId={selectedConversationId}
      onSelect={loadConversation}
      onNew={handleNewConversation}
      onDelete={handleDeleteConversation}
      onRename={updateConversationTitle}
      loading={conversationsLoading}
    />
  );

  return (
    <AppLayout title="Chat IA" showBottomNav={!isMobile}>
      <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] -mx-4 -my-4 md:my-0 md:mx-0 md:rounded-lg md:border overflow-hidden">
        {/* Desktop sidebar */}
        {!isMobile && (
          <div className="w-64 shrink-0 hidden md:block">
            {sidebarContent}
          </div>
        )}

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with model selector */}
          <div className="flex items-center justify-between gap-2 p-3 border-b">
            {isMobile && (
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80">
                  {sidebarContent}
                </SheetContent>
              </Sheet>
            )}
            {isMobile && (
              <span className="font-medium truncate flex-1">
                {selectedConversationId
                  ? conversations.find(c => c.id === selectedConversationId)?.title || "Chat"
                  : "Nueva conversación"}
              </span>
            )}
            {!isMobile && <div className="flex-1" />}
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 md:mr-1" />
                      <span className="hidden md:inline">Exportar</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-popover">
                    <DropdownMenuItem onClick={exportConversationToMarkdown}>
                      Exportar como Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportConversationToText}>
                      Exportar como texto
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <ModelSelector
                value={selectedModel}
                onChange={setSelectedModel}
                disabled={isLoading}
              />
            </div>
          </div>

          <ChatMessages
            messages={messages}
            streamingContent={streamingContent}
            isLoading={isLoading}
          />

          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading}
            initialValue={initialPrompt}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default Chat;
