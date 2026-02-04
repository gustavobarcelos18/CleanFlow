import React from "react";
import { Activity } from "lucide-react";
import { Link } from "react-router-dom";
export function LandingFooter() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth"
      });
    }
  };
  return <footer id="contato" className="bg-card border-t border-border py-12 px-4 sm:px-6 lg:px-8">
    <div className="container mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">CleanFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">Feito para profissionais de saúde que querem crescer.</p>
        </div>

        <div>
          <h3 className="font-semibold text-foreground mb-3">Produto</h3>
          <ul className="space-y-2">
            <li>
              <button onClick={() => scrollToSection("recursos")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Recursos
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection("como-funciona")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Como funciona
              </button>
            </li>
            <li>
              <button onClick={() => scrollToSection("planos")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Planos
              </button>
            </li>
            <li>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sobre Nós
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-foreground mb-3">Suporte</h3>
          <ul className="space-y-2">
            <li>
              <button onClick={() => scrollToSection("faq")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </button>
            </li>
            <li>
              <Link to="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Central de Suporte
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contato
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-foreground mb-3">Legal</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Política de Privacidade
              </Link>
            </li>
            <li>
              <Link to="/termos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Termos de Uso
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border pt-8 text-center">
        <p className="text-sm text-muted-foreground">
          © 2025 CleanFlow. Todos os direitos reservados.
        </p>
      </div>
    </div>
  </footer>;
}