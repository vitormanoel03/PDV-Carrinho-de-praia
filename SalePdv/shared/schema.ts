import { z } from "zod";

// User Schema
export const userSchema = z.object({
  id: z.string(),
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  name: z.string().optional(),
  role: z.enum(["admin", "client"]).default("client"), // "admin" para dono do carrinho, "client" para clientes
  tableId: z.string().optional(), // Mesa associada ao cliente
  tableNumber: z.number().int().optional(), // Número da mesa para exibição
  sellerId: z.string().optional(), // ID do dono do carrinho associado a este cliente
  sellerName: z.string().optional(), // Nome do dono do carrinho para exibição
});

export const insertUserSchema = userSchema.omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema>;

// Mesa Schema
export const tableSchema = z.object({
  id: z.string().optional(),
  number: z.number().int().min(1, "Número da mesa deve ser maior que 0"),
  status: z.enum(["available", "occupied"]).default("available"),
  occupiedAt: z.date().optional(),
});

export const insertTableSchema = tableSchema.omit({ id: true, occupiedAt: true });
export type InsertTable = z.infer<typeof insertTableSchema>;
export type Table = z.infer<typeof tableSchema>;

// Product Schema
export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nome do produto deve ter pelo menos 2 caracteres"),
  price: z.number().min(0, "Preço não pode ser negativo"),
  stock: z.number().int().min(0, "Estoque não pode ser negativo").optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  sellerId: z.string().optional(), // ID do dono do carrinho a que o produto pertence
  sellerName: z.string().optional(), // Nome do dono do carrinho para exibição
});

export const insertProductSchema = productSchema.omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = z.infer<typeof productSchema>;

// Order Item Schema
export const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1),
  price: z.number().min(0),
  productName: z.string(),
  notes: z.string().optional(), // Para observações sobre o item (ex: "sem gelo", "bem passado", etc)
});

export type OrderItem = z.infer<typeof orderItemSchema>;

// Order Schema - representa um pedido
export const orderSchema = z.object({
  id: z.string().optional(),
  orderCode: z.number().int().positive().optional(), // Código do pedido (número inteiro)
  tableId: z.string(),
  tableNumber: z.number(),
  items: z.array(orderItemSchema),
  total: z.number().min(0),
  status: z.enum(["aguardando", "em_preparo", "entregue", "cancelado"]).default("aguardando"),
  userId: z.string().optional(), // ID do cliente que fez o pedido (opcional)
  userName: z.string().optional(), // Nome do cliente que fez o pedido (opcional)
  sellerId: z.string().optional(), // ID do dono do carrinho que receberá o pedido
  sellerName: z.string().optional(), // Nome do dono do carrinho para exibição
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  paymentMethod: z.enum(["dinheiro", "cartao_credito", "cartao_debito", "pix"]).optional(),
  isPaid: z.boolean().default(false),
});

export const insertOrderSchema = orderSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = z.infer<typeof orderSchema>;

// Customer Schema
export const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nome do cliente deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
});

export const insertCustomerSchema = customerSchema.omit({ id: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = z.infer<typeof customerSchema>;
