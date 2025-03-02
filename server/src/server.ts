import express, { Request, Response } from 'express';
import { ApolloServer } from 'apollo-server-express';
import path from 'path';
import { fileURLToPath } from 'url';
import { typeDefs, resolvers } from './schemas/index.js';
import connectDB from './config/connection.js';
import cors from 'cors';
import fs from 'fs';

// Fix __dirname manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const app = express();

// Enable CORS
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// Middleware for parsing request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Logging middleware to log all incoming requests
app.use((req: Request, _: Response, next: express.NextFunction) => {
  console.log(`Received request for ${req.url}`);
  next();
});

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true, // Enable introspection for GraphQL Playground
});

const startApolloServer = async () => {
  await server.start();

  // Apply Apollo middleware to Express app
  // Use type assertion to fix TypeScript error
  server.applyMiddleware({ 
    app: app as any,  // Add type assertion here
    path: '/graphql', // Explicitly set the GraphQL endpoint
  });

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '../../client/dist');
    
    if (fs.existsSync(distPath)) {
      // Serve static files from the React build folder
      app.use(express.static(distPath));

      // Fallback to index.html for client-side routing
      app.get('*', (req: Request, res: Response) => {
        // Skip GraphQL requests
        if (req.path === '/graphql') return;
        
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.error('❌ ERROR: The dist/ folder does not exist. Make sure to run "npm run build".');
    }
  }

  // Connect to the database and start the server
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🌍 Server running on port ${PORT}`);
    console.log(`🚀 GraphQL ready at http://localhost:${PORT}${server.graphqlPath}`);
  });
};

// Start the server
startApolloServer();