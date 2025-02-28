import User from "../models/User"
import { AuthenticationError, signToken } from "../services/auth";

const resolvers = {
    Query: {
        me: async (_: any, __: any, context: any) => {
          if (!context.user) {
            return null; 
          }
          return User.findOne({ _id: context.user._id }).populate('savedBooks');
        },
      },

    Mutation: {
        login: async (_: any, { email, password }: { email: string; password: string }) => {
            
            const user = await User.findOne({ email });
      
            if (!user) {
              throw new AuthenticationError('Incorrect credentials');
            }
      
            const correctPw = await user.isCorrectPassword(password);
      
            if (!correctPw) {
              throw new AuthenticationError('Incorrect credentials');
            }
      
            const token = signToken(user.username,user.email,user._id.toString());
            return { token, user };
          },
      
          addUser: async (_: any, { username, email, password }: { username: string; email: string; password: string }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user.username, user.email, user._id.toString());
            return { token, user };
          },
      
          saveBook: async (_: any, { bookData }: { bookData: any }, context: any) => {
            if (!context.user) {
              throw new AuthenticationError('Not logged in');
            }
            
            if (!bookData || !bookData.bookId) {
              throw new Error('Invalid book data'); 
            }
      
            return User.findByIdAndUpdate(
              context.user._id,
              { $addToSet: { savedBooks: bookData } },
              { new: true, runValidators: true }
            );
          },
      
          removeBook: async (_: any, { bookId }: { bookId: string }, context: any) => {
            if (!context.user) {
              throw new AuthenticationError('Not logged in');
            }
      
            if (!bookId) {
              throw new Error('Book ID is required'); 
            }
      
            return User.findByIdAndUpdate(
              context.user._id,
              { $pull: { savedBooks: { bookId } } },
              { new: true }
            );
          },
        
    }
}
export default resolvers;