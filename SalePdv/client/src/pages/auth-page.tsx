import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  username: z.string().min(1, "O nome de usuário é obrigatório"),
  password: z.string().min(1, "A senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      const redirectPath = user.role === "admin" ? "/admin" : "/order";
      navigate(redirectPath);
    }
  }, [user, navigate]);

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({
      username: data.username,
      password: data.password
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-beach-sand p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="bg-beach-yellow p-6 text-black text-center">
          <h1 className="text-2xl font-medium">Carrinho de Praia</h1>
          <p className="text-sm opacity-90 mt-1">Faça seu login</p>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Digite seu nome de usuário"
                        className="border-beach-yellow focus:ring-beach-yellow"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite sua senha"
                          className="pr-10 border-beach-yellow focus:ring-beach-yellow"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-beach-red hover:bg-red-700 text-white"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full" />
                    <span>Entrando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="mr-2">Entrar</span>
                    <LogIn className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}