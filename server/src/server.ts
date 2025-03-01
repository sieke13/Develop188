import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import path from 'path';
import { fileURLToPath } from 'url';
import typeDefs from './schemas/typeDefs.js';
import resolvers from './schemas/resolvers.js';
import { authMiddleware } from './services/auth.js';
import db from './config/connection.js';
import fs from 'fs';

// Fix __dirname manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Crear servidor Apollo
const server = new ApolloServer({
  typeDefs,
  resolvers,
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
    const distPath = path.join(__dirname, '../client/dist');
  
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
          }
        }
      }));
  
      app.get('*', (req, res) => {
        // 🔹 Si la solicitud es un archivo estático, devolverlo
        const requestedFile = path.join(distPath, req.path);
        if (fs.existsSync(requestedFile) && req.path.includes('.')) {
          return res.sendFile(requestedFile);
        }
  
        // 🔹 Si no es un archivo, devolver index.html
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.error('❌ ERROR: La carpeta dist/ no existe. Asegúrate de ejecutar "npm run build".');
    }
  }
  
  

  // Iniciar servidor después de la conexión a la DB
  db.once('open', () => {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`🌍 Server running on port ${PORT}`);
      console.log(`🚀 GraphQL ready at http://localhost:${PORT}/graphql`);
    });
  });

  // Manejo de errores en la base de datos
  db.on('error', (err) => {
    console.error('❌ Database connection error:', err);
  });
};

// Iniciar el servidor
startApolloServer();
