import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Eye, EyeOff, LogIn, UserPlus, Umbrella, Sun } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery } from "@tanstack/react-query";
import { Table, User } from "@shared/schema";

const loginSchema = z.object({
  username: z.string().min(1, "O nome de usuário é obrigatório"),
  password: z.string().min(1, "A senha é obrigatória"),
  rememberMe: z.boolean().optional(),
});

// Criar um novo schema estendido para o formulário de registro
const extendedRegisterSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  name: z.string().optional(),
  role: z.enum(["admin", "client"]).default("client"),
  tableId: z.string().optional(),
  tableNumber: z.number().optional(),
  sellerId: z.string().optional(),
  sellerName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof extendedRegisterSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [selectedTable, setSelectedTable] = useState<{ id: string, number: number } | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<{ id: string, name: string } | null>(null);
  
  // Buscar mesas disponíveis
  const {
    data: tables = [],
    isLoading: isLoadingTables,
  } = useQuery<Table[]>({
    queryKey: ["/api/tables/available"],
    staleTime: 10000,
  });
  
  // Buscar donos de carrinhos
  const {
    data: sellers = [],
    isLoading: isLoadingSellers,
  } = useQuery<User[]>({
    queryKey: ["/api/users/sellers"],
    staleTime: 10000,
  });
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(extendedRegisterSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      role: "client",
      tableId: "",
      tableNumber: undefined,
      sellerId: "",
      sellerName: "",
    },
  });

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      // Redireciona com base no papel do usuário
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

  // Atualizar os valores de mesa quando uma mesa é selecionada
  useEffect(() => {
    if (selectedTable) {
      registerForm.setValue('tableId', selectedTable.id);
      registerForm.setValue('tableNumber', selectedTable.number);
    }
  }, [selectedTable, registerForm]);
  
  // Atualizar os valores do vendedor quando um dono de carrinho é selecionado
  useEffect(() => {
    if (selectedSeller) {
      registerForm.setValue('sellerId', selectedSeller.id);
      registerForm.setValue('sellerName', selectedSeller.name);
    }
  }, [selectedSeller, registerForm]);

  const onRegisterSubmit = (data: RegisterFormValues) => {
    if (data.role === "client") {
      if (!data.tableId) {
        registerForm.setError('tableId', { 
          type: 'manual', 
          message: 'Por favor, selecione uma mesa' 
        });
        return;
      }
      
      if (!data.sellerId) {
        // Não temos um campo específico para o erro de sellerId, então mostramos o erro de outra forma
        registerForm.setError('tableId', { 
          type: 'manual', 
          message: 'Por favor, selecione um carrinho' 
        });
        return;
      }
    }
    registerMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen bg-beach-sand">
      <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-white">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-beach-yellow data-[state=active]:text-black"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="data-[state=active]:bg-beach-yellow data-[state=active]:text-black"
              >
                Cadastro
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader className="bg-beach-yellow p-6 text-black text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Umbrella className="h-6 w-6" />
                    <Sun className="h-6 w-6" />
                  </div>
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
                      <div className="flex items-center justify-between">
                        <FormField
                          control={loginForm.control}
                          name="rememberMe"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">Lembrar-me</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-beach-red hover:bg-red-700 text-white"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <div className="flex items-center">
                            <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full" />
                            <span>Entrando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span className="mr-2">Entrar</span>
                            <LogIn className="h-5 w-5" />
                          </div>
                        )}
                      </Button>
                    </form>
                  </Form>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      Não tem uma conta? Selecione a aba "Cadastro" acima.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader className="bg-beach-yellow p-6 text-black text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Umbrella className="h-6 w-6" />
                    <Sun className="h-6 w-6" />
                  </div>
                  <h1 className="text-2xl font-medium">Carrinho de Praia</h1>
                  <p className="text-sm opacity-90 mt-1">Cadastre-se para fazer pedidos</p>
                </CardHeader>
                <CardContent className="p-6">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Digite seu nome completo" 
                                className="border-beach-yellow focus:ring-beach-yellow"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Usuário</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Digite um nome de usuário" 
                                className="border-beach-yellow focus:ring-beach-yellow"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showRegisterPassword ? "text" : "password"}
                                  placeholder="Digite uma senha segura"
                                  className="pr-10 border-beach-yellow focus:ring-beach-yellow"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                >
                                  {showRegisterPassword ? (
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
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirme a Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showRegisterConfirmPassword ? "text" : "password"}
                                  placeholder="Confirme sua senha"
                                  className="pr-10 border-beach-yellow focus:ring-beach-yellow"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                                  onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                                >
                                  {showRegisterConfirmPassword ? (
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
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Você é:</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  // Se o tipo for alterado, limpe a seleção de mesa
                                  if (value === "admin") {
                                    setSelectedTable(null);
                                    registerForm.setValue('tableId', '');
                                    registerForm.setValue('tableNumber', undefined);
                                  }
                                }}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="client" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Cliente
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="admin" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Dono do Carrinho
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {registerForm.watch('role') === 'client' && (
                        <div className="space-y-3">
                          {/* Seleção de dono de carrinho */}
                          <FormItem>
                            <FormLabel>Selecione o Carrinho:</FormLabel>
                            {isLoadingSellers ? (
                              <div className="flex justify-center py-2">
                                <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-beach-yellow rounded-full" />
                              </div>
                            ) : sellers.length === 0 ? (
                              <p className="text-sm text-red-500">Não há donos de carrinhos cadastrados no momento.</p>
                            ) : (
                              <div className="grid grid-cols-1 gap-2">
                                {sellers.map((seller) => (
                                  <div 
                                    key={seller.id}
                                    onClick={() => setSelectedSeller({ id: seller.id || '', name: seller.name || seller.username })}
                                    className={`
                                      border rounded-md py-2 px-3 cursor-pointer text-center transition-all
                                      ${selectedSeller?.id === seller.id 
                                        ? 'bg-beach-yellow border-beach-red text-black' 
                                        : 'bg-white border-gray-200 hover:border-beach-yellow'
                                      }
                                    `}
                                  >
                                    {seller.name || seller.username}
                                  </div>
                                ))}
                              </div>
                            )}
                            {!selectedSeller && (
                              <p className="text-sm text-gray-500 mt-1">
                                Selecione um carrinho para fazer seus pedidos
                              </p>
                            )}
                          </FormItem>
                        
                          {/* Seleção de mesa */}
                          <FormItem>
                            <FormLabel>Selecione sua Mesa:</FormLabel>
                            {isLoadingTables ? (
                              <div className="flex justify-center py-2">
                                <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-beach-yellow rounded-full" />
                              </div>
                            ) : tables.length === 0 ? (
                              <p className="text-sm text-red-500">Não há mesas disponíveis no momento.</p>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {tables.map((table) => (
                                  <div 
                                    key={table.id}
                                    onClick={() => setSelectedTable({ id: table.id || '', number: table.number })}
                                    className={`
                                      border rounded-md py-2 px-3 cursor-pointer text-center transition-all
                                      ${selectedTable?.id === table.id 
                                        ? 'bg-beach-yellow border-beach-red text-black' 
                                        : 'bg-white border-gray-200 hover:border-beach-yellow'
                                      }
                                    `}
                                  >
                                    Mesa {table.number}
                                  </div>
                                ))}
                              </div>
                            )}
                            {registerForm.formState.errors.tableId && (
                              <p className="text-sm font-medium text-destructive mt-1">
                                {registerForm.formState.errors.tableId.message}
                              </p>
                            )}
                          </FormItem>
                        </div>
                      )}
                      <Button
                        type="submit"
                        className="w-full bg-beach-red hover:bg-red-700 text-white"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <div className="flex items-center">
                            <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full" />
                            <span>Cadastrando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span className="mr-2">Cadastrar</span>
                            <UserPlus className="h-5 w-5" />
                          </div>
                        )}
                      </Button>
                    </form>
                  </Form>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      Já tem uma conta? Selecione a aba "Login" acima.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="text-center mt-6 text-gray-600 text-sm">
            <p>© {new Date().getFullYear()} Carrinho de Praia. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-beach-yellow to-beach-orange overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-beach-yellow/90 to-beach-orange/90"></div>
          <div className="absolute inset-0 opacity-30 bg-pattern"></div>
          <div className="flex flex-col justify-center items-center h-full text-black p-8">
            <div className="max-w-md text-center">
              <div className="flex justify-center items-center mb-6">
                <Umbrella className="h-16 w-16 mr-4" />
                <Sun className="h-16 w-16" />
              </div>
              <h2 className="text-4xl font-bold mb-6">Carrinho de Praia</h2>
              <p className="text-xl mb-6">
                Faça seus pedidos diretamente do seu celular, sem precisar sair da sua cadeira de praia!
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-full bg-white/20 p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4 text-left">
                    <p className="text-lg">Cardápio digital completo</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-full bg-white/20 p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4 text-left">
                    <p className="text-lg">Acompanhe o status do seu pedido</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-full bg-white/20 p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4 text-left">
                    <p className="text-lg">Processo de pagamento simplificado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}