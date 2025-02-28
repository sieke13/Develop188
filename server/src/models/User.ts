import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import bookSchema from './Book.js';

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+@.+\..+/, 'Must use a valid email address'],
  },
  password: {
    type: String,
    required: true,
  },
  // set savedBooks to be an array of data that adheres to the bookSchema
  savedBooks: [bookSchema],
},
{
  toJSON: {
    virtuals: true,
  },
});

// hash user password
userSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('password')) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }
  next();
});

// custom method to compare and validate password for logging in
interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  savedBooks: typeof bookSchema[];
  bookCount: number;
  isCorrectPassword(password: string): Promise<boolean>;
}

userSchema.methods.isCorrectPassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

// when we query a user, we'll also get another field called `bookCount` with the number of saved books we have
userSchema.virtual('bookCount').get(function () {
  return this.savedBooks.length;
});

const User = model<IUser>('User', userSchema);
export default User;