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
import { Loader2, LogOut, Coffee, Users, ShoppingBasket, Check, Clock, AlertTriangle,CheckCircle, Trash, LineChart, FileDown, RefreshCw, HelpCircle, Menu, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,DialogClose } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Settings } from 'lucide-react';


export default function AdminDashboardPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("mesas");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Buscar mesas
  const {
    data: tables = [],
    isLoading: isLoadingTables,
    error: tablesError,
  } = useQuery<Table[]>({
    queryKey: ["/api/tables"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/tables");
      return await res.json();
    },
    staleTime: 10000,
  });

  // Buscar pedidos
  const {
    data: orders = [],
    isLoading: isLoadingOrders,
    error: ordersError,
  } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/orders");
      return await res.json();
    },
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

  const activeOrders = orders.filter(order => order.status !== 'arquivado');

  // Agrupar pedidos por mesa
  const ordersByTable: Record<string, Order[]> = {};

  // Inicializar para garantir que todas as mesas tenham uma entrada
  tables.forEach(table => {
    if (table.id) {
      ordersByTable[table.id] = [];
    }
  });

  // Preencher com os pedidos
  activeOrders.forEach(order => {
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

  const handleExportCSV = () => {
    const headers = ["ID do Pedido", "Mesa", "Status", "Total", "Data"];
    const csvContent = [
      headers.join(","),
      ...activeOrders.map(order => [
        order.id,
        order.tableNumber,
        order.status,
        order.total.toFixed(2),
        order.createdAt ? new Date(order.createdAt).toLocaleString() : ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = "pedidos.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Relatório Gerado",
      description: "O arquivo CSV com os pedidos foi baixado.",
    });
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

  const pendingOrdersCount = activeOrders.filter(
    (order) => order.status === "aguardando"
  ).length;
  
//Inicio da tela 
  return (
    <div className="min-h-screen bg-beach-sand">
      <header className="bg-beach-yellow text-black p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center">
            <Coffee className="mr-2" /> Carrinho de Praia - Painel Admin
          </h1>
          <div className="flex items-center gap-4">
            <span>Olá, {user?.username || user?.username}</span>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/dashboard'}
                className="bg-beach-yellow text-black hover:bg-yellow-600"
              >
                <LineChart className="mr-2 h-4 w-4" /> Dashboard
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/products'}
                className="bg-beach-yellow text-black hover:bg-yellow-600"
              >
                <ShoppingBasket className="mr-2 h-4 w-4" /> Produtos
              </Button>

              <Button 
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/tables'}
                className="bg-beach-yellow text-black hover:bg-yellow-600"
              >
                <Users className="mr-2 h-4 w-4" /> Mesas
              </Button>

              <Button 
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="bg-beach-yellow text-black hover:bg-yellow-600"
              >
                <FileDown className="mr-2 h-4 w-4" /> Relatórios
              </Button>


              <DropdownMenu>
  <DropdownMenuTrigger asChild>
  <Button variant="ghost">
      <Settings className="h-5 w-5" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-48">
    <DropdownMenuItem onClick={() => window.location.href = '/profile'}>Editar Perfil</DropdownMenuItem>
    <DropdownMenuItem onClick={() => toast({ title: "Função não implementada" })}>Modo Offline</DropdownMenuItem>
    <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="bg-beach-white">
            <TabsTrigger value="mesas" className="data-[state=active]:bg-beach-yellow data-[state=active]:text-black">
              <Users className="mr-2 h-4 w-4" />
              {user?.tableNaming === 'guarda-sol' ? 'Guarda-sóis' : 'Mesas'}
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="data-[state=active]:bg-beach-yellow data-[state=active]:text-black">
              <ShoppingBasket className="mr-2 h-4 w-4" />
              Pedidos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mesas" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {tables.map((table) => {
                const tableOrders = table.id && ordersByTable[table.id] || [];

                return (
                  <Link to={`/tables/${table.id}`} key={table.id}>
                    <Card className={`
                      ${table.status === 'available' ? 'bg-green-500' : 'bg-red-500'} 
                      text-white hover:shadow-lg transition-shadow cursor-pointer flex flex-col justify-between h-full
                    `}>
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                          <span>{user?.tableNaming || 'Mesa'} {table.number}</span>
                          <Badge variant={table.status === "occupied" ? "secondary" : "default"} className="bg-white/20 text-white">
                            {table.status === "occupied" ? "Ocupada" : "Disponível"}
                          </Badge>
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="p-4">
                        {table.status === "occupied" && tableOrders.length > 0 ? (
                          <div>
                            <p className="text-sm font-bold mb-2">{tableOrders.length} pedido(s) ativos</p>
                            <div className="text-xs">
                              {tableOrders.map(o => `#${o.orderCode || o.id?.substring(0,4)}`).join(', ')}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p>{user?.tableNaming || 'Mesa'} disponível</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
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
                      <div className="flex items-center">
                        Aguardando
                        {pendingOrdersCount > 0 && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full ml-2"></div>
                        )}
                      </div>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
  {activeOrders
    .filter(order => order.status === status)
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    })
    .map(order => (
      <Card key={order.id} className="overflow-hidden w-full bg-white shadow-md rounded-xl">
  <CardHeader className={`p-4 ${getStatusColor(order.status)} text-white`}>
    <div className="flex justify-between items-center">
      <CardTitle className="text-base font-semibold">
        {user?.tableNaming || 'Mesa'} {order.tableNumber} - Pedido #{order.orderCode || order.id?.substring(0, 6)}
      </CardTitle>
      <Badge className="bg-black text-white px-2 py-1 rounded-md text-xs">
        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : "Sem horário"}
      </Badge>
    </div>
  </CardHeader>

  <CardContent className="p-4 bg-gray-50">
  <div className="space-y-2">
    {order.items && order.items.map((item: any, idx: number) => (
      <div key={idx} className="flex justify-between text-sm bg-white px-2 py-1 rounded-md">
        <span className="font-medium text-gray-800">{item.quantity}x {item.name || item.productName}</span>
        <span className="text-gray-600">R$ {item.price.toFixed(2)}</span>
      </div>
    ))}

    <div className="pt-2 border-t mt-2 font-semibold flex justify-between text-gray-900">
      <span>Total:</span>
      <span>R$ {order.total.toFixed(2)}</span>
    </div>
  </div>

  <div className="mt-4 flex gap-2">
  {order.status === "aguardando" && (
    <>
      {/* Botão PREPARAR */}
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

      {/* Botão CANCELAR */}
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
    <>
      {/* Botão ENTREGAR */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium"
          >
            <CheckCircle className="mr-1 h-4 w-4" /> Entregar
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Entregar Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma que o pedido foi entregue? O status será atualizado para "Entregue".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700 text-white font-medium"
              onClick={() => handleUpdateOrderStatus(order.id!, "entregue")}
            >
              Sim, marcar como entregue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )}
    {order.status === "entregue" && (
    <>
      {/* Botão arquivar */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium"
          >
            <CheckCircle className="mr-1 h-4 w-4" /> Arquivar
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle> Arquivar Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma que o pedido foi  Arquivado? O status será atualizado para " Arquivado".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700 text-white font-medium"
              onClick={() => handleUpdateOrderStatus(order.id!, "arquivado")}
            >
              Sim, marcar como arquivado
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )}
</div>

</CardContent>

</Card>

    ))}
</div>


                          {orders.filter(order => order.status === status).length === 0 && (
                            <div className="text-center py-6 text-gray-500">
                              {`Nenhum pedido com status "${
                                status === "aguardando" ? "Aguardando" :
                                status === "em_preparo" ? "Em Preparo" :
                                status === "entregue" ? "Entregue" : "Cancelado"
                              }"`}
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
          {selectedTable && (
            <Dialog open={selectedTable !== null} onOpenChange={() => setSelectedTable(null)}>
            <DialogContent>
              {/* Botão X de fechar */}
             
          
              <DialogHeader>
                <DialogTitle>Pedidos da {user?.tableNaming || 'Mesa'} {selectedTable?.number}</DialogTitle>
              </DialogHeader>
          
              <ScrollArea className="h-96">
                {selectedTable?.id && ordersByTable[selectedTable.id]?.map((order: Order) => (
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
     
</DialogContent>
            </Dialog>
          )}
        </Tabs>
   
       

      </main>
    </div>
  );
}