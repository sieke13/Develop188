import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import dotenv from 'dotenv';

dotenv.config();

interface JwtPayload {
  _id: unknown;
  username: string;
  email: string;
}

// Middleware para autenticar tokens en Express
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    const secretKey = process.env.JWT_SECRET_KEY || '';

    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.sendStatus(403); // Forbidden
      }

      req.user = user as JwtPayload;
      return next();
    });
  } else {
    res.sendStatus(401); // Unauthorized
  }
};

// Middleware para autenticar tokens en GraphQL
export const authMiddleware = ({ req }: { req: Request }) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return { user: null }; // Devuelve un contexto sin usuario si no hay token
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || '') as JwtPayload;
    return { user: decoded }; // Devuelve el usuario decodificado en el contexto
  } catch (err) {
    console.log('Token is not valid');
    return { user: null }; // Devuelve un contexto sin usuario si el token no es válido
  }
};

// Función para firmar tokens JWT
export const signToken = (username: string, email: string, _id: unknown) => {
  const payload = { username, email, _id };
  const secretKey = process.env.JWT_SECRET_KEY || '';

  return jwt.sign(payload, secretKey, { expiresIn: '90h' });
};

// Clase personalizada para errores de autenticación en GraphQL
export class AuthenticationError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'UNAUTHENTICATED',
      },
    });
    Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
  }
}