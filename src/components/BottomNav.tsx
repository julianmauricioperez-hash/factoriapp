import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Home, List, FolderOpen, BookOpen, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { label: "Inicio", icon: Home, path: "/" },
  { label: "Prompts", icon: List, path: "/my-prompts", requiresAuth: true },
  { label: "Chat IA", icon: MessageSquare, path: "/chat", requiresAuth: true },
  { label: "Colecciones", icon: FolderOpen, path: "/collections", requiresAuth: true },
  { label: "Biblioteca", icon: BookOpen, path: "/library" },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigate = (item: NavItem, index: number) => {
    // For unauthenticated users clicking on auth-required items
    if (item.requiresAuth && !user) {
      navigate("/auth");
      return;
    }
    navigate(item.path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path + index}
              onClick={() => handleNavigate(item, index)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-primary")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
      {/* Safe area padding for iOS devices */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
