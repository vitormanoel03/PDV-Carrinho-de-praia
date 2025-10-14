import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { MongoDBStorage } from "./mongodb-storage";

declare global {
  namespace Express {
    // Extend the Express User interface with our User type
    interface Userapp extends User {
      // All properties already defined in the User type from schema.ts
    }
  }
}

async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function comparePasswords(supplied: string, stored: string) {
  return bcrypt.compare(supplied, stored);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "pdv-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

 passport.use(
  new LocalStrategy(
    {
      usernameField: "cpfouCnpj", // 👈 diz para o passport qual campo usar
      passwordField: "password"
    },
    async (cpfouCnpj, password, done) => {
      try {
        const user = await storage.getUserByCpfouCnpj(cpfouCnpj);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }
  )
);


  passport.serializeUser((user, done) => done(null, user.cpfouCnpj));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUserByCpfouCnpj(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate request body
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByCpfouCnpj(userData.cpfouCnpj);
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Atualiza o status da mesa para "ocupada"
      if (userData.tableId) {
        await storage.updateTable(userData.tableId, { status: "occupied" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      // Log in the user automatically
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt:", req.body);
    if (!req.body.cpfouCnpj || !req.body.password) {
      return res.status(400).json({ message: "CPF/CNPJ e password são obrigatórios" });
    }
    
    passport.authenticate("local", (err: Error | null, user: User | false, info: any)  => {
      console.log("Passport authenticate callback:", { err, user, info });
      if (err) {
        console.error("Erro de autenticação:", err);
        return res.status(500).json({ message: "Erro interno do servidor" });
      }
      if (!user) return res.status(401).json({ message: "Usuário ou senha inválidos" })
      console.log("Este é o que o back-end ta recebendo",req.body.cpfouCnpj);
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });
}
