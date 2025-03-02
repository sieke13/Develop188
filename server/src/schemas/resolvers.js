import User from '../models/User';
import bcrypt from 'bcrypt';
export const resolvers = {
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
        login: async (_, { input }) => {
            const { email, password } = input;
            // Find the user by email
            const user = await User.findOne({ email });
            if (!user) {
                throw new Error('User not found');
            }
            // Compare the password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                throw new Error('Invalid password');
            }
            return user;
        },
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return { token, user };
        },
    },
};

module.exports = resolvers;
