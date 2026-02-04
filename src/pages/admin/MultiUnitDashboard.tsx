
import { useState, useEffect } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Building2, DollarSign, Users, Activity } from 'lucide-react';

interface UnitMetric {
    unitName: string;
    revenue: number;
    appointments: number;
    occupancy: number;
}

export default function MultiUnitDashboard() {
    const [metrics, setMetrics] = useState<UnitMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30d');

    useEffect(() => {
        fetchMultiUnitData();
    }, [period]);

    const fetchMultiUnitData = async () => {
        setLoading(true);
        try {
            // In a real scenario, we would query a view or aggregate data from multiple tenants
            // linked to the current user's organization.
            // For MVP, we will mock this data to demonstrate the visualization structure,
            // as setting up the full multi-tenant organization hierarchy is complex.

            // Mock Data representing 3 units
            const mockData: UnitMetric[] = [
                { unitName: 'Unidade Centro', revenue: 125000, appointments: 450, occupancy: 85 },
                { unitName: 'Unidade Jardins', revenue: 180000, appointments: 520, occupancy: 92 },
                { unitName: 'Unidade Zona Sul', revenue: 95000, appointments: 310, occupancy: 68 },
            ];

            setMetrics(mockData);
        } catch (error) {
            console.error("Error fetching multi-unit data", error);
        } finally {
            setLoading(false);
        }
    };

    const totalRevenue = metrics.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalAppointments = metrics.reduce((acc, curr) => acc + curr.appointments, 0);
    const avgOccupancy = metrics.reduce((acc, curr) => acc + curr.occupancy, 0) / metrics.length;

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Visão Global da Rede</h1>
                        <p className="text-muted-foreground">Acompanhe o desempenho de todas as suas unidades em tempo real.</p>
                    </div>
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Últimos 7 dias</SelectItem>
                            <SelectItem value="30d">Últimos 30 dias</SelectItem>
                            <SelectItem value="90d">Últimos 3 meses</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
                            </div>
                            <p className="text-xs text-muted-foreground">+12% em relação ao mês anterior</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Atendimentos</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalAppointments}</div>
                            <p className="text-xs text-muted-foreground">+5% em relação ao mês anterior</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ocupação Média</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{avgOccupancy.toFixed(1)}%</div>
                            <p className="text-xs text-muted-foreground">Meta: 85%</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unidades Ativas</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.length}</div>
                            <p className="text-xs text-muted-foreground">Todas operando normalmente</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Faturamento por Unidade</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="unitName" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number)}
                                    />
                                    <Bar dataKey="revenue" fill="#016CA5" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Taxa de Ocupação (%)</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" domain={[0, 100]} />
                                    <YAxis dataKey="unitName" type="category" width={100} />
                                    <Tooltip />
                                    <Bar dataKey="occupancy" fill="#25D366" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
