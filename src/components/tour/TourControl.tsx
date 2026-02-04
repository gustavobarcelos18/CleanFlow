import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTourStore } from '@/stores/useTourStore';
import { MapPin, RotateCcw, Play } from 'lucide-react';

export function TourControl() {
    const { hasSeenTour, isRunning, startTour, resetTour } = useTourStore();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Tour Guiado
                </CardTitle>
                <CardDescription>
                    Conheça todas as funcionalidades do CleanFlow através de um tour interativo
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                    <Button
                        onClick={() => startTour('dashboard')}
                        disabled={isRunning}
                        className="w-full"
                    >
                        <Play className="mr-2 h-4 w-4" />
                        {hasSeenTour ? 'Reiniciar Tour' : 'Iniciar Tour'}
                    </Button>

                    {hasSeenTour && (
                        <Button
                            onClick={resetTour}
                            variant="outline"
                            className="w-full"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Marcar como não visto
                        </Button>
                    )}
                </div>

                <div className="text-sm text-muted-foreground">
                    <p className="font-semibold mb-2">O tour inclui:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Visão geral do dashboard</li>
                        <li>Gestão de agenda</li>
                        <li>Cadastro de pacientes</li>
                        <li>Automações de WhatsApp</li>
                        <li>Controle financeiro</li>
                        <li>Relatórios e análises</li>
                    </ul>
                </div>

                {hasSeenTour && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-300">
                            ✓ Você já completou o tour guiado
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
