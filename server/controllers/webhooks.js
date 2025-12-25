import { Webhook } from "svix";
import User from "../models/User.js";

const clerkWebhooks = async (req, res) => {
  try {
    console.log("🔥 WEBHOOK HIT");

    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // ✅ VERIFY RAW BODY
    const evt = whook.verify(req.body, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { type, data } = evt;
    console.log("📌 Event:", type);

    // ✅ SAFE NAME HANDLING
    const name =
      `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User";

    // ✅ UPSERT (CREATE OR UPDATE)
    if (type === "user.created" || type === "user.updated") {
      const user = await User.findByIdAndUpdate(
        data.id,
        {
          name,
          email: data.email_addresses?.[0]?.email_address,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

      console.log("✅ User saved:", user);
    }

    if (type === "user.deleted") {
      await User.findByIdAndDelete(data.id);
      console.log("🗑 User deleted:", data.id);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ WEBHOOK ERROR:", error);
    return res.status(400).json({ success: false });
  }
};

export default clerkWebhooks;
