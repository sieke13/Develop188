import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'url'; // ✅ Required for __dirname in ES Modules
import db from './config/connection.js';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import typeDefs from './schemas/typeDefs.js';
import { resolvers } from './schemas/resolvers.js';

// Fix __dirname manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const startApolloServer = async () => {
  await server.start();
  await db.once('open', () => console.log('Connected to MongoDB'));

  const app = express();
  const PORT = process.env.PORT || 3001;

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.use('/graphql', expressMiddleware(server));

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🌍 Server running on http://localhost:${PORT}`);
  });
};

startApolloServer();
