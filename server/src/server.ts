import express, { Request, Response, NextFunction } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import path from 'path';
import { fileURLToPath } from 'url';
// Import specific files with explicit paths
import typeDefs from './schemas/typeDefs.js';
import resolvers from './schemas/resolvers.js';
import { authMiddleware } from './services/auth.js';
import cors from 'cors';
import fs from 'fs';
import mongoose from 'mongoose';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3001;
const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req: Request, _: Response, next: NextFunction) => {
    console.log(`Request: ${req.url}`);
    next();
});

// Apollo Server setup
const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
});

const startApolloServer = async () => {
    try {
        await server.start();
        
        // Apply GraphQL middleware
        app.use(
            '/graphql',
            expressMiddleware(server, {
                context: async ({ req }) => authMiddleware({ req }),
            })
        );

        // Log GraphQL requests
        app.use('/graphql', (req, _, next) => {
            if (req.body) console.log("GraphQL Request:", req.body);
            next();
        });

        // Serve static files in production
        if (process.env.NODE_ENV === 'production') {
            const distPath = path.join(__dirname, '../../client/dist');
            if (fs.existsSync(distPath)) {
                app.use(express.static(distPath));
                app.get('*', (_: Request, res: Response) => {
                    res.sendFile(path.join(distPath, 'index.html'));
                });
            } else {
                console.error('❌ ERROR: dist/ folder missing. Run "npm run build".');
            }
        }

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mydatabase');
        console.log('✅ Database connected');

        // Start the server
        app.listen(PORT, () => {
            console.log(`🌍 Server running on port ${PORT}`);
            console.log(`🚀 GraphQL ready at http://localhost:${PORT}/graphql`);
        });
    } catch (error) {
        console.error('❌ Server startup error:', error);
    }
};

startApolloServer();