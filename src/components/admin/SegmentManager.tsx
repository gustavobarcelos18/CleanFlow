
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, Scale, Wrench, Scissors } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface SegmentConfig {
    id: string;
    name: string;
    active: boolean;
    terminology: any;
}

export function SegmentManager() {
    const [segments, setSegments] = useState<SegmentConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchSegments();
    }, []);

    const fetchSegments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('segment_configs')
                .select('*')
                .order('name');

            if (error) throw error;
            setSegments(data || []);
        } catch (error) {
            console.error("Error fetching segments:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSegment = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('segment_configs')
                .update({ active: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            setSegments(prev => prev.map(s => s.id === id ? { ...s, active: !currentStatus } : s));
            toast({
                title: !currentStatus ? "Segmento Ativado" : "Segmento Desativado",
                description: `O segmento agora está ${!currentStatus ? 'disponível' : 'indisponível'} para novos cadastros.`
            });
        } catch (error) {
            toast({
                title: "Erro ao atualizar",
                variant: "destructive"
            });
        }
    };

    const getIcon = (id: string) => {
        switch (id) {
            case 'saude': return <Activity className="h-5 w-5" />;
            case 'juridico': return <Scale className="h-5 w-5" />;
            case 'oficina': return <Wrench className="h-5 w-5" />;
            case 'beleza': return <Scissors className="h-5 w-5" />;
            default: return <Activity className="h-5 w-5" />;
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Gerenciar Segmentos de Atuação</h2>
                <p className="text-muted-foreground">Ative ou desative os ramos de atividade disponíveis na plataforma.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {segments.map(segment => (
                    <Card key={segment.id} className={!segment.active ? 'opacity-70 bg-muted/30' : ''}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                {getIcon(segment.id)}
                                <CardTitle className="text-base font-medium">
                                    {segment.name}
                                </CardTitle>
                            </div>
                            <Switch
                                checked={segment.active}
                                onCheckedChange={() => toggleSegment(segment.id, segment.active)}
                            />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mt-2">
                                <Badge variant={segment.active ? 'default' : 'secondary'}>
                                    {segment.active ? 'Ativo' : 'Inativo'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">ID: {segment.id}</span>
                            </div>
                            <CardDescription className="mt-2 text-xs">
                                Terminologia: {segment.terminology?.client_label} / {segment.terminology?.file_label}
                            </CardDescription>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
