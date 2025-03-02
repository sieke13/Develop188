import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import dotenv from 'dotenv';
dotenv.config();

const secret = 'your_secret_key';
const expiration = '200h';

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
    // Extract the token from the request headers
    let token = req.headers['authorization'];

    if (!token) {
        return req;
    }

    // Remove "Bearer " from the token string if it exists
    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length).trimLeft();
    }

    try {
        const { data } = jwt.verify(token, secret, { maxAge: expiration });
        req.user = data;
    } catch {
        console.log('Invalid token');
    }

    return req;
};

// Función para firmar tokens JWT
export const signToken = ({ username, email, _id }) => {
    const payload = { username, email, _id };
    return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
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
