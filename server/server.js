import express from "express";
import 'dotenv/config'
import connectDB from "./configs/db.js";
import bookRouter from "./routes/bookRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import cors from 'cors';

const app = express();

await connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

//Routes
app.get('/',(req,res)=> res.send("API is working"));
app.use('/api/book', bookRouter);
app.use('/api/admin', adminRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('Server is running on port: ' + PORT)
});

export default app;