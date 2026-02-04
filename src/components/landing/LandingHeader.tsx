import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
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
      // Se não estiver na home, navegar para home e depois rolar
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth"
          });
        }
      }, 100);
    } else {
      // Se já estiver na home, apenas rolar
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth"
        });
      }
    }
  };
  const baseNavItems = [{
    label: "Recursos",
    id: "recursos"
  }, {
    label: "Como funciona",
    id: "como-funciona"
  }, {
    label: "Planos",
    id: "planos"
  }, {
    label: "FAQ",
    id: "faq"
  }, {
    label: "Contato",
    id: "contato"
  }];
  const navItems = isHomePage ? baseNavItems : [{
    label: "Home",
    id: "home"
  }, ...baseNavItems];
  return <header className="fixed top-0 left-0 right-0 z-50">
    {/* Dark contrast bar */}
    <div className="bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Activity className="h-6 md:h-8 w-6 md:w-8 text-primary" />
            <span className="text-xl md:text-2xl font-bold text-foreground">CleanFlow</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map(item => <button key={item.id} onClick={() => scrollToSection(item.id)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {item.label}
            </button>)}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs">
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-primary hover:bg-primary-hover text-xs">
                Comece agora
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                {navItems.map(item => <button key={item.id} onClick={() => scrollToSection(item.id)} className="text-left text-lg text-muted-foreground hover:text-foreground transition-colors py-2">
                  {item.label}
                </button>)}
                <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-border">
                  <Link to="/login" className="w-full">
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup" className="w-full">
                    <Button className="w-full bg-primary hover:bg-primary-hover">
                      Comece agora
                    </Button>
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  </header>;
}