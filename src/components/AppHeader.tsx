import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import logoLight from "@/assets/Logo.svg";
import logoDark from "@/assets/LogoDark.svg";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNav } from "@/components/MobileNav";
import {
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

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export function AppHeader({ title, showBackButton }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, loading } = useAuth();
  const { isAdmin } = useAdmin();
  const { resolvedTheme } = useTheme();
  const logoSrc = resolvedTheme === "dark" ? logoDark : logoLight;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Mobile: Hamburger + Title */}
        <div className="flex items-center gap-2">
          <MobileNav />
          <div className="flex items-center gap-2 md:hidden">
            <img src={logoSrc} alt="Factoría logo" className="h-7 w-7" />
            <h1 className="text-lg font-semibold">
              {title || "Factoría"}
            </h1>
          </div>
        </div>

        {/* Desktop: Logo + Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xl font-semibold text-foreground hover:text-primary transition-colors"
          >
            <img src={logoSrc} alt="Factoría logo" className="h-8 w-8" />
            Factoría
          </button>
          <nav className="flex items-center gap-1">
            <Button
              variant={isActive("/") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => navigate("/")}
            >
              <Home className="mr-1 h-4 w-4" />
              Inicio
            </Button>
            {user && (
              <>
                <Button
                  variant={isActive("/my-prompts") ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => navigate("/my-prompts")}
                >
                  <List className="mr-1 h-4 w-4" />
                  Mis Prompts
                </Button>
                <Button
                  variant={isActive("/chat") ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => navigate("/chat")}
                >
                  <MessageSquare className="mr-1 h-4 w-4" />
                  Chat IA
                </Button>
                <Button
                  variant={isActive("/collections") ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => navigate("/collections")}
                >
                  <FolderOpen className="mr-1 h-4 w-4" />
                  Colecciones
                </Button>
                <Button
                  variant={isActive("/tags") ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => navigate("/tags")}
                >
                  <Tag className="mr-1 h-4 w-4" />
                  Etiquetas
                </Button>
                <Button
                  variant={isActive("/statistics") ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => navigate("/statistics")}
                >
                  <BarChart3 className="mr-1 h-4 w-4" />
                  Stats
                </Button>
              </>
            )}
            <Button
              variant={isActive("/library") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => navigate("/library")}
            >
              <BookOpen className="mr-1 h-4 w-4" />
              Biblioteca
            </Button>
            {isAdmin && (
              <Button
                variant={isActive("/admin") ? "secondary" : "ghost"}
                size="sm"
                onClick={() => navigate("/admin")}
              >
                <ShieldCheck className="mr-1 h-4 w-4" />
                Admin
              </Button>
            )}
          </nav>
        </div>

        {/* Desktop: Actions */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {!loading && (
            user ? (
              <>
                <Button size="sm" onClick={() => navigate("/")}>
                  <Plus className="mr-1 h-4 w-4" />
                  Nuevo
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="mr-1 h-4 w-4" />
                  Salir
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => navigate("/auth")}>
                <LogIn className="mr-1 h-4 w-4" />
                Entrar
              </Button>
            )
          )}
        </div>

        {/* Mobile: Only theme toggle (actions are in drawer) */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
