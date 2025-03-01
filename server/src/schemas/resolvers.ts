import User, { IUser } from '../models/User.js';
import { signToken } from '../services/auth.js';
import { AuthenticationError } from 'apollo-server-express';


interface AddUserArgs {
  input: {
    username: string;
    email: string;
    password: string;
  };
}

interface LoginUserArgs {
  email: string;
  password: string;
}

interface addBookArgs {
  bookData: {
    bookId: string;
    authors: string[];
    description: string;
    title: string;
    image: string;
    link: string;
  };
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
    login: async (_: any, { email, password }: LoginUserArgs) => {
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

    addUser: async (_: any, { input }: AddUserArgs) => {
      const user: IUser = await User.create({ ...input });
      const token = signToken(user.username, user.email, user._id.toString());
      return { token, user };
    },

    saveBook: async (_: any, { bookData }: addBookArgs, context: any) => {
      if (!context.user) {
        throw new AuthenticationError('Not logged in');
      }

      try {
        console.log("🔍 Recibiendo solicitud para guardar libro:", bookData);

        // Update the user's savedBooks array
        const updatedUser = await User.findByIdAndUpdate(
          context.user._id,
          { $addToSet: { savedBooks: bookData } }, // Add the book to the savedBooks array
          { new: true, runValidators: true }
        ).populate('savedBooks');

        return updatedUser;
      } catch (error) {
        console.error("❌ Error en la mutación saveBook:", error);
        throw new Error("Error al guardar el libro.");
      }
    },


    removeBook: async (_: any, { bookId }: { bookId: string }, context: any) => {
      if (!context.user) {
        throw new AuthenticationError('Not logged in');
      }

      if (!bookId) {
        throw new Error('Book ID is required');
      }

      const updatedUser = await User.findByIdAndUpdate(
        context.user._id,
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      ).populate('savedBooks');

      return updatedUser;
    }
  },
};

export { resolvers };