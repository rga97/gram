import { Request, Response, NextFunction } from "express";

const VALID_PASSWORD = "++++froyo";

export function validatePassword(req: Request, res: Response, next: NextFunction) {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }
  
  if (password !== VALID_PASSWORD) {
    return res.status(401).json({ error: "Invalid access code" });
  }
  
  next();
}

export function requirePasswordSession(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const token = authHeader.substring(7);
  
  // Simple token validation - in production, use proper JWT or session management
  if (token !== Buffer.from(VALID_PASSWORD).toString('base64')) {
    return res.status(401).json({ error: "Invalid authentication token" });
  }
  
  next();
}
