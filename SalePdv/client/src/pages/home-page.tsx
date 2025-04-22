
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      navigate(user.role === "admin" ? "/admin" : "/order");
    } else {
      navigate("/auth");
    }
  }, [user, navigate]);
  
  return null;
}
