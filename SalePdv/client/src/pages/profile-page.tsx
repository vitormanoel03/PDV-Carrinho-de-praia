import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const profileSchema = z.object({
  username: z.string().min(3, "O nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").optional().or(z.literal('')),
  confirmPassword: z.string().optional(),
  tableNaming: z.enum(['mesa', 'guarda-sol']).optional(),
  showOrderStatus: z.boolean().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      tableNaming: user?.tableNaming || 'mesa',
      showOrderStatus: user?.showOrderStatus !== undefined ? user.showOrderStatus : true,
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: Partial<ProfileFormData>) => {
      if (!user?.cpfouCnpj) throw new Error("Usuário não encontrado");
      const { confirmPassword, ...updateData } = data;
      if (!updateData.password) {
        delete updateData.password;
      }
      const res = await apiRequest("PUT", `/api/users/${user.cpfouCnpj}`, updateData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Perfil Atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      if (!user?.cpfouCnpj) throw new Error("Usuário não encontrado");
      // The backend will likely prevent this, but we call it anyway
      const res = await apiRequest("DELETE", `/api/users/${user.cpfouCnpj}`);
      if (res.status === 400) { // Specific check for the backend message
        const data = await res.json();
        throw new Error(data.message || "Erro ao excluir conta.");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Conta Excluída",
        description: "Sua conta foi excluída com sucesso.",
      });
      // Logout and redirect
      window.location.href = "/auth";
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateUserMutation.mutate(data);
  };

  const handleDeleteAccount = () => {
    deleteUserMutation.mutate();
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Editar Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input id="username" {...register("username")} />
              {errors.username && <p className="text-red-500 text-sm">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </form>

          {user?.role === 'admin' && (
            <>
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-semibold">Configurações de Administrador</h3>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Nomear mesas como:</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <input type="radio" id="mesa" value="mesa" {...register("tableNaming")} />
                        <Label htmlFor="mesa">Mesa</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="radio" id="guarda-sol" value="guarda-sol" {...register("tableNaming")} />
                        <Label htmlFor="guarda-sol">Guarda-sol</Label>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="showOrderStatus" {...register("showOrderStatus")} />
                    <Label htmlFor="showOrderStatus">Mostrar status do pedido para o cliente</Label>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-red-500/50 text-center">
                <h3 className="text-lg font-semibold text-red-600">Zona de Perigo</h3>
                <p className="text-sm text-gray-500 mt-2 mb-4">
                  A exclusão da sua conta é uma ação irreversível e todos os seus dados serão perdidos.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Excluir Minha Conta</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso irá apagar permanentemente sua conta e remover seus dados de nossos servidores.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                        Sim, excluir conta
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
