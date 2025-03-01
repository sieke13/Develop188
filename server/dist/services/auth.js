import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import dotenv from 'dotenv';
dotenv.config();
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
export const authMiddleware = ({ req }) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return req; // Allow requests without a token
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || '');
        req.user = decoded; // Attach the decoded user object to the request
    }
    catch (err) {
        console.log('Token is not valid');
    }
    return req;
};
export const signToken = (username, email, _id) => {
    const payload = { username, email, _id };
    const secretKey = process.env.JWT_SECRET_KEY || '';
    return jwt.sign(payload, secretKey, { expiresIn: '90h' });
};
export class AuthenticationError extends GraphQLError {
    constructor(message) {
        super(message, undefined, undefined, undefined, ['UNAUTHENTICATED']);
        Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
    }
}
;
