
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Table } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function TableManagementPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableForm, setTableForm] = useState({
    number: "",
  });

  const { data: tables = [] } = useQuery<Table[]>({
    queryKey: ["/api/tables"],
  });

  const createTableMutation = useMutation({
    mutationFn: async (data: { number: number }) => {
      const res = await apiRequest("POST", "/api/tables", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      setIsAddDialogOpen(false);
      setTableForm({ number: "" });
      toast({
        title: "Mesa criada",
        description: "A mesa foi criada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar mesa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Table> }) => {
      const res = await apiRequest("PUT", `/api/tables/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      setEditingTable(null);
      toast({
        title: "Mesa atualizada",
        description: "A mesa foi atualizada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar mesa",
        description: error.message,
        variant: "destructive",
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
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir mesa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const number = parseInt(tableForm.number);
    if (isNaN(number)) {
      toast({
        title: "Número inválido",
        description: "Por favor, insira um número válido",
        variant: "destructive",
      });
      return;
    }

    if (editingTable) {
      updateTableMutation.mutate({
        id: editingTable.id!,
        data: { number },
      });
    } else {
      createTableMutation.mutate({ number });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Mesas</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Adicionar Mesa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTable ? "Editar Mesa" : "Adicionar Nova Mesa"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="number">Número da Mesa</Label>
                <Input
                  id="number"
                  type="number"
                  value={tableForm.number}
                  onChange={(e) => setTableForm({ number: e.target.value })}
                  placeholder="Digite o número da mesa"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingTable ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <Card key={table.id}>
            <CardHeader>
              <CardTitle>Mesa {table.number}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    table.status === "available"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {table.status === "available" ? "Disponível" : "Ocupada"}
                </span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingTable(table);
                      setTableForm({ number: table.number.toString() });
                      setIsAddDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (table.id) {
                        deleteTableMutation.mutate(table.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
