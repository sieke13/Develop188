const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findById(context.user._id);
      }
      throw new AuthenticationError('Not logged in');
    },
  },
  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { username, password }) => {
      const user = await User.findOne({ username });

      if (!user) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);
      return { token, user };
    },
    saveBook: async (_, { bookData }, context) => {
      if (!context.user) {
        throw new AuthenticationError('Not logged in');
      }
      try {
        console.log("🔍 Recibiendo solicitud para guardar libro:", bookData);
        // Verificar si el libro ya está en la base de datos
        const existingBook = await context.db.collection("books").findOne({ bookId: bookData.bookId });
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
        const result = await context.db.collection("books").insertOne(newBook);
        if (!result.insertedId) {
          console.error("❌ Error al guardar el libro en la base de datos.");
          throw new Error("No se pudo guardar el libro.");
        }
        console.log("✅ Libro guardado exitosamente:", newBook);
        // Actualizar los libros guardados del usuario
        const updatedUser = await User.findByIdAndUpdate(context.user._id, { $addToSet: { savedBooks: bookData } }, { new: true, runValidators: true }).populate('savedBooks');
        return updatedUser;
      }
      catch (error) {
        console.error("❌ Error en la mutación saveBook:", error);
        throw new Error("Error al guardar el libro.");
      }
    },
    removeBook: async (_, { bookId }, context) => {
      if (!context.user) {
        throw new AuthenticationError('Not logged in');
      }
      if (!bookId) {
        throw new Error('Book ID is required');
      }
      const updatedUser = await User.findByIdAndUpdate(context.user._id, { $pull: { savedBooks: { bookId } } }, { new: true }).populate('savedBooks');
      return updatedUser;
    }
  },
};

module.exports = resolvers;
