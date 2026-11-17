import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import type { RolUsuario } from '../src/types.ts';

function getJwtSecret(): string {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET !== 'MY_JWT_SECRET') {
    return process.env.JWT_SECRET;
  }
  const secretPath = path.resolve(process.cwd(), 'data', '.jwt_secret');
  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, 'utf-8').trim();
  }
  const generated = crypto.randomBytes(48).toString('hex');
  fs.mkdirSync(path.dirname(secretPath), { recursive: true });
  fs.writeFileSync(secretPath, generated, { mode: 0o600 });
  return generated;
}

const JWT_SECRET = getJwtSecret();

export interface AuthPayload {
  id: number;
  username: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = bearerToken;

  if (!token) {
    res.status(401).json({ error: 'Sesión no iniciada o token ausente.' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
    return;
  }

  const dbUser = db
    .prepare('SELECT id, nombre, username, email, rol, activo FROM usuarios WHERE id = ?')
    .get(decoded.id) as { id: number; nombre: string; username: string; email: string; rol: RolUsuario; activo: number } | undefined;

  if (!dbUser || dbUser.activo !== 1) {
    res.status(403).json({ error: 'Usuario inactivo o no autorizado.' });
    return;
  }

  req.user = {
    id: dbUser.id,
    nombre: dbUser.nombre,
    username: dbUser.username,
    email: dbUser.email,
    rol: dbUser.rol,
  };
  next();
}

export function requireRole(...roles: RolUsuario[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado.' });
      return;
    }
    if (!roles.includes(req.user.rol)) {
      res.status(403).json({ error: 'No tiene permisos suficientes para realizar esta acción.' });
      return;
    }
    next();
  };
}
