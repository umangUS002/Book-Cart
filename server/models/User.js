import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, required: true, unique: true, index: true },
    preferences: { genres: [String], authors: [String] },
    createdAt: { type: Date, default: Date.now }
})

const User = mongoose.model('User', userSchema);
export default User;