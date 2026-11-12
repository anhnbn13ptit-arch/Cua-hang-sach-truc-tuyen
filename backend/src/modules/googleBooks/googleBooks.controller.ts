import { Request, Response } from "express";
import { searchBooks } from "./googleBooks.service";

export const searchGoogleBooks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const q = req.query.q;

    if (typeof q !== "string" || !q.trim()) {
      res.status(400).json({
        success: false,
        message: "Search query is required"
      });
      return;
    }

    const maxResults = Math.min(
      Math.max(Number(req.query.maxResults) || 20, 1),
      40
    );

    const startIndex = Math.max(
      Number(req.query.startIndex) || 0,
      0
    );

    const result = await searchBooks(q, maxResults, startIndex);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: unknown) {
    const message = error instanceof Error
      ? error.message
      : "Internal server error";

    res.status(500).json({
      success: false,
      message
    });
  }
};