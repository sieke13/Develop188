import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
// Define the userSchema
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/.+@.+\..+/, 'Must match an email address!'],
    },
    password: {
        type: String,
        required: true,
        minlength: 1,
    },
    savedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
}, {
    toJSON: {
        virtuals: true,
    },
});
// Hash user password before saving
userSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('password')) {
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
    }
    next();
});
// Custom method to compare and validate password for logging in
userSchema.methods.isCorrectPassword = async function (password) {
    return bcrypt.compare(password, this.password);
};
// Create a virtual property `bookCount` that gets the number of saved books
userSchema.virtual('bookCount').get(function () {
    return this.savedBooks?.length || 0;
});
// Create and export the User model
const User = model('User', userSchema);
export default User;
