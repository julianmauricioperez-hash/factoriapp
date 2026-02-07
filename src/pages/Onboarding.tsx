import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, FolderOpen, MessageSquare, Globe } from "lucide-react";

const steps = [
  {
    icon: Sparkles,
    title: "¡Bienvenido a Factoría!",
    description: "Tu espacio para gestionar, organizar y potenciar tus prompts de IA. Vamos a darte un recorrido rápido.",
  },
  {
    icon: FolderOpen,
    title: "Crea y organiza",
    description: "Crea prompts, organízalos en colecciones y categorías, y etiquétalos para encontrarlos fácilmente.",
  },
  {
    icon: MessageSquare,
    title: "Chat con IA",
    description: "Chatea con IA directamente desde la app para probar, refinar y mejorar tus prompts al instante.",
  },
  {
    icon: Globe,
    title: "Biblioteca pública",
    description: "Comparte tus mejores prompts con la comunidad y descubre los que otros usuarios han creado.",
  },
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { completeOnboarding } = useProfile();
  const { user } = useAuth();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = async () => {
    await completeOnboarding();
    navigate("/");
  };

  const handleSkip = async () => {
    await completeOnboarding();
    navigate("/");
  };

  const isLastStep = currentStep === steps.length - 1;
  const StepIcon = steps[currentStep].icon;

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-sm border">
        <CardContent className="pt-8 pb-6 px-6">
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <StepIcon className="w-8 h-8 text-primary" />
            </div>

            {/* Title */}
            <h1 className="text-xl font-semibold text-foreground mb-2">
              {currentStep === 0 && displayName
                ? `¡Bienvenido, ${displayName}!`
                : steps[currentStep].title}
            </h1>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              {steps[currentStep].description}
            </p>

            {/* Dots */}
            <div className="flex gap-2 mb-6">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? "w-6 bg-primary"
                      : "w-2 bg-muted-foreground/25"
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex w-full gap-3">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  className="flex-1"
                >
                  Anterior
                </Button>
              )}
              <Button
                onClick={isLastStep ? handleFinish : handleNext}
                className="flex-1"
              >
                {isLastStep ? "¡Empezar!" : "Siguiente"}
              </Button>
            </div>

            {/* Skip */}
            <button
              type="button"
              onClick={handleSkip}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Saltar
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
