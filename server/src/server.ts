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
    const manifestPath = path.join(distPath, 'manifest.json');

    app.use(express.static(distPath));

    app.get('*', (_, res) => {
      // Verificar si existe el manifest.json para obtener el script correcto
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        if (manifest['index.html'] && manifest['index.html'].file) {
          res.sendFile(path.join(distPath, manifest['index.html'].file));
          return;
        }
      }

      // Si no hay manifest, enviar el index.html
      res.sendFile(path.join(distPath, 'index.html'));
    });
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
