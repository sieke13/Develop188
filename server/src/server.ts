import express from 'express';
import path from 'node:path';
import db from './config/connection.js';
//import routes from './routes/index.js';

// Import the ApolloServer class

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

// Import the two parts of a GraphQL schema
import typeDefs from './schemas/typeDefs.js';
import resolvers from './schemas/resolvers.js';

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
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
    console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
  });
  
}

// Call the async function to start the server
startApolloServer();