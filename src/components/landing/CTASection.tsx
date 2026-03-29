import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="py-16 md:py-20 bg-muted/30">
      <div className="mx-auto max-w-2xl text-center px-4">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">
          ¿Listo para potenciar tus prompts?
        </h2>
        <p className="mt-4 text-muted-foreground">
          Únete a la comunidad de Factoría y lleva tus prompts al siguiente nivel. Es gratis.
        </p>
        <Link to="/auth">
          <Button size="lg" className="mt-8 text-base px-8 gap-2">
            Crear cuenta gratis
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </section>
  );
};
