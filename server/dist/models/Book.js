import { Schema } from 'mongoose';
const bookSchema = new Schema({
    authors: [
        {
            type: String,
        },
    ],
    description: {
        type: String,
        required: true,
    },
    // saved book id from GoogleBooks
    bookId: {
        type: String,
        required: true,
    },
    image: {
        type: String,
    },
    link: {
        type: String,
    },
    title: {
        type: String,
        required: true,
    },
});
export default bookSchema;
