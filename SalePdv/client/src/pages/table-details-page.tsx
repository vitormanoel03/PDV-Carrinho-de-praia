import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Order, Table } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TableDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: table, isLoading: isLoadingTable } = useQuery<Table>({
    queryKey: ["/api/tables", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/tables/${id}`);
      return res.json();
    },
  });

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/orders/table", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/orders/table/${id}`);
      return res.json();
    },
    enabled: !!id,
  });

  const closeTableMutation = useMutation({
    mutationFn: async () => {
      // 1. Archive all delivered orders from this table
      const deliveredOrders = orders.filter(order => order.status === 'entregue');
      const archivePromises = deliveredOrders.map(order => {
        return apiRequest("PATCH", `/api/orders/${order.id}`, { status: "arquivado" });
      });
      await Promise.all(archivePromises);

      // 2. Then, make the table available
      const res = await apiRequest("PATCH", `/api/tables/${id}`, { status: "available" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Mesa Encerrada",
        description: `A mesa ${table?.number} foi liberada e os pedidos foram arquivados.`,
      });
      navigate("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao encerrar mesa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activeOrders = orders.filter(order => order.status !== 'arquivado');

  const totalAmount = activeOrders.reduce((acc, order) => acc + order.total, 0);

  const isLoading = isLoadingTable || isLoadingOrders;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-beach-yellow" />
      </div>
    );
  }

  if (!table) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h1 className="text-2xl font-bold mt-4">Mesa não encontrada</h1>
        <Button onClick={() => navigate("/admin")} className="mt-4">Voltar para o painel</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Detalhes da Mesa {table.number}</h1>
        <Button onClick={() => navigate("/admin")} variant="outline">Voltar</Button>
      </div>

      {table.customerName && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Nome:</strong> {table.customerName}</p>
            <p><strong>Telefone:</strong> {table.customerPhone}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {activeOrders.length > 0 ? (
          activeOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Pedido #{order.orderCode || order.id?.substring(0, 6)}</span>
                  <Badge>{order.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between">
                      <span>{item.quantity}x {item.productName}</span>
                      <span>R$ {item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-4 pt-4 flex justify-between font-semibold">
                  <span>Total do Pedido:</span>
                  <span>R$ {order.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p>Nenhum pedido encontrado para esta mesa.</p>
        )}
      </div>

      {activeOrders.length > 0 && (
        <div className="mt-8 pt-6 border-t">
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle>Resumo da Mesa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center font-bold text-xl mb-4">
                <span>Valor Total da Mesa:</span>
                <span>R$ {totalAmount.toFixed(2)}</span>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="lg" className="w-full" disabled={closeTableMutation.isPending}>
                    {closeTableMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Encerrar e Liberar Mesa
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Encerrar Mesa?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso irá marcar a mesa como disponível. O valor total da mesa é de R$ {totalAmount.toFixed(2)}. Deseja continuar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => closeTableMutation.mutate()}>
                      Sim, encerrar mesa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
