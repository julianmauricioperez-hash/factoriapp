import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "María López",
    role: "Content Manager",
    initials: "ML",
    quote: "Factoría transformó la forma en que creo contenido. Mis prompts ahora generan resultados mucho más precisos y útiles.",
  },
  {
    name: "Carlos Ruiz",
    role: "Desarrollador Full-Stack",
    initials: "CR",
    quote: "La función de mejorar con IA es increíble. Me ahorra horas de iteración al crear prompts para programación.",
  },
  {
    name: "Ana Martínez",
    role: "Profesora universitaria",
    initials: "AM",
    quote: "Organizo todos mis prompts educativos en colecciones. Compartirlos con mis colegas nunca fue tan fácil.",
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl">
          Lo que dicen nuestros usuarios
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Card key={i} className="border shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground italic leading-relaxed mb-4">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {t.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
