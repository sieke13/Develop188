import User from '../models/User.js';
import { signToken } from '../services/auth.js';
import { AuthenticationError } from 'apollo-server-express';
const resolvers = {
    Query: {
        me: async (_, __, context) => {
            if (context.user) {
                const user = await User.findById(context.user._id).populate('savedBooks');
                return user;
            }
            throw new AuthenticationError('Not logged in');
        },
    },
    Mutation: {
        login: async (_, { email, password }) => {
            console.log("Incoming Data: ", email, password);
            const user = await User.findOne({ email });
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
        addUser: async (_, { input }) => {
            try {
                console.log("🔍 Recibiendo solicitud de registro:", input);
                // Verificar si el usuario ya existe
                const existingUser = await User.findOne({ email: input.email });
                if (existingUser) {
                    console.log("⚠️ El usuario ya existe.");
                    throw new Error("El usuario ya está registrado.");
                }
                // Crear el nuevo usuario
                const user = await User.create({ ...input });
                console.log("✅ Usuario creado exitosamente:", user);
                // Generar el token JWT
                const token = signToken(user.username, user.email, user._id.toString());
                return { token, user };
            }
            catch (error) {
                console.error("❌ Error en la mutación addUser:", error);
                throw new Error("Error durante el registro. Por favor, inténtalo de nuevo.");
            }
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
export { resolvers };
