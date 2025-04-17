import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Package, UserPlus, FileBarChart, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Product } from "@shared/schema";

export default function QuickAccess() {
  const { data: lowStockProducts, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/low-stock"],
  });

  return (
    <Card>
      <CardHeader className="py-4 border-b">
        <CardTitle className="text-base font-medium">Acesso Rápido</CardTitle>
      </CardHeader>

      <CardContent className="p-4 grid grid-cols-2 gap-4">
        <Link href="/pos">
          <a className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
            <ShoppingCart className="h-6 w-6 text-primary mb-2" />
            <span className="text-sm font-medium">Nova Venda</span>
          </a>
        </Link>

        <Link href="/products/new">
          <a className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
            <Package className="h-6 w-6 text-primary mb-2" />
            <span className="text-sm font-medium">Novo Produto</span>
          </a>
        </Link>

        <Link href="/customers/new">
          <a className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
            <UserPlus className="h-6 w-6 text-primary mb-2" />
            <span className="text-sm font-medium">Novo Cliente</span>
          </a>
        </Link>

        <Link href="/reports">
          <a className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
            <FileBarChart className="h-6 w-6 text-primary mb-2" />
            <span className="text-sm font-medium">Relatório</span>
          </a>
        </Link>
      </CardContent>

      <div className="p-4 border-t">
        <h4 className="text-sm font-medium mb-3">Estoque Crítico</h4>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : lowStockProducts && lowStockProducts.length > 0 ? (
          <div className="space-y-3">
            {lowStockProducts.slice(0, 3).map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-2 bg-red-50 rounded-md"
              >
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-sm truncate max-w-[150px]">{product.name}</span>
                </div>
                <span className="text-sm font-medium">{product.stock} un.</span>
              </div>
            ))}
            {lowStockProducts.length > 3 && (
              <Link href="/products/low-stock">
                <a className="text-sm text-primary hover:underline">
                  Ver mais {lowStockProducts.length - 3} produtos
                </a>
              </Link>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhum produto com estoque baixo</p>
        )}
      </div>
    </Card>
  );
}
