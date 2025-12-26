import { getAuth } from "@clerk/express";

export default function clerkAuth(req, res, next) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized (Clerk)" });
  }

  req.user = { id: userId }; // Clerk userId (string)
  next();
}
