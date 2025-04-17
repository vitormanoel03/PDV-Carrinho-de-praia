import {
  User,
  InsertUser,
  Product,
  InsertProduct,
  Customer,
  InsertCustomer,
  Table,
  InsertTable,
  Order,
  InsertOrder,
} from "@shared/schema";
import { nanoid } from "nanoid";
import session from "express-session";
import createMemoryStore from "memorystore";
import { MongoDBStorage } from "./mongodb-storage";
import dotenv from 'dotenv';
dotenv.config();


const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User related methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Table related methods
  getTable(id: string): Promise<Table | undefined>;
  getTableByNumber(number: number): Promise<Table | undefined>;
  createTable(table: InsertTable): Promise<Table>;
  updateTable(id: string, table: Partial<Table>): Promise<Table | undefined>;
  deleteTable(id: string): Promise<boolean>;
  listTables(): Promise<Table[]>;
  getAvailableTables(): Promise<Table[]>;
  getOccupiedTables(): Promise<Table[]>;

  // Product related methods
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(
    id: string,
    product: Partial<Product>,
  ): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  listProducts(): Promise<Product[]>;
  getActiveProducts(): Promise<Product[]>;

  // Customer related methods
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(
    id: string,
    customer: Partial<Customer>,
  ): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  listCustomers(): Promise<Customer[]>;

  // Order related methods
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<Order>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;
  listOrders(): Promise<Order[]>;
  getOrdersByTable(tableId: string): Promise<Order[]>;
  getOrdersByStatus(status: string): Promise<Order[]>;
  getRecentOrders(limit: number): Promise<Order[]>;
  getDailyOrders(): Promise<{ total: number; count: number }>;

  // Session store
  sessionStore: session.Store;
}

// Inicializar o MongoDB Storage
const MONGODB_URI = process.env.MONGO_URI;
if (!MONGODB_URI) {
  throw new Error("MONGO_URI não está definida nas variáveis de ambiente");
}

const DB_NAME = process.env.DB_NAME || "PDVCarrinho_praia";

// Inicializar o armazenamento MongoDB
const mongoStorage = new MongoDBStorage(MONGODB_URI, DB_NAME);

// Exportar a instância do storage
export const storage = mongoStorage;

// Conectar ao MongoDB
mongoStorage.connect().catch(err => {
  console.error("Erro ao conectar com MongoDB:", err);
  process.exit(1);
});