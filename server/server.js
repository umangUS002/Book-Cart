import express from "express";
import 'dotenv/config'
import connectDB from "./configs/db.js";
import bookRouter from "./routes/bookRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import cors from 'cors';
import authRouter from "./routes/authRoutes.js";
import wishlistRouter from "./routes/wishlistRoutes.js";
import recRouter from "./routes/recommendationRoutes.js";
import clerkWebhooks from "./controllers/webhooks.js";
import { clerkMiddleware } from '@clerk/express';

const app = express();

await connectDB();

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN, // React dev server
    credentials: true,               // ALLOW cookies
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(clerkMiddleware());

//Routes
app.get('/',(req,res)=> res.send("API is working"));

app.post('/webhooks', clerkWebhooks);

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