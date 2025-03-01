import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import path from 'path';
import { fileURLToPath } from 'url';
import typeDefs from './schemas/typeDefs.js';
import { resolvers } from './schemas/resolvers.js';
import { authMiddleware } from './services/auth.js';
import connectDB from './config/connection.js';
import fs from 'fs';
import cors from 'cors';

// Fix __dirname manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const app = express();

// Enable CORS
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true
};
app.use(cors(corsOptions));

// Crear servidor Apollo
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
});

const startApolloServer = async () => {
  await server.start();

  // Middleware para GraphQL con autenticación
  app.use('/graphql', express.json(), expressMiddleware(server, {
    context: async ({ req }) => authMiddleware({ req }),
  }));

  // Middleware para request bodies
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // Servir archivos estáticos en producción
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '../../client/dist');
    
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, { extensions: ['js', 'css', 'html'] }));

      app.get('*', (req, res) => {
        // Verifica si la ruta solicitada es un archivo estático en dist/
        const requestedFile = path.join(distPath, req.path);

        if (fs.existsSync(requestedFile) && req.path.startsWith('/assets/')) {
          return res.sendFile(requestedFile);
        }

        // Si no es un archivo estático, devolver index.html
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.error('❌ ERROR: La carpeta dist/ no existe. Asegúrate de ejecutar "npm run build".');
    }
  }

  // Conexión a la base de datos y arranque del servidor
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🌍 Server running on port ${PORT}`);
    console.log(`🚀 GraphQL ready at http://localhost:${PORT}/graphql`);
  });
};

// Iniciar el servidor
startApolloServer();
