import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import path from 'path';
import { fileURLToPath } from 'url';
import { typeDefs, resolvers } from './schemas';
import connectDB from './config/connection';
import cors from 'cors';
import fs from 'fs';

// Fix __dirname manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const app: express.Application = express();

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
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true, // Enable introspection for GraphQL Playground
});

const startApolloServer = async () => {
  await server.start();

  // Apply Apollo middleware to Express app
  server.applyMiddleware({ 
    app: app as any,
    cors: corsOptions // Apply CORS options to Apollo Server
  });

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
    console.log(`🌍 Server running on port ${PORT}`);
    console.log(`🚀 GraphQL ready at http://localhost:${PORT}${server.graphqlPath}`);
  });
};

// Start the server
startApolloServer();