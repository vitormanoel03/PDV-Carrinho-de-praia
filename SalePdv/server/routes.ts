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
  // Conectar ao MongoDB antes de registrar rotas
  if ('connect' in storage) {
    try {
      await storage.connect();
      console.log("Conexão com MongoDB estabelecida com sucesso");
    } catch (error) {
      console.error("Erro ao conectar ao MongoDB:", error);
      throw new Error("Falha na conexão com o MongoDB");
    }
  }

  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  app.post("/api/users/find", async (req, res) => {
    try {
      const { cpfOrPhone } = req.body;
      if (!cpfOrPhone) {
        return res.status(400).json({ message: "CPF ou telefone é obrigatório" });
      }

      const user = await storage.getUserByCpfouCnpj(cpfOrPhone);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  app.patch("/api/users/:userId/password", async (req, res) => {
    try {
      const { userId } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ message: "A nova senha é obrigatória" });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.updateUser(userId, { password: hashedPassword });

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({ message: "Senha atualizada com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar senha" });
    }
  });

  
  // Rota para obter usuários administradores (donos de carrinhos)
  app.get("/api/users/sellers", async (req, res) => {
    try {
      const users = await storage.listUsers();
      const sellers = users.filter(user => user.role === "admin");
      res.json(sellers);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar donos de carrinhos" });
    }
  });

  // Table routes
  app.get("/api/tables", isAuthenticated, async (req, res) => {
    try {
      let tables = await storage.listTables();
      if (req.user?.role === 'admin') {
        tables = tables.filter(table => table.sellerId === req.user.cpfouCnpj);
      }
      res.json(tables);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar mesas" });
    }
  });

  // Esta rota está disponível publicamente para permitir o registro de usuários com seleção de mesa
  app.get("/api/tables/available", async (req, res) => {
  try {
    const { sellerId } = req.query;
    if (!sellerId) {
      return res.status(400).json({ message: "Parâmetro sellerId é obrigatório" });
    }

    const tables = await storage.getAvailableTablesBySeller(sellerId.toString());
    const seller = await storage.getUserByCpfouCnpj(sellerId.toString());

    res.json({
      tables,
      settings: {
        tableNaming: seller?.tableNaming || 'mesa',
        showOrderStatus: seller?.showOrderStatus !== undefined ? seller.showOrderStatus : true,
      }
    });
  } catch (error) {
    console.error("Erro ao buscar mesas:", error);
    res.status(500).json({ message: "Erro ao buscar mesas disponíveis" });
  }
});


 app.post("/api/tables", isAuthenticated, async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Acesso negado" });
  }

  try {
    const { number } = req.body;

    const table = await storage.createTable({
      number,
      status: "available",
      sellerId: req.user.cpfouCnpj,
      sellerName: req.user.username
    });

    res.json(table);
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar mesa" });
  }
});

app.post("/api/tables/bulk", isAdmin, async (req, res) => {
    try {
      const { quantity } = req.body;
      const sellerId = req.user?.cpfouCnpj;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: "Quantidade inválida" });
      }
      if (!sellerId) {
        return res.status(400).json({ message: "Vendedor não encontrado" });
      }

      const tables = await storage.createManyTables({
        quantity,
        sellerId,
        sellerName: req.user?.username,
      });

      res.status(201).json(tables);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar mesas" });
    }
  });


  app.patch("/api/tables/:id", isAuthenticated, async (req, res) => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Acesso negado" });
    }
    try {
      const table = await storage.updateTable(req.params.id, req.body);
      res.json(table);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar mesa" });
    }
  });

  app.delete("/api/tables/:id", isAuthenticated, async (req, res) => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Acesso negado" });
    }
    try {
      const success = await storage.deleteTable(req.params.id);
      if (success) {
        res.json({ message: "Mesa excluída com sucesso" });
      } else {
        res.status(404).json({ message: "Mesa não encontrada" });
      }
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir mesa" });
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
      
      // Se for cliente, filtrar os produtos pelo sellerId associado ao cliente
      if (req.user && req.user.role === "client" && req.user.sellerId) {
        const filteredProducts = products.filter(product => product.sellerId === req.user?.sellerId);
        return res.json(filteredProducts);
      }
      
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar produtos" });
    }
  });

  app.get("/api/products/active", isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getActiveProducts();
      // Retornar todos os produtos ativos, independente do vendedor
      const activeProducts = products.filter(product => product.isActive);
      res.json(activeProducts);
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
      // Adicionar o sellerId e sellerName ao produto sendo criado
      const productData = {
        ...req.body,
        sellerId: req.user?.cpfouCnpj,
        sellerName: req.user?.sellerName || req.user?.username,
      };
      
      const validatedProduct = insertProductSchema.parse(productData);
      const product = await storage.createProduct(validatedProduct);
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
      res.status(200).json({ message: "Produto excluído com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      res.status(500).json({ message: "Erro ao excluir produto" });
    }
  });

  // Order routes
  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      let orders = await storage.listOrders();
      if (req.user?.role === 'admin') {
        orders = orders.filter(order => order.sellerId === req.user.cpfouCnpj);
      }
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
  
  // Rota para o cliente ver seus próprios pedidos
  app.get("/api/users/:userId/orders", isAuthenticated, async (req, res) => {
    try {
      // Garantir que um cliente só possa ver seus próprios pedidos
      if (req.user?.role === "client" && req.user?.cpfouCnpj !== req.params.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const userOrders = await storage.listOrders();
      const filteredOrders = userOrders.filter(order => order.userId === req.params.userId);
      
      // Ordenar do mais recente para o mais antigo
      filteredOrders.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      res.json(filteredOrders);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar pedidos do usuário" });
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
      console.log("--- Creating Order ---");
      console.log("Request Body:", req.body);
      console.log("User:", req.user);

      // Add user info to the order if available
      const orderData = {
        ...req.body,
      };
      
      if (req.user) {
        orderData.userId = req.user.cpfouCnpj;
        orderData.userName = req.user.username || req.user.username;
        
        // Se o usuário for cliente, adicionar o sellerId associado ao cliente ao pedido
        if (req.user.role === "client" && req.user.sellerId) {
          orderData.sellerId = req.user.sellerId;
          orderData.sellerName = req.user.sellerName; // Nome do dono do carrinho, se disponível
        } else if (req.user.role === "admin") {
          // Se o usuário for admin (dono do carrinho), adicionar seu próprio ID
          orderData.sellerId = req.user.cpfouCnpj;
          orderData.sellerName = req.user.username || req.user.username;
        }
        
        // Permitimos que clientes façam múltiplos pedidos na mesma mesa
        // Ainda mantemos a restrição de apenas uma mesa por cliente
        if (req.user.role === "client") {
          const userOrders = await storage.listOrders();
          const activeUserOrders = userOrders.filter(order => 
            order.userId === req.user?.cpfouCnpj && 
            order.tableId !== orderData.tableId && 
            ["aguardando", "em_preparo"].includes(order.status)
          );
          
          if (activeUserOrders.length > 0) {
            return res.status(400).json({ 
              message: "Você já tem pedidos ativos em outra mesa. Por favor, continue usando a mesma mesa para seus pedidos." 
            });
          }
        }
      }
      
      // Gerar um código de pedido aleatório de 4 dígitos
      const orderCode = Math.floor(1000 + Math.random() * 9000);
      
      const orderToValidate = {
        ...orderData,
        orderCode
      };

      console.log("Order to validate:", orderToValidate);

      const validatedOrder = insertOrderSchema.parse(orderToValidate);
      
      console.log("Validated Order:", validatedOrder);

      const order = await storage.createOrder(validatedOrder);

      // Update table with customer info
      if (order) {
        await storage.updateTable(order.tableId, {
          status: "occupied",
          customerName: orderData.userName,
          customerPhone: orderData.userPhone, // Assuming userPhone is passed in orderData
        });
      }

      res.status(201).json(order);
    } catch (error) {
      console.error("--- Error Creating Order ---");
      console.error(error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro ao criar pedido" });
    }
  });

  app.patch("/api/orders/:id", isAuthenticated, async (req, res) => {
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
      const existingUser = await storage.getUserByCpfouCnpj(userData.cpfouCnpj);
      if (existingUser) {
        return res.status(400).json({ message: "Usuário já existe" });
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

  app.delete("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userToDeleteId = req.params.id;
      const requester = req.user;

      // Allow admin to delete any user, or user to delete themselves
      if (requester.role !== 'admin' && requester.cpfouCnpj !== userToDeleteId) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const success = await storage.deleteUser(userToDeleteId);
      if (!success) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir usuário" });
    }
  });

  // Stats routes (admin only)
  app.get("/api/stats/revenue/summary", isAdmin, async (req, res) => {
    try {
      const sellerId = req.user.cpfouCnpj;
      const summary = await storage.getRevenueSummary(sellerId);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar resumo de faturamento" });
    }
  });

  app.get("/api/stats/revenue/daily", isAdmin, async (req, res) => {
    try {
      const sellerId = req.user.cpfouCnpj;
      const dailyRevenue = await storage.getDailyRevenue(sellerId);
      res.json(dailyRevenue);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar faturamento diário" });
    }
  });

  app.get("/api/stats/revenue/monthly", isAdmin, async (req, res) => {
    try {
      const sellerId = req.user.cpfouCnpj;
      const monthlyRevenue = await storage.getMonthlyRevenue(sellerId);
      res.json(monthlyRevenue);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar faturamento mensal" });
    }
  });

  app.get("/api/stats/revenue/yearly", isAdmin, async (req, res) => {
    try {
      const sellerId = req.user.cpfouCnpj;
      const yearlyRevenue = await storage.getYearlyRevenue(sellerId);
      res.json(yearlyRevenue);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar faturamento anual" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
