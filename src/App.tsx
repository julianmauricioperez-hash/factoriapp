import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import MyPrompts from "./pages/MyPrompts";
import Collections from "./pages/Collections";
import Statistics from "./pages/Statistics";
import PublicLibrary from "./pages/PublicLibrary";
import SharedPrompt from "./pages/SharedPrompt";
import Chat from "./pages/Chat";
import Tags from "./pages/Tags";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/my-prompts" element={<MyPrompts />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/library" element={<PublicLibrary />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/tags" element={<Tags />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/p/:slug" element={<SharedPrompt />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
