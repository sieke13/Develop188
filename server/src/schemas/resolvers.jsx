import User from '../models/User';
import { signToken } from '../services/auth';
const resolvers = {
    Mutation: {
        register: async (_, { input }) => {
            const { email, password } = input;
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);
            // Create a new user
            const newUser = new User({
                email,
                password: hashedPassword,
            });
            // Save the user to the database
            await newUser.save();
            return newUser;
        },
        loginUser: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) {
                throw new Error('No user found with this email address');
            }
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw new Error('Incorrect credentials');
            }
            const token = signToken(user);
            return { token, user };
        },
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return { token, user };
        },
    },
};
export default resolvers;
