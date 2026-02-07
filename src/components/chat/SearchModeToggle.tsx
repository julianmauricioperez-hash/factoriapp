import { Globe, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SearchModeToggleProps {
  searchMode: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export function SearchModeToggle({ searchMode, onToggle, disabled }: SearchModeToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={searchMode ? "default" : "outline"}
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => onToggle(!searchMode)}
          disabled={disabled}
        >
          {searchMode ? (
            <>
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Búsqueda</span>
            </>
          ) : (
            <>
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Chat</span>
            </>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {searchMode
          ? "Modo búsqueda: respuestas con información actualizada de internet"
          : "Modo chat: conversación general con IA"}
      </TooltipContent>
    </Tooltip>
  );
}
