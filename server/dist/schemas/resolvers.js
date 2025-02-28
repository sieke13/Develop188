import User from "../models/User";
import { AuthenticationError } from "apollo-server-express";
import { signToken } from "../services/auth";
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
            const user = await User.findOne({ email });
            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }
            const token = signToken(user.username, user.email, user._id.toString());
            return { token, user };
        },
        addUser: async (_, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user.username, user.email, user._id.toString());
            return { token, user };
        },
        saveBook: async (_, { bookData }, context) => {
            if (!context.user) {
                throw new AuthenticationError('Not logged in');
            }
            if (!bookData || !bookData.bookId) {
                throw new Error('Invalid book data');
            }
            return User.findByIdAndUpdate(context.user._id, { $addToSet: { savedBooks: bookData } }, { new: true, runValidators: true }).populate('savedBooks');
        },
        removeBook: async (_, { bookId }, context) => {
            if (!context.user) {
                throw new AuthenticationError('Not logged in');
            }
            if (!bookId) {
                throw new Error('Book ID is required');
            }
            return User.findByIdAndUpdate(context.user._id, { $pull: { savedBooks: { bookId } } }, { new: true }).populate('savedBooks');
        },
    },
};
export default resolvers;
