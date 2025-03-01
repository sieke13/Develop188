import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import path from 'path';
import { fileURLToPath } from 'url';
import typeDefs from './schemas/typeDefs.js';
import resolvers from './schemas/resolvers.js';
import { authMiddleware } from './services/auth.js';
import db from './config/connection.js';
// Fix __dirname manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3001;
const app = express();
// Crear servidor Apollo
const server = new ApolloServer({
    typeDefs,
    resolvers,
});
const startApolloServer = async () => {
    await server.start();
    // Middleware para GraphQL con contexto de autenticación
    app.use('/graphql', express.json(), expressMiddleware(server, {
        context: async ({ req }) => authMiddleware({ req }),
    }));
    // Middleware para analizar request bodies
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    // Servir archivos estáticos en producción
    if (process.env.NODE_ENV === 'production') {
        app.use(express.static(path.join(__dirname, '../../client/build')));
        app.get('*', (_, res) => {
            res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
        });
    }
    // Iniciar servidor después de la conexión a la DB
    db.once('open', () => {
        app.listen(PORT, () => {
            console.log(`🌍 Server running at http://localhost:${PORT}`);
            console.log(`🚀 GraphQL ready at http://localhost:${PORT}/graphql`);
        });
    });
};
startApolloServer();
