import { Schema, model, Document, ObjectId } from 'mongoose';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

// Define the IBook interface
export interface IBook {
  bookId: string;
  authors?: string[];
  description?: string;
  title: string;
  image?: string;
  link?: string;
}

// Define the IUser interface
export interface IUser extends Document {
  _id: ObjectId; 
  username: string;
  email: string;
  password: string;
  savedBooks?: IBook[];
  isCorrectPassword(password: string): Promise<boolean>;
}

// Define the bookSchema
const bookSchema = new Schema<IBook>({
  bookId: {
    type: String,
    required: true,
  },
  authors: [String],
  description: {
    type: String,
  },
  title: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  link: {
    type: String,
  },
});

// Define the userSchema
const userSchema = new Schema<IUser>(
  {
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
  },
  {
    toJSON: {
      virtuals: true,
    },
  }
);

// Hash user password before saving
userSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('password')) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }
  next();
});

// Custom method to compare and validate password for logging in
userSchema.methods.isCorrectPassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

// Create a virtual property `bookCount` that gets the number of saved books
userSchema.virtual('bookCount').get(function () {
  return this.savedBooks?.length || 0;
});

// Create and export the User model
const User = model<IUser>('User', userSchema);
export default User;