import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OnboardingConsultorioProps {
  onBack: () => void;
}

export function OnboardingConsultorio({ onBack }: OnboardingConsultorioProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = () => {
    toast({
      title: "Cadastro concluído!",
      description: "Bem-vindo ao CleanFlow.",
    });
    setTimeout(() => navigate("/dashboard"), 1500);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Cadastro de Consultório/Unidade</h1>
          <p className="text-muted-foreground">Em desenvolvimento...</p>
          <Button onClick={handleSubmit} className="mt-6">Concluir</Button>
        </Card>
      </div>
    </div>
  );
}
