import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import testimonial1 from "@/assets/testimonial-doctor-1.jpg";
import testimonial2 from "@/assets/testimonial-doctor-2.jpg";
import testimonial3 from "@/assets/testimonial-doctor-3.jpg";

export function Testimonials() {
  const testimonials = [
    {
      quote: "Reduzi faltas em 60% em três meses. Atingi meu objetivo de faturamento antes do esperado. O CleanFlow transformou completamente a gestão da minha clínica.",
      author: "Dr. Carlos Silva",
      role: "Clínico Geral",
      location: "São Paulo, SP",
      image: testimonial1,
      rating: 5,
    },
    {
      quote: "A confirmação automática libera tempo da secretária, e os encaixes acontecem sem eu precisar interferir. Simplesmente perfeito para profissionais ocupados.",
      author: "Dra. Ana Costa",
      role: "Dentista",
      location: "Rio de Janeiro, RJ",
      image: testimonial2,
      rating: 5,
    },
    {
      quote: "Faturei R$ 28 mil a mais no último trimestre só pela queda de faltas. Não sabia que era tão fácil aumentar a produtividade da clínica.",
      author: "Dr. Roberto Mendes",
      role: "Fisioterapeuta",
      location: "Belo Horizonte, MG",
      image: testimonial3,
      rating: 5,
    },
  ];

  return (
    <section className="py-12 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-8 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-6">
            <Star className="h-4 w-4 text-primary fill-primary" />
            <span className="text-sm font-medium text-primary">Avaliação 4.9/5.0</span>
          </div>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4">
            O que os profissionais dizem
          </h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Centenas de profissionais já transformaram suas clínicas com o CleanFlow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-2 border-border hover:border-primary/30 hover:shadow-xl transition-all duration-300 bg-card">
              <CardContent className="p-8 space-y-6">
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-warning fill-warning" />
                  ))}
                </div>

                <p className="text-foreground text-lg leading-relaxed">
                  "{testimonial.quote}"
                </p>

                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <Avatar className="h-14 w-14 ring-2 ring-primary/10">
                    <AvatarImage src={testimonial.image} alt={testimonial.author} />
                    <AvatarFallback>{testimonial.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-foreground text-lg">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground font-medium">{testimonial.role}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
