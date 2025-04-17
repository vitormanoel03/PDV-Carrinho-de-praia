import { MongoClient, Db, Collection } from "mongodb";
import session from "express-session";
import { IStorage } from "./storage";
import { User, InsertUser, Table, InsertTable, Product, InsertProduct, Customer, InsertCustomer, Order, InsertOrder } from "@shared/schema";
import { nanoid } from "nanoid";
import ConnectMongoDBSession from "connect-mongodb-session";

const MongoDBStore = ConnectMongoDBSession(session);

export class MongoDBStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private users: Collection<User>;
  private tables: Collection<Table>;
  private products: Collection<Product>;
  private customers: Collection<Customer>;
  private orders: Collection<Order>;
  sessionStore: session.Store;

  constructor(uri: string, dbName: string) {
    if (!uri) {
      throw new Error("MongoDB URI não pode estar vazia");
    }
    
    this.client = new MongoClient(uri, {
      ssl: true,
      retryWrites: true,
      w: "majority",
    });
    
    this.db = this.client.db(dbName);
    this.users = this.db.collection<User>("Users");
    this.tables = this.db.collection<Table>("Tables");
    this.products = this.db.collection<Product>("Products");
    this.customers = this.db.collection<Customer>("Customers");
    this.orders = this.db.collection<Order>("Orders");
    
    // Configurar a loja de sessão com opções de SSL/TLS
    this.sessionStore = new MongoDBStore({
      uri: uri,
      databaseName: dbName,
      collection: "sessions",
      connectionOptions: {
        ssl: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
      }
    });
  }

  async connect() {
    await this.client.connect();
    console.log("Conectado ao MongoDB com sucesso");
    
    // Criar índices para pesquisas rápidas
    await this.users.createIndex({ username: 1 }, { unique: true });
    await this.tables.createIndex({ number: 1 }, { unique: true });
    await this.products.createIndex({ name: 1 });
    await this.customers.createIndex({ name: 1 });
  }

  // Implementação dos métodos para User
  async getUser(id: string): Promise<User | undefined> {
    const user = await this.users.findOne({ id });
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await this.users.findOne({ username });
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = nanoid();
    const user: User = { ...insertUser, id };
    await this.users.insertOne(user);
    return user;
  }

  async listUsers(): Promise<User[]> {
    return this.users.find().toArray();
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const result = await this.users.findOneAndUpdate(
      { id },
      { $set: userData },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.users.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Implementação dos métodos para Table
  async getTable(id: string): Promise<Table | undefined> {
    const table = await this.tables.findOne({ id });
    return table || undefined;
  }

  async getTableByNumber(number: number): Promise<Table | undefined> {
    const table = await this.tables.findOne({ number });
    return table || undefined;
  }

  async createTable(insertTable: InsertTable): Promise<Table> {
    const id = nanoid();
    const table: Table = { ...insertTable, id };
    await this.tables.insertOne(table);
    return table;
  }

  async updateTable(id: string, tableData: Partial<Table>): Promise<Table | undefined> {
    const result = await this.tables.findOneAndUpdate(
      { id },
      { $set: tableData },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async deleteTable(id: string): Promise<boolean> {
    const result = await this.tables.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async listTables(): Promise<Table[]> {
    return this.tables.find().toArray();
  }

  async getAvailableTables(): Promise<Table[]> {
    return this.tables.find({ status: "available" }).toArray();
  }

  async getOccupiedTables(): Promise<Table[]> {
    return this.tables.find({ status: "occupied" }).toArray();
  }

  // Implementação dos métodos para Product
  async getProduct(id: string): Promise<Product | undefined> {
    const product = await this.products.findOne({ id });
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = nanoid();
    const product: Product = { ...insertProduct, id };
    await this.products.insertOne(product);
    return product;
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product | undefined> {
    const result = await this.products.findOneAndUpdate(
      { id },
      { $set: productData },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await this.products.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async listProducts(): Promise<Product[]> {
    return this.products.find().toArray();
  }

  async getActiveProducts(): Promise<Product[]> {
    return this.products.find({ isActive: true }).toArray();
  }

  // Implementação dos métodos para Customer
  async getCustomer(id: string): Promise<Customer | undefined> {
    const customer = await this.customers.findOne({ id });
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = nanoid();
    const customer: Customer = { ...insertCustomer, id };
    await this.customers.insertOne(customer);
    return customer;
  }

  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<Customer | undefined> {
    const result = await this.customers.findOneAndUpdate(
      { id },
      { $set: customerData },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await this.customers.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async listCustomers(): Promise<Customer[]> {
    return this.customers.find().toArray();
  }

  // Implementação dos métodos para Order
  async getOrder(id: string): Promise<Order | undefined> {
    const order = await this.orders.findOne({ id });
    return order || undefined;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = nanoid();
    const now = new Date();
    const order: Order = {
      ...insertOrder,
      id,
      createdAt: now,
      updatedAt: now
    };
    await this.orders.insertOne(order);
    return order;
  }

  async updateOrder(id: string, orderData: Partial<Order>): Promise<Order | undefined> {
    // Incluir updatedAt automaticamente
    const dataWithUpdatedTime = {
      ...orderData,
      updatedAt: new Date()
    };
    
    const result = await this.orders.findOneAndUpdate(
      { id },
      { $set: dataWithUpdatedTime },
      { returnDocument: "after" }
    );
    return result || undefined;
  }

  async deleteOrder(id: string): Promise<boolean> {
    const result = await this.orders.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async listOrders(): Promise<Order[]> {
    return this.orders.find().sort({ createdAt: -1 }).toArray();
  }

  async getOrdersByTable(tableId: string): Promise<Order[]> {
    return this.orders.find({ tableId }).sort({ createdAt: -1 }).toArray();
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return this.orders.find({ status: status as any }).sort({ createdAt: -1 }).toArray();
  }

  async getRecentOrders(limit: number): Promise<Order[]> {
    return this.orders.find().sort({ createdAt: -1 }).limit(limit).toArray();
  }

  async getDailyOrders(): Promise<{ total: number; count: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: today,
            $lt: tomorrow
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: { $sum: 1 }
        }
      }
    ];
    
    const result = await this.orders.aggregate(pipeline).toArray();
    
    if (result.length === 0) {
      return { total: 0, count: 0 };
    }
    
    return {
      total: result[0].total,
      count: result[0].count
    };
  }
}