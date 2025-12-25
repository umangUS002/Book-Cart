import { Webhook } from "svix";
import User from "../models/User.js";

const clerkWebhooks = async (req, res) => {
  try {
    console.log("🔥 WEBHOOK HIT");

    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    const evt = whook.verify(req.body, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { type, data } = evt;
    console.log("📌 EVENT:", type);

    if (type === "user.created" || type === "user.updated") {
      const name =
        `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User";

      const email = data.email_addresses?.[0]?.email_address;
      if (!email) throw new Error("Email missing");

      await User.updateOne(
        { _id: data.id },
        { $set: { name, email } },
        { upsert: true, runValidators: true }
      );

      console.log("✅ USER UPSERTED:", data.id);
    }

    if (type === "user.deleted") {
      await User.deleteOne({ _id: data.id });
      console.log("🗑 USER DELETED:", data.id);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ WEBHOOK ERROR:", error);
    return res.status(400).json({ error: error.message });
  }
};

export default clerkWebhooks;
