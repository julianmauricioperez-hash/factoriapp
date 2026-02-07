import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Menu, Download, Tag } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { SearchModeToggle } from "@/components/chat/SearchModeToggle";
import { ChatAttachment } from "@/components/chat/AttachmentPreview";
import { useChatConversations, ChatMessage } from "@/hooks/useChatConversations";
import { useChatTags } from "@/hooks/useChatTags";
import { useTags } from "@/hooks/useTags";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

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
    toggleFavorite,
    deleteConversation,
    getMessages,
    addMessage,
  } = useChatConversations();

  const { tags, createTag } = useTags();
  const { fetchChatTags, addTagToChat, removeTagFromChat, getTagsForChat } = useChatTags();

  // Fetch chat tags when conversations load
  useEffect(() => {
    if (conversations.length > 0) {
      fetchChatTags(conversations.map((c) => c.id));
    }
  }, [conversations, fetchChatTags]);

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("google/gemini-3-flash-preview");
  const [searchMode, setSearchMode] = useState(false);
  const [messageAttachments, setMessageAttachments] = useState<Record<string, { type: string; url: string; name: string }[]>>({});
  const [searchModeMessages, setSearchModeMessages] = useState<Set<string>>(new Set());

  // Get initial prompt from URL params
  const initialPrompt = searchParams.get("prompt") || "";

  const loadConversation = useCallback(async (id: string) => {
    const msgs = await getMessages(id);
    setMessages(msgs);
    setSelectedConversationId(id);
    setSidebarOpen(false);
    
    // Load attachments for this conversation's messages
    if (msgs.length > 0) {
      const messageIds = msgs.map(m => m.id);
      const { data: attachments } = await supabase
        .from("chat_attachments")
        .select("*")
        .in("message_id", messageIds);
      
      if (attachments && attachments.length > 0) {
        const attMap: Record<string, { type: string; url: string; name: string }[]> = {};
        attachments.forEach((att: any) => {
          if (!attMap[att.message_id]) attMap[att.message_id] = [];
          attMap[att.message_id].push({
            type: att.file_type,
            url: att.file_url,
            name: att.file_name,
          });
        });
        setMessageAttachments(attMap);
      } else {
        setMessageAttachments({});
      }
    }
  }, [getMessages]);

  const handleNewConversation = async () => {
    const id = await createConversation();
    if (id) {
      setSelectedConversationId(id);
      setMessages([]);
      setMessageAttachments({});
      setSearchModeMessages(new Set());
      setSidebarOpen(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
    if (selectedConversationId === id) {
      setSelectedConversationId(null);
      setMessages([]);
      setMessageAttachments({});
      setSearchModeMessages(new Set());
    }
  };

  const exportConversationToMarkdown = () => {
    if (messages.length === 0) {
      toast({ title: "Sin mensajes", description: "No hay mensajes para exportar.", variant: "destructive" });
      return;
    }
    const conversation = conversations.find(c => c.id === selectedConversationId);
    const title = conversation?.title || "Conversación";
    const date = new Date().toLocaleDateString("es-ES");
    let markdown = `# ${title}\n\n*Exportado el ${date}*\n\n---\n\n`;
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
    toast({ title: "¡Exportado!", description: "Conversación exportada como Markdown." });
  };

  const exportConversationToText = () => {
    if (messages.length === 0) {
      toast({ title: "Sin mensajes", description: "No hay mensajes para exportar.", variant: "destructive" });
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
    toast({ title: "¡Exportado!", description: "Conversación exportada como texto." });
  };

  // Upload a file to storage and return the public URL
  const uploadAttachment = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop() || "bin";
    const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
    
    const { error } = await supabase.storage
      .from("chat-attachments")
      .upload(filePath, file);
    
    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data } = supabase.storage
      .from("chat-attachments")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Read document text content
  const readDocumentText = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || "");
      reader.onerror = () => resolve("");
      reader.readAsText(file);
    });
  };

  // Convert file to base64 data URL for multimodal
  const fileToBase64DataUrl = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const streamChat = async (allMessages: any[], model: string, isSearchMode: boolean) => {
    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages, model, searchMode: isSearchMode }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) throw new Error("Límite de solicitudes excedido. Intenta de nuevo en unos minutos.");
      if (response.status === 402) throw new Error("Créditos de IA agotados.");
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

  const handleSendMessage = async (content: string, attachments?: ChatAttachment[]) => {
    if (!user) {
      toast({ title: "Inicia sesión", description: "Necesitas iniciar sesión para usar el chat.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    let conversationId = selectedConversationId;

    // Create new conversation if none selected
    if (!conversationId) {
      const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      conversationId = await createConversation(title);
      if (!conversationId) {
        toast({ title: "Error", description: "No se pudo crear la conversación.", variant: "destructive" });
        return;
      }
      setSelectedConversationId(conversationId);
    }

    // Process attachments
    let imageUrls: string[] = [];
    let imageDataUrls: string[] = [];
    let documentTexts: string[] = [];
    let messageContent = content;

    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        if (attachment.type === "image") {
          // Upload image to storage
          const publicUrl = await uploadAttachment(attachment.file);
          if (publicUrl) {
            imageUrls.push(publicUrl);
            // Get base64 for sending to AI
            const dataUrl = await fileToBase64DataUrl(attachment.file);
            imageDataUrls.push(dataUrl);
          }
        } else if (attachment.type === "document") {
          const text = await readDocumentText(attachment.file);
          if (text) {
            documentTexts.push(`[Documento: ${attachment.file.name}]\n${text}`);
          }
        }
      }

      // Append document texts to message content
      if (documentTexts.length > 0) {
        messageContent = (content || "Analiza este documento:") + "\n\n" + documentTexts.join("\n\n");
      }
    }

    // Add user message to DB
    const userMessage = await addMessage(conversationId, "user", messageContent);
    if (!userMessage) return;

    // Save attachment records
    if (imageUrls.length > 0) {
      const attRecords = imageUrls.map((url, i) => ({
        message_id: userMessage.id,
        file_type: "image" as const,
        file_name: attachments![i].file.name,
        file_url: url,
      }));
      
      await supabase.from("chat_attachments").insert(attRecords);
      
      setMessageAttachments(prev => ({
        ...prev,
        [userMessage.id]: attRecords.map(r => ({ type: r.file_type, url: r.file_url, name: r.file_name })),
      }));
    }

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent("");

    try {
      // Build messages array for AI
      const historyMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      // If we have images, make the last user message multimodal
      if (imageDataUrls.length > 0) {
        const lastIdx = historyMessages.length - 1;
        const lastMsg = historyMessages[lastIdx];
        const contentArray: any[] = [];
        
        if (lastMsg.content) {
          contentArray.push({ type: "text", text: lastMsg.content });
        }
        
        imageDataUrls.forEach(dataUrl => {
          contentArray.push({
            type: "image_url",
            image_url: { url: dataUrl },
          });
        });

        historyMessages[lastIdx] = {
          role: lastMsg.role,
          content: contentArray as any,
        };
      }

      const assistantContent = await streamChat(historyMessages, selectedModel, searchMode);

      // Save assistant message
      const assistantMessage = await addMessage(conversationId, "assistant", assistantContent);
      if (assistantMessage) {
        setMessages(prev => [...prev, assistantMessage]);
        // Track if this message was generated in search mode
        if (searchMode) {
          setSearchModeMessages(prev => new Set(prev).add(assistantMessage.id));
          // Mark conversation as having search messages
          const conv = conversations.find(c => c.id === conversationId);
          if (conv && !conv.has_search_messages) {
            await supabase
              .from("chat_conversations")
              .update({ has_search_messages: true })
              .eq("id", conversationId);
          }
        }
      }

      // Update title if first message
      if (messages.length === 0) {
        const title = (content || "Imagen adjunta").slice(0, 50) + ((content || "").length > 50 ? "..." : "");
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
      onToggleFavorite={toggleFavorite}
      loading={conversationsLoading}
      availableTags={tags}
      getTagsForChat={getTagsForChat}
      onAddTagToChat={addTagToChat}
      onRemoveTagFromChat={removeTagFromChat}
      onCreateTag={createTag}
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
                  : "Historial"}
              </span>
            )}
            {!isMobile && selectedConversationId && (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-medium truncate">
                  {conversations.find(c => c.id === selectedConversationId)?.title || "Chat"}
                </span>
                {getTagsForChat(selectedConversationId).length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    {getTagsForChat(selectedConversationId).map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="text-[10px] h-5 px-1.5">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!isMobile && !selectedConversationId && <div className="flex-1" />}
            <div className="flex items-center gap-2">
              <SearchModeToggle
                searchMode={searchMode}
                onToggle={setSearchMode}
                disabled={isLoading}
              />
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
            messageAttachments={messageAttachments}
            searchModeMessages={searchModeMessages}
            isStreamingSearchMode={searchMode}
          />

          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading}
            initialValue={initialPrompt}
            placeholder={searchMode ? "¿Qué quieres buscar?" : "Escribe tu mensaje o pega un prompt..."}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default Chat;
