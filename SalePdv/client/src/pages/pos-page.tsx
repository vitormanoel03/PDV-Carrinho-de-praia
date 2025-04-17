import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode } from "lucide-react";
import { Product, Customer, SaleItem, InsertSale } from "@shared/schema";

export default function PosPage() {
  const { toast } = useToast();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit" | "debit" | "pix">("cash");

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const createSaleMutation = useMutation({
    mutationFn: async (sale: InsertSale) => {
      const res = await apiRequest("POST", "/api/sales", sale);
      return await res.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Venda realizada com sucesso", 
        description: "A venda foi registrada no sistema" 
      });
      // Clear cart
      setCart([]);
      // Refresh recent sales and other data
      queryClient.invalidateQueries({ queryKey: ["/api/sales/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao realizar venda", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))
  ) || [];

  const handleAddToCart = (product: Product) => {
    // Check if product is already in cart
    const existingItemIndex = cart.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if already in cart
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      // Add new item to cart
      setCart([...cart, {
        productId: product.id!,
        productName: product.name,
        quantity: 1,
        price: product.price
      }]);
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    if (quantity < 1) return;
    
    const updatedCart = [...cart];
    updatedCart[index].quantity = quantity;
    setCart(updatedCart);
  };

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ 
        title: "Carrinho vazio", 
        description: "Adicione produtos ao carrinho antes de finalizar a compra", 
        variant: "destructive" 
      });
      return;
    }

    const selectedCustomerData = customers?.find(c => c.id === selectedCustomer);
    
    const sale: InsertSale = {
      items: cart,
      total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      paymentMethod,
      status: "completed",
      userId: "", // Will be set by the server
      userName: "", // Will be set by the server
    };
    
    if (selectedCustomer && selectedCustomerData) {
      sale.customerId = selectedCustomer;
      sale.customerName = selectedCustomerData.name;
    }

    createSaleMutation.mutate(sale);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="h-screen flex flex-col">
      <Header onToggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isVisible={sidebarVisible} />
        
        <main className="flex-1 overflow-hidden bg-gray-100 p-4 flex flex-col">
          <div className="mb-4">
            <h2 className="text-2xl font-medium text-gray-800">Ponto de Venda</h2>
            <p className="text-sm text-gray-600">Registre suas vendas rapidamente</p>
          </div>
          
          <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
            {/* Products Section */}
            <div className="lg:w-2/3 flex flex-col overflow-hidden">
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Buscar produtos por nome ou código de barras..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto flex-1 pb-4">
                {filteredProducts.map(product => (
                  <Card 
                    key={product.id} 
                    className="hover:shadow-md cursor-pointer transition-shadow"
                    onClick={() => handleAddToCart(product)}
                  >
                    <CardContent className="p-4 flex flex-col items-center">
                      <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Package className="h-6 w-6 text-gray-600" />
                      </div>
                      <h3 className="font-medium text-sm text-center line-clamp-2 mb-1">{product.name}</h3>
                      <p className="text-primary font-bold">R$ {product.price.toFixed(2).replace(".", ",")}</p>
                      <p className="text-xs text-gray-500 mt-1">Estoque: {product.stock}</p>
                    </CardContent>
                  </Card>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full flex justify-center items-center p-8 text-gray-500">
                    {searchTerm ? "Nenhum produto encontrado" : "Carregando produtos..."}
                  </div>
                )}
              </div>
            </div>
            
            {/* Cart Section */}
            <div className="lg:w-1/3 flex flex-col">
              <Card className="flex-1 flex flex-col">
                <CardHeader className="py-4 border-b">
                  <CardTitle className="text-base font-medium">Carrinho de Compras</CardTitle>
                </CardHeader>
                
                <div className="flex-1 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                      <ShoppingCart className="h-12 w-12 mb-2" />
                      <p>Seu carrinho está vazio</p>
                      <p className="text-sm">Adicione produtos clicando nos itens</p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {cart.map((item, index) => (
                        <div key={index} className="flex items-center justify-between border-b pb-3">
                          <div className="flex-1">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-gray-500">
                              R$ {item.price.toFixed(2).replace(".", ",")} x {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <div className="flex items-center mr-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => handleQuantityChange(index, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="mx-2 w-8 text-center">{item.quantity}</span>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => handleQuantityChange(index, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-gray-500 hover:text-red-500"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Cliente</label>
                    <Select value={selectedCustomer || ""} onValueChange={setSelectedCustomer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sem cliente</SelectItem>
                        {customers?.map(customer => (
                          <SelectItem key={customer.id} value={customer.id!}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Forma de Pagamento</label>
                    <div className="grid grid-cols-4 gap-2">
                      <Button 
                        variant={paymentMethod === "cash" ? "default" : "outline"} 
                        className="flex flex-col items-center justify-center h-20 p-2"
                        onClick={() => setPaymentMethod("cash")}
                      >
                        <Banknote className="h-6 w-6 mb-1" />
                        <span className="text-xs">Dinheiro</span>
                      </Button>
                      <Button 
                        variant={paymentMethod === "credit" ? "default" : "outline"} 
                        className="flex flex-col items-center justify-center h-20 p-2"
                        onClick={() => setPaymentMethod("credit")}
                      >
                        <CreditCard className="h-6 w-6 mb-1" />
                        <span className="text-xs">Crédito</span>
                      </Button>
                      <Button 
                        variant={paymentMethod === "debit" ? "default" : "outline"} 
                        className="flex flex-col items-center justify-center h-20 p-2"
                        onClick={() => setPaymentMethod("debit")}
                      >
                        <CreditCard className="h-6 w-6 mb-1" />
                        <span className="text-xs">Débito</span>
                      </Button>
                      <Button 
                        variant={paymentMethod === "pix" ? "default" : "outline"} 
                        className="flex flex-col items-center justify-center h-20 p-2"
                        onClick={() => setPaymentMethod("pix")}
                      >
                        <QrCode className="h-6 w-6 mb-1" />
                        <span className="text-xs">PIX</span>
                      </Button>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium">Subtotal</span>
                    <span>R$ {cartTotal.toFixed(2).replace(".", ",")}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-6 text-lg font-bold">
                    <span>Total</span>
                    <span>R$ {cartTotal.toFixed(2).replace(".", ",")}</span>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg"
                    disabled={cart.length === 0 || createSaleMutation.isPending}
                    onClick={handleCheckout}
                  >
                    {createSaleMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full" />
                        <span>Processando...</span>
                      </div>
                    ) : (
                      <span>Finalizar Venda</span>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ShoppingCart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function Package(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}
