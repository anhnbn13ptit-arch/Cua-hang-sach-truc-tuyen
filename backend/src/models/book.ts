import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBook extends Document {
  googleBooksId: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  isbn?: string;
  pageCount: number;
  language?: string;
  thumbnail?: string;
  categories: string[];

  price: number;
  discountPrice?: number;
  stock: number;
  soldCount: number;

  category?: Types.ObjectId | null;
  status: "active" | "inactive";
  featured: boolean;
  averageRating: number;
  reviewCount: number;
}

const bookSchema = new Schema<IBook>(
  {
    googleBooksId: {
      type: String,
      required: true,
      unique: true,
      sparse: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    authors: {
      type: [String],
      default: []
    },

    publisher: String,
    publishedDate: String,
    description: String,
    isbn: String,

    pageCount: {
      type: Number,
      default: 0
    },

    language: String,
    thumbnail: String,

    categories: {
      type: [String],
      default: []
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    discountPrice: {
      type: Number,
      min: 0
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    soldCount: {
      type: Number,
      default: 0
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },

    featured: {
      type: Boolean,
      default: false
    },

    averageRating: {
      type: Number,
      default: 0
    },

    reviewCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Book = mongoose.model<IBook>("Book", bookSchema);

export default Book;