import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
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
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

const searchSchema = z.object({
  cpfOrPhone: z.string().min(1, "CPF ou telefone é obrigatório"),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

type SearchFormValues = z.infer<typeof searchSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [foundUser, setFoundUser] = useState<User | null>(null);

  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { cpfOrPhone: "" },
  });

  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const findUserMutation = useMutation({
    mutationFn: async (cpfOrPhone: string) => {
      const res = await apiRequest("POST", "/api/users/find", { cpfOrPhone });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Usuário não encontrado");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      setFoundUser(data.user);
      toast({ title: "Usuário encontrado", description: "Agora você pode redefinir sua senha." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const updateUserPasswordMutation = useMutation({
    mutationFn: async (data: { userId: string; password: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${data.userId}/password`, { password: data.password });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao atualizar senha");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Senha atualizada", description: "Sua senha foi atualizada com sucesso." });
      setFoundUser(null);
      searchForm.reset();
      resetPasswordForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const onSearchSubmit = (data: SearchFormValues) => {
    findUserMutation.mutate(data.cpfOrPhone);
  };

  const onResetPasswordSubmit = (data: ResetPasswordFormValues) => {
    if (foundUser) {
      updateUserPasswordMutation.mutate({ userId: foundUser.cpfouCnpj, password: data.password });
    }
  };

  return (
    <div className="flex min-h-screen bg-beach-sand justify-center items-center">
      <Card className="w-full max-w-md">
        <CardHeader className="bg-beach-yellow p-6 text-black text-center">
          <h1 className="text-2xl font-medium">Redefinir Senha</h1>
          <p className="text-sm opacity-90 mt-1">Encontre sua conta para continuar</p>
        </CardHeader>
        <CardContent className="p-6">
          {!foundUser ? (
            <Form {...searchForm}>
              <form onSubmit={searchForm.handleSubmit(onSearchSubmit)} className="space-y-4">
                <FormField
                  control={searchForm.control}
                  name="cpfOrPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF ou Telefone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite seu CPF ou telefone"
                          className="border-beach-yellow focus:ring-beach-yellow"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-beach-red hover:bg-red-700 text-white"
                  disabled={findUserMutation.isPending}
                >
                  {findUserMutation.isPending ? "Buscando..." : "Buscar Conta"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...resetPasswordForm}>
              <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
                <p className="text-center">Redefinindo a senha para <strong>{foundUser.username}</strong></p>
                <FormField
                  control={resetPasswordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Digite a nova senha"
                          className="border-beach-yellow focus:ring-beach-yellow"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={resetPasswordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirme a Nova Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirme a nova senha"
                          className="border-beach-yellow focus:ring-beach-yellow"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-beach-red hover:bg-red-700 text-white"
                  disabled={updateUserPasswordMutation.isPending}
                >
                  {updateUserPasswordMutation.isPending ? "Atualizando..." : "Atualizar Senha"}
                </Button>
              </form>
            </Form>
          )}
          <div className="mt-4 text-center">
            <Link href="/auth" className="text-sm text-gray-600 hover:underline">
              Voltar para o Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
