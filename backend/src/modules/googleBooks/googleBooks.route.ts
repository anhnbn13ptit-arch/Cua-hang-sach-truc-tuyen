import { Router } from "express";
import { searchGoogleBooks } from "./googleBooks.controller";

const router = Router();

router.get("/search", searchGoogleBooks);

export default router;