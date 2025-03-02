import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import path from 'path';
import { fileURLToPath } from 'url';
import { typeDefs } from './schemas/typeDefs.js';
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

// Middleware for parsing request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Ensure this middleware is set up before Apollo Server

// Logging middleware to log all incoming requests
app.use((req, _, next) => {
  console.log(`Received request for ${req.url}`);
  next();
});

// Create Apollo Server
const serverConfig = {
  typeDefs,
  resolvers,
  context: ({ req }: { req: express.Request }) => authMiddleware({ req }),
  introspection: true, // Enable introspection for GraphQL Playground
};

const server = new ApolloServer(serverConfig);

const startApolloServer = async () => {
  await server.start();

  // Apply Apollo middleware to Express app
  app.use('/graphql', expressMiddleware(server));

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '../../client/dist');
    
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, { extensions: ['js', 'css', 'html'] }));

      app.get('*', (req, res) => {
        // Check if the requested path is a static file in dist/
        const requestedFile = path.join(distPath, req.path);

        if (fs.existsSync(requestedFile) && req.path.startsWith('/assets/')) {
          return res.sendFile(requestedFile);
        }

        // If not a static file, return index.html
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.error('❌ ERROR: The dist/ folder does not exist. Make sure to run "npm run build".');
    }
  }

  // Connect to the database and start the server
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${4000}/graphql`);
  });
}

// Start the server
startApolloServer();