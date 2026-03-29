import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, BookOpen } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10 pointer-events-none" />
      <div className="relative mx-auto max-w-3xl text-center px-4">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          Potenciado con IA
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
          Transforma tus prompts en{" "}
          <span className="text-primary">resultados extraordinarios</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
          Escribe, mejora con inteligencia artificial, organiza y comparte tus mejores prompts. 
          Todo en un solo lugar.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/auth">
            <Button size="lg" className="w-full sm:w-auto text-base px-8">
              Empieza gratis
            </Button>
          </Link>
          <Link to="/library">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 gap-2">
              <BookOpen className="h-5 w-5" />
              Explorar biblioteca
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
