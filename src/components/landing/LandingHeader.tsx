import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (id === "home") {
      navigate("/");
      window.scrollTo(0, 0);
      return;
    }
    if (id === "contato") {
      navigate("/contact");
      setTimeout(() => window.scrollTo(0, 0), 0);
      return;
    }
    if (!isHomePage) {
      navigate("/");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navItems = [
    { label: "Como funciona", id: "como-funciona" },
    { label: "Resultados", id: "resultados" },
    { label: "Depoimentos", id: "depoimentos" },
    { label: "Planos", id: "planos" },
    { label: "FAQ", id: "faq" },
  ];

  const navClass = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    isScrolled
      ? "bg-[#070B12]/95 backdrop-blur-md border-b border-[#1B2A40] shadow-lg shadow-black/30"
      : "bg-transparent"
  }`;

  return (
    <header className={navClass}>
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <Activity
              className="h-8 md:h-9 w-8 md:w-9 text-cyan-400"
              strokeWidth={2.5}
            />
            <span className="text-xl md:text-2xl font-bold text-white tracking-tight">
              CleanFlow
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav
            className="hidden lg:flex items-center gap-6"
            aria-label="Navegação principal"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-sm text-[#A9B7D0] hover:text-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded px-1"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button
                size="sm"
                variant="outline"
                className="border-[#1B2A40] text-[#A9B7D0] hover:border-cyan-400/60 hover:bg-cyan-400/10 hover:text-white text-sm transition-all hover:shadow-[0_0_15px_rgba(34,211,238,0.1)]"
              >
                Login
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => scrollToSection("planos")}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-lg shadow-orange-500/25 transition-all"
            >
              Começar agora
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="h-6 w-6 text-white" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] bg-[#0B1220] border-[#1B2A40]"
            >
              <nav
                className="flex flex-col gap-4 mt-8"
                aria-label="Menu mobile"
              >
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="text-left text-base text-[#A9B7D0] hover:text-cyan-400 transition-colors py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-[#1B2A40]">
                  <Link
                    to="/login"
                    className="w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant="outline"
                      className="w-full border-[#1B2A40] text-[#A9B7D0] hover:border-cyan-400/60 hover:bg-cyan-400/10 hover:text-white transition-all hover:shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                    >
                      Login
                    </Button>
                  </Link>
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                    onClick={() => scrollToSection("planos")}
                  >
                    Começar agora
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
