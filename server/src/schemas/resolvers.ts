import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { GraphQLError } from "graphql";
const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

export const resolvers = {
  Query: {
    me: async (_parent: any, _args: any, context: { user: any }) => {
      if (context.user) {
        return User.findById(context.user._id);
      }
      throw new AuthenticationError('Not logged in');
    },
  },
  Mutation: {
    signUp: async (_: any, { username, email, password, bio }: { username: string; email: string; password: string; bio?: string }, { db }: { db: any }) => {
      try {
        console.log("🔍 Recibiendo solicitud de signup:", { username, email, bio });

        // Normalizar email (quitar espacios y pasar a minúsculas)
        email = email.trim().toLowerCase();

        // Verificar si el email ya está registrado
        const existingUser = await db.collection("users").findOne({ email });
        if (existingUser) {
          throw new GraphQLError("⚠️ El email ya está registrado.");
        }

        // Generar un username si no se proporciona
        if (!username) {
          username = email.split("@")[0]; // Usa la parte antes del @ como username
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear objeto de usuario
        const newUser = {
          _id: new ObjectId(),
          username,
          email,
          password: hashedPassword,
          bio: bio || "", // Si no se proporciona, se guarda como string vacío
          createdAt: new Date().toISOString(),
        };

        // Insertar en la base de datos
        const result = await db.collection("users").insertOne(newUser);
        if (!result.insertedId) {
          throw new GraphQLError("❌ No se pudo crear el usuario.");
        }

        console.log("✅ Usuario creado con éxito:", newUser);
        return newUser;
      } catch (error) {
        if (error instanceof Error) {
          console.error("❌ Error en signUp:", error.message);
          throw new GraphQLError((error as Error).message);
        } else {
          console.error("❌ Error en signUp:", error);
          throw new GraphQLError("An unknown error occurred.");
        }
      }
    },
    addUser: async (_: any, { username, email, password }: { username: string; email: string; password: string }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    login: async (_: any, { username, password }: { username: string; password: string }) => {
      const user = await User.findOne({ username });

      if (!user) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);
      return { token, user };
    },
  },
};
