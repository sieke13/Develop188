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

    // Asegurar que la carpeta dist existe
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));

      // Capturar cualquier ruta que no sea un archivo y devolver index.html
      app.get('*', (req, res) => {
        const requestedFile = path.join(distPath, req.path);

        // Si el archivo no existe, devolver index.html
        if (!fs.existsSync(requestedFile)) {
          return res.sendFile(path.join(distPath, 'index.html'));
        }

        // Si el archivo existe, dejar que Express lo maneje
        res.sendFile(requestedFile);
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
