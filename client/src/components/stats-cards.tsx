import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, AlertTriangle, Users, ShoppingBag, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsCards() {
  const { data: dailySales, isLoading: isSalesLoading } = useQuery({
    queryKey: ["/api/sales/daily"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: lowStockProducts, isLoading: isProductsLoading } = useQuery({
    queryKey: ["/api/products/low-stock"],
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Vendas hoje</p>
              {isSalesLoading ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <h3 className="text-2xl font-medium mt-1">
                  {dailySales?.total ? 
                    `R$ ${dailySales.total.toFixed(2).replace('.', ',')}` : 
                    'R$ 0,00'
                  }
                </h3>
              )}
              <p className="text-emerald-600 text-sm mt-1 flex items-center">
                <ArrowUp className="h-4 w-4 mr-1" />
                12% em relação a ontem
              </p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full text-primary">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Transações</p>
              {isSalesLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <h3 className="text-2xl font-medium mt-1">
                  {dailySales?.count || 0}
                </h3>
              )}
              <p className="text-rose-600 text-sm mt-1 flex items-center">
                <ArrowDown className="h-4 w-4 mr-1" />
                3% em relação a ontem
              </p>
            </div>
            <div className="bg-amber-100 p-2 rounded-full text-amber-600">
              <ShoppingBag className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Novos clientes</p>
              <h3 className="text-2xl font-medium mt-1">5</h3>
              <p className="text-emerald-600 text-sm mt-1 flex items-center">
                <ArrowUp className="h-4 w-4 mr-1" />
                25% em relação a ontem
              </p>
            </div>
            <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Estoque crítico</p>
              {isProductsLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <h3 className="text-2xl font-medium mt-1">
                  {lowStockProducts?.length || 0}
                </h3>
              )}
              <p className="text-rose-600 text-sm mt-1 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Produtos precisam reposição
              </p>
            </div>
            <div className="bg-rose-100 p-2 rounded-full text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
