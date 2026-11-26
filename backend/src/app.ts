import express from "express";
import cors from "cors";

import googleBooksRoute from "./modules/googleBooks/googleBooks.route";
import bookRoute from "./modules/books/book.route";
import authRoute from "./modules/auth/auth.route";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Bookstore API is running"
  });
});

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/google-books", googleBooksRoute);
app.use("/api/v1/books", bookRoute);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

export default app;