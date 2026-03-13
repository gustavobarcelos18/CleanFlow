import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PacientesDoDia } from "@/components/atendimento/PacientesDoDia";
import { ProntuarioAtendimento } from "@/components/atendimento/ProntuarioAtendimento";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";

export default function Atendimento() {
  const [selectedAgendamento, setSelectedAgendamento] = useState<any>(null);

  return (
    <MainLayout>
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        <div className="border-b border-muted/30 pb-6">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-300 dark:to-gray-600 pr-2 pb-1">
            Atendimento
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Atenda seus pacientes e registre os prontuários
          </p>
        </div>

        {!selectedAgendamento ? (
          <PacientesDoDia onSelectPaciente={setSelectedAgendamento} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Prontuário do Paciente</CardTitle>
            </CardHeader>
            <CardContent>
              <ProntuarioAtendimento
                agendamento={selectedAgendamento}
                onClose={() => setSelectedAgendamento(null)}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
