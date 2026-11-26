import { Router } from "express";

import {
  importGoogleBook,
  getAllBooks,
  getBookByIdFromDB,
  updateBook,
  deleteBook
} from "./book.controller";

import { authenticate, authorize } from "../../middlewares/auth";

const router = Router();

router.get("/", getAllBooks);

router.get("/:id", getBookByIdFromDB);

router.post("/import/google-books/:volumeId", authenticate, authorize("admin"), importGoogleBook);

router.patch("/:id", authenticate, authorize("admin"), updateBook);

router.delete("/:id", authenticate, authorize("admin"), deleteBook);

export default router;