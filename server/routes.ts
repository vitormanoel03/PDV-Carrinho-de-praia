import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertProductSchema, 
  insertTableSchema, 
  insertOrderSchema, 
  insertUserSchema 
} from "@shared/schema";
import bcrypt from "bcrypt";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Não autorizado" });
};

// Middleware to check if user is admin (dono do carrinho)
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Acesso negado" });
};

// Middleware to check if user is client
const isClient = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user && req.user.role === "client") {
    return next();
  }
  res.status(403).json({ message: "Acesso negado" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Table routes
  app.get("/api/tables", isAuthenticated, async (req, res) => {
    try {
      const tables = await storage.listTables();
      res.json(tables);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar mesas" });
    }
  });

  app.get("/api/tables/available", isAuthenticated, async (req, res) => {
    try {
      const tables = await storage.getAvailableTables();
      res.json(tables);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar mesas disponíveis" });
    }
  });

  app.get("/api/tables/occupied", isAuthenticated, async (req, res) => {
    try {
      const tables = await storage.getOccupiedTables();
      res.json(tables);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar mesas ocupadas" });
    }
  });

  app.get("/api/tables/:id", isAuthenticated, async (req, res) => {
    try {
      const table = await storage.getTable(req.params.id);
      if (!table) {
        return res.status(404).json({ message: "Mesa não encontrada" });
      }
      res.json(table);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar mesa" });
    }
  });

  app.post("/api/tables", isAdmin, async (req, res) => {
    try {
      const tableData = insertTableSchema.parse(req.body);
      const table = await storage.createTable(tableData);
      res.status(201).json(table);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro ao criar mesa" });
    }
  });

  app.put("/api/tables/:id", isAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const tableData = req.body;
      const table = await storage.updateTable(id, tableData);
      
      if (!table) {
        return res.status(404).json({ message: "Mesa não encontrada" });
      }
      res.json(table);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar mesa" });
    }
  });

  app.delete("/api/tables/:id", isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteTable(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Mesa não encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir mesa" });
    }
  });

  // Product routes
  app.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const products = await storage.listProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar produtos" });
    }
  });

  app.get("/api/products/active", isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getActiveProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar produtos ativos" });
    }
  });

  app.get("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar produto" });
    }
  });

  app.post("/api/products", isAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro ao criar produto" });
    }
  });

  app.put("/api/products/:id", isAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const productData = req.body;
      const product = await storage.updateProduct(id, productData);
      
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar produto" });
    }
  });

  app.delete("/api/products/:id", isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir produto" });
    }
  });

  // Order routes
  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.listOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar pedidos" });
    }
  });

  app.get("/api/orders/recent", isAuthenticated, async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 10;
      const orders = await storage.getRecentOrders(limit);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar pedidos recentes" });
    }
  });

  app.get("/api/orders/daily", isAuthenticated, async (req, res) => {
    try {
      const dailyOrders = await storage.getDailyOrders();
      res.json(dailyOrders);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar pedidos do dia" });
    }
  });

  app.get("/api/orders/status/:status", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getOrdersByStatus(req.params.status);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar pedidos por status" });
    }
  });

  app.get("/api/orders/table/:tableId", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getOrdersByTable(req.params.tableId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar pedidos por mesa" });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar pedido" });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      // Add user info to the order if available
      const orderData = {
        ...req.body,
      };
      
      if (req.user) {
        orderData.userId = req.user.id;
        orderData.userName = req.user.name || req.user.username;
      }
      
      const validatedOrder = insertOrderSchema.parse(orderData);
      const order = await storage.createOrder(validatedOrder);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro ao criar pedido" });
    }
  });

  app.put("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      const orderData = req.body;
      
      // Check if the order exists and get current status
      const existingOrder = await storage.getOrder(id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }
      
      // Only the admin can change the status of an order from "em_preparo" to another status
      if (
        existingOrder.status === "em_preparo" && 
        orderData.status && 
        orderData.status !== "em_preparo" && 
        (!req.user || req.user.role !== "admin")
      ) {
        return res.status(403).json({ 
          message: "Apenas o dono do carrinho pode mudar o status de um pedido em preparo"
        });
      }
      
      // Only admin can change from "aguardando" to "em_preparo"
      if (
        existingOrder.status === "aguardando" && 
        orderData.status === "em_preparo" && 
        (!req.user || req.user.role !== "admin")
      ) {
        return res.status(403).json({ 
          message: "Apenas o dono do carrinho pode iniciar o preparo do pedido"
        });
      }
      
      // Clients cannot change orders that are already in "em_preparo" status
      if (
        existingOrder.status === "em_preparo" && 
        req.user && 
        req.user.role === "client"
      ) {
        return res.status(403).json({ 
          message: "Não é possível alterar um pedido que já está em preparo"
        });
      }
      
      const order = await storage.updateOrder(id, orderData);
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar pedido" });
    }
  });

  app.delete("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      // Check if the order exists and get current status
      const existingOrder = await storage.getOrder(req.params.id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }
      
      // Only allow deletion of orders in "aguardando" status, or by admin
      if (existingOrder.status !== "aguardando" && (!req.user || req.user.role !== "admin")) {
        return res.status(403).json({ 
          message: "Apenas pedidos aguardando podem ser cancelados"
        });
      }
      
      const success = await storage.deleteOrder(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir pedido" });
    }
  });

  // User management routes (admin only)
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.listUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...rest }) => rest);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  app.post("/api/users", isAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });

  app.put("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const userData = req.body;
      
      // If updating password, hash it
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      
      const user = await storage.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  app.delete("/api/users/:id", isAdmin, async (req, res) => {
    try {
      // Prevent deleting the current user
      if (req.user && req.params.id === req.user.id) {
        return res.status(400).json({ message: "Não é possível excluir o próprio usuário" });
      }
      
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
