import User, { IUser } from '../models/User.js';
import { signToken } from '../services/auth.js';
import { AuthenticationError } from 'apollo-server-express';
import { Db } from 'mongodb';

interface BookInput {
  bookId: string;
  title: string;
  authors: string[];
  description?: string;
  image?: string;
}

const resolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      if (context.user) {
        const user = await User.findById(context.user._id).populate('savedBooks');
        return user;
      }
      throw new AuthenticationError('Not logged in');
    },
  },
  Mutation: {
    login: async (_: any, { email, password }: { email: string; password: string }) => {
      console.log("Incoming Data: ", email, password);
      
      const user: IUser | null = await User.findOne({ email });

      if (!user) {
        console.log('No user.');
        throw new AuthenticationError('Incorrect credentials');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        console.log('Bad password.');
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user.username, user.email, user._id.toString());
      return { token, user };
    },

    addUser: async (_: any, { username, email, password }: { username: string; email: string; password: string }) => {
      const user: IUser = await User.create({ username, email, password });
      const token = signToken(user.username, user.email, user._id.toString());
      return { token, user };
    },

    saveBook: async (_: any, { bookData }: { bookData: BookInput }, { db }: { db: Db }) => {
      try {
        console.log("🔍 Recibiendo solicitud para guardar libro:", bookData);

        // Verificar si el libro ya está en la base de datos
        const existingBook = await db.collection("books").findOne({ bookId: bookData.bookId });
        if (existingBook) {
          console.log("⚠️ El libro ya existe en la base de datos.");
          throw new Error("Este libro ya está guardado.");
        }

        // Crear objeto para guardar en la base de datos
        const newBook = {
          ...bookData,
          createdAt: new Date(),
        };

        // Insertar en la base de datos
        const result = await db.collection("books").insertOne(newBook);
        if (!result.insertedId) {
          console.error("❌ Error al guardar el libro en la base de datos.");
          throw new Error("No se pudo guardar el libro.");
        }

        console.log("✅ Libro guardado exitosamente:", newBook);
        return newBook;
      } catch (error) {
        console.error("❌ Error en la mutación saveBook:", error);
        throw new Error("Error al guardar el libro.");
      }
    },

    removeBook: async (_: any, { bookId }: { bookId: string }, context: any) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          context.user._id,
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        ).populate('savedBooks');
        return updatedUser;
      }
      throw new AuthenticationError('Not logged in');
    }
  }
};

export { resolvers };