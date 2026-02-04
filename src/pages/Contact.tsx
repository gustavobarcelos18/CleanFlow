import React, { useState } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
const contactSchema = z.object({
  name: z.string().trim().min(1, {
    message: "Nome é obrigatório"
  }).max(100),
  email: z.string().trim().email({
    message: "E-mail inválido"
  }).max(255),
  phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().min(1, {
    message: "Assunto é obrigatório"
  }).max(200),
  message: z.string().trim().min(10, {
    message: "Mensagem deve ter no mínimo 10 caracteres"
  }).max(2000)
});
const Contact = () => {
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const validated = contactSchema.parse(formData);

      // Simular envio (integrar com backend posteriormente)
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Mensagem enviada!",
        description: "Entraremos em contato em breve."
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro no formulário",
          description: error.errors[0].message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro ao enviar",
          description: "Tente novamente mais tarde.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  return <div className="min-h-screen bg-background">
    <LandingHeader />

    <main className="pt-24 pb-16">
      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary/10 via-background to-success/10">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Entre em Contato
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Estamos aqui para ajudar. Envie sua mensagem e responderemos em breve.
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Informações de Contato
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">E-mail</p>
                      <a href="mailto:contato@cleanflow.com.br" className="text-muted-foreground hover:text-primary transition-colors">
                        contato@cleanflow.com.br
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Telefone</p>
                      <a href="tel:+5511999999999" className="text-muted-foreground hover:text-primary transition-colors">(11) 98406-8448</a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Localização</p>
                      <p className="text-muted-foreground">
                        São Paulo, SP<br />
                        Brasil
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Horário de Atendimento
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>Segunda a Sexta: 9h às 18h</p>
                  <p>Sábado: 9h às 13h</p>
                  <p>Domingo: Fechado</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-card p-8 rounded-2xl border border-border">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Envie sua Mensagem
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Seu nome completo" required maxLength={100} />
                  </div>

                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="seu@email.com" required maxLength={255} />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="(11) 99999-9999" maxLength={20} />
                  </div>

                  <div>
                    <Label htmlFor="subject">Assunto *</Label>
                    <Input id="subject" name="subject" value={formData.subject} onChange={handleChange} placeholder="Como podemos ajudar?" required maxLength={200} />
                  </div>

                  <div>
                    <Label htmlFor="message">Mensagem *</Label>
                    <Textarea id="message" name="message" value={formData.message} onChange={handleChange} placeholder="Descreva sua dúvida ou solicitação..." rows={6} required minLength={10} maxLength={2000} />
                    <p className="text-xs text-muted-foreground mt-2">
                      {formData.message.length}/2000 caracteres
                    </p>
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Enviando..." : <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Mensagem
                    </>}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <LandingFooter />
  </div>;
};
export default Contact;