import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Download, Check, Smartphone, Monitor, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <AppLayout title="Instalar App">
      <div className="max-w-md mx-auto py-8 space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
            <Download className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Instalar Factoría</h1>
          <p className="text-muted-foreground">
            Instala la app en tu dispositivo para acceso rápido, experiencia completa y uso sin conexión.
          </p>
        </div>

        {isInstalled ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-accent flex items-center justify-center">
              <Check className="w-6 h-6 text-primary" />
            </div>
            <p className="font-medium text-foreground">¡App ya instalada!</p>
            <p className="text-sm text-muted-foreground">
              Factoría ya está en tu dispositivo. Búscala en tu pantalla de inicio.
            </p>
          </div>
        ) : deferredPrompt ? (
          <div className="space-y-4">
            <Button onClick={handleInstall} className="w-full h-12 text-base" size="lg">
              <Download className="w-5 h-5 mr-2" />
              Instalar ahora
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Se instalará como app independiente en tu dispositivo.
            </p>
          </div>
        ) : isIOS ? (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Instalar en iPhone / iPad
            </h3>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                <span>Toca el botón <Share className="w-4 h-4 inline" /> <strong className="text-foreground">Compartir</strong> en Safari</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                <span>Desplázate y selecciona <strong className="text-foreground">"Añadir a pantalla de inicio"</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                <span>Toca <strong className="text-foreground">"Añadir"</strong> para confirmar</span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Cómo instalar
            </h3>
            <p className="text-sm text-muted-foreground">
              Abre esta página en <strong className="text-foreground">Chrome</strong> o <strong className="text-foreground">Edge</strong> en tu teléfono o computador y aparecerá el botón de instalación.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-semibold text-foreground text-center">Ventajas</h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: "⚡", title: "Acceso rápido", desc: "Abre desde tu pantalla de inicio" },
              { icon: "📱", title: "Pantalla completa", desc: "Sin barras del navegador" },
              { icon: "🔄", title: "Siempre actualizada", desc: "Se actualiza automáticamente" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-medium text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
