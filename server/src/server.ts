import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import path from 'path';
import { fileURLToPath } from 'url';
import { typeDefs, resolvers } from './schemas/index.js';
import { authMiddleware } from './services/auth.js';
import connectDB from './config/connection.js';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }: { req: express.Request }) => authMiddleware(req),
  introspection: true, // Enable introspection for GraphQL Playground
});

const startApolloServer = async () => {
  try {
    // Connect to the database
    await connectDB();
    
    // Start Apollo Server
    await server.start();
    
    // Apply Apollo middleware to Express app
    server.applyMiddleware({ app: app as express.Application });
    
    // Important: Serve static files first, then add the catch-all route
    if (process.env.NODE_ENV === 'production') {
      // Serve static files from the client's dist directory
      const distPath = path.join(__dirname, '../../client/dist');
      console.log(`Looking for client dist at: ${distPath}`);
      
      if (fs.existsSync(distPath)) {
        // Serve static files (JS, CSS, images)
        app.use(express.static(distPath));
        
        // Wild card route - send all other requests to index.html
        app.get('*', (req, res) => {
          // Skip GraphQL requests
          if (req.path === '/graphql') return;
          
          console.log(`Serving index.html for path: ${req.path}`);
          res.sendFile(path.join(distPath, 'index.html'));
        });
      } else {
        console.error('❌ ERROR: dist/ folder missing. Run "npm run build".');
      }
    }
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🌍 Server running on port ${PORT}`);
      console.log(`🚀 GraphQL ready at http://localhost:${PORT}${server.graphqlPath}`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

// Start the server
startApolloServer();