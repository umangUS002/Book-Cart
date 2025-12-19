import express from "express";
import cors from "cors";
import connectDB from "./configs/db.js";
import bookRouter from "./routes/bookRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import authRouter from "./routes/authRoutes.js";
import wishlistRouter from "./routes/wishlistRoutes.js";
import recRouter from "./routes/recommendationRoutes.js";

const app = express();

let isConnected = false;
async function ensureDB() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",")
  : [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS blocked"));
  },
  credentials: true,
}));

app.options("*", cors());
app.use(express.json());

app.use(async (req, res, next) => {
  await ensureDB();
  next();
});

app.get("/", (req, res) => res.send("API working"));

app.use("/api/book", bookRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/recommendations", recRouter);

export default app;
