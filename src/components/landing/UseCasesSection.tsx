import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, Code2, GraduationCap, Pen, BarChart3, Lightbulb } from "lucide-react";

const useCases = [
  {
    icon: Megaphone,
    title: "Marketing",
    example: "Genera copy persuasivo para campañas, emails y redes sociales.",
    color: "text-primary",
  },
  {
    icon: Code2,
    title: "Programación",
    example: "Escribe, depura y documenta código con instrucciones precisas.",
    color: "text-primary",
  },
  {
    icon: GraduationCap,
    title: "Educación",
    example: "Crea material didáctico, exámenes y explicaciones claras.",
    color: "text-primary",
  },
  {
    icon: Pen,
    title: "Escritura creativa",
    example: "Genera historias, guiones, poesía y contenido narrativo.",
    color: "text-primary",
  },
  {
    icon: BarChart3,
    title: "Análisis de datos",
    example: "Extrae insights, resume informes y visualiza tendencias.",
    color: "text-primary",
  },
  {
    icon: Lightbulb,
    title: "Brainstorming",
    example: "Genera ideas innovadoras y explora soluciones creativas.",
    color: "text-primary",
  },
];

export const UseCasesSection = () => {
  return (
    <section className="py-16 md:py-20 bg-muted/30">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl">
          Casos de uso
        </h2>
        <p className="mt-3 text-center text-muted-foreground">
          Factoría se adapta a cualquier necesidad
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((uc, i) => (
            <Card key={i} className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <uc.icon className={`h-5 w-5 ${uc.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground">{uc.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {uc.example}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
