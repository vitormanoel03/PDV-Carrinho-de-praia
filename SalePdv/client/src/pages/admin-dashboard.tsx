import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Table, Order } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, LogOut, Coffee, Users, ShoppingBasket, Check, Clock, AlertTriangle, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboardPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("mesas");

  // Buscar mesas
  const {
    data: tables = [],
    isLoading: isLoadingTables,
    error: tablesError,
  } = useQuery<Table[]>({
    queryKey: ["/api/tables"],
    staleTime: 10000,
  });

  // Buscar pedidos
  const {
    data: orders = [],
    isLoading: isLoadingOrders,
    error: ordersError,
  } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    staleTime: 10000,
  });

  // Mutação para atualizar status do pedido
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Status atualizado",
        description: "O status do pedido foi atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para limpar uma mesa
  const clearTableMutation = useMutation({
    mutationFn: async (tableId: string) => {
      const res = await apiRequest("PATCH", `/api/tables/${tableId}`, { status: "available" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      toast({
        title: "Mesa liberada",
        description: "A mesa foi marcada como disponível",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao liberar mesa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Agrupar pedidos por mesa
  const ordersByTable: Record<string, Order[]> = {};
  
  // Inicializar para garantir que todas as mesas tenham uma entrada
  tables.forEach(table => {
    if (table.id) {
      ordersByTable[table.id] = [];
    }
  });
  
  // Preencher com os pedidos
  orders.forEach(order => {
    if (order.tableId && ordersByTable[order.tableId]) {
      ordersByTable[order.tableId].push(order);
    } else if (order.tableId) {
      ordersByTable[order.tableId] = [order];
    }
  });

  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    updateOrderStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleClearTable = (tableId: string) => {
    clearTableMutation.mutate(tableId);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoadingTables || isLoadingOrders) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-beach-yellow" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aguardando":
        return "bg-beach-yellow text-black";
      case "em_preparo":
        return "bg-beach-orange text-white";
      case "entregue":
        return "bg-green-500 text-white";
      case "cancelado":
        return "bg-beach-red text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-beach-sand">
      <header className="bg-beach-yellow text-black p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center">
            <Coffee className="mr-2" /> Carrinho de Praia - Painel Admin
          </h1>
          <div className="flex items-center gap-4">
            <span>Olá, {user?.name || user?.username}</span>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/products'}
              className="bg-beach-yellow text-black hover:bg-yellow-600"
            >
              <ShoppingBasket className="mr-2 h-4 w-4" /> Gerenciar Produtos
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleLogout}
              className="bg-beach-red hover:bg-red-700"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="bg-beach-white">
            <TabsTrigger value="mesas" className="data-[state=active]:bg-beach-yellow data-[state=active]:text-black">
              <Users className="mr-2 h-4 w-4" />
              Mesas
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="data-[state=active]:bg-beach-yellow data-[state=active]:text-black">
              <ShoppingBasket className="mr-2 h-4 w-4" />
              Pedidos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mesas" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((table) => (
                <Card key={table.id} className={table.status === "occupied" ? "border-beach-yellow" : ""}>
                  <CardHeader className={`${table.status === "occupied" ? "bg-beach-yellow text-black" : "bg-gray-100"}`}>
                    <CardTitle className="flex justify-between items-center">
                      <span>Mesa {table.number}</span>
                      <Badge variant={table.status === "occupied" ? "default" : "outline"}>
                        {table.status === "occupied" ? "Ocupada" : "Disponível"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {table.status === "occupied" && ordersByTable && table.id && ordersByTable[table.id] ? (
                      <div className="space-y-4">
                        <ScrollArea className="h-48">
                          {table.id && ordersByTable[table.id].map((order: Order) => (
                            <div key={order.id} className="mb-4 p-3 border rounded-md">
                              <div className="flex justify-between items-center mb-2">
                                <div className="font-semibold">Pedido #{order.orderCode || order.id?.substring(0, 6)}</div>
                                <Badge className={getStatusColor(order.status)}>
                                  {order.status === "aguardando" && "Aguardando"}
                                  {order.status === "em_preparo" && "Em Preparo"}
                                  {order.status === "entregue" && "Entregue"}
                                  {order.status === "cancelado" && "Cancelado"}
                                </Badge>
                              </div>
                              <div className="text-sm space-y-1">
                                {order.items && order.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between">
                                    <span>{item.quantity}x {item.name || item.productName}</span>
                                    <span>R$ {item.price.toFixed(2)}</span>
                                  </div>
                                ))}
                                <div className="font-bold mt-2 pt-2 border-t flex justify-between">
                                  <span>Total:</span>
                                  <span>R$ {order.total.toFixed(2)}</span>
                                </div>
                              </div>
                              {/* Botões de ação baseados no status atual */}
                              <div className="mt-3 flex justify-between gap-2">
                                {order.status === "aguardando" && (
                                  <>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          className="flex-1 bg-beach-orange hover:bg-orange-800 text-white font-medium"
                                        >
                                          <Clock className="mr-1 h-4 w-4" /> Preparar
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Preparar Pedido</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Confirma iniciar o preparo deste pedido? O status será atualizado para "Em Preparo".
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction
                                            className="bg-beach-orange hover:bg-orange-800 text-white font-medium"
                                            onClick={() => handleUpdateOrderStatus(order.id!, "em_preparo")}
                                          >
                                            Sim, iniciar preparo
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                    
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className="flex-1"
                                        >
                                          <AlertTriangle className="mr-1 h-4 w-4" /> Cancelar
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Não, manter</AlertDialogCancel>
                                          <AlertDialogAction
                                            className="bg-beach-red"
                                            onClick={() => handleUpdateOrderStatus(order.id!, "cancelado")}
                                          >
                                            Sim, cancelar
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                                {order.status === "em_preparo" && (
                                  <Button
                                    size="sm"
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                    onClick={() => handleUpdateOrderStatus(order.id!, "entregue")}
                                  >
                                    <Check className="mr-1 h-4 w-4" /> Marcar como Entregue
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                              Liberar Mesa
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Liberar Mesa</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja liberar esta mesa? Isso irá marcá-la como disponível e finalizar todos os pedidos pendentes.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-beach-yellow text-black hover:bg-yellow-600"
                                onClick={() => handleClearTable(table.id!)}
                              >
                                Liberar Mesa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        {table.status === "available" 
                          ? "Mesa disponível para clientes" 
                          : "Nenhum pedido encontrado"}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pedidos" className="space-y-4">
            <Card>
              <CardHeader className="bg-beach-yellow text-black">
                <CardTitle>Todos os Pedidos</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Tabs defaultValue="aguardando">
                  <TabsList className="bg-beach-sand">
                    <TabsTrigger value="aguardando" className="data-[state=active]:bg-beach-yellow data-[state=active]:text-black">
                      Aguardando
                    </TabsTrigger>
                    <TabsTrigger value="em_preparo" className="data-[state=active]:bg-beach-orange data-[state=active]:text-white">
                      Em Preparo
                    </TabsTrigger>
                    <TabsTrigger value="entregue" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                      Entregues
                    </TabsTrigger>
                    <TabsTrigger value="cancelado" className="data-[state=active]:bg-beach-red data-[state=active]:text-white">
                      Cancelados
                    </TabsTrigger>
                  </TabsList>
                  
                  {["aguardando", "em_preparo", "entregue", "cancelado"].map((status) => (
                    <TabsContent key={status} value={status} className="pt-4">
                      <ScrollArea className="h-[60vh]">
                        <div className="space-y-4">
                          {orders
                            .filter(order => order.status === status)
                            .map(order => (
                              <Card key={order.id} className="overflow-hidden">
                                <CardHeader className={`p-4 ${getStatusColor(order.status)}`}>
                                  <div className="flex justify-between items-center">
                                    <CardTitle className="text-base">
                                      Mesa {order.tableNumber} - Pedido #{order.orderCode || order.id?.substring(0, 6)}
                                    </CardTitle>
                                    <Badge className="bg-white text-black">
                                      {new Date(order.createdAt!).toLocaleTimeString()}
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                  <div className="space-y-2">
                                    {order.items && order.items.map((item: any, idx: number) => (
                                      <div key={idx} className="flex justify-between text-sm">
                                        <span>{item.quantity}x {item.name || item.productName}</span>
                                        <span>R$ {item.price.toFixed(2)}</span>
                                      </div>
                                    ))}
                                    <div className="pt-2 border-t mt-2 font-semibold flex justify-between">
                                      <span>Total:</span>
                                      <span>R$ {order.total.toFixed(2)}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Ações baseadas no status atual */}
                                  <div className="mt-4 flex gap-2">
                                    {status === "aguardando" && (
                                      <>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              size="sm"
                                              className="flex-1 bg-beach-orange hover:bg-orange-800 text-white font-medium"
                                            >
                                              <Clock className="mr-1 h-4 w-4" /> Preparar
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Preparar Pedido</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Confirma iniciar o preparo deste pedido? O status será atualizado para "Em Preparo".
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction
                                                className="bg-beach-orange hover:bg-orange-800 text-white font-medium"
                                                onClick={() => handleUpdateOrderStatus(order.id!, "em_preparo")}
                                              >
                                                Sim, iniciar preparo
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                        
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="destructive"
                                              className="flex-1"
                                            >
                                              <AlertTriangle className="mr-1 h-4 w-4" /> Cancelar
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Não, manter</AlertDialogCancel>
                                              <AlertDialogAction
                                                className="bg-beach-red"
                                                onClick={() => handleUpdateOrderStatus(order.id!, "cancelado")}
                                              >
                                                Sim, cancelar
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </>
                                    )}
                                    {status === "em_preparo" && (
                                      <Button
                                        size="sm"
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                        onClick={() => handleUpdateOrderStatus(order.id!, "entregue")}
                                      >
                                        <Check className="mr-1 h-4 w-4" /> Marcar como Entregue
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          
                          {orders.filter(order => order.status === status).length === 0 && (
                            <div className="text-center py-6 text-gray-500">
                              Nenhum pedido com status "{status === "aguardando" ? "Aguardando" : 
                                                       status === "em_preparo" ? "Em Preparo" : 
                                                       status === "entregue" ? "Entregue" : "Cancelado"}"
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      

    </div>
  );
}