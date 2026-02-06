import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";

export interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: "google" | "openai";
}

export const AI_MODELS: AIModel[] = [
  {
    id: "google/gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    description: "Rápido y eficiente",
    provider: "google",
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description: "Máxima calidad",
    provider: "google",
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Balance velocidad/calidad",
    provider: "google",
  },
  {
    id: "openai/gpt-5",
    name: "GPT-5",
    description: "Potente y versátil",
    provider: "openai",
  },
  {
    id: "openai/gpt-5-mini",
    name: "GPT-5 Mini",
    description: "Rápido y económico",
    provider: "openai",
  },
];

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const selectedModel = AI_MODELS.find(m => m.id === value);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[180px] h-8 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <SelectValue>
            {selectedModel?.name || "Seleccionar modelo"}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Google
        </div>
        {AI_MODELS.filter(m => m.provider === "google").map((model) => (
          <SelectItem key={model.id} value={model.id} className="text-xs">
            <div className="flex flex-col">
              <span className="font-medium">{model.name}</span>
              <span className="text-muted-foreground text-[10px]">{model.description}</span>
            </div>
          </SelectItem>
        ))}
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-t mt-1 pt-2">
          OpenAI
        </div>
        {AI_MODELS.filter(m => m.provider === "openai").map((model) => (
          <SelectItem key={model.id} value={model.id} className="text-xs">
            <div className="flex flex-col">
              <span className="font-medium">{model.name}</span>
              <span className="text-muted-foreground text-[10px]">{model.description}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
