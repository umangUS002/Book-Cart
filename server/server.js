import express from "express";
import 'dotenv/config'
import connectDB from "./configs/db.js";
import bookRouter from "./routes/bookRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import cors from 'cors';
import authRouter from "./routes/authRoutes.js";
import wishlistRouter from "./routes/wishlistRoutes.js";
import recRouter from "./routes/recommendationRoutes.js";

const app = express();

await connectDB();

// Middlewares
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",")
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // allow server-to-server & Postman
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error(`CORS blocked for origin: ${origin}`)
    );
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// IMPORTANT for preflight
app.options("*", cors());

app.use(express.json());

//Routes
app.get('/',(req,res)=> res.send("API is working"));
app.use('/api/book', bookRouter);
app.use('/api/admin', adminRouter);

app.use('/api/auth', authRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/recommendations', recRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('Server is running on port: ' + PORT)
});

export default app;