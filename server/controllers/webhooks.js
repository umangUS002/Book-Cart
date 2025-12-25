import { Webhook } from "svix";
import User from "../models/User.js";

const clerkWebhooks = async (req, res) => {
  try {
    console.log("🔔 Webhook received");

    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // 🔎 Log headers
    console.log("📩 Headers:", {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    // 🔎 Log raw body
    console.log("📦 Raw Body:", req.body);

    // Verify webhook
    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    console.log("✅ Webhook verification passed");

    const { data, type } = req.body;

    console.log("📌 Event Type:", type);
    console.log("🆔 Clerk User ID:", data?.id);

    switch (type) {
      case "user.created": {
        console.log("➡️ Handling user.created");

        const userData = {
          _id: data.id,
          email: data.email_addresses?.[0]?.email_address,
          name: `${data.first_name || ""} ${data.last_name || ""}`,
        };

        console.log("📝 Creating user:", userData);

        const createdUser = await User.create(userData);

        console.log("✅ User created in MongoDB:", createdUser);

        res.json({ success: true });
        break;
      }

      case "user.updated": {
        console.log("➡️ Handling user.updated");

        const userData = {
          email: data.email_addresses?.[0]?.email_address,
          name: `${data.first_name || ""} ${data.last_name || ""}`,
        };

        console.log("📝 Updating user with ID:", data.id);
        console.log("📝 Update data:", userData);

        const updatedUser = await User.findByIdAndUpdate(
          data.id,
          userData,
          { new: true }
        );

        console.log("🔄 Updated user result:", updatedUser);

        res.json({ success: true });
        break;
      }

      case "user.deleted": {
        console.log("➡️ Handling user.deleted");

        const deletedUser = await User.findByIdAndDelete(data.id);

        console.log("🗑 Deleted user:", deletedUser);

        res.json({ success: true });
        break;
      }

      default:
        console.log("⚠️ Unhandled event type:", type);
        res.json({ success: true });
        break;
    }
  } catch (error) {
    console.error("❌ Webhook Error:", error.message);
    res.status(400).json({ success: false, message: "Webhooks Error" });
  }
};

export default clerkWebhooks;
