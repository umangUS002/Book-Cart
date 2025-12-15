import Comment from "../models/Comment.js";
import axios from "axios";

/**
 * POST /api/books/:bookId/comments
 * creates a comment and calls sentiment service (if configured)
 */
export async function postComment(req, res) {
  try {
    const { bookId } = req.params;
    const { text, rating } = req.body;
    if (!text) return res.status(400).json({ message: "Missing text" });

    let sentiment = null;
    if (process.env.SENTIMENT_URL) {
      try {
        const resp = await axios.post(`${process.env.SENTIMENT_URL}/analyze`, { text });
        sentiment = resp.data;
      } catch (err) {
        console.warn("sentiment service failed:", err.message);
      }
    }

    const comment = await Comment.create({
      bookId,
      userId: req.user.id,
      text,
      rating,
      sentiment
    });

    return res.status(201).json(comment);
  } catch (err) {
    console.error("postComment err:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/books/:bookId/comments
 */
export async function getCommentsForBook(req, res) {
  try {
    const { bookId } = req.params;
    const comments = await Comment.find({ bookId }).populate("userId", "name");
    return res.json(comments);
  } catch (err) {
    console.error("getCommentsForBook err:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
