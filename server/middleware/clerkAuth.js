import { verifyToken } from "@clerk/backend";

export default async function clerkAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing Clerk token" });
    }

    const token = authHeader.split(" ")[1];

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    req.user = {
      id: payload.sub, // Clerk userId
      provider: "clerk",
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid Clerk token" });
  }
}
