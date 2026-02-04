import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Check, Loader2, ArrowLeft, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Plan {
    id: string;
    name: string;
    slug: string;
    description: string;
    price_monthly: number;
    stripe_price_id: string | null;
    features: string[];
    metadata: {
        type: 'professional' | 'clinic' | 'multi_unit';
        recommended?: boolean;
        extra_seat_price?: number;
    };
}

interface PlanSelectionProps {
    edition: 'solo' | 'company' | 'org';
    onSelect: (selection: { planCode: string; price: number; priceId?: string; seats?: number; units?: number; couponCode?: string }) => void;
    onBack: () => void;
}

export function PlanSelection({ edition, onSelect, onBack }: PlanSelectionProps) {
    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    // State for selections
    const [selectedPlanId, setSelectedPlanId] = useState<string>("");
    const [companySeats, setCompanySeats] = useState(5);
    const [orgUnits, setOrgUnits] = useState(2);

    // Coupon state
    const [couponCode, setCouponCode] = useState("");
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: 'percent' | 'fixed'; value: number } | null>(null);

    useEffect(() => {
        fetchPlans();
    }, [edition]);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            let typeFilter = '';
            if (edition === 'solo') typeFilter = 'professional';
            if (edition === 'company') typeFilter = 'clinic';
            if (edition === 'org') typeFilter = 'multi_unit';

            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .eq('active', true)
                .order('price_monthly');

            if (error) throw error;

            if (data) {
                const typedData = data as any[];
                const filteredPlans = typedData.filter(p => p.metadata?.type === typeFilter);

                setPlans(filteredPlans as Plan[]);

                if (filteredPlans.length > 0) {
                    if (edition === 'solo') {
                        const recommended = filteredPlans.find(p => p.metadata?.recommended);
                        setSelectedPlanId(recommended ? recommended.id : filteredPlans[0].id);
                    } else {
                        setSelectedPlanId(filteredPlans[0].id);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching plans:", error);
        } finally {
            setLoading(false);
        }
    };

    const validateCoupon = async () => {
        if (!couponCode.trim()) return;
        setValidatingCoupon(true);

        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', couponCode.toUpperCase())
                .eq('active', true)
                .single();

            if (error || !data) {
                toast.error("Cupom inválido ou expirado");
                setAppliedCoupon(null);
                return;
            }

            // Check dates
            const now = new Date();
            if (data.start_date && new Date(data.start_date) > now) {
                toast.error("Cupom ainda não é válido");
                return;
            }
            if (data.end_date && new Date(data.end_date) < now) {
                toast.error("Cupom expirado");
                return;
            }

            // Check usage limit
            if (data.usage_limit && data.times_redeemed >= data.usage_limit) {
                toast.error("Limite de uso do cupom atingido");
                return;
            }

            setAppliedCoupon({
                code: data.code,
                type: data.discount_type as 'percent' | 'fixed',
                value: data.value
            });
            toast.success("Cupom aplicado com sucesso!");
        } catch (error) {
            console.error("Error validating coupon:", error);
            toast.error("Erro ao validar cupom");
        } finally {
            setValidatingCoupon(false);
        }
    };

    const calculateTotal = () => {
        const plan = plans.find(p => p.id === selectedPlanId);
        if (!plan) return 0;

        let total = plan.price_monthly;

        if (edition === 'company') {
            const extraSeats = Math.max(0, companySeats - 5);
            const extraPrice = plan.metadata?.extra_seat_price || 0;
            total = plan.price_monthly + (extraSeats * extraPrice);
        }

        if (edition === 'org') {
            const discount = orgUnits >= 2 ? 0.9 : 1;
            total = plan.price_monthly * orgUnits * discount;
        }

        // Apply coupon
        if (appliedCoupon) {
            if (appliedCoupon.type === 'percent') {
                total = total * (1 - appliedCoupon.value / 100);
            } else {
                total = Math.max(0, total - appliedCoupon.value);
            }
        }

        return total;
    };

    const handleContinue = () => {
        const plan = plans.find(p => p.id === selectedPlanId);
        if (!plan) return;

        onSelect({
            planCode: plan.slug,
            price: calculateTotal(),
            priceId: plan.stripe_price_id || undefined,
            seats: edition === 'company' ? companySeats : undefined,
            units: edition === 'org' ? orgUnits : undefined,
            couponCode: appliedCoupon?.code
        });
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold">Escolha seu Plano</h2>
                    <p className="text-muted-foreground">Selecione o plano ideal para o seu negócio</p>
                </div>
            </div>

            <div className={`grid gap-6 ${edition === 'solo' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {plans.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    return (
                        <Card
                            key={plan.id}
                            className={`p-6 cursor-pointer transition-all border-2 ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}
                            onClick={() => setSelectedPlanId(plan.id)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold">{plan.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                                    {edition === 'company' && <Badge variant="secondary" className="mt-2">5 Profissionais Inclusos</Badge>}
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold">
                                        {plan.price_monthly === 0 ? 'Grátis' : `R$ ${formatCurrency(plan.price_monthly)}`}
                                    </span>
                                    {plan.price_monthly > 0 && <p className="text-xs text-muted-foreground">/mês</p>}
                                </div>
                            </div>

                            <ul className="space-y-3 mb-6">
                                {plan.features && plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center text-sm">
                                        <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {edition === 'company' && isSelected && (
                                <div className="mt-6 pt-6 border-t space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label>Número de Profissionais</Label>
                                        <span className="font-bold text-lg">{companySeats}</span>
                                    </div>
                                    <Slider
                                        value={[companySeats]}
                                        min={1}
                                        max={50}
                                        step={1}
                                        onValueChange={(vals) => setCompanySeats(vals[0])}
                                    />
                                    <div className="text-sm text-muted-foreground flex justify-between">
                                        <span>5 inclusos</span>
                                        {companySeats > 5 && (
                                            <span className="text-primary font-medium">
                                                +{companySeats - 5} extras (+ R$ {formatCurrency((companySeats - 5) * (plan.metadata?.extra_seat_price || 0))}/mês)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {edition === 'org' && isSelected && (
                                <div className="mt-6 pt-6 border-t space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label>Número de Unidades</Label>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setOrgUnits(Math.max(2, orgUnits - 1)); }}>-</Button>
                                            <span className="font-bold text-lg w-8 text-center">{orgUnits}</span>
                                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setOrgUnits(orgUnits + 1); }}>+</Button>
                                        </div>
                                    </div>
                                    {orgUnits >= 2 && (
                                        <p className="text-sm text-green-600 font-medium flex items-center">
                                            <Check className="h-3 w-3 mr-1" />
                                            Desconto de 10% aplicado por múltiplas unidades
                                        </p>
                                    )}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            <div className="flex flex-col gap-4 pt-6 border-t">
                {/* Coupon Section */}
                <div className="flex items-end gap-2 max-w-sm">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="coupon">Cupom de Desconto</Label>
                        <div className="relative">
                            <Tag className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="coupon"
                                placeholder="Código do cupom"
                                className="pl-8"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                disabled={!!appliedCoupon}
                            />
                        </div>
                    </div>
                    {appliedCoupon ? (
                        <Button variant="outline" onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}>
                            Remover
                        </Button>
                    ) : (
                        <Button variant="secondary" onClick={validateCoupon} disabled={validatingCoupon || !couponCode}>
                            {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                        </Button>
                    )}
                </div>

                {appliedCoupon && (
                    <div className="text-sm text-green-600 font-medium flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        Cupom {appliedCoupon.code} aplicado:
                        {appliedCoupon.type === 'percent' ? ` ${appliedCoupon.value}% de desconto` : ` R$ ${appliedCoupon.value} de desconto`}
                    </div>
                )}

                <div className="flex items-center justify-between mt-4">
                    <div className="text-lg">
                        Total estimado: <span className="font-bold text-2xl text-primary">R$ {formatCurrency(calculateTotal())}</span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                    <Button size="lg" onClick={handleContinue} disabled={!selectedPlanId}>
                        Continuar
                    </Button>
                </div>
            </div>
        </div>
    );
}
