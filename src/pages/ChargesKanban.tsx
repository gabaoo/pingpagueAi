import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, CheckCircle, Clock, AlertCircle, Repeat, Download, Send, Edit, Trash2, Search, ArrowUpDown, XCircle } from "lucide-react";
import { formatCurrency, parseCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Client {
  id: string;
  name: string;
}

interface Charge {
  id: string;
  client_id: string;
  amount: number;
  status: "pending" | "paid" | "overdue" | "canceled";
  due_date: string;
  payment_link: string | null;
  notes: string | null;
  is_recurrent: boolean;
  recurrence_interval: string | null;
  recurrence_day: number | null;
  next_charge_date: string | null;
  canceled_at: string | null;
  clients: {
    name: string;
    phone: string;
  };
}

const initialFormData = {
  client_id: "",
  amount: "",
  due_date: "",
  notes: "",
  is_recurrent: false,
  recurrence_interval: "monthly",
  recurrence_day: "1",
};

export default function ChargesKanban() {
  const navigate = useNavigate();
  const [charges, setCharges] = useState<Charge[]>([]);
  const [filteredCharges, setFilteredCharges] = useState<Charge[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const [editingCharge, setEditingCharge] = useState<Charge | null>(null);
  const [chargeToDelete, setChargeToDelete] = useState<string | null>(null);
  const [editStatusDialogOpen, setEditStatusDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Charge | null>(null);

  // Filter and sort states
  const [searchClient, setSearchClient] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("due_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [charges, searchClient, filterStatus, sortBy, sortOrder]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const applyFilters = () => {
    let filtered = [...charges];

    // Filter by client name
    if (searchClient) {
      filtered = filtered.filter(charge =>
        charge.clients.name.toLowerCase().includes(searchClient.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(charge => charge.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "due_date") {
        comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      } else if (sortBy === "amount") {
        comparison = a.amount - b.amount;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredCharges(filtered);
  };

  const loadData = async () => {
    try {
      const [chargesResult, clientsResult] = await Promise.all([
        supabase
          .from("charges")
          .select(`
            *,
            clients (
              name,
              phone
            )
          `)
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
          .order("due_date", { ascending: false }),
        supabase.from("clients").select("id, name").order("name"),
      ]);

      if (chargesResult.error) throw chargesResult.error;
      if (clientsResult.error) throw clientsResult.error;

      setCharges(chargesResult.data || []);
      setClients(clientsResult.data || []);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const resetFormData = () => {
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const chargeData: any = {
        user_id: user.id,
        client_id: formData.client_id,
        amount: parseCurrency(formData.amount),
        due_date: formData.due_date,
        notes: formData.notes || null,
        payment_link: "https://exemplo.com/pagar",
        is_recurrent: formData.is_recurrent,
      };

      if (formData.is_recurrent) {
        chargeData.recurrence_interval = formData.recurrence_interval;
        chargeData.recurrence_day = parseInt(formData.recurrence_day);

        const [year, month, day] = formData.due_date.split('-').map(Number);
        const nextDate = new Date(Date.UTC(year, month - 1, day));

        switch (formData.recurrence_interval) {
          case "weekly": nextDate.setUTCDate(nextDate.getUTCDate() + 7); break;
          case "biweekly": nextDate.setUTCDate(nextDate.getUTCDate() + 14); break;
          case "monthly": nextDate.setUTCMonth(nextDate.getUTCMonth() + 1); break;
          case "quarterly": nextDate.setUTCMonth(nextDate.getUTCMonth() + 3); break;
          case "yearly": nextDate.setUTCFullYear(nextDate.getUTCFullYear() + 1); break;
        }
        chargeData.next_charge_date = nextDate.toISOString().split('T')[0];
      } else {
        chargeData.recurrence_interval = null;
        chargeData.recurrence_day = null;
        chargeData.next_charge_date = null;
      }

      if (editingCharge) {
        const { error } = await supabase
          .from("charges")
          .update(chargeData)
          .eq("id", editingCharge.id);

        if (error) throw error;
        toast.success("Cobrança atualizada com sucesso!");
      } else {
        const { data: newCharge, error } = await supabase
          .from("charges")
          .insert(chargeData)
          .select()
          .single();

        if (error) throw error;

        // Send notification for new charge
        if (newCharge) {
          try {
            await supabase.functions.invoke('send-charge-notification', {
              body: {
                charge_id: newCharge.id,
                notification_type: 'reception'
              }
            });
          } catch (notifError) {
            console.error('Error sending notification:', notifError);
          }
        }

        toast.success("Cobrança criada com sucesso!");
      }

      resetFormData();
      setEditingCharge(null);
      setOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || (editingCharge ? "Erro ao atualizar cobrança" : "Erro ao criar cobrança"));
    }
  };

  const exportToCSV = () => {
    const headers = ["Cliente", "Valor", "Vencimento", "Status", "Recorrente", "Observações"];
    const rows = charges.map((charge) => [
      charge.clients.name,
      `R$ ${charge.amount.toFixed(2)}`,
      new Date(charge.due_date).toLocaleDateString("pt-BR", { timeZone: "UTC" }),
      charge.status === "paid" ? "Pago" : charge.status === "pending" ? "Pendente" : charge.status === "overdue" ? "Atrasado" : "Cancelada",
      charge.is_recurrent ? "Sim" : "Não",
      charge.notes || "",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `cobrancas_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    toast.success("Relatório exportado!");
  };

  const sendReminder = async (chargeId: string, clientPhone: string) => {
    try {
      toast.info("Enviando lembrete...");

      const { error } = await supabase.functions.invoke('send-charge-notification', {
        body: {
          charge_id: chargeId,
          notification_type: 'overdue'
        }
      });

      if (error) throw error;

      toast.success("Lembrete enviado com sucesso via WhatsApp!");
      loadData();
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      toast.error("Erro ao enviar lembrete: " + (error.message || "Tente novamente"));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!chargeToDelete) return;
    try {
      const { error } = await supabase
        .from("charges")
        .update({
          status: "canceled",
          canceled_at: new Date().toISOString()
        })
        .eq("id", chargeToDelete);

      if (error) throw error;
      toast.success("Cobrança cancelada com sucesso!");
      loadData();
    } catch (error) {
      toast.error("Erro ao cancelar cobrança");
    } finally {
      setChargeToDelete(null);
    }
  };

  const handleStatusChange = async () => {
    if (!editingStatus) return;

    try {
      const updateData: any = { status: editingStatus.status };

      if (editingStatus.status === "canceled") {
        updateData.canceled_at = new Date().toISOString();
      } else if (editingStatus.status === "paid") {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("charges")
        .update(updateData)
        .eq("id", editingStatus.id);

      if (error) throw error;

      toast.success("Status atualizado com sucesso!");
      loadData();
      setEditStatusDialogOpen(false);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleEdit = (charge: Charge) => {
    if (charge.status === "canceled") {
      toast.error("Cobranças canceladas não podem ser editadas");
      return;
    }

    setEditingCharge(charge);
    setFormData({
      client_id: charge.client_id,
      amount: formatCurrency((charge.amount * 100).toString()),
      due_date: charge.due_date.split('T')[0],
      notes: charge.notes || "",
      is_recurrent: charge.is_recurrent,
      recurrence_interval: charge.recurrence_interval || "monthly",
      recurrence_day: (charge.recurrence_day || 1).toString(),
    });
    setOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="mr-1 h-3 w-3" />Pago
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Clock className="mr-1 h-3 w-3" />Pendente
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />Vencido
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="outline" className="bg-muted/50 text-muted-foreground">
            <XCircle className="mr-1 h-3 w-3" />Cancelada
          </Badge>
        );
      default:
        return null;
    }
  };


  // Group filtered charges by status
  const chargesByStatus = {
    paid: filteredCharges.filter(c => c.status === "paid"),
    overdue: filteredCharges.filter(c => c.status === "overdue"),
    canceled: filteredCharges.filter(c => c.status === "canceled"),
    pending: filteredCharges.filter(c => c.status === "pending"),
  };

  const renderChargeCard = (charge: Charge) => (
    <Card key={charge.id} className="mb-3">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base">{charge.clients.name}</CardTitle>
            <CardDescription className="text-xs">{charge.clients.phone}</CardDescription>
          </div>
          {charge.is_recurrent && (
            <Badge variant="outline" className="text-primary ml-2">
              <Repeat className="mr-1 h-3 w-3" />
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pb-3">
        <div className="text-sm">
          <p className="font-semibold">R$ {charge.amount.toFixed(2).replace(".", ",")}</p>
          <p className="text-xs text-muted-foreground">
            Venc: {new Date(charge.due_date).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
          </p>
          {charge.notes && (
            <p className="text-xs text-muted-foreground mt-1">{charge.notes}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {charge.status === "overdue" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => sendReminder(charge.id, charge.clients.phone)}
              className="h-7 text-xs"
            >
              <Send className="h-3 w-3 mr-1" />
              Lembrete
            </Button>
          )}
          {charge.status !== "canceled" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(charge)}
                className="h-7 text-xs"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingStatus(charge);
                  setEditStatusDialogOpen(true);
                }}
                className="h-7 text-xs text-primary"
              >
                Status
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChargeToDelete(charge.id)}
                className="h-7 text-xs text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Cobranças</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Visão em colunas por status</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>

          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) {
                setEditingCharge(null);
                resetFormData();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Cobrança
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCharge ? "Editar Cobrança" : "Criar Cobrança"}</DialogTitle>
                <DialogDescription>
                  {editingCharge ? "Atualize os dados da cobrança" : "Adicione uma nova cobrança para enviar ao cliente"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente *</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                    <Input
                      id="amount"
                      type="text"
                      placeholder="0,00"
                      value={formData.amount}
                      onChange={(e) => {
                        const formatted = formatCurrency(e.target.value);
                        setFormData({ ...formData, amount: formatted });
                      }}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Data de Vencimento *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informações adicionais"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_recurrent"
                    checked={formData.is_recurrent}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_recurrent: checked as boolean })
                    }
                  />
                  <Label htmlFor="is_recurrent" className="cursor-pointer flex items-center gap-2">
                    <Repeat className="h-4 w-4" />
                    Cobrança Recorrente
                  </Label>
                </div>

                {formData.is_recurrent && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="recurrence_interval">Intervalo de Recorrência</Label>
                      <Select
                        value={formData.recurrence_interval}
                        onValueChange={(value) =>
                          setFormData({ ...formData, recurrence_interval: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="biweekly">Quinzenal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="quarterly">Trimestral</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recurrence_day">Dia da Recorrência (1-31)</Label>
                      <Input
                        id="recurrence_day"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.recurrence_day}
                        onChange={(e) =>
                          setFormData({ ...formData, recurrence_day: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}
                <Button type="submit" className="w-full">
                  {editingCharge ? "Salvar Alterações" : "Criar e Enviar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Sorting */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search-client">Buscar Cliente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-client"
                  placeholder="Nome do cliente..."
                  value={searchClient}
                  onChange={(e) => setSearchClient(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-status">Filtrar por Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort-by">Ordenar por</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="due_date">Data de Vencimento</SelectItem>
                  <SelectItem value="amount">Valor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ordem</Label>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {sortOrder === "asc" ? "Crescente" : "Decrescente"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p>Carregando...</p>
      ) : charges.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma cobrança encontrada</CardTitle>
            <CardDescription>
              Comece criando sua primeira cobrança clicando no botão "Nova Cobrança"
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Coluna Pendente */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-warning">
              <Clock className="h-5 w-5 text-warning-foreground" />
              <h3 className="font-semibold text-lg">
                Pendente ({chargesByStatus.pending.length})
              </h3>
            </div>
            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
              {chargesByStatus.pending.map(renderChargeCard)}
            </div>
          </div>

          {/* Coluna Vencido */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-destructive">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold text-lg">
                Vencido ({chargesByStatus.overdue.length})
              </h3>
            </div>
            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
              {chargesByStatus.overdue.map(renderChargeCard)}
            </div>
          </div>

          {/* Coluna Pago */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-success">
              <CheckCircle className="h-5 w-5 text-success" />
              <h3 className="font-semibold text-lg">
                Pago ({chargesByStatus.paid.length})
              </h3>
            </div>
            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
              {chargesByStatus.paid.map(renderChargeCard)}
            </div>
          </div>

          {/* Coluna Cancelado – Padronizada */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b-2 border-muted">
              <XCircle className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg text-muted-foreground">
                Cancelada ({chargesByStatus.canceled.length})
              </h3>
            </div>
            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
              {chargesByStatus.canceled.map(renderChargeCard)}
            </div>
          </div>
        </div>

      )}

      <AlertDialog
        open={!!chargeToDelete}
        onOpenChange={(isOpen) => !isOpen && setChargeToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cancelamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta cobrança? A cobrança será marcada como cancelada e não será mais contabilizada nos totais.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar Cobrança
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editStatusDialogOpen} onOpenChange={setEditStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Status da Cobrança</DialogTitle>
          </DialogHeader>
          {editingStatus && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <p className="text-sm text-muted-foreground">{editingStatus.clients.name}</p>
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <p className="text-sm text-muted-foreground">R$ {Number(editingStatus.amount).toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editingStatus.status}
                  onValueChange={(value) => setEditingStatus({ ...editingStatus, status: value as any })}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Vencido</SelectItem>
                    <SelectItem value="canceled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditStatusDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleStatusChange}>
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
