import { z } from "zod";
import { userSchema } from "../shared/schema";

export type User = z.infer<typeof userSchema>;
// src/types/express/index.d.ts
import "express";
import { User as AppUser } from "../shared/schema"; // caminho pode variar

declare global {
  namespace Express {
    interface User extends AppUser {}
  }
}
