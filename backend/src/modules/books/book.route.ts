import { Router } from "express";

import {
  importGoogleBook,
  getAllBooks,
  getBookByIdFromDB,
  updateBook,
  deleteBook
} from "./book.controller";

const router = Router();

router.get("/", getAllBooks);

router.get("/:id", getBookByIdFromDB);

router.post(
  "/import/google-books/:volumeId",
  importGoogleBook
);

router.patch("/:id", updateBook);

router.delete("/:id", deleteBook);

export default router;