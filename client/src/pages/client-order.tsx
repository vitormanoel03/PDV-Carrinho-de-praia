import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Table, Product, OrderItem, InsertOrder, Order } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, LogOut, Plus, Trash2, ShoppingCart, CoffeeIcon, Umbrella, Sun, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ClientOrderPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [productNote, setProductNote] = useState<string>("");
  const [orderDialogOpen, setOrderDialogOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");

  // Buscar mesas disponíveis
  const {
    data: tables = [],
    isLoading: isLoadingTables,
  } = useQuery<Table[]>({
    queryKey: ["/api/tables/available"],
    staleTime: 10000,
  });

  // Buscar produtos
  const {
    data: products = [],
    isLoading: isLoadingProducts,
  } = useQuery<Product[]>({
    queryKey: ["/api/products/active"],
    staleTime: 10000,
  });

  // Buscar pedidos do usuário atual
  const {
    data: userOrders = [],
    isLoading: isLoadingOrders,
  } = useQuery<Order[]>({
    queryKey: [`/api/users/${user?.id}/orders`],
    staleTime: 10000,
    enabled: !!user?.id,
  });

  // Mutação para criar um novo pedido
  const createOrderMutation = useMutation({
    mutationFn: async (order: InsertOrder) => {
      const res = await apiRequest("POST", "/api/orders", order);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/orders`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tables/available"] });
      setCartItems([]);
      setSelectedTable(null);
      setOrderDialogOpen(false);
      toast({
        title: "Pedido realizado",
        description: "Seu pedido foi enviado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao fazer pedido",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filtragem de categorias para a navegação por abas
  const categories = ["todos", ...new Set(products.map(product => product.category || "sem categoria"))];

  // Filtra produtos pela categoria selecionada
  const filteredProducts = selectedCategory === "todos"
    ? products
    : products.filter(product => product.category === selectedCategory);

  // Adicionar item ao carrinho
  const addToCart = (product: Product, quantity = 1) => {
    const existingItem = cartItems.find(item => item.productId === product.id);
    
    if (existingItem) {
      setCartItems(
        cartItems.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      const newItem: OrderItem = {
        productId: product.id!,
        productName: product.name,
        price: product.price,
        quantity,
        notes: productNote.trim() || undefined,
      };
      setCartItems([...cartItems, newItem]);
    }
    
    setProductNote("");
    
    toast({
      title: "Item adicionado",
      description: `${quantity}x ${product.name} adicionado ao carrinho`,
    });
  };

  // Remover item do carrinho
  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.productId !== productId));
  };

  // Calcular total do carrinho
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Finalizar pedido
  const handlePlaceOrder = () => {
    if (!selectedTable) {
      toast({
        title: "Selecione uma mesa",
        description: "Por favor, selecione uma mesa para continuar",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione pelo menos um item ao carrinho",
        variant: "destructive",
      });
      return;
    }

    const selectedTableObj = tables.find(table => table.id === selectedTable);
    
    if (!selectedTableObj) {
      toast({
        title: "Mesa inválida",
        description: "A mesa selecionada não foi encontrada",
        variant: "destructive",
      });
      return;
    }

    const newOrder: InsertOrder = {
      tableId: selectedTable,
      tableNumber: selectedTableObj.number,
      items: cartItems,
      total: cartTotal,
      status: "aguardando",
      userId: user?.id,
      userName: user?.name || user?.username,
      isPaid: false,
    };

    createOrderMutation.mutate(newOrder);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Status do pedido formatado para exibição
  const formatOrderStatus = (status: string) => {
    switch (status) {
      case "aguardando": return { text: "Aguardando", color: "bg-beach-yellow text-black" };
      case "em_preparo": return { text: "Em preparo", color: "bg-beach-orange text-white" };
      case "entregue": return { text: "Entregue", color: "bg-green-500 text-white" };
      case "cancelado": return { text: "Cancelado", color: "bg-beach-red text-white" };
      default: return { text: status, color: "bg-gray-500 text-white" };
    }
  };

  if (isLoadingTables || isLoadingProducts || isLoadingOrders) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-beach-yellow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beach-sand">
      <header className="bg-beach-yellow text-black p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center">
            <Umbrella className="mr-1" /> 
            <Sun className="mr-2" /> 
            Carrinho de Praia
          </h1>
          <div className="flex items-center gap-4">
            <span>Olá, {user?.name || user?.username}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Lado esquerdo - Menu de produtos */}
          <div className="md:col-span-8 space-y-4">
            <Card>
              <CardHeader className="bg-beach-yellow text-black">
                <CardTitle className="flex justify-between items-center">
                  <span className="flex items-center">
                    <CoffeeIcon className="mr-2" /> Cardápio
                  </span>
                  {selectedTable && (
                    <Badge className="bg-white text-black">
                      Mesa {tables.find(t => t.id === selectedTable)?.number}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {!selectedTable ? (
                  <div className="text-center py-6">
                    <h3 className="font-bold mb-2">Selecione uma mesa</h3>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      {tables.map((table) => (
                        <Button
                          key={table.id}
                          variant="outline"
                          className="border-beach-yellow hover:bg-beach-yellow hover:text-black"
                          onClick={() => setSelectedTable(table.id!)}
                        >
                          Mesa {table.number}
                        </Button>
                      ))}
                    </div>
                    {tables.length === 0 && (
                      <p className="text-gray-500 mt-2">Nenhuma mesa disponível no momento</p>
                    )}
                  </div>
                ) : (
                  <Tabs defaultValue="todos" value={selectedCategory} onValueChange={setSelectedCategory}>
                    <TabsList className="bg-beach-white mb-4 flex flex-wrap h-auto">
                      {categories.map(category => (
                        <TabsTrigger 
                          key={category} 
                          value={category}
                          className="data-[state=active]:bg-beach-yellow data-[state=active]:text-black capitalize"
                        >
                          {category}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <ScrollArea className="h-[50vh]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredProducts.map((product) => (
                          <Card key={product.id} className="overflow-hidden">
                            <CardHeader className="p-3 bg-beach-white">
                              <CardTitle className="text-base flex justify-between">
                                <span>{product.name}</span>
                                <span className="text-beach-red">R$ {product.price.toFixed(2)}</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3">
                              <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button className="w-full bg-beach-yellow text-black hover:bg-yellow-600">
                                    <Plus className="mr-2 h-4 w-4" /> Adicionar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>{product.name}</DialogTitle>
                                    <DialogDescription>
                                      Adicione observações e a quantidade do item.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <Textarea
                                      placeholder="Alguma observação? (Ex: sem gelo, bem passado, etc)"
                                      value={productNote}
                                      onChange={(e) => setProductNote(e.target.value)}
                                    />
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">Quantidade:</span>
                                      <Input
                                        type="number"
                                        min="1"
                                        defaultValue="1"
                                        className="w-20"
                                        id="quantity"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button 
                                      className="bg-beach-yellow text-black hover:bg-yellow-600"
                                      onClick={() => {
                                        const quantityInput = document.getElementById("quantity") as HTMLInputElement;
                                        const quantity = parseInt(quantityInput?.value || "1");
                                        addToCart(product, quantity);
                                      }}
                                    >
                                      Adicionar ao Pedido
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </CardContent>
                          </Card>
                        ))}
                        
                        {filteredProducts.length === 0 && (
                          <div className="text-center py-6 text-gray-500 col-span-2">
                            Nenhum produto encontrado nesta categoria
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </Tabs>
                )}
              </CardContent>
              <CardFooter className="bg-gray-50 p-3">
                <div className="w-full flex justify-between">
                  {selectedTable ? (
                    <Button variant="outline" onClick={() => setSelectedTable(null)}>
                      Trocar Mesa
                    </Button>
                  ) : (
                    <div></div>
                  )}
                  <Button
                    className="bg-beach-yellow text-black hover:bg-yellow-600"
                    disabled={!selectedTable || cartItems.length === 0}
                    onClick={() => setOrderDialogOpen(true)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" /> 
                    Ver Carrinho ({cartItems.length})
                  </Button>
                </div>
              </CardFooter>
            </Card>

            {/* Meus Pedidos */}
            <Card>
              <CardHeader className="bg-beach-yellow text-black">
                <CardTitle>Meus Pedidos</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {userOrders.length > 0 ? (
                  <ScrollArea className="h-[30vh]">
                    <div className="space-y-4">
                      {userOrders.map(order => {
                        const statusInfo = formatOrderStatus(order.status);
                        return (
                          <Card key={order.id} className="overflow-hidden">
                            <CardHeader className={`p-3 ${statusInfo.color}`}>
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-sm">
                                  Mesa {order.tableNumber} - Pedido #{order.id?.substring(0, 6)}
                                </CardTitle>
                                <Badge className="bg-white text-black">
                                  {statusInfo.text}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="p-3">
                              <div className="space-y-1 text-sm">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between">
                                    <span>{item.quantity}x {item.productName}</span>
                                    <span>R$ {item.price.toFixed(2)}</span>
                                  </div>
                                ))}
                                <div className="pt-2 border-t mt-2 font-semibold flex justify-between">
                                  <span>Total:</span>
                                  <span>R$ {order.total.toFixed(2)}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    Você ainda não fez nenhum pedido
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lado direito - Carrinho/Resumo do pedido */}
          <div className="md:col-span-4">
            <Card className="sticky top-4">
              <CardHeader className="bg-beach-yellow text-black">
                <CardTitle>Seu Pedido</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {cartItems.length > 0 ? (
                  <ScrollArea className="h-[40vh]">
                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <div key={item.productId} className="flex justify-between items-start border-b pb-3">
                          <div>
                            <div className="font-medium">{item.quantity}x {item.productName}</div>
                            {item.notes && (
                              <div className="text-xs text-gray-500 mt-1">
                                Obs: {item.notes}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end">
                            <div>R$ {(item.price * item.quantity).toFixed(2)}</div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-beach-red"
                              onClick={() => removeFromCart(item.productId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    Seu carrinho está vazio
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>R$ {cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 p-4">
                <Button
                  className="w-full bg-beach-red hover:bg-red-700 text-white"
                  disabled={cartItems.length === 0}
                  onClick={handlePlaceOrder}
                >
                  Finalizar Pedido
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      {/* Modal de Carrinho (Versão móvel) */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Carrinho de Pedidos</DialogTitle>
            <DialogDescription>
              Revise seus itens antes de finalizar o pedido
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[40vh]">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.productId} className="flex justify-between border-b pb-2">
                  <div>
                    <div className="font-medium">{item.quantity}x {item.productName}</div>
                    {item.notes && (
                      <div className="text-xs text-gray-500">Obs: {item.notes}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div>R$ {(item.price * item.quantity).toFixed(2)}</div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-beach-red"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="pt-4 border-t">
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>R$ {cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-2 text-sm text-gray-500 text-center">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            Depois que o pedido estiver com status "preparando" não é possível mais cancelar ou fazer alterações.
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>
              Continuar Comprando
            </Button>
            <Button 
              className="bg-beach-red hover:bg-red-700 text-white"
              onClick={handlePlaceOrder}
            >
              Finalizar Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}