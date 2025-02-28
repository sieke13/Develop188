import User from '../models/User.js';
import { AuthenticationError } from 'apollo-server-express';
import { signToken } from '../services/auth.js';

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

      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },

    addUser: async (_: any, { username, email, password }: { username: string; email: string; password: string }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },
    saveBook: async (_: any, { bookData }: { bookData: any }, context: any) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          context.user._id,
          { $addToSet: { savedBooks: bookData } },
          { new: true }
        ).populate('savedBooks');
        return updatedUser;
      }
      throw new AuthenticationError('Not logged in');
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