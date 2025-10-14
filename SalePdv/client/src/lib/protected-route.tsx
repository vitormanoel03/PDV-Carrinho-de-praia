import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

type ProtectedRouteProps = {
  children: React.ReactNode;
  role?: "admin" | "client";
};

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-beach-yellow" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (role && user.role !== role) {
    const redirectPath = user.role === "admin" ? "/admin" : "/order";
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
