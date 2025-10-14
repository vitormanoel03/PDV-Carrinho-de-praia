import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, UserPlus, Waves, Sun } from "lucide-react";
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
import { apiRequest } from "@/lib/queryClient";
import InputMask from "react-input-mask";
import { cpf, cnpj } from "cpf-cnpj-validator";
import { motion } from "framer-motion";
import image1 from "../images/Pessoasnapraia/pexels-efrem-efre-2786187-33768199.jpg";
import image2 from "../images/Pessoasnapraia/pexels-josh-hild-1270765-17391950.jpg";
import image3 from "../images/Pessoasnapraia/pexels-olly-3811310.jpg";

const baseSchema = z.object({
  inputType: z.enum(["cpf", "cnpj", "phone"]).default("cpf"),
  password: z.string().min(1, "A senha é obrigatória"),
});

const loginSchema = baseSchema.extend({
  rememberMe: z.boolean().optional(),
  cpfouCnpj: z.string().min(1, "O CPF, CNPJ ou telefone é obrigatório"),
});

const extendedRegisterSchema = baseSchema.extend({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  confirmPassword: z.string(),
  name:z.string().optional(),
  role: z.enum(["admin", "client"]).default("client"),
  tableId: z.string().optional(),
  tableNumber: z.number().optional(),
  sellerId: z.string().optional(),
  sellerName: z.string().optional(),
  cpfouCnpj: z.string().min(1, "O CPF, CNPJ ou telefone é obrigatório"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
}).refine((data) => {
  const cleanedValue = data.cpfouCnpj.replace(/[^\d]/g, "");
  if (data.inputType === "cpf") {
    return cpf.isValid(cleanedValue);
  }
  if (data.inputType === "cnpj") {
    return cnpj.isValid(cleanedValue);
  }
  if (data.inputType === "phone") {
    return cleanedValue.length === 10 || cleanedValue.length === 11;
  }
  return false;
}, {
  message: "Valor inválido para o tipo selecionado",
  path: ["cpfouCnpj"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof extendedRegisterSchema>;

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loginMutation, registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [selectedTable, setSelectedTable] = useState<{ id: string, number: number } | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<{ cpfouCnpj: string, name: string } | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [mask, setMask] = useState("999.999.999-99");
  const [activeTab, setActiveTab] = useState("login");

  const [phraseIndex, setPhraseIndex] = useState(0);
  const phrases = [
    "Sistema de Ponto de Venda para Carrinhos de Praia",
    "Interface Intuitiva e Funcional",
    "Acessível de Qualquer Dispositivo Móvel"
  ];

  useEffect(() => {
    const intervalId = setInterval(() => {
      setPhraseIndex(prevIndex => (prevIndex + 1) % phrases.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(intervalId);
  }, [phrases.length]);
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      cpfouCnpj: "",
      password: "",
      rememberMe: false,
      inputType: "cpf",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(extendedRegisterSchema),
    defaultValues: {
      cpfouCnpj: "",
      username:"",
      password: "",
      confirmPassword: "",
      role: "client",
      tableId: "",
      tableNumber: undefined,
      sellerId: "",
      sellerName: "",
      inputType: "cpf",
    },
  });

  const loginInputType = loginForm.watch("inputType");
  const registerInputType = registerForm.watch("inputType");

  useEffect(() => {
    if (loginInputType === "cpf") setMask("999.999.999-99");
    else if (loginInputType === "cnpj") setMask("99.999.999/9999-99");
    else setMask("(99) 99999-9999");
  }, [loginInputType]);

  useEffect(() => {
    if (registerInputType === "cpf") setMask("999.999.999-99");
    else if (registerInputType === "cnpj") setMask("99.999.999/9999-99");
    else setMask("(99) 99999-9999");
  }, [registerInputType]);

  // Buscar mesas disponíveis
 const {
  data: tables = [],
  isLoading: isLoadingTables,
} = useQuery<Table[]>({
  queryKey: ["/api/tables/available", selectedSellerId],
  enabled: !!selectedSellerId, // só busca se tiver seller selecionado
  queryFn: async () => {
    const res = await apiRequest("GET", `/api/tables/available?sellerId=${selectedSellerId}`);
    const data = await res.json();
    return data.tables; // Extract the tables array
  },
  staleTime: 10000,
});

useEffect(() => {
  if (selectedSeller) {
    setSelectedSellerId(selectedSeller.cpfouCnpj);
  }
}, [selectedSeller]);


const availableTables = Array.isArray(tables) ? tables : [];



  
  // Buscar donos de carrinhos
  const {
    data: sellers = [],
    isLoading: isLoadingSellers,
  } = useQuery<User[]>({
    queryKey: ["/api/users/sellers"],
    staleTime: 10000,
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({
      cpfouCnpj: data.cpfouCnpj.replace(/[^\d]/g, ""),
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
      registerForm.setValue('sellerId', selectedSeller.cpfouCnpj);
      registerForm.setValue('sellerName', selectedSeller.name);
    }
  }, [selectedSeller, registerForm]);

const onRegisterSubmit = (data: RegisterFormValues) => {
  console.log('Tentando registrar com dados:', data);
  if (data.role === "client") {
    if (!data.tableId) {
      registerForm.setError('tableId', { 
        type: 'manual', 
        message: 'Por favor, selecione uma mesa' 
      });
      return;
    }

    if (!data.sellerId) {
      registerForm.setError('tableId', { 
        type: 'manual', 
        message: 'Por favor, selecione um carrinho' 
      });
      return;
    }
  }

  
  registerMutation.mutate({ ...data, cpfouCnpj: data.cpfouCnpj.replace(/[^\d]/g, "") });
};

const animationProps = {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: "easeOut" },
  };

  const animationPropsRight = {
    initial: { opacity: 0, x: 50 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: "easeOut" },
  };


  return (
    <div className="w-full min-h-screen bg-beach-sand overflow-x-hidden">
      <div className="grid lg:grid-cols-2">
        <div className="flex flex-col items-center justify-start py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
          <div className="mx-auto w-full max-w-md">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                      <Waves className="h-6 w-6" />
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
                          name="inputType"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Tipo de Documento</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex space-x-4"
                                >
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="cpf" /></FormControl>
                                    <FormLabel className="font-normal">CPF</FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="cnpj" /></FormControl>
                                    <FormLabel className="font-normal">CNPJ</FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="phone" /></FormControl>
                                    <FormLabel className="font-normal">Telefone</FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="cpfouCnpj"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF, CNPJ ou Telefone</FormLabel>
                              <FormControl>
                                <InputMask
                                  mask={mask}
                                  value={field.value}
                                  onChange={field.onChange}
                                >
                                  {(inputProps: any) => <Input {...inputProps} placeholder="Digite seu documento ou telefone" className="border-beach-yellow focus:ring-beach-yellow" />}
                                </InputMask>
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
                          <div className="text-sm">
                            <Link to="/forgot-password" className="font-medium text-beach-red hover:text-red-700">
                              Esqueceu a senha?
                            </Link>
                          </div>
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
                      <Waves className="h-6 w-6" />
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
                          name="username"
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
                          name="inputType"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Tipo de Documento</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex space-x-4"
                                >
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="cpf" /></FormControl>
                                    <FormLabel className="font-normal">CPF</FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="cnpj" /></FormControl>
                                    <FormLabel className="font-normal">CNPJ</FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl><RadioGroupItem value="phone" /></FormControl>
                                    <FormLabel className="font-normal">Telefone</FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="cpfouCnpj"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF, CNPJ ou Telefone</FormLabel>
                              <FormControl>
                                <InputMask
                                  mask={mask}
                                  value={field.value}
                                  onChange={field.onChange}
                                >
                                  {(inputProps: any) => <Input {...inputProps} placeholder="Digite seu documento ou telefone" className="border-beach-yellow focus:ring-beach-yellow" />}
                                </InputMask>
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
                                  {sellers.map((seller) => {
                                    const isSelected = selectedSeller?.cpfouCnpj === seller.cpfouCnpj;



                                    return (
                                      <div
                                        key={seller.cpfouCnpj}
                                        onClick={() => {
                                          setSelectedSeller({ cpfouCnpj: seller.cpfouCnpj || '', name: seller.username });

                                        }}
                                        className={`
          border rounded-md py-2 px-3 cursor-pointer text-center transition-all
          ${isSelected
                                            ? 'bg-beach-yellow border-beach-red text-black'
                                            : 'bg-white border-gray-200 hover:border-beach-yellow'}
        `}
                                      >
                                        {seller.username || seller.cpfouCnpj}
                                      </div>
                                    );
                                  })}
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
                              ) : (
                                <>

                                  {availableTables.length === 0 ? (
                                    <p className="text-sm text-red-500">
                                      Não há mesas disponíveis deste carrinho no momento.
                                    </p>
                                  ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                      {availableTables.map((table) => {
                                        const isSelected = selectedTable?.id === table.id;

                                        return (
                                          <div
                                            key={table.id}
                                            onClick={() => {
                                              setSelectedTable({ id: table.id, number: table.number });
                                            }}
                                            className={`
                  border rounded-md py-2 px-3 text-center transition-all relative
                  ${isSelected
                                                ? "bg-beach-yellow border-beach-red text-black cursor-pointer"
                                                : "bg-white border-gray-200 hover:border-beach-yellow cursor-pointer"}
                `}
                                          >
                                            <div>Mesa {table.number}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </>
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
                              <span>Registrando...</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="mr-2">Registrar</span>
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
        <div className="hidden lg:flex flex-col items-center justify-center bg-beach-yellow p-10">
          <motion.div {...animationPropsRight} className="text-center w-full">
            <Sun className="h-24 w-24 text-gray-800 mx-auto mb-6" />
            <div className="h-20 flex items-center justify-center">
                <h2 key={phraseIndex} className="phrase-animation text-3xl font-bold text-gray-800">
                    {phrases[phraseIndex]}
                </h2>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="w-full bg-beach-sand py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div {...animationProps} className="text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Gerencie seu negócio na praia, sem a necessidade de um computador.
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Otimize o fluxo de pedidos e minimize a ocorrência de erros.
            </p>
          </motion.div>

          <div className="mt-20 grid gap-16 lg:grid-cols-3 lg:gap-x-5 lg:gap-y-12">
            <motion.div {...animationPropsRight} className="flex flex-col items-center text-center">
              <img src={image1} alt="Pessoas na praia" className="w-full h-64 bg-gray-300 rounded-lg mb-4 object-cover" />
              <h3 className="text-2xl font-bold text-gray-900">Reduza Erros no Atendimento</h3>
              <p className="mt-2 text-lg text-gray-600">Garanta a precisão nas entregas e evite o esquecimento de pedidos.</p>
            </motion.div>

            <motion.div {...animationProps} className="flex flex-col items-center text-center">
              <img src={image2} alt="Pessoas na praia" className="w-full h-64 bg-gray-300 rounded-lg mb-4 object-cover" />
              <h3 className="text-2xl font-bold text-gray-900">Minimize a Inadimplência</h3>
              <p className="mt-2 text-lg text-gray-600">Ofereça mais opções de pagamento e fidelize seus clientes.</p>
            </motion.div>

            <motion.div {...animationPropsRight} className="flex flex-col items-center text-center">
              <img src={image3} alt="Pessoas na praia" className="w-full h-64 bg-gray-300 rounded-lg mb-4 object-cover" />
              <h3 className="text-2xl font-bold text-gray-900">Agilize o Processo de Pedidos</h3>
              <p className="mt-2 text-lg text-gray-600">Proporcione uma experiência de compra mais fluida e incentive o consumo.</p>
            </motion.div>
          </div>

          <motion.div {...animationProps} className="text-center mt-20">
            <Button onClick={() => setActiveTab("register")} size="lg" className="w-full max-w-md mx-auto bg-green-600 hover:bg-green-700 text-xl py-8">
              Teste Grátis
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
  }
