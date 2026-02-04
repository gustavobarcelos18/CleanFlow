import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function FinalCTA() {
  return (
    <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 via-background to-success/10">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4">
          Sua agenda cheia começa hoje
        </h2>
        <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8">
          Leva minutos para iniciar na sua clínica ou consultório. Sem contrato longo.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
          <Link to="/signup">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-lg h-14 px-8"
            >
              Comece agora grátis
            </Button>
          </Link>
          <Link to="/login">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-lg h-14 px-8"
            >
              Login
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
