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
            const user = await User.create({ ...input });
            const token = signToken(user.username, user.email, user._id.toString());
            return { token, user };
        },
        saveBook: async (_, { bookData }, context) => {
            if (!context.user) {
                throw new AuthenticationError('Not logged in');
            }
            try {
                console.log("🔍 Recibiendo solicitud para guardar libro:", bookData);
                // Update the user's savedBooks array
                const updatedUser = await User.findByIdAndUpdate(context.user._id, { $addToSet: { savedBooks: bookData } }, // Add the book to the savedBooks array
                { new: true, runValidators: true }).populate('savedBooks');
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
