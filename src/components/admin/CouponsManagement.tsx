import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";

interface Coupon {
    id: string;
    code: string;
    discount_type: 'percent' | 'fixed';
    value: number;
    start_date: string | null;
    end_date: string | null;
    active: boolean;
    usage_limit: number | null;
    times_redeemed: number;
}

export const CouponsManagement = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    const [formData, setFormData] = useState({
        code: "",
        discount_type: "percent",
        value: "",
        start_date: "",
        end_date: "",
        usage_limit: ""
    });

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        try {
            const { data, error } = await supabase
                .from("coupons")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setCoupons(data as any || []);
        } catch (error) {
            console.error("Error loading coupons:", error);
            toast.error("Erro ao carregar cupons");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("Sessão inválida");
                return;
            }

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-coupons`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        action: "create",
                        couponData: {
                            code: formData.code.toUpperCase(),
                            discount_type: formData.discount_type,
                            value: parseFloat(formData.value),
                            start_date: formData.start_date || null,
                            end_date: formData.end_date || null,
                            usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null
                        }
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Erro ao criar cupom");
            }

            toast.success("Cupom criado com sucesso!");
            setDialogOpen(false);
            setFormData({
                code: "",
                discount_type: "percent",
                value: "",
                start_date: "",
                end_date: "",
                usage_limit: ""
            });
            loadCoupons();
        } catch (error: any) {
            console.error("Error creating coupon:", error);
            toast.error(error.message);
        } finally {
            setCreating(false);
        }
    };

    const handleDeactivate = async (id: string) => {
        if (!confirm("Tem certeza que deseja desativar este cupom?")) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-coupons`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        action: "delete",
                        id
                    }),
                }
            );

            if (!response.ok) throw new Error("Erro ao desativar cupom");

            toast.success("Cupom desativado");
            loadCoupons();
        } catch (error) {
            console.error("Error deactivating coupon:", error);
            toast.error("Erro ao desativar cupom");
        }
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Cupons de Desconto</h2>
                    <p className="text-muted-foreground">Gerencie promoções e descontos de assinatura.</p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Cupom
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Novo Cupom</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <Label htmlFor="code">Código do Cupom</Label>
                                <Input
                                    id="code"
                                    placeholder="EX: BLACKFRIDAY"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Tipo de Desconto</Label>
                                    <Select
                                        value={formData.discount_type}
                                        onValueChange={(val) => setFormData({ ...formData, discount_type: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percent">Porcentagem (%)</SelectItem>
                                            <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="value">Valor</Label>
                                    <Input
                                        id="value"
                                        type="number"
                                        placeholder={formData.discount_type === 'percent' ? "10" : "50.00"}
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="start_date">Início (Opcional)</Label>
                                    <Input
                                        id="start_date"
                                        type="datetime-local"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="end_date">Fim (Opcional)</Label>
                                    <Input
                                        id="end_date"
                                        type="datetime-local"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="limit">Limite de Usos (Opcional)</Label>
                                <Input
                                    id="limit"
                                    type="number"
                                    placeholder="Ex: 100"
                                    value={formData.usage_limit}
                                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={creating}>
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Criar Cupom
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-center py-8">Carregando...</div>
            ) : coupons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhum cupom criado</div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Código</TableHead>
                                <TableHead>Desconto</TableHead>
                                <TableHead>Validade</TableHead>
                                <TableHead>Usos</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {coupons.map((coupon) => (
                                <TableRow key={coupon.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-primary" />
                                            {coupon.code}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {coupon.discount_type === 'percent'
                                            ? `${coupon.value}%`
                                            : `R$ ${coupon.value.toFixed(2)}`}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs">
                                            {coupon.start_date && <div>De: {new Date(coupon.start_date).toLocaleDateString()}</div>}
                                            {coupon.end_date && <div>Até: {new Date(coupon.end_date).toLocaleDateString()}</div>}
                                            {!coupon.start_date && !coupon.end_date && "Indeterminado"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {coupon.times_redeemed}
                                        {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={coupon.active ? "default" : "secondary"}>
                                            {coupon.active ? "Ativo" : "Inativo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {coupon.active && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleDeactivate(coupon.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </Card>
    );
};
