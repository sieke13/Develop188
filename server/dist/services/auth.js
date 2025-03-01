import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import dotenv from 'dotenv';
dotenv.config();
// Middleware para autenticar tokens en Express
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        const secretKey = process.env.JWT_SECRET_KEY || '';
        jwt.verify(token, secretKey, (err, user) => {
            if (err) {
                return res.sendStatus(403); // Forbidden
            }
            req.user = user;
            return next();
        });
    }
    else {
        res.sendStatus(401); // Unauthorized
    }
};
// Middleware para autenticar tokens en GraphQL
export const authMiddleware = ({ req }) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return { user: null }; // Devuelve un contexto sin usuario si no hay token
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || '');
        return { user: decoded }; // Devuelve el usuario decodificado en el contexto
    }
    catch (err) {
        console.log('Token is not valid');
        return { user: null }; // Devuelve un contexto sin usuario si el token no es válido
    }
};
// Función para firmar tokens JWT
export const signToken = (username, email, _id) => {
    const payload = { username, email, _id };
    const secretKey = process.env.JWT_SECRET_KEY || '';
    return jwt.sign(payload, secretKey, { expiresIn: '90h' });
};
// Clase personalizada para errores de autenticación en GraphQL
export class AuthenticationError extends GraphQLError {
    constructor(message) {
        super(message, {
            extensions: {
                code: 'UNAUTHENTICATED',
            },
        });
        Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
    }
}
