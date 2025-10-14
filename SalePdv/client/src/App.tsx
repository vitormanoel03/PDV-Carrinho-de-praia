import React from 'react';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "./pages/not-found";
import AuthPage from "./pages/auth-page";
import AdminDashboardPage from "./pages/admin-dashboard";
import ClientOrderPage from "./pages/client-order";
import ProductManagementPage from "./pages/product-management";
import TableManagementPage from "./pages/table-management";
import ProfilePage from "./pages/profile-page";
import DashboardPage from "./pages/dashboard-page";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { Umbrella, Sun } from "lucide-react";
import TableDetailsPage from "./pages/table-details-page";
import ForgotPasswordPage from "./pages/forgot-password-page";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Footer from './components/footer';

function Router() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute role="admin"><ProductManagementPage /></ProtectedRoute>} />
      <Route path="/tables" element={<ProtectedRoute role="admin"><TableManagementPage /></ProtectedRoute>} />
      <Route path="/tables/:id" element={<ProtectedRoute role="admin"><TableDetailsPage /></ProtectedRoute>} />
      <Route path="/order" element={<ProtectedRoute role="client"><ClientOrderPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute role="admin"><DashboardPage /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-beach-sand">
            <Router />
            <Toaster />
            <Footer />
            <div className="fixed bottom-4 right-4 bg-beach-yellow text-black p-2 rounded-full shadow-lg flex items-center text-xs">
              <Umbrella className="w-4 h-4 mr-1" /> 
              <Sun className="w-4 h-4 mr-1" /> 
              Carrinho de Praia
            </div>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;