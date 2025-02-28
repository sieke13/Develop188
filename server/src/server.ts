import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import path from 'path';
import typeDefs from './schemas/typeDefs.js';
import resolvers from './schemas/resolvers.js';
import { authMiddleware } from './services/auth'; // Asegúrate de que authMiddleware esté tipado
import db from './config/connection'; // Asegúrate de que db esté tipado

const PORT = process.env.PORT || 3001;
const app: express.Application = express();

// Crear una instancia de Apollo Server con tipos
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware, // Asegúrate de que authMiddleware sea compatible con el contexto de Apollo
});

// Aplicar middleware de Apollo Server a Express
server.applyMiddleware({ app: app as any });

// Middleware para parsear el cuerpo de las solicitudes
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Si estamos en producción, servir los archivos estáticos de la carpeta client/build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Capturar todas las rutas y servir el archivo index.html
  app.get('*', (_, res: express.Response) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Iniciar el servidor una vez que la conexión a la base de datos esté abierta
db.once('open', () => {
  app.listen(PORT, () => {
    console.log(`🌍 Now listening on localhost:${PORT}`);
    console.log(`GraphQL server ready at http://localhost:${PORT}${server.graphqlPath}`);
  });
});