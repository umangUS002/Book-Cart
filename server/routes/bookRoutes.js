import express from "express";
import { addBook, addComment, deleteBookById, generateContent, getAllBooks, getBookById, getBookComment, getSimilarBooks, togglePublish } from "../controllers/bookControllers.js";
import upload from "../middleware/multer.js";
import auth from "../middleware/auth.js";

const bookRouter = express.Router();

bookRouter.post("/add", upload.single('image'), auth, addBook);
bookRouter.get("/all", getAllBooks);
bookRouter.get("/:bookId", getBookById);
bookRouter.post("/delete", auth, deleteBookById);
bookRouter.post("/toggle-publish", togglePublish);
bookRouter.post("/add-comment", addComment);
bookRouter.post("/comments", getBookComment);

bookRouter.post("/generate", auth, generateContent);
bookRouter.get("/similar-books/:id", getSimilarBooks);

export default bookRouter;