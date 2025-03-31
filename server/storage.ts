import { 
  User, InsertUser, 
  Product, InsertProduct,
  Customer, InsertCustomer,
  Table, InsertTable,
  Order, InsertOrder
} from "@shared/schema";
import { nanoid } from "nanoid";
import session from "express-session";
import createMemoryStore from "memorystore";

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
  updateProduct(id: string, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  listProducts(): Promise<Product[]>;
  getActiveProducts(): Promise<Product[]>;

  // Customer related methods
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer | undefined>;
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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tables: Map<string, Table>;
  private products: Map<string, Product>;
  private customers: Map<string, Customer>;
  private orders: Map<string, Order>;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.tables = new Map();
    this.products = new Map();
    this.customers = new Map();
    this.orders = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired sessions every 24h
    });

    // Create a default admin user (dono do carrinho)
    this.createUser({
      username: "admin",
      password: "$2b$10$X/VvbXlXZxc8BrMMxkTSb.lfAg5wVLvn8iK1dCkgpVdSi0lVrg5tq", // "password"
      name: "Dono do Carrinho",
      role: "admin"
    });

    // Create a default client user
    this.createUser({
      username: "cliente",
      password: "$2b$10$X/VvbXlXZxc8BrMMxkTSb.lfAg5wVLvn8iK1dCkgpVdSi0lVrg5tq", // "password"
      name: "Cliente",
      role: "client"
    });

    // Create some default tables
    for (let i = 1; i <= 10; i++) {
      this.createTable({
        number: i,
        status: "available"
      });
    }

    // Create some default products for carrinho de praia
    const products = [
      { name: "Água Mineral", price: 5.00, category: "Bebidas", description: "Água mineral 500ml", isActive: true },
      { name: "Refrigerante", price: 8.00, category: "Bebidas", description: "Lata 350ml", isActive: true },
      { name: "Cerveja", price: 10.00, category: "Bebidas Alcoólicas", description: "Lata 350ml", isActive: true },
      { name: "Água de Coco", price: 12.00, category: "Bebidas", description: "Natural, servida no coco", isActive: true },
      { name: "Suco Natural", price: 10.00, category: "Bebidas", description: "Diversos sabores", isActive: true },
      { name: "Porção de Isca de Peixe", price: 45.00, category: "Porções", description: "Porção para 2 pessoas", isActive: true },
      { name: "Porção de Camarão", price: 55.00, category: "Porções", description: "Porção para 2 pessoas", isActive: true },
      { name: "Batata Frita", price: 30.00, category: "Porções", description: "Porção para 2 pessoas", isActive: true },
      { name: "Sanduíche Natural", price: 20.00, category: "Lanches", description: "Frango ou atum", isActive: true },
      { name: "Espetinho", price: 15.00, category: "Lanches", description: "Carne, frango ou linguiça", isActive: true }
    ];

    products.forEach(product => this.createProduct(product));
  }

  // User related methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = nanoid();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Table related methods
  async getTable(id: string): Promise<Table | undefined> {
    return this.tables.get(id);
  }

  async getTableByNumber(number: number): Promise<Table | undefined> {
    return Array.from(this.tables.values()).find(
      (table) => table.number === number,
    );
  }

  async createTable(insertTable: InsertTable): Promise<Table> {
    const id = nanoid();
    const table: Table = { ...insertTable, id };
    this.tables.set(id, table);
    return table;
  }

  async updateTable(id: string, tableData: Partial<Table>): Promise<Table | undefined> {
    const table = await this.getTable(id);
    if (!table) return undefined;
    
    const updatedTable = { ...table, ...tableData };
    
    // If we're setting the table as occupied, set the occupiedAt time
    if (tableData.status === "occupied" && table.status === "available") {
      updatedTable.occupiedAt = new Date();
    }
    
    this.tables.set(id, updatedTable);
    return updatedTable;
  }

  async deleteTable(id: string): Promise<boolean> {
    return this.tables.delete(id);
  }

  async listTables(): Promise<Table[]> {
    return Array.from(this.tables.values());
  }

  async getAvailableTables(): Promise<Table[]> {
    return Array.from(this.tables.values()).filter(
      (table) => table.status === "available",
    );
  }

  async getOccupiedTables(): Promise<Table[]> {
    return Array.from(this.tables.values()).filter(
      (table) => table.status === "occupied",
    );
  }

  // Product related methods
  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = nanoid();
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product | undefined> {
    const product = await this.getProduct(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  async listProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getActiveProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.isActive,
    );
  }

  // Customer related methods
  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = nanoid();
    const customer: Customer = { ...insertCustomer, id };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<Customer | undefined> {
    const customer = await this.getCustomer(id);
    if (!customer) return undefined;
    
    const updatedCustomer = { ...customer, ...customerData };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  async listCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  // Order related methods
  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = nanoid();
    const order: Order = { 
      ...insertOrder, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Update table status to occupied if it's a new order on an available table
    const table = await this.getTable(order.tableId);
    if (table && table.status === "available") {
      await this.updateTable(table.id!, { status: "occupied" });
    }
    
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, orderData: Partial<Order>): Promise<Order | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;
    
    const updatedOrder = { 
      ...order, 
      ...orderData,
      updatedAt: new Date()
    };
    
    this.orders.set(id, updatedOrder);
    
    // If order is delivered or cancelled, check if there are any active orders for this table
    // If not, set table status back to available
    if (orderData.status === "entregue" || orderData.status === "cancelado") {
      const tableOrders = await this.getOrdersByTable(order.tableId);
      const hasActiveOrders = tableOrders.some(o => 
        o.id !== id && 
        (o.status === "aguardando" || o.status === "em_preparo")
      );
      
      if (!hasActiveOrders) {
        await this.updateTable(order.tableId, { status: "available" });
      }
    }
    
    return updatedOrder;
  }

  async deleteOrder(id: string): Promise<boolean> {
    return this.orders.delete(id);
  }

  async listOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrdersByTable(tableId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.tableId === tableId,
    );
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.status === status,
    );
  }

  async getRecentOrders(limit: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => {
        const dateA = a.createdAt || new Date(0);
        const dateB = b.createdAt || new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);
  }

  async getDailyOrders(): Promise<{ total: number; count: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dailyOrders = Array.from(this.orders.values()).filter((order) => {
      const orderDate = order.createdAt || new Date(0);
      return orderDate >= today && orderDate < tomorrow;
    });
    
    const total = dailyOrders.reduce((sum, order) => sum + order.total, 0);
    const count = dailyOrders.length;
    
    return { total, count };
  }
}

export const storage = new MemStorage();
