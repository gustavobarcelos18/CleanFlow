import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PacientesDoDia } from "@/components/atendimento/PacientesDoDia";
import { ProntuarioAtendimento } from "@/components/atendimento/ProntuarioAtendimento";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";
import { useLayoutTitle } from "@/hooks/useLayoutTitle";

export default function Atendimento() {
  const [selectedAgendamento, setSelectedAgendamento] = useState<any>(null);
  const { setTitle, setSubtitle } = useLayoutTitle();

  useEffect(() => {
    setTitle("Atendimento");
    setSubtitle("Atenda seus pacientes e registre os prontuários");
  }, [setTitle, setSubtitle]);

  return (
    <MainLayout>
      <div className="space-y-6 animate-in fade-in duration-500 pb-10">

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
