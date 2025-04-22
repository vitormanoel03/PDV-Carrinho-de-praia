
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "./pages/not-found";
import AuthPage from "./pages/auth-page";
import AdminDashboardPage from "./pages/admin-dashboard";
import ClientOrderPage from "./pages/client-order";
import ProductManagementPage from "./pages/product-management";
import TableManagementPage from "./pages/table-management";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { Umbrella, Sun } from "lucide-react";

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-beach-sand">
      <div className="flex items-center text-4xl font-bold mb-2">
        <Umbrella className="w-8 h-8 mr-2 text-beach-red" />
        <Sun className="w-8 h-8 mr-2 text-beach-yellow" />
        <span>Carrinho de Praia</span>
      </div>
      <p className="text-xl">Bem-vindo ao sistema de pedidos!</p>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/admin" component={AdminDashboardPage} role="admin" />
      <ProtectedRoute path="/products" component={ProductManagementPage} role="admin" />
      <ProtectedRoute path="/tables" component={TableManagementPage} role="admin" />
      <ProtectedRoute path="/order" component={ClientOrderPage} role="client" />
      <ProtectedRoute path="/" component={HomePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-beach-sand">
          <Router />
          <Toaster />
          <div className="fixed bottom-4 right-4 bg-beach-yellow text-black p-2 rounded-full shadow-lg flex items-center text-xs">
            <Umbrella className="w-4 h-4 mr-1" /> 
            <Sun className="w-4 h-4 mr-1" /> 
            Carrinho de Praia
          </div>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
