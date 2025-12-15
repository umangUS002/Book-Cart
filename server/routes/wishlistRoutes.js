import express from "express";
import { getWishlist, addToWishlist, removeFromWishlist } from "../controllers/wishlistController.js";
import auth from "../middleware/auth.js";

const wishlistRouter = express.Router();

wishlistRouter.get("/", auth, getWishlist);
wishlistRouter.post("/", auth, addToWishlist);
wishlistRouter.delete("/:bookId", auth, removeFromWishlist);

export default wishlistRouter;
