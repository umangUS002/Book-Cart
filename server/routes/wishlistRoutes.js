import express from "express";
import { getWishlist, addToWishlist, removeFromWishlist } from "../controllers/wishlistController.js";
import auth from "../middleware/auth.js";
import clerkAuth from "../middleware/clerkAuth.js";

const wishlistRouter = express.Router();

wishlistRouter.get("/", clerkAuth, getWishlist);
wishlistRouter.post("/", clerkAuth, addToWishlist);
wishlistRouter.delete("/:bookId", clerkAuth, removeFromWishlist);

export default wishlistRouter;
