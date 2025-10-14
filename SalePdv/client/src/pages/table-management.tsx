import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Table } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Coffee } from "lucide-react";

export default function TableManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableForm, setTableForm] = useState({ number: "" });
  const [quantity, setQuantity] = useState(1);

  const { data: tables = [], isLoading } = useQuery<Table[]>({
    queryKey: ["/api/tables"],
    staleTime: 10000,
  });

  const createManyTablesMutation = useMutation({
    mutationFn: async (data: { quantity: number; sellerId: string; sellerName?: string }) => {
      const res = await apiRequest("POST", "/api/tables/bulk", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      setIsAddDialogOpen(false);
      setQuantity(1);
      toast({
        title: "Mesas Criadas",
        description: "As novas mesas foram criadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Criar Mesas",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Table> }) => {
      const res = await apiRequest("PATCH", `/api/tables/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      setEditingTable(null);
      setIsAddDialogOpen(false);
      toast({
        title: "Mesa atualizada",
        description: "A mesa foi atualizada com sucesso",
      });
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/tables/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      toast({
        title: "Mesa excluída",
        description: "A mesa foi excluída com sucesso",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTable) {
      const number = parseInt(tableForm.number);
      if (isNaN(number)) {
        toast({ title: "Número inválido", variant: "destructive" });
        return;
      }
      updateTableMutation.mutate({ id: editingTable.id!, data: { number } });
    } else {
      if (!user?.cpfouCnpj) {
        toast({ title: "Erro", description: "Vendedor não encontrado", variant: "destructive" });
        return;
      }
      createManyTablesMutation.mutate({
        quantity,
        sellerId: user.cpfouCnpj,
        sellerName: user.username,
      });
    }
  };

  return (
    <div className="min-h-screen bg-beach-sand">
      <header className="bg-beach-yellow text-black p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center">
            <Coffee className="mr-2" /> Gerenciamento de {user?.tableNaming === 'guarda-sol' ? 'Guarda-sóis' : 'Mesas'}
          </h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.href = '/admin'}
            className="bg-beach-yellow text-black hover:bg-yellow-600"
          >
            Voltar ao Painel
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{user?.tableNaming === 'guarda-sol' ? 'Guarda-sóis' : 'Mesas'} Cadastradas</h2>
          <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => {
            setIsAddDialogOpen(isOpen);
            if (!isOpen) {
              setEditingTable(null);
              setTableForm({ number: "" });
              setQuantity(1);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-beach-yellow text-black hover:bg-yellow-600">
                <Plus className="h-4 w-4 mr-2" /> Adicionar {user?.tableNaming === 'guarda-sol' ? 'Guarda-sóis' : 'Mesas'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTable ? `Editar ${user?.tableNaming || 'Mesa'}` : `Adicionar Novas ${user?.tableNaming === 'guarda-sol' ? 'Guarda-sóis' : 'Mesas'}`}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {editingTable ? (
                  <div>
                    <Label htmlFor="number">Número do {user?.tableNaming || 'Mesa'}</Label>
                    <Input
                      id="number"
                      type="number"
                      value={tableForm.number}
                      onChange={(e) => setTableForm({ number: e.target.value })}
                      placeholder="Digite o número da mesa"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="quantity">Quantidade de {user?.tableNaming === 'guarda-sol' ? 'Guarda-sóis' : 'Mesas'} a Criar</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      required
                      min="1"
                    />
                  </div>
                )}
                <Button type="submit" className="w-full bg-beach-yellow text-black hover:bg-yellow-600">
                  {editingTable ? `Atualizar ${user?.tableNaming || 'Mesa'}` : `Criar ${quantity} ${user?.tableNaming || 'Mesa'}(s)`}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {tables.map((table) => (
            <Card 
              key={table.id}
              className={`
                ${table.status === 'available' ? 'bg-green-500' : 'bg-red-500'} 
                text-white flex flex-col justify-between
              `}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{user?.tableNaming || 'Mesa'} {table.number}</span>
                  <span className="text-xs font-normal">
                    {table.status === "available" ? "Disponível" : "Ocupada"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex items-end justify-end">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white"
                    onClick={() => {
                      setEditingTable(table);
                      setTableForm({ number: table.number.toString() });
                      setIsAddDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white"
                    onClick={() => {
                      if (table.id) {
                        deleteTableMutation.mutate(table.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
