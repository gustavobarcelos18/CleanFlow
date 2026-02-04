import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Stethoscope,
  Sparkles,
  Dog,
  Scissors,
  GraduationCap,
  Wrench,
  Loader2,
  Info,
  Lock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const SEGMENTOS = [
  { codigo: 'saude', nome: 'Saúde', icone: Stethoscope, descricao: 'Clínicas, consultórios médicos' },
  { codigo: 'estetica', nome: 'Estética & Beleza', icone: Sparkles, descricao: 'Estúdios, SPAs, salões' },
  { codigo: 'veterinaria', nome: 'Veterinária', icone: Dog, descricao: 'Clínicas veterinárias, pet shops' },
  { codigo: 'odontologia', nome: 'Odontologia', icone: Scissors, descricao: 'Consultórios odontológicos' },
  { codigo: 'educacao', nome: 'Educação & Cursos', icone: GraduationCap, descricao: 'Escolas, cursos, treinamentos' },
  { codigo: 'oficina', nome: 'Oficina & Serviços', icone: Wrench, descricao: 'Mecânicas, assistências técnicas' },
];

export default function SegmentoConfig() {
  const { profile } = useAuth();
  const [segmentoAtual, setSegmentoAtual] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentSegment();
  }, [profile?.tenant_id]);

  const fetchCurrentSegment = async () => {
    if (!profile?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('tenant_profile')
        .select('segmentos')
        .eq('tenant_id', profile.tenant_id)
        .single();

      if (error) throw error;

      const segmentos = data?.segmentos as Array<{ codigo: string }> | null;
      const codigo = segmentos?.[0]?.codigo || '';
      setSegmentoAtual(codigo);
    } catch (error) {
      console.error('Error fetching segment:', error);
    } finally {
      setLoading(false);
    }
  };

  const segmentoInfo = SEGMENTOS.find(s => s.codigo === segmentoAtual);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Configuração Permanente</AlertTitle>
        <AlertDescription>
          O segmento de atuação define a estrutura de dados e terminologias do sistema.
          Para garantir a integridade das suas informações, ele não pode ser alterado após a criação da conta.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {segmentoInfo && <segmentoInfo.icone className="h-5 w-5" />}
            Segmento do Negócio
          </CardTitle>
          <CardDescription>
            Seu ambiente está configurado para o seguinte segmento:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SEGMENTOS.map(seg => {
              const Icon = seg.icone;
              const isCurrent = segmentoAtual === seg.codigo;

              return (
                <div
                  key={seg.codigo}
                  className={`p-4 rounded-lg border-2 transition-all relative ${isCurrent
                      ? 'border-primary bg-primary/5'
                      : 'border-border opacity-50 grayscale'
                    }`}
                >
                  {!isCurrent && (
                    <div className="absolute top-2 right-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{seg.nome}</h4>
                        {isCurrent && <Badge variant="default" className="text-xs">Atual</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{seg.descricao}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
