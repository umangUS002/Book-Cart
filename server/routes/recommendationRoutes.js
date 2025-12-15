import express from "express";
import { getRecommendationsForUser, getSimilarBooks } from "../controllers/recommendationController.js";
import auth from "../middleware/auth.js";

const recRouter = express.Router();

recRouter.get("/", auth, getRecommendationsForUser);
recRouter.get("/book/:bookId", getSimilarBooks);

export default recRouter;
