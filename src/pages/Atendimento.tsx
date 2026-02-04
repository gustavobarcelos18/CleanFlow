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
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Atendimento</h1>
            <p className="text-muted-foreground">
              Atenda seus pacientes e registre os prontuários
            </p>
          </div>
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
