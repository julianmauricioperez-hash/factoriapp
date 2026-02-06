import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
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
} from "lucide-react";

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export function AppHeader({ title, showBackButton }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, loading } = useAuth();

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
          <h1 className="text-lg font-semibold md:hidden">
            {title || "Alimentaria"}
          </h1>
        </div>

        {/* Desktop: Logo + Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={() => navigate("/")}
            className="text-xl font-semibold text-foreground hover:text-primary transition-colors"
          >
            Alimentaria
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
                  variant={isActive("/collections") ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => navigate("/collections")}
                >
                  <FolderOpen className="mr-1 h-4 w-4" />
                  Colecciones
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
