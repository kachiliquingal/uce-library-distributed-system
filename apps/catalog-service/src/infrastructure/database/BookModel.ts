import mongoose, { Schema, Document } from "mongoose";
import { Book } from "../../domain/entities/Book";

export interface BookDocument extends Omit<Book, "id">, Document {}

const BookSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String, required: true, unique: true },
    publishedYear: { type: Number, required: true },
    category: { type: String, required: true },
    available: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Transform the internal _id to id when returning JSON
BookSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
  },
});

export const BookModel = mongoose.model<BookDocument>("Book", BookSchema);
