import { ApolloServer } from 'apollo-server';
import { typeDefs, resolvers } from './schemas/index.js';
import connectDB from './config/connection.js';

// Crear el servidor Apollo
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true, // Habilitar introspection para GraphQL Playground
});

const startApolloServer = async () => {
  // Conectar a la base de datos
  await connectDB();

  // Iniciar el servidor Apollo
  const { url } = await server.listen({ port: process.env.PORT || 3001 });
  console.log(`🚀 GraphQL ready at ${url}`);
};

// Iniciar el servidor
startApolloServer();