import { PenLine, Sparkles, Share2 } from "lucide-react";

const steps = [
  {
    icon: PenLine,
    title: "Escribe tu prompt",
    description: "Redacta tu prompt inicial con la ayuda de plantillas y sugerencias inteligentes.",
  },
  {
    icon: Sparkles,
    title: "Mejóralo con IA",
    description: "Nuestra IA analiza y potencia tu prompt para obtener respuestas más precisas y útiles.",
  },
  {
    icon: Share2,
    title: "Organiza y comparte",
    description: "Guarda en colecciones, etiqueta y comparte tus mejores prompts con la comunidad.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl">
          ¿Cómo funciona?
        </h2>
        <p className="mt-3 text-center text-muted-foreground">
          Tres pasos simples para dominar tus prompts
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <step.icon className="h-7 w-7" />
              </div>
              <span className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
