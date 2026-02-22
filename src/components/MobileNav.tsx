import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Menu,
  Home,
  List,
  FolderOpen,
  BarChart3,
  BookOpen,
  LogIn,
  LogOut,
  Plus,
  MessageSquare,
  Tag,
  ShieldCheck,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  requiresAuth?: boolean;
  hideWhenAuth?: boolean;
}

const navItems: NavItem[] = [
  { label: "Inicio", icon: <Home className="h-5 w-5" />, path: "/" },
  { label: "Mis Prompts", icon: <List className="h-5 w-5" />, path: "/my-prompts", requiresAuth: true },
  { label: "Chat IA", icon: <MessageSquare className="h-5 w-5" />, path: "/chat", requiresAuth: true },
  { label: "Colecciones", icon: <FolderOpen className="h-5 w-5" />, path: "/collections", requiresAuth: true },
  { label: "Etiquetas", icon: <Tag className="h-5 w-5" />, path: "/tags", requiresAuth: true },
  { label: "Estadísticas", icon: <BarChart3 className="h-5 w-5" />, path: "/statistics", requiresAuth: true },
  { label: "Biblioteca", icon: <BookOpen className="h-5 w-5" />, path: "/library" },
  { label: "Entrar", icon: <LogIn className="h-5 w-5" />, path: "/auth", hideWhenAuth: true },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, loading } = useAuth();
  const { isAdmin } = useAdmin();

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate("/auth");
  };

  const allNavItems: NavItem[] = [
    ...navItems,
    ...(isAdmin ? [{ label: "Admin", icon: <ShieldCheck className="h-5 w-5" />, path: "/admin", requiresAuth: true }] : []),
  ];

  const filteredNavItems = allNavItems.filter((item) => {
    if (item.requiresAuth && !user) return false;
    if (item.hideWhenAuth && user) return false;
    return true;
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="text-left flex items-center gap-2">
            <span className="text-xl font-semibold">Factoría</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col h-[calc(100%-65px)]">
          <div className="flex-1 py-4">
            {filteredNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                  isActive(item.path)
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          
          <div className="border-t p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tema</span>
              <ThemeToggle />
            </div>
            
            {user && (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleNavigate("/")}
                >
                  <Plus className="h-4 w-4" />
                  Nuevo Prompt
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                  onClick={handleSignOut}
                  disabled={loading}
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </Button>
              </>
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
