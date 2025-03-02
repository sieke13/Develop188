import { ApolloServer } from 'apollo-server';
import { typeDefs, resolvers } from './schemas/index.js';
import connectDB from './config/connection.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true, // Enable introspection for GraphQL Playground
});

const startApolloServer = async () => {
  try {
    // Connect to the database
    await connectDB();
    
    // Start Apollo Server
    const { url } = await server.listen({ port: process.env.PORT || 3001 });
    console.log(`🚀 GraphQL ready at ${url}`);
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

// Start the server
startApolloServer();