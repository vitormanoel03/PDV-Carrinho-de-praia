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

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/admin" component={AdminDashboardPage} role="admin" />
      <ProtectedRoute path="/products" component={ProductManagementPage} role="admin" />
      <ProtectedRoute path="/tables" component={TableManagementPage} role="admin" />
      <ProtectedRoute path="/order" component={ClientOrderPage} role="client" />
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
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;