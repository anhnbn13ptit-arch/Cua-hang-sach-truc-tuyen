import { Request, Response } from "express";
import mongoose from "mongoose";
import Book from "../../models/book";
import { getBookById } from "../googleBooks/googleBooks.service";

interface ImportBookBody {
  price: number;
  discountPrice?: number;
  stock: number;
}

export const importGoogleBook = async (
  req: Request<{ volumeId: string }, object, ImportBookBody>,
  res: Response
): Promise<void> => {
  try {
    const { volumeId } = req.params;
    const { price, discountPrice, stock } = req.body;

    // Validate dữ liệu đầu vào
    if (
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0 ||
      typeof stock !== "number" ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid price or stock"
      });
      return;
    }

    if (
      discountPrice !== undefined &&
      (
        typeof discountPrice !== "number" ||
        !Number.isFinite(discountPrice) ||
        discountPrice < 0 ||
        discountPrice > price
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid discount price"
      });
      return;
    }

    // Kiểm tra sách đã tồn tại chưa
    const existingBook = await Book.findOne({
      googleBooksId: volumeId
    });

    if (existingBook) {
      res.status(409).json({
        success: false,
        message: "This book has already been imported"
      });
      return;
    }

    // Lấy thông tin sách từ Google Books
    const googleBook = await getBookById(volumeId);

    const newBook = await Book.create({
      ...googleBook,
      price,
      discountPrice,
      stock
    });

    res.status(201).json({
      success: true,
      message: "Book imported successfully",
      data: newBook
    });
  } catch (error: unknown) {
    if (
      error instanceof mongoose.Error ||
      (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      )
    ) {
      res.status(409).json({
        success: false,
        message: "This book already exists"
      });
      return;
    }

    const message = error instanceof Error
      ? error.message
      : "Internal server error";

    const status = message.includes("not found") ? 404 : 500;

    res.status(status).json({
      success: false,
      message
    });
  }
};

// Lấy danh sách sách
export const getAllBooks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    );

    const skip = (page - 1) * limit;

    const [books, total] = await Promise.all([
      Book.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Book.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: books,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error
        ? error.message
        : "Internal server error"
    });
  }
};

// Lấy chi tiết một cuốn sách
export const getBookByIdFromDB = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid book ID"
      });
      return;
    }

    const book = await Book.findById(id);

    if (!book) {
      res.status(404).json({
        success: false,
        message: "Book not found"
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error
        ? error.message
        : "Internal server error"
    });
  }
};

// Cập nhật thông tin sách
export const updateBook = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid book ID"
      });
      return;
    }

    const allowedFields = [
      "title",
      "authors",
      "publisher",
      "description",
      "price",
      "discountPrice",
      "stock",
      "category",
      "status",
      "featured"
    ];

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        message: "No valid fields to update"
      });
      return;
    }

    if (
      updates.price !== undefined &&
      (
        typeof updates.price !== "number" ||
        !Number.isFinite(updates.price) ||
        updates.price < 0
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid price"
      });
      return;
    }

    if (
      updates.stock !== undefined &&
      (
        typeof updates.stock !== "number" ||
        !Number.isInteger(updates.stock) ||
        updates.stock < 0
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid stock"
      });
      return;
    }

    const book = await Book.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!book) {
      res.status(404).json({
        success: false,
        message: "Book not found"
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: book
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error
        ? error.message
        : "Internal server error"
    });
  }
};

// Xóa sách
export const deleteBook = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid book ID"
      });
      return;
    }

    const book = await Book.findByIdAndDelete(id);

    if (!book) {
      res.status(404).json({
        success: false,
        message: "Book not found"
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Book deleted successfully"
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error
        ? error.message
        : "Internal server error"
    });
  }
};