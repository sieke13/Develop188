import User from '../models/User.js';
import { signToken } from '../services/auth.js';
import { comparePassword } from '../utils/passwordUtils.js';

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const getSingleUser = async (req, res) => {
    const foundUser = await User.findOne({
        $or: [{ _id: req.user ? req.user._id : req.params.id }, { username: req.params.username }],
    });
    if (!foundUser) {
        return res.status(400).json({ message: 'Cannot find a user with this id!' });
    }
    return res.json(foundUser);
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const createUser = async (req, res) => {
    const user = await User.create(req.body);
    if (!user) {
        return res.status(400).json({ message: 'Something is wrong!' });
    }
    const token = signToken(user.username, user.email, user._id.toString());
    return res.json({ token, user });
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const login = async (req, res) => {
    const user = await User.findOne({ $or: [{ username: req.body.username }, { email: req.body.email }] });
    if (!user) {
        return res.status(400).json({ message: "Can't find this user" });
    }
    const correctPw = await comparePassword(req.body.password, user.password);
    if (!correctPw) {
        return res.status(400).json({ message: 'Wrong password!' });
    }
    const userId = user._id.toString();
    const token = signToken(user.username, user.email, userId);
    return res.json({ token, user });
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const saveBook = async (req, res) => {
    try {
        const updatedUser = await User.findOneAndUpdate(
            { _id: req.user?._id },
            { $addToSet: { savedBooks: req.body } },
            { new: true, runValidators: true }
        );
        return res.json(updatedUser);
    } catch (err) {
        console.log(err);
        return res.status(400).json(err);
    }
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const deleteBook = async (req, res) => {
    const updatedUser = await User.findOneAndUpdate(
        { _id: req.user?._id },
        { $pull: { savedBooks: { bookId: req.params.bookId } } },
        { new: true }
    );
    if (!updatedUser) {
        return res.status(404).json({ message: "Couldn't find user with this id!" });
    }
    return res.json(updatedUser);
};
